import csv
import os
import pandas as pd
from datetime import datetime

ALERTS_FILE = os.path.join(os.path.dirname(__file__), "alerts.csv")
COLUMNS = [
    "id", "timestamp", "src_bytes", "dst_bytes", "protocol",
    "duration", "prediction", "confidence", "severity", "action", "top_feature"
]


def _ensure_file():
    if not os.path.exists(ALERTS_FILE):
        with open(ALERTS_FILE, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=COLUMNS)
            writer.writeheader()


def append_alert(
    prediction: str,
    confidence: float,
    severity: str,
    action: str,
    src_bytes: int,
    dst_bytes: int,
    protocol: str,
    duration: float,
    top_feature: str,
):
    _ensure_file()
    try:
        df = pd.read_csv(ALERTS_FILE)
        next_id = len(df) + 1
    except Exception:
        next_id = 1

    row = {
        "id": next_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "src_bytes": src_bytes,
        "dst_bytes": dst_bytes,
        "protocol": protocol,
        "duration": duration,
        "prediction": prediction,
        "confidence": round(confidence * 100, 2),
        "severity": severity,
        "action": action,
        "top_feature": top_feature,
    }
    with open(ALERTS_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writerow(row)
    return row


def get_alerts(limit: int = None):
    _ensure_file()
    try:
        df = pd.read_csv(ALERTS_FILE)
        df = df.sort_values("id", ascending=False)
        if limit:
            df = df.head(limit)
        df = df.fillna("")
        records = df.to_dict(orient="records")
        # Replace any remaining NaN/inf floats that fillna misses
        import math
        def clean(v):
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                return ""
            return v
        return [{k: clean(v) for k, v in row.items()} for row in records]
    except Exception:
        return []


def clear_alerts():
    with open(ALERTS_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()


def get_stats():
    _ensure_file()
    try:
        df = pd.read_csv(ALERTS_FILE)
        df = df.fillna("")
        if df.empty:
            return {"total": 0, "by_category": {}, "by_severity": {}, "threats": 0}
        by_cat = {str(k): int(v) for k, v in df["prediction"].value_counts().items()}
        by_sev = {str(k): int(v) for k, v in df["severity"].value_counts().items()}
        threats = int((df["prediction"] != "Normal").sum())
        return {
            "total": len(df),
            "by_category": by_cat,
            "by_severity": by_sev,
            "threats": threats,
        }
    except Exception:
        return {"total": 0, "by_category": {}, "by_severity": {}, "threats": 0}
