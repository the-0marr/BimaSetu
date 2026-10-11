# 🌾 BimaSetu — Automated Crop Damage Assessment

> Automated Damage Assessment for Farmers · SAM Segmentation · Multilingual Telegram Bot · PMFBY-Compliant Claim Generation

[![CI](https://github.com/the-0marr/BimaSetu/actions/workflows/deploy.yml/badge.svg)](https://github.com/the-0marr/BimaSetu/actions)

---

## What it does

1. **Capture** — Farmers photograph damaged crops via web app camera or Telegram Bot with GPS coordinates auto-captured.
2. **Assess** — **SAM (Segment Anything Model)** identifies crop vs damage regions; fine-tuned classifier labels damage cause (waterlogging / lodging / leaf disease / pest / drought / nutrient deficiency).
3. **Generate** — PMFBY-compliant 2-page PDF claim report is generated with photo evidence, SAM mask overlay, and AI diagnostics.
4. **Telegram Bot** — Instant mobile assessments via Telegram with language selection (English, Hindi, Kannada, Telugu), photo upload, location sharing, and direct PDF report delivery.
5. **Track** — Farmer dashboard shows all past claims with instant download links.

---

## Tech Stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| Frontend     | React 18 + Vite + Tailwind CSS                            |
| Backend      | FastAPI (Python 3.11) + Uvicorn                           |
| ML           | SAM (Segment Anything Model) + EfficientNet / Groq Vision |
| Telegram Bot | Python Telegram Bot API (Multilingual)                    |
| Database     | SQLite (via Python stdlib)                                |
| PDF          | ReportLab                                                 |
| Auth         | Firebase Authentication (Google)                          |

---

## 🤖 Multilingual Telegram Bot Setup

BimaSetu features an interactive Telegram Bot that guides farmers step-by-step to submit claims and get immediate PDF reports.

### Bot Workflow

```
/start ──► 🌐 Language Selection (English / हिन्दी / ಕನ್ನಡ / తెలుగు)
              │
              ▼
📷 Photo Upload (Farmer sends photo of crop field)
              │
              ▼
📍 Location Sharing (Farmer shares live/current GPS location)
              │
              ▼
⚙️ AI Assessment Pipeline (SAM Segmentation + Classification)
              │
              ▼
📄 PMFBY Claim Report PDF generated & delivered directly in chat!
```

### Quick Setup

1. **Obtain Bot Token**: Open Telegram, search for [@BotFather](https://t.me/BotFather), type `/newbot`, and copy your HTTP API token.
2. **Configure `.env`**:
   Add the token to `backend/.env`:

   ```
   TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
   ```

3. **Run Bot**:
   - **Method A (Automatic)**: Start the FastAPI server (`uvicorn main:app --reload`), the bot will auto-launch on startup!
   - **Method B (Standalone)**:

     ```
     cd backend
     python telegram_bot.py
     ```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- A Firebase project (Auth + Firestore + Storage enabled)

### 1. Clone & configure

```
git clone https://github.com/the-0marr/BimaSetu.git
cd BimaSetu
```

### 2. Backend setup

```
cd backend
cp .env.example .env
# Edit .env — set TELEGRAM_BOT_TOKEN and BASE_URL

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

> **No ML weights?** No problem — the system auto-falls back to HSV colour analysis (segmentation) and rule-based classification. Results will be approximate but functional.

### 3. Frontend setup

```
cd frontend
cp .env.example .env
# Fill in your Firebase project values in .env

npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Language

Use the **globe icon** in the top navbar to switch between **English**, **हिन्दी (Hindi)**, and **ಕನ್ನಡ (Kannada)** on the web app, or use `/start` / `/language` in the Telegram Bot for English, Hindi, Kannada, and Telugu.

---

## Project Structure

```
bimasetu/
├── frontend/src/
│   ├── components/
│   │   ├── CameraCapture.jsx   # Rear camera + GPS capture
│   │   ├── UploadForm.jsx      # Photo upload + claim submit
│   │   ├── ResultCard.jsx      # Assessment results + PDF download
│   │   ├── ClaimDownload.jsx   # Reusable PDF download button
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Home.jsx            # Public marketing landing (SAM mode overview)
│   │   ├── FarmerHome.jsx      # Authenticated farmer home (stats, claims)
│   │   ├── Profile.jsx         # Account settings & setup checklist
│   │   ├── Dashboard.jsx       # Claim upload & history
│   │   ├── Login.jsx           # Sign-in
│   │   └── Signup.jsx          # Registration
│   ├── context/AuthContext.jsx
│   └── i18n/                   # English, Hindi (हिन्दी), Kannada (ಕನ್ನಡ)
│
└── backend/
    ├── main.py                 # FastAPI app entry + Telegram Bot startup
    ├── telegram_bot.py         # Multilingual Telegram Bot workflow
    ├── database.py             # SQLite setup
    ├── routers/
    │   ├── analyze.py          # POST /api/analyze
    │   └── claims.py           # GET/DELETE /api/claims
    ├── ml/
    │   ├── segmentor.py        # SAM (Segment Anything Model) + HSV fallback
    │   ├── classifier.py       # Damage classification + rule-based fallback
    │   └── field_detector.py   # Crop field validation
    └── pdf/generator.py        # ReportLab PMFBY PDF Generator
```

---

## API Reference

### `POST /api/analyze`

Accepts multipart form:

| Field          | Type   | Description               |
| -------------- | ------ | ------------------------- |
| `image`        | file   | JPEG/PNG crop photo       |
| `lat`          | float  | GPS latitude              |
| `lng`          | float  | GPS longitude             |
| `timestamp`    | string | ISO 8601 capture time     |
| `uid`          | string | Firebase user UID         |
| `display_name` | string | Farmer name               |
| `claim_id`     | string | Optional pre-generated ID |

---

## Adding ML Model Weights

Place your trained weights in `backend/ml/model_weights/`:

```
backend/ml/model_weights/
├── sam2_b.pt             # SAM (Segment Anything Model) weights
└── efficientnet_b0.pth   # Fine-tuned damage classifier weights
```

The app auto-detects weights at startup and logs whether it's using SAM/ML models or rule-based fallbacks.

---

## Disclaimer

Generated claim PDFs are for insurer review only and must be verified by a licensed agricultural assessor before formal claim processing. This tool is designed to assist, not replace, official PMFBY assessment procedures.

---

## License

MIT © BimaSetu Contributors
