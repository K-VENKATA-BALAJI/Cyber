"""
Reset script for CyberShield AI.

Usage:
  python reset.py           → clears alerts only (dashboard goes clean)
  python reset.py --full    → clears alerts + all models + dataset (full redo)
"""

import os
import sys
import csv
import shutil

BASE_DIR = os.path.dirname(__file__)
ALERTS_FILE = os.path.join(BASE_DIR, "alerts.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

ALERT_COLUMNS = [
    "id", "timestamp", "src_bytes", "dst_bytes", "protocol",
    "duration", "prediction", "confidence", "severity", "action", "top_feature"
]


def clear_alerts():
    with open(ALERTS_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=ALERT_COLUMNS)
        writer.writeheader()
    print("✓ Alerts cleared — dashboard is now clean.")


def clear_models():
    if os.path.exists(MODELS_DIR):
        shutil.rmtree(MODELS_DIR)
        os.makedirs(MODELS_DIR)
        print("✓ Models deleted — run 'python train.py' to retrain.")
    else:
        print("  Models folder not found, skipping.")


def clear_data():
    if os.path.exists(DATA_DIR):
        shutil.rmtree(DATA_DIR)
        os.makedirs(DATA_DIR)
        print("✓ Dataset deleted — run 'python download_data.py' to re-download.")
    else:
        print("  Data folder not found, skipping.")


def main():
    full = "--full" in sys.argv

    print("\n=== CyberShield AI — Reset ===\n")

    if full:
        print("Mode: FULL RESET (alerts + models + dataset)\n")
        confirm = input("This will delete all trained models and dataset. Are you sure? (yes/no): ").strip().lower()
        if confirm != "yes":
            print("Cancelled.")
            return
        clear_alerts()
        clear_models()
        clear_data()
        print("\nFull reset complete.")
        print("Next steps:")
        print("  1. python download_data.py")
        print("  2. python train.py")
        print("  3. uvicorn main:app --reload")
    else:
        print("Mode: ALERTS ONLY (dashboard reset)\n")
        clear_alerts()
        print("\nDone. Refresh your browser — the dashboard is clean.")
        print("Models are still loaded. No need to retrain.")


if __name__ == "__main__":
    main()
