# CyberShield AI — Cybersecurity Threat Detection System
**Final Year Project | AI for Cybersecurity Threat Detection**

A full-stack AI-powered network intrusion detection system built on the NSL-KDD dataset. Implements deep learning, reinforcement learning, and explainable AI (XAI) for real-time threat classification and automated response recommendations.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python) |
| Machine Learning | scikit-learn (Random Forest, SVM) |
| Deep Learning | TensorFlow / Keras (DNN) |
| Reinforcement Learning | Q-learning (custom Python) |
| Explainability (XAI) | SHAP (KernelExplainer) |
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Storage | CSV files (no database needed) |
| Dataset | NSL-KDD (free, open-source) |

## Models

- **Random Forest** — baseline ensemble classifier
- **SVM (LinearSVC)** — trained on 20% subset for speed
- **Deep Neural Network** — 256→128→64→5 with dropout layers
- **Q-learning RL Agent** — learns optimal response action per threat type

## Setup Instructions

### Step 1: Download NSL-KDD Dataset

```bash
cd backend
python download_data.py
```

Or manually download and place these files in `backend/data/`:
- `KDDTrain+.txt`
- `KDDTest+.txt`

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Train all models (takes 5-15 minutes)
python train.py

# Start the API server
uvicorn main:app --reload
# API runs at http://localhost:8000
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install
npm run dev
# UI runs at http://localhost:5173
```

### Step 4: Open Browser

Visit **http://localhost:5173**

---

## Pages

| Page | Description |
|---|---|
| **Dashboard** | Live monitoring overview with stats, recent alerts, threat distribution pie chart |
| **Analyze** | Single sample analysis with SHAP explanation + batch CSV upload |
| **Alerts** | Full alert history with filtering, pagination, export |
| **Reports** | 4 performance charts: model comparison, threat evolution, FP reduction, RL learning curve |

## Project Structure

```
ai-cybersecurity-fyp/
├── backend/
│   ├── data/              ← NSL-KDD dataset files
│   ├── models/            ← trained models + metrics
│   ├── main.py            ← FastAPI app
│   ├── train.py           ← training script
│   ├── predict.py         ← inference module
│   ├── xai_module.py      ← SHAP explainability
│   ├── response.py        ← automated response rules
│   ├── alerts.py          ← CSV alert storage
│   └── alerts.csv         ← auto-created on first run
└── frontend/
    └── src/
        ├── pages/         ← Dashboard, Analyze, Alerts, Reports
        └── components/    ← Sidebar, StatCard, ThreatBadge, SHAPChart
```
