"""
BimaSetu — Automated Crop Damage Assessment & PMFBY Claim Generation
FastAPI entry point
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from routers.analyze import router as analyze_router
from routers.claims import router as claims_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("bimasetu")

app = FastAPI(
    title="BimaSetu API",
    description="Automated Crop Damage Assessment & PMFBY Claim Generation",
    version="1.0.0",
)

# Allow React dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated mask images and PDFs
os.makedirs("static/masks", exist_ok=True)
os.makedirs("static/pdfs", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(analyze_router, prefix="/api", tags=["Analysis"])
app.include_router(claims_router, prefix="/api", tags=["Claims"])


@app.on_event("startup")
async def startup_event():
    try:
        from telegram_bot import start_telegram_bot_background
        start_telegram_bot_background()
    except Exception as exc:
        logger.warning("Could not auto-start Telegram bot: %s", exc)


@app.get("/health")
async def health():
    return {"success": True, "data": {"status": "ok", "service": "BimaSetu API"}, "error": ""}


@app.get("/")
async def root():
    return {
        "success": True,
        "data": {"message": "BimaSetu API is running", "docs": "/docs"},
        "error": "",
    }
