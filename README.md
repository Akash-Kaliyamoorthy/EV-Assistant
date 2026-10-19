# ⚡ EV Charging Assistant

An AI-powered full-stack web application that helps electric vehicle owners with charging time calculation, cost estimation, range estimation, trip planning, station discovery, and natural-language EV questions — powered by Google Gemini.

> **Portfolio / Academic Project** — Built as a demonstration of full-stack development, AI integration, and cloud deployment.

---

## Architecture

```
User Browser
   ↓
React + Vite frontend (GitHub Pages)
   ↓ HTTPS fetch calls via VITE_API_BASE_URL
FastAPI backend (Render free tier)
   ↓ server-side only
Google Gemini API (key in Render env vars)
```

**Key design principle:** Gemini handles natural-language explanation only. All numeric calculations (charging time, cost, range, trip estimates) are performed by deterministic Python services in `backend/app/services/calculations.py`. Gemini receives those computed results and explains them in natural language.

---

## Features

| Feature | Description |
|---|---|
| 💬 AI Chat | Real Gemini-powered conversational assistant |
| ⏱️ Charging Time | Deterministic calculator wired to backend |
| 💰 Charging Cost | Cost estimation with INR default, multi-currency |
| 🛣️ Range Estimator | SOC + efficiency based range calculation |
| 🗺️ Charging Stations | Sample station browser with geolocation + filters |
| 🚗 Trip Planner | Multi-stop charging requirement estimator |
| 🔧 Troubleshooting | Guided fault diagnosis flow |
| 👤 EV Profile | localStorage-persisted vehicle profile |
| 📱 Responsive | Works at 360px → 1440px+ |

---

## Project Structure

```
ev-charging-assistant/
  frontend/               # React + Vite
    src/
      components/         # Sidebar, ChatMessage, RightPanel, etc.
      pages/              # ChatPage, ChargingTimePage, StationsPage, etc.
      services/api.js     # All API calls (reads VITE_API_BASE_URL)
      hooks/              # useEVProfile, useChatHistory
    vite.config.js        # Base path configured for GitHub Pages
    .env.example
  backend/                # FastAPI Python
    app/
      routes/             # chat, calculate, stations, trip, health
      services/
        calculations.py   # Pure deterministic math — NO Gemini dependency
        gemini_service.py # Gemini API wrapper (google-genai SDK)
        station_service.py# StationProvider interface + DemoStationProvider
      models/schemas.py   # Pydantic v2 request/response models
      utils/prompts.py    # System instruction + prompt builder
      main.py             # FastAPI app with lifespan, CORS, error handling
    tests/                # pytest unit tests (no Gemini key required)
    render.yaml           # Render deployment config
    .env.example
  .github/workflows/
    deploy-frontend.yml   # GitHub Pages deployment workflow
  README.md
  .gitignore
```

---

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API key (see below)

### 1. Clone and enter the project

```bash
git clone https://github.com/YOUR_USERNAME/ev-charging-assistant.git
cd ev-charging-assistant
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and GEMINI_MODEL
```

Example `.env`:
```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

Verify at: http://localhost:8000/health and http://localhost:8000/docs

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# Edit .env:
# VITE_API_BASE_URL=http://localhost:8000

npm install
npm run dev
```

App opens at: http://localhost:5173

### 4. Run backend tests

```bash
cd backend
pytest tests/ -v
# Tests do NOT require a real Gemini API key.
```

---

## Getting a Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key — you'll need it for both local development and Render
5. **NEVER commit this key to Git** — add it only to environment variables

---

## Deployment: GitHub Pages (Frontend)

### Step 1: Create a GitHub repository
```bash
cd ev-charging-assistant
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ev-charging-assistant.git
git push -u origin main
```

### Step 2: Set the Vite base path
Edit `frontend/vite.config.js`:
```js
const GITHUB_REPO_NAME = 'ev-charging-assistant' // ← set your actual repo name
```

### Step 3: Enable GitHub Pages
- Go to your repo → **Settings → Pages**
- Source: **GitHub Actions**

### Step 4: Add the API URL secret
- Go to **Settings → Secrets and variables → Actions → New repository secret**
- Name: `VITE_API_BASE_URL`
- Value: your Render backend URL (e.g. `https://ev-charging-assistant-api.onrender.com`)

### Step 5: Push to main
The GitHub Actions workflow will automatically build and deploy.

Your site will be live at: `https://YOUR_USERNAME.github.io/ev-charging-assistant/`

---

## Deployment: Render (Backend)

### Step 1: Push to GitHub (done above)

### Step 2: Create a Render account
Go to [https://render.com](https://render.com) and sign in with GitHub.

### Step 3: Create a new Web Service
- Dashboard → **New → Web Service**
- Connect your GitHub repo
- Set **Root Directory**: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 4: Set environment variables
In Render → your service → **Environment**, add:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `FRONTEND_URL` | `https://YOUR_USERNAME.github.io` |

> ⚠️ **Never put your API key in `render.yaml` or any committed file.**

### Step 5: Deploy
Click **Deploy** — Render will build and start your service.

Verify:
- `https://YOUR_APP.onrender.com/health` → `{"status":"ok",...}`
- `https://YOUR_APP.onrender.com/docs` → Swagger UI

---

## Configuration Values You Must Supply

| Value | Where to set | Example |
|---|---|---|
| `GEMINI_API_KEY` | Backend `.env` (local) / Render env (prod) | `AIza...` |
| `GEMINI_MODEL` | Same | `gemini-2.0-flash` |
| `VITE_API_BASE_URL` | Frontend `.env` (local) / GitHub Actions secret (prod) | `https://app.onrender.com` |
| `FRONTEND_URL` | Backend `.env` (local) / Render env (prod) | `https://user.github.io` |
| GitHub repo name | `frontend/vite.config.js` → `GITHUB_REPO_NAME` | `ev-charging-assistant` |

---

## Station Data Disclaimer

> ⚠️ **All charging station data shown in this application is fictional sample/demo data created for demonstration purposes only. It is NOT live, real-time, or accurate data from any charging network. Do not rely on it for actual trip planning.**

---

## Future Extension Points

The codebase includes documented seams for future integration (see source comments):

- **Real routing API** (`backend/app/services/calculations.py` → `estimate_trip`) — replace heuristic distance with Google Maps/OSRM
- **Live station data** (`backend/app/services/station_service.py`) — implement `OpenChargeMapProvider(StationProvider)`
- **Authentication** — add JWT/OAuth middleware layer before routes
- **Database** — replace localStorage with PostgreSQL/Firebase (add `database/` module)
- **Vehicle data API** — wire to vehicle telematics API for live SOC
- **Push notifications** — add WebSocket or SSE layer for charging alerts

---

## License

MIT License — see [LICENSE](LICENSE)
