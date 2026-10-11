"""
backend/telegram_bot.py

BimaSetu Telegram Bot Handler.
Flow:
  1. /start -> Language Selection (English, Hindi, Kannada, Telugu)
  2. Upload Crop Photo
  3. Share GPS Location
  4. Run SAM Crop Damage Assessment & Generate PMFBY Claim PDF Report
  5. Send PDF document back to user
"""

import asyncio
import logging
import os
import uuid
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv

from database import get_connection, init_db
from ml.classifier import classify_damage as local_classify
from ml.field_detector import predict_crop_field as local_predict_field
from ml.segmentor import segment_damage as local_segment
from pdf.generator import generate_claim_pdf

# Try loading production Groq vision if key available, fallback to local ML modules
try:
    from ml.groq_vision import (
        classify_damage as groq_classify,
        predict_crop_field as groq_predict_field,
        segment_damage as groq_segment,
    )
    HAS_GROQ = bool(os.getenv("GROQ_API_KEY", ""))
except Exception:
    HAS_GROQ = False

load_dotenv()
logger = logging.getLogger("bimasetu.telegram")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Directory setup
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
init_db()

# User State Store: { user_id: { "lang": "en", "photo_bytes": b"...", "img_path": "...", "claim_id": "..." } }
USER_STATES = {}

