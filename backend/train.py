"""
Training script for CyberShield AI.
Trains Random Forest, SVM, DNN, and a Q-learning RL agent on NSL-KDD.
Run: python train.py
Requires KDDTrain+.txt and KDDTest+.txt in backend/data/
"""
import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.calibration import CalibratedClassifierCV

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

COLUMNS = [
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
    "label", "difficulty",
]

CATEGORICAL = ["protocol_type", "service", "flag"]
FEATURE_COLS = COLUMNS[:41]

ATTACK_MAP = {
    "normal": "Normal",
    "neptune": "DoS", "smurf": "DoS", "pod": "DoS", "teardrop": "DoS",
    "land": "DoS", "back": "DoS", "apache2": "DoS", "udpstorm": "DoS",
    "processtable": "DoS", "mailbomb": "DoS",
    "ipsweep": "Probe", "portsweep": "Probe", "nmap": "Probe",
    "satan": "Probe", "mscan": "Probe", "saint": "Probe",
    "warezclient": "R2L", "guess_passwd": "R2L", "ftp_write": "R2L",
    "multihop": "R2L", "imap": "R2L", "warezmaster": "R2L", "phf": "R2L",
    "named": "R2L", "snmpgetattack": "R2L", "sendmail": "R2L",
    "xlock": "R2L", "xsnoop": "R2L", "snmpguess": "R2L", "worm": "R2L",
    "httptunnel": "R2L",
    "buffer_overflow": "U2R", "rootkit": "U2R", "loadmodule": "U2R",
    "perl": "U2R", "sqlattack": "U2R", "xterm": "U2R", "ps": "U2R",
}

CATEGORIES = ["Normal", "DoS", "Probe", "R2L", "U2R"]

# RL action mapping: state_index -> correct_action_index
# Actions: 0=Monitor, 1=Alert, 2=Block, 3=Isolate
RL_CORRECT_ACTION = {0: 0, 1: 2, 2: 1, 3: 2, 4: 3}
RL_ACTION_NAMES = ["Monitor", "Alert", "Block", "Isolate"]


def load_data(path):
    df = pd.read_csv(path, header=None, names=COLUMNS)
    df["category"] = df["label"].str.strip().str.lower().map(ATTACK_MAP)
    df = df.dropna(subset=["category"])
    return df


def encode_features(df_train, df_test):
    encoders = {}
    for col in CATEGORICAL:
        le = LabelEncoder()
        le.fit(df_train[col].astype(str))
        encoders[col] = le

    def apply_encoders(df):
        df = df.copy()
        for col in CATEGORICAL:
            le = encoders[col]
            known = set(le.classes_)
            df[col] = df[col].astype(str).apply(
                lambda x: x if x in known else le.classes_[0]
            )
            df[col] = le.transform(df[col])
        return df

    df_train = apply_encoders(df_train)
    df_test = apply_encoders(df_test)
    return df_train, df_test, encoders


def compute_metrics(y_true, y_pred, model_name):
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    print(f"  {model_name}: Acc={acc:.4f} Prec={prec:.4f} Rec={rec:.4f} F1={f1:.4f}")
    return {"accuracy": round(acc, 4), "precision": round(prec, 4),
            "recall": round(rec, 4), "f1": round(f1, 4)}


def train_rl_agent():
    print("\n[5/7] Training Q-learning RL agent...")
    n_states = 5
    n_actions = 4
    Q = np.zeros((n_states, n_actions))
    alpha = 0.1
    gamma = 0.9
    epsilon = 1.0
    epsilon_min = 0.01
    epsilon_decay = (epsilon - epsilon_min) / 2000
    rewards_per_episode = []

    for episode in range(2000):
        state = np.random.randint(0, n_states)
        if np.random.random() < epsilon:
            action = np.random.randint(0, n_actions)
        else:
            action = np.argmax(Q[state])

        correct = RL_CORRECT_ACTION[state]
        reward = 1.0 if action == correct else -1.0
        next_state = np.random.randint(0, n_states)
        Q[state, action] += alpha * (reward + gamma * np.max(Q[next_state]) - Q[state, action])
        rewards_per_episode.append(reward)
        epsilon = max(epsilon_min, epsilon - epsilon_decay)

    print("  Q-learning agent trained.")
    return Q, np.array(rewards_per_episode)


