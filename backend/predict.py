import os
import pickle
import numpy as np

BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")

CATEGORIES = ["Normal", "DoS", "Probe", "R2L", "U2R"]
CATEGORICAL = ["protocol_type", "service", "flag"]

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

_cache = {}


def models_available():
    rf_path = os.path.join(MODELS_DIR, "model_rf.pkl")
    return os.path.exists(rf_path)


def _load():
    if _cache:
        return _cache

    with open(os.path.join(MODELS_DIR, "scaler.pkl"), "rb") as f:
        _cache["scaler"] = pickle.load(f)
    with open(os.path.join(MODELS_DIR, "encoders.pkl"), "rb") as f:
        _cache["encoders"] = pickle.load(f)
    with open(os.path.join(MODELS_DIR, "label_encoder.pkl"), "rb") as f:
        _cache["label_encoder"] = pickle.load(f)
    with open(os.path.join(MODELS_DIR, "model_rf.pkl"), "rb") as f:
        _cache["rf"] = pickle.load(f)

    svm_path = os.path.join(MODELS_DIR, "model_svm.pkl")
    if os.path.exists(svm_path):
        with open(svm_path, "rb") as f:
            _cache["svm"] = pickle.load(f)

    dnn_path = os.path.join(MODELS_DIR, "model_dnn.keras")
    if os.path.exists(dnn_path):
        try:
            import tensorflow as tf
            import logging
            tf.get_logger().setLevel(logging.ERROR)
            _cache["dnn"] = tf.keras.models.load_model(dnn_path)
        except Exception:
            pass

    rl_path = os.path.join(MODELS_DIR, "rl_qtable.npy")
    if os.path.exists(rl_path):
        _cache["rl_qtable"] = np.load(rl_path)

    return _cache


def preprocess(raw: dict):
    cache = _load()
    scaler = cache["scaler"]
    encoders = cache["encoders"]

    row = []
    for feat in FEATURE_NAMES:
        val = raw.get(feat, 0)
        if feat in CATEGORICAL:
            le = encoders[feat]
            known = set(le.classes_)
            str_val = str(val)
            if str_val not in known:
                str_val = le.classes_[0]
            val = le.transform([str_val])[0]
        else:
            try:
                val = float(val)
            except (ValueError, TypeError):
                val = 0.0
        row.append(val)

    X_raw = np.array(row, dtype=float).reshape(1, -1)
    X_scaled = scaler.transform(X_raw)
    return X_raw, X_scaled


def predict(raw: dict):
    cache = _load()
    X_raw, X_scaled = preprocess(raw)

    if "dnn" in cache:
        probs = cache["dnn"].predict(X_scaled, verbose=0)[0]
        category_index = int(np.argmax(probs))
        confidence = float(probs[category_index])
    else:
        probs = cache["rf"].predict_proba(X_scaled)[0]
        category_index = int(np.argmax(probs))
        confidence = float(probs[category_index])

    prediction = CATEGORIES[category_index]
    probabilities = {cat: round(float(p), 4) for cat, p in zip(CATEGORIES, probs)}

    return {
        "prediction": prediction,
        "confidence": confidence,
        "probabilities": probabilities,
        "category_index": category_index,
        "X_scaled": X_scaled,
        "X_raw": X_raw,
    }


def get_test_sample(category: str = None):
    samples_path = os.path.join(MODELS_DIR, "test_samples.npy")
    labels_path = os.path.join(MODELS_DIR, "test_labels.npy")

    if not os.path.exists(samples_path):
        raise FileNotFoundError("Test samples not found. Run train.py first.")

    X_test = np.load(samples_path)
    y_test = np.load(labels_path)
    category_map = {i: cat for i, cat in enumerate(CATEGORIES)}

    if category and category in CATEGORIES:
        cat_idx = CATEGORIES.index(category)
        mask = y_test == cat_idx
        if not mask.any():
            mask = np.ones(len(y_test), dtype=bool)
        indices = np.where(mask)[0]
    else:
        indices = np.arange(len(X_test))

    idx = int(np.random.choice(indices))
    raw_row = X_test[idx]
    actual_label = category_map[int(y_test[idx])]

    raw_dict = {feat: float(raw_row[i]) for i, feat in enumerate(FEATURE_NAMES)}

    # Decode categoricals back to string (approximate — use encoded int values)
    cache = _load()
    for col in CATEGORICAL:
        le = cache["encoders"][col]
        enc_val = int(raw_dict[col])
        if 0 <= enc_val < len(le.classes_):
            raw_dict[col] = le.classes_[enc_val]
        else:
            raw_dict[col] = le.classes_[0]

    raw_dict["_actual_label"] = actual_label
    return raw_dict
