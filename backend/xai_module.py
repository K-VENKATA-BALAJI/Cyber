import os
import pickle
import numpy as np
import shap

BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")

FEATURE_NAMES = [
    "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes",
    "land", "wrong_fragment", "urgent", "hot", "num_failed_logins", "logged_in",
    "num_compromised", "root_shell", "su_attempted", "num_root", "num_file_creations",
    "num_shells", "num_access_files", "num_outbound_cmds", "is_host_login",
    "is_guest_login", "count", "srv_count", "serror_rate", "srv_serror_rate",
    "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate",
    "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate",
]

_explainer = None
_rf_model = None


def get_explainer():
    global _explainer, _rf_model

    if _explainer is not None:
        return _explainer

    rf_path = os.path.join(MODELS_DIR, "model_rf.pkl")
    bg_path = os.path.join(MODELS_DIR, "shap_background.npy")

    if not os.path.exists(rf_path) or not os.path.exists(bg_path):
        return None

    with open(rf_path, "rb") as f:
        _rf_model = pickle.load(f)

    background = np.load(bg_path)
    # Use at most 20 samples for SHAP speed
    if len(background) > 20:
        idx = np.random.choice(len(background), size=20, replace=False)
        background = background[idx]

    _explainer = shap.KernelExplainer(_rf_model.predict_proba, background)
    return _explainer


def explain(X_scaled: np.ndarray, top_n: int = 10):
    explainer = get_explainer()
    if explainer is None:
        return []

    try:
        shap_values = explainer.shap_values(X_scaled, nsamples=100, silent=True)

        # shap_values is list of arrays (one per class), each shape (1, 41)
        # Sum absolute values across all classes to get overall feature importance
        if isinstance(shap_values, list):
            combined = np.sum([np.abs(sv) for sv in shap_values], axis=0)[0]
            # For direction, use the max-probability class
            pred_class = int(np.argmax(_rf_model.predict_proba(X_scaled)[0]))
            directional = shap_values[pred_class][0]
        else:
            combined = np.abs(shap_values[0])
            directional = shap_values[0]

        # Rank by importance
        ranked_idx = np.argsort(combined)[::-1][:top_n]

        result = []
        for i in ranked_idx:
            result.append({
                "feature": FEATURE_NAMES[i],
                "shap_value": round(float(directional[i]), 6),
                "abs_shap": round(float(combined[i]), 6),
                "value": round(float(X_scaled[0][i]), 4),
            })

        return result

    except Exception as e:
        print(f"SHAP explanation failed: {e}")
        return []