def main():
    train_path = os.path.join(DATA_DIR, "KDDTrain+.txt")
    test_path = os.path.join(DATA_DIR, "KDDTest+.txt")

    if not os.path.exists(train_path):
        print(f"ERROR: {train_path} not found.")
        print("Run: python download_data.py  or place KDDTrain+.txt in backend/data/")
        return

    print("[1/7] Loading NSL-KDD dataset...")
    df_train_raw = load_data(train_path)
    df_test_raw = load_data(test_path) if os.path.exists(test_path) else df_train_raw.copy()
    print(f"  Train: {len(df_train_raw)} rows | Test: {len(df_test_raw)} rows")
    print(f"  Categories: {df_train_raw['category'].value_counts().to_dict()}")

    print("\n[2/7] Preprocessing features...")
    df_train_enc, df_test_enc, encoders = encode_features(
        df_train_raw[FEATURE_COLS], df_test_raw[FEATURE_COLS]
    )

    label_encoder = LabelEncoder()
    label_encoder.fit(CATEGORIES)

    y_train = label_encoder.transform(df_train_raw["category"])
    y_test = label_encoder.transform(df_test_raw["category"])

    X_train_raw = df_train_enc[FEATURE_COLS].values.astype(float)
    X_test_raw = df_test_enc[FEATURE_COLS].values.astype(float)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_test = scaler.transform(X_test_raw)

    print(f"  Feature shape: {X_train.shape}")

    print("\n[3/7] Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_metrics = compute_metrics(y_test, rf_pred, "Random Forest")

    print("\n[4/7] Training SVM (on 20% subset for speed)...")
    subset_size = int(len(X_train) * 0.2)
    X_sub, _, y_sub, _ = train_test_split(X_train, y_train, train_size=subset_size, random_state=42, stratify=y_train)
    base_svm = LinearSVC(max_iter=2000, random_state=42)
    svm = CalibratedClassifierCV(base_svm, cv=3)
    svm.fit(X_sub, y_sub)
    svm_pred = svm.predict(X_test)
    svm_metrics = compute_metrics(y_test, svm_pred, "SVM")

    print("\n[5/7] Training Deep Neural Network (Keras)...")
    try:
        import tensorflow as tf
        from tensorflow import keras

        tf.get_logger().setLevel("ERROR")
        os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

        n_classes = len(CATEGORIES)
        model = keras.Sequential([
            keras.layers.Input(shape=(41,)),
            keras.layers.Dense(256, activation="relu"),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(128, activation="relu"),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(64, activation="relu"),
            keras.layers.Dense(n_classes, activation="softmax"),
        ])
        model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
        model.fit(
            X_train, y_train,
            epochs=20,
            batch_size=256,
            validation_split=0.1,
            verbose=1,
        )
        dnn_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)
        dnn_metrics = compute_metrics(y_test, dnn_pred, "DNN")
        dnn_available = True
        model.save(os.path.join(MODELS_DIR, "model_dnn.keras"))
        print("  DNN saved.")
    except Exception as e:
        print(f"  DNN training failed ({e}), skipping.")
        dnn_metrics = {"accuracy": 0, "precision": 0, "recall": 0, "f1": 0}
        dnn_available = False

    q_table, rl_rewards = train_rl_agent()

    print("\n[6/7] Saving all models and artifacts...")
    with open(os.path.join(MODELS_DIR, "scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
    with open(os.path.join(MODELS_DIR, "encoders.pkl"), "wb") as f:
        pickle.dump(encoders, f)
    with open(os.path.join(MODELS_DIR, "model_rf.pkl"), "wb") as f:
        pickle.dump(rf, f)
    with open(os.path.join(MODELS_DIR, "model_svm.pkl"), "wb") as f:
        pickle.dump(svm, f)
    with open(os.path.join(MODELS_DIR, "label_encoder.pkl"), "wb") as f:
        pickle.dump(label_encoder, f)

    np.save(os.path.join(MODELS_DIR, "rl_qtable.npy"), q_table)
    np.save(os.path.join(MODELS_DIR, "rl_rewards_per_episode.npy"), rl_rewards)

    # SHAP background: 100 samples from training set
    bg_idx = np.random.choice(len(X_train), size=min(100, len(X_train)), replace=False)
    np.save(os.path.join(MODELS_DIR, "shap_background.npy"), X_train[bg_idx])

    # Save test samples for the Analyze page random sample feature
    np.save(os.path.join(MODELS_DIR, "test_samples.npy"), X_test_raw)
    np.save(os.path.join(MODELS_DIR, "test_labels.npy"), y_test)

    # Performance metrics JSON
    performance = {
        "models": {
            "Random Forest": rf_metrics,
            "SVM": svm_metrics,
            "DNN": dnn_metrics,
        },
        "dnn_available": dnn_available,
        "dataset": {
            "train_size": len(X_train),
            "test_size": len(X_test),
            "n_features": 41,
            "n_classes": len(CATEGORIES),
            "categories": CATEGORIES,
        },
    }
    with open(os.path.join(MODELS_DIR, "performance_metrics.json"), "w") as f:
        json.dump(performance, f, indent=2)

    # Save RL action names
    with open(os.path.join(MODELS_DIR, "rl_action_names.json"), "w") as f:
        json.dump(RL_ACTION_NAMES, f)

    print("\n[7/7] All done!")
    print(f"  Models saved to: {MODELS_DIR}")
    print("\n  Performance Summary:")
    print(f"    Random Forest Accuracy : {rf_metrics['accuracy']:.4f}")
    print(f"    SVM Accuracy           : {svm_metrics['accuracy']:.4f}")
    if dnn_available:
        print(f"    DNN Accuracy           : {dnn_metrics['accuracy']:.4f}")
    print("\nNow run: uvicorn main:app --reload")


if __name__ == "__main__":
    main()
