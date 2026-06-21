# CyberShield AI — Setup Guide

---

## Requirements (install these first on the new laptop)

| Tool | Version | Download |
|------|---------|---------|
| Python | 3.10 or higher | https://www.python.org/downloads/ |
| Node.js | 18 or higher | https://nodejs.org/ |

> After installing, open a terminal and confirm with:
> ```
> python --version
> node --version
> ```

---

## PART 1 — Initial Setup (do this only once on a new laptop)

### Step 1 — Download the dataset

```bash
cd ai-cybersecurity-fyp/backend
python download_data.py
```

This downloads two files into the `backend/data/` folder:
- `KDDTrain+.txt` — used for training the models
- `KDDTest+.txt` — used for testing and random samples

---

### Step 2 — Set up the backend

```bash
cd ai-cybersecurity-fyp/backend
python -m venv venv
```

Then activate the virtual environment:

- **Mac / Linux / WSL:**
  ```bash
  source venv/bin/activate
  ```
- **Windows (Command Prompt):**
  ```bash
  venv\Scripts\activate
  ```

Then install all Python packages:

```bash
pip install -r requirements.txt
```

> This installs FastAPI, TensorFlow, SHAP, scikit-learn and others.
> Takes about 5–10 minutes on first run.

---

### Step 3 — Train the AI models

```bash
python train.py
```

This trains all four components of the system:
- Random Forest model
- SVM model
- Deep Neural Network (Keras)
- Q-Learning Reinforcement Learning agent

All trained models are saved into `backend/models/`. This step takes **5–10 minutes**. You will see progress printed in the terminal.

> You only need to do this once. After models are saved, you never need to retrain unless you want to start completely fresh.

---

### Step 4 — Install frontend packages

```bash
cd ai-cybersecurity-fyp/frontend
npm install
```

> This installs React, Recharts, Tailwind CSS and all other UI packages.
> Takes about 1–2 minutes.

---

## PART 2 — How to Run (do this every time you want to use the project)

You need **two terminal windows** open at the same time.

### Terminal 1 — Start the backend

```bash
cd ai-cybersecurity-fyp/backend
source venv/bin/activate        # Windows: venv\Scripts\activate
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### Terminal 2 — Start the frontend

```bash
cd ai-cybersecurity-fyp/frontend
npm run dev
```

You should see:
```
VITE ready in ...ms
➜  Local:   http://localhost:5173/
```

---

### Open the app

Go to your browser and open: **http://localhost:5173**

---

## PART 3 — How to Reset (clear everything for a clean fresh start)

If you want the dashboard to show zero data — no alerts, no history — run this:

```bash
cd ai-cybersecurity-fyp/backend
source venv/bin/activate        # Windows: venv\Scripts\activate
python reset.py
```

This clears:
- All alerts history (the `alerts.csv` file)
- Dashboard goes back to showing zeros
- Analyze page still works (models are NOT deleted)

If you also want to **delete and retrain the models from scratch**, run:

```bash
python reset.py --full
```

This deletes everything in `backend/models/` and `backend/data/` so you can redo the full setup from Step 1.

---

## Project Structure (for reference)

```
ai-cybersecurity-fyp/
├── backend/
│   ├── data/            ← NSL-KDD dataset files (downloaded in Step 1)
│   ├── models/          ← trained model files (created in Step 3)
│   ├── alerts.csv       ← alert history log (auto-created, cleared by reset)
│   ├── main.py          ← FastAPI backend server
│   ├── train.py         ← model training script
│   ├── predict.py       ← prediction logic
│   ├── xai_module.py    ← SHAP explainability
│   ├── response.py      ← automated response rules
│   ├── alerts.py        ← CSV alert logging
│   ├── download_data.py ← dataset downloader
│   ├── reset.py         ← reset script
│   └── requirements.txt ← Python packages list
│
├── frontend/
│   ├── src/
│   │   ├── pages/       ← Dashboard, Analyze, Alerts, Reports
│   │   └── components/  ← reusable UI components
│   └── package.json     ← Node packages list
│
├── SETUP.md             ← this file
└── README.md
```

---

## Common Issues

**"python: command not found"**
Try `python3` instead of `python`.

**"venv is not activated" / packages not found**
Make sure you ran `source venv/bin/activate` before running any python command.

**"Models not found" error on the dashboard**
You need to run `python train.py` first (Step 3).

**Port already in use**
Another process is using port 8000 or 5173. Restart your terminal or run:
```bash
pkill -f uvicorn    # kills backend
pkill -f vite       # kills frontend
```
Then start again from Part 2.