# Multilingual Text Resources
MESSAGES = {
    "welcome": {
        "en": "🌾 *Welcome to BimaSetu AI Crop Damage Assessor!*\n\nPlease select your preferred language:",
        "hi": "🌾 *बीमासेतु AI फसल क्षति मूल्यांकन में आपका स्वागत है!*\n\nकृपया अपनी पसंदीदा भाषा चुनें:",
        "kn": "🌾 *ಭೀಮಾಸೇತು AI ಬೆಳೆ ಹಾನಿ ಮೌಲ್ಯಮಾಪಕಕ್ಕೆ ಸುಸ್ವಾಗತ!*\n\nದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:",
        "te": "🌾 *భీమాసేతు AI పంట నష్ట అంచనాకు స్వాగతం!*\n\nదయచేసి మీ ప్రాధాన్యత భాషను ఎంచుకోండి:",
    },
    "ask_photo": {
        "en": "🇬🇧 Language set to *English*!\n\n📷 Please upload or send a clear photo of your damaged crop field.",
        "hi": "🇮🇳 भाषा *हिन्दी* पर सेट हो गई है!\n\n📷 कृपया अपने क्षतिग्रस्त फसल खेत की एक स्पष्ट फोटो भेजें।",
        "kn": "🌾 ಭಾಷೆಯನ್ನು *ಕನ್ನಡಕ್ಕೆ* ಹೊಂದಿಸಲಾಗಿದೆ!\n\n📷 ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹಾನಿಗೊಳಗಾದ ಬೆಳೆಯ ಸ್ಪಷ್ಟ ಫೋಟೋವನ್ನು ಕಳುಹಿಸಿ.",
        "te": "🍇 భాష *తెలుగులోకి* సెట్ చేయబడింది!\n\n📷 దయచేసి మీ దెబ్బతిన్న పంట పొలం స్పష్టమైన ఫోటోను పంపండి.",
    },
    "ask_location": {
        "en": "📸 Photo received!\n\n📍 Now please share your current/live GPS Location.\n_(Tap the Attachment 📎 icon -> Location -> Share My Current Location)_",
        "hi": "📸 फोटो प्राप्त हुई!\n\n📍 अब कृपया अपना वर्तमान GPS लोकेशन शेयर करें।\n_(अटैचमेंट 📎 आइकन दबाएं -> Location -> Share My Current Location)_",
        "kn": "📸 ಫೋಟೋ ಸ್ವೀಕರಿಸಲಾಗಿದೆ!\n\n📍 ಈಗ ನಿಮ್ಮ ಪ್ರಸ್ತುತ GPS ಸ್ಥಳವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.\n_(ಲಗತ್ತು 📎 ಐಕಾನ್ ಸ್ಪರ್ಶಿಸಿ -> Location -> Share My Current Location)_",
        "te": "📸 ఫోటో స్వీకరించబడింది!\n\n📍 ఇప్పుడు మీ ప్రస్తుత GPS స్థానాన్ని భాగస్వామ్యం చేయండి.\n_(అటాచ్‌మెంట్ 📎 ఐకాన్ నొక్కండి -> Location -> Share My Current Location)_",
    },
    "processing": {
        "en": "⏳ *Processing your claim...*\n\n1️⃣ Validating crop field image\n2️⃣ Running SAM (Segment Anything Model) crop damage segmentation\n3️⃣ Classifying damage cause\n4️⃣ Generating PMFBY Claim Report PDF...",
        "hi": "⏳ *आपका दावा प्रोसेस किया जा रहा है...*\n\n1️⃣ फसल खेत चित्र का सत्यापन\n2️⃣ SAM मॉडल द्वारा नुकसान का विभाजन\n3️⃣ नुकसान के कारण का वर्गीकरण\n4️⃣ PMFBY दावा PDF रिपोर्ट जनरेट की जा रही है...",
        "kn": "⏳ *ನಿಮ್ಮ ಹಕ್ಕು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...*\n\n1️⃣ ಬೆಳೆ ಚಿತ್ರ ಪರಿಶೀಲನೆ\n2️⃣ SAM ಮಾದರಿ ಬೆಳೆ ಹಾನಿ ವಿಶ್ಲೇಷಣೆ\n3️⃣ ಹಾನಿಯ ರೋಗನಿರ್ಣಯ\n4️⃣ PMFBY PDF ವರದಿ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...",
        "te": "⏳ *మీ క్లెయిమ్ ప్రాసెస్ చేయబడుతోంది...*\n\n1️⃣ పంట పొలం ఫోటో ధృవీకరణ\n2️⃣ SAM మోడల్ పంట నష్ట విభజన\n3️⃣ నష్టం రకం వర్గీకరణ\n4️⃣ PMFBY క్లెయిమ్ నివేదిక PDF రూపొందించబడుతోంది...",
    },
    "not_crop": {
        "en": "⚠️ *Invalid Image*: The uploaded photo does not appear to be a crop field. Please send a clear photo of your affected crop field.",
        "hi": "⚠️ *अमान्य चित्र*: अपलोड की गई फोटो फसल खेत की नहीं लग रही है। कृपया प्रभावित फसल खेत की स्पष्ट फोटो भेजें।",
        "kn": "⚠️ *ಅಮಾನ್ಯ ಚಿತ್ರ*: ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಫೋಟೋ ಬೆಳೆ ಜಮೀನಿನಂತೆ ಕಾಣುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೆಳೆಯ ಸ್ಪಷ್ಟ ಫೋಟೋ ಕಳುಹಿಸಿ.",
        "te": "⚠️ *చెల్లని చిత్రం*: అప్‌లోడ్ చేసిన ఫోటో పంట పొలం వలె ಕಾಣడం లేదు. దయచేసి స్పష్టమైన పంట ఫోటోను పంపండి.",
    },
    "need_photo_first": {
        "en": "⚠️ Please upload a crop damage photo first before sharing your location.",
        "hi": "⚠️ लोकेशन शेयर करने से पहले कृपया फसल क्षति की फोटो अपलोड करें।",
        "kn": "⚠️ ಸ್ಥಳವನ್ನು ಹಂಚಿಕೊಳ್ಳುವ ಮೊದಲು ದಯವಿಟ್ಟು ಮೊದಲು ಬೆಳೆಯ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
        "te": "⚠️ లొకేషన్ పంపే ముందు దయచేసి మొదట పంట ఫోటోను అప్‌లోడ్ చేయండి.",
    },
    "success": {
        "en": "✅ *PMFBY Claim Report Generated Successfully!*\n\n🆔 *Claim ID*: `{claim_id}`\n📊 *Damage Percentage*: *{damage_pct}%*\n🌾 *Damage Cause*: *{damage_type}*\n📍 *GPS*: `{lat:.5f}, {lng:.5f}`\n\n📄 Your official PMFBY claim PDF is attached below.",
        "hi": "✅ *PMFBY दावा रिपोर्ट सफलतापूर्वक जनरेट हो गई!*\n\n🆔 *दावा ID*: `{claim_id}`\n📊 *क्षति प्रतिशत*: *{damage_pct}%*\n🌾 *क्षति कारण*: *{damage_type}*\n📍 *GPS*: `{lat:.5f}, {lng:.5f}`\n\n📄 आपकी आधिकारिक PMFBY दावा PDF नीचे संलग्न है।",
        "kn": "✅ *PMFBY ಹಕ್ಕು ಸಲ್ಲಿಕೆ ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ!*\n\n🆔 *ಹಕ್ಕು ID*: `{claim_id}`\n📊 *ಹಾನಿ ಪ್ರಮಾಣ*: *{damage_pct}%*\n🌾 *ಹಾನಿಯ ಕಾರಣ*: *{damage_type}*\n📍 *GPS*: `{lat:.5f}, {lng:.5f}`\n\n📄 ನಿಮ್ಮ ಅಧಿಕೃತ PMFBY PDF ವರದಿಯನ್ನು ಕೆಳಗೆ ಲಗತ್ತಿಸಲಾಗಿದೆ.",
        "te": "✅ *PMFBY క్లెయిమ్ నివేదిక విజ‌య‌వంతంగా రూపొందించబడింది!*\n\n🆔 *క్లెయిమ్ ID*: `{claim_id}`\n📊 *నష్టం శాతం*: *{damage_pct}%*\n🌾 *నష్టం రకం*: *{damage_type}*\n📍 *GPS*: `{lat:.5f}, {lng:.5f}`\n\n📄 మీ అధికారిక PMFBY నివేదిక PDF క్రింద జత చేయబడింది.",
    },
}


