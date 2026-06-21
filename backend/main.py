import os
import json
import io
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import predict as pred_module
import alerts as alerts_module
import response as response_module
import xai_module

BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load models at startup if available
    if pred_module.models_available():
        try:
            pred_module._load()
            print("Models loaded at startup.")
        except Exception as e:
            print(f"Model pre-load warning: {e}")
    else:
        print("Models not found. Run train.py first.")
    yield


app = FastAPI(title="CyberShield AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    sample_type: Optional[str] = None  # "random", "random_attack", "random_normal"
    features: Optional[dict] = None


# ──────────────────────────────────────────────────────────────────────────────
# Health & Status
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    loaded = pred_module.models_available()
    return {"status": "ok", "models_loaded": loaded}


@app.get("/api/models/status")
def models_status():
    rf = os.path.exists(os.path.join(MODELS_DIR, "model_rf.pkl"))
    dnn = os.path.exists(os.path.join(MODELS_DIR, "model_dnn.keras"))
    svm = os.path.exists(os.path.join(MODELS_DIR, "model_svm.pkl"))
    rl = os.path.exists(os.path.join(MODELS_DIR, "rl_qtable.npy"))
    return {
        "rf": rf,
        "dnn": dnn,
        "svm": svm,
        "rl": rl,
        "trained": rf,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Prediction
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/api/predict")
def predict(body: PredictRequest):
    if not pred_module.models_available():
        raise HTTPException(
            status_code=503,
            detail="Models not trained yet. Run python train.py in the backend folder."
        )

    actual_label = None

    if body.sample_type:
        category_map = {
            "random": None,
            "random_attack": "DoS",   # pick a common attack for demo
            "random_normal": "Normal",
        }
        if body.sample_type == "random_attack":
            # pick any non-normal
            import random
            attack_cats = ["DoS", "Probe", "R2L", "U2R"]
            cat = random.choice(attack_cats)
        elif body.sample_type == "random_normal":
            cat = "Normal"
        else:
            cat = None

        raw = pred_module.get_test_sample(category=cat)
        actual_label = raw.pop("_actual_label", None)
    elif body.features:
        raw = body.features
    else:
        raise HTTPException(status_code=400, detail="Provide sample_type or features.")

    result = pred_module.predict(raw)
    X_scaled = result.pop("X_scaled")
    X_raw = result.pop("X_raw")

    # XAI
    shap_values = xai_module.explain(X_scaled, top_n=10)
    top_feature = shap_values[0]["feature"] if shap_values else "N/A"

    # Response recommendation
    resp = response_module.get_response(result["prediction"])

    # Log alert
    alerts_module.append_alert(
        prediction=result["prediction"],
        confidence=result["confidence"],
        severity=resp["severity"],
        action=resp["action"],
        src_bytes=int(raw.get("src_bytes", 0)),
        dst_bytes=int(raw.get("dst_bytes", 0)),
        protocol=str(raw.get("protocol_type", "tcp")),
        duration=float(raw.get("duration", 0)),
        top_feature=top_feature,
    )

    return {
        "prediction": result["prediction"],
        "confidence": round(result["confidence"] * 100, 2),
        "probabilities": result["probabilities"],
        "severity": resp["severity"],
        "action": resp["action"],
        "description": resp["description"],
        "color": resp["color"],
        "shap_values": shap_values,
        "actual_label": actual_label,
        "feature_values": {k: v for k, v in raw.items()},
    }


@app.post("/api/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    if not pred_module.models_available():
        raise HTTPException(status_code=503, detail="Models not trained yet.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file.")

    results = []
    threats = 0

    for i, (_, row) in enumerate(df.iterrows()):
        raw = row.to_dict()
        try:
            result = pred_module.predict(raw)
            result.pop("X_scaled", None)
            result.pop("X_raw", None)
            resp = response_module.get_response(result["prediction"])
            if result["prediction"] != "Normal":
                threats += 1
            results.append({
                "row": i + 1,
                "prediction": result["prediction"],
                "confidence": round(result["confidence"] * 100, 2),
                "severity": resp["severity"],
                "action": resp["action"],
            })
        except Exception as e:
            results.append({
                "row": i + 1,
                "prediction": "Error",
                "confidence": 0,
                "severity": "N/A",
                "action": str(e),
            })

    return {"results": results, "total": len(results), "threats": threats}


# ──────────────────────────────────────────────────────────────────────────────
# Alerts
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts(limit: int = Query(default=50, ge=1, le=1000)):
    data = alerts_module.get_alerts(limit=limit)
    return {"alerts": data, "total": len(data)}


@app.delete("/api/alerts")
def clear_alerts():
    alerts_module.clear_alerts()
    return {"message": "All alerts cleared."}


@app.get("/api/alerts/export")
def export_alerts():
    alerts_file = os.path.join(BASE_DIR, "alerts.csv")
    if not os.path.exists(alerts_file):
        raise HTTPException(status_code=404, detail="No alerts file found.")
    return FileResponse(
        alerts_file,
        media_type="text/csv",
        filename="cybershield_alerts.csv",
    )


@app.get("/api/stats")
def get_stats():
    return alerts_module.get_stats()


# ──────────────────────────────────────────────────────────────────────────────
# Performance & RL
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/performance")
def get_performance():
    path = os.path.join(MODELS_DIR, "performance_metrics.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Models not trained yet.")
    with open(path) as f:
        data = json.load(f)
    return data


@app.get("/api/rl/rewards")
def get_rl_rewards():
    path = os.path.join(MODELS_DIR, "rl_rewards_per_episode.npy")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="RL model not trained yet.")

    rewards = np.load(path)
    # Rolling average to smooth
    window = 20
    smoothed = np.convolve(rewards, np.ones(window) / window, mode="valid")
    # Downsample to 100 points
    indices = np.linspace(0, len(smoothed) - 1, 100, dtype=int)
    downsampled = smoothed[indices].tolist()

    return {
        "rewards": downsampled,
        "episodes": list(range(1, 101)),
        "total_episodes": len(rewards),
    }