class TelegramBotRunner:
    def __init__(self, token: str):
        self.token = token
        self.api_url = f"https://api.telegram.org/bot{token}"
        self.offset = 0
        self.running = False

    def send_message(self, chat_id: int, text: str, reply_markup=None, parse_mode="Markdown"):
        url = f"{self.api_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        try:
            resp = requests.post(url, json=payload, timeout=10)
            return resp.json()
        except Exception as exc:
            logger.error("Failed to send telegram message: %s", exc)
            return None

    def send_document(self, chat_id: int, document_path: str, caption: str = ""):
        url = f"{self.api_url}/sendDocument"
        try:
            with open(document_path, "rb") as f:
                files = {"document": f}
                data = {"chat_id": chat_id, "caption": caption, "parse_mode": "Markdown"}
                resp = requests.post(url, data=data, files=files, timeout=30)
                return resp.json()
        except Exception as exc:
            logger.error("Failed to send telegram document: %s", exc)
            return None

    def get_file_bytes(self, file_id: str) -> bytes:
        url = f"{self.api_url}/getFile"
        res = requests.get(url, params={"file_id": file_id}, timeout=10).json()
        if not res.get("ok"):
            raise ValueError(f"Could not fetch file info for {file_id}")
        file_path = res["result"]["file_path"]
        download_url = f"https://api.telegram.org/file/bot{self.token}/{file_path}"
        dl_res = requests.get(download_url, timeout=20)
        return dl_res.content

    def show_language_keyboard(self, chat_id: int):
        keyboard = {
            "inline_keyboard": [
                [
                    {"text": "🇬🇧 English", "callback_data": "lang_en"},
                    {"text": "🇮🇳 हिन्दी (Hindi)", "callback_data": "lang_hi"},
                ],
                [
                    {"text": "🌾 ಕನ್ನಡ (Kannada)", "callback_data": "lang_kn"},
                    {"text": "🍇 తెలుగు (Telugu)", "callback_data": "lang_te"},
                ],
            ]
        }
        welcome_text = (
            "🌾 *Welcome to BimaSetu AI Crop Damage Assessor!*\n\n"
            "Please select your language / अपनी भाषा चुनें / ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ / భాషను ఎంచుకోండి:"
        )
        self.send_message(chat_id, welcome_text, reply_markup=keyboard)

    def handle_callback_query(self, callback_query: dict):
        chat_id = callback_query["message"]["chat"]["id"]
        data = callback_query.get("data", "")
        
        if data.startswith("lang_"):
            lang = data.replace("lang_", "")
            if chat_id not in USER_STATES:
                USER_STATES[chat_id] = {}
            USER_STATES[chat_id]["lang"] = lang

            # Answer callback
            requests.post(
                f"{self.api_url}/answerCallbackQuery",
                json={"callback_query_id": callback_query["id"]},
            )

            prompt = MESSAGES["ask_photo"].get(lang, MESSAGES["ask_photo"]["en"])
            self.send_message(chat_id, prompt)

    def handle_photo(self, message: dict):
        chat_id = message["chat"]["id"]
        user_state = USER_STATES.get(chat_id, {})
        lang = user_state.get("lang", "en")

        # Get highest resolution photo
        photos = message.get("photo", [])
        if not photos:
            return

        photo = max(photos, key=lambda p: p.get("file_size", 0))
        file_id = photo["file_id"]

        try:
            photo_bytes = self.get_file_bytes(file_id)
            claim_id = uuid.uuid4().hex
            img_path = UPLOAD_DIR / f"{claim_id}.jpg"
            img_path.write_bytes(photo_bytes)

            USER_STATES[chat_id] = {
                "lang": lang,
                "photo_bytes": photo_bytes,
                "img_path": str(img_path),
                "claim_id": claim_id,
            }

            prompt = MESSAGES["ask_location"].get(lang, MESSAGES["ask_location"]["en"])
            self.send_message(chat_id, prompt)

        except Exception as exc:
            logger.exception("Error processing uploaded Telegram photo: %s", exc)
            self.send_message(chat_id, f"❌ Error processing image: {exc}")

    def handle_location(self, message: dict):
        chat_id = message["chat"]["id"]
        user_state = USER_STATES.get(chat_id)
        lang = user_state.get("lang", "en") if user_state else "en"

        if not user_state or "photo_bytes" not in user_state:
            prompt = MESSAGES["need_photo_first"].get(
                lang, MESSAGES["need_photo_first"]["en"]
            )
            self.send_message(chat_id, prompt)
            return

        loc = message.get("location", {})
        lat = float(loc.get("latitude", 0.0))
        lng = float(loc.get("longitude", 0.0))

        proc_msg = MESSAGES["processing"].get(lang, MESSAGES["processing"]["en"])
        self.send_message(chat_id, proc_msg)

        # Run analysis pipeline
        try:
            photo_bytes = user_state["photo_bytes"]
            claim_id = user_state["claim_id"]
            img_path = user_state["img_path"]
            display_name = (
                message["from"].get("first_name", "Farmer")
                + " "
                + message["from"].get("last_name", "")
            ).strip()
            user_uid = f"tg_{message['from'].get('id', chat_id)}"

            # 1. Field validation
            if HAS_GROQ:
                is_crop, conf = groq_predict_field(photo_bytes)
            else:
                is_crop, conf = local_predict_field(photo_bytes)

            if not is_crop:
                not_crop_text = MESSAGES["not_crop"].get(
                    lang, MESSAGES["not_crop"]["en"]
                )
                self.send_message(chat_id, not_crop_text)
                return

            # 2. Segmentation (SAM / Groq / HSV)
            if HAS_GROQ:
                seg_res = groq_segment(photo_bytes)
            else:
                seg_res = local_segment(photo_bytes)

            damage_pct = seg_res["damage_pct"]
            mask_path = seg_res["mask_path"]

            # 3. Damage Classification
            if HAS_GROQ:
                cls_res = groq_classify(photo_bytes)
            else:
                cls_res = local_classify(photo_bytes)

            damage_type = cls_res["damage_type"]
            confidence = cls_res["confidence"]

            # 4. Generate PMFBY Claim PDF
            timestamp = datetime.utcnow().isoformat()
            pdf_path = generate_claim_pdf(
                claim_id=claim_id,
                uid=user_uid,
                display_name=display_name,
                lat=lat,
                lng=lng,
                timestamp=timestamp,
                damage_pct=damage_pct,
                damage_type=damage_type,
                confidence=confidence,
                original_image_path=img_path,
                mask_image_path=mask_path,
            )

            # 5. Persist Claim to SQLite DB
            conn = get_connection()
            conn.execute(
                """INSERT OR REPLACE INTO claims
                   (id, uid, display_name, lat, lng, timestamp,
                    image_path, mask_path, pdf_path,
                    damage_pct, damage_type, confidence, status)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'completed')""",
                (
                    claim_id,
                    user_uid,
                    display_name,
                    lat,
                    lng,
                    timestamp,
                    img_path,
                    mask_path,
                    pdf_path,
                    damage_pct,
                    damage_type,
                    confidence,
                ),
            )
            conn.commit()
            conn.close()

            # 6. Send PDF Report back to user
            tmpl = MESSAGES["success"].get(lang, MESSAGES["success"]["en"])
            success_caption = tmpl.format(
                claim_id=claim_id[:12],
                damage_pct=damage_pct,
                damage_type=damage_type,
                lat=lat,
                lng=lng,
            )
            self.send_document(chat_id, pdf_path, caption=success_caption)

            # Reset user state for next claim
            USER_STATES.pop(chat_id, None)

        except Exception as exc:
            logger.exception("Error running claim assessment for Telegram user: %s", exc)
            self.send_message(chat_id, f"❌ Failed to generate report: {exc}")

    def handle_update(self, update: dict):
        if "callback_query" in update:
            self.handle_callback_query(update["callback_query"])
            return

        message = update.get("message")
        if not message:
            return

        chat_id = message["chat"]["id"]
        text = message.get("text", "")

        if text.startswith("/start") or text.startswith("/language"):
            self.show_language_keyboard(chat_id)
        elif text.startswith("/help"):
            lang = USER_STATES.get(chat_id, {}).get("lang", "en")
            help_text = (
                "ℹ️ *BimaSetu Bot Help*\n\n"
                "1. Use /start to select language.\n"
                "2. Send photo of damaged crop field.\n"
                "3. Share GPS location.\n"
                "4. Receive PMFBY Claim PDF report automatically!"
            )
            self.send_message(chat_id, help_text)
        elif "photo" in message:
            self.handle_photo(message)
        elif "location" in message:
            self.handle_location(message)
        else:
            lang = USER_STATES.get(chat_id, {}).get("lang", "en")
            if chat_id not in USER_STATES:
                self.show_language_keyboard(chat_id)
            else:
                self.send_message(
                    chat_id,
                    "📷 Please upload a crop field photo or share your location to continue.",
                )

    async def poll_updates(self):
        self.running = True
        logger.info("Telegram Bot poller active for BimaSetu...")
        while self.running:
            try:
                url = f"{self.api_url}/getUpdates"
                params = {"offset": self.offset, "timeout": 15}
                resp = await asyncio.to_thread(requests.get, url, params=params, timeout=20)
                data = resp.json()
                if data.get("ok"):
                    for update in data.get("result", []):
                        self.offset = update["update_id"] + 1
                        self.handle_update(update)
            except Exception as exc:
                logger.debug("Telegram polling cycle notice: %s", exc)
                await asyncio.sleep(3)
            await asyncio.sleep(0.5)


_bot_task = None


def start_telegram_bot_background():
    global _bot_task
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        logger.info("TELEGRAM_BOT_TOKEN not provided — Telegram Bot runner disabled.")
        return None

    runner = TelegramBotRunner(token)
    loop = asyncio.get_event_loop()
    _bot_task = loop.create_task(runner.poll_updates())
    logger.info("Started BimaSetu Telegram Bot in background task.")
    return runner


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        print("Error: Set TELEGRAM_BOT_TOKEN in .env or environment to launch the bot.")
    else:
        print(f"Starting BimaSetu Telegram Bot with token prefix {token[:6]}...")
        runner = TelegramBotRunner(token)
        asyncio.run(runner.poll_updates())
