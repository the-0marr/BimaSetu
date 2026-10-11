"""
backend/pdf/generator.py

Generates a PMFBY-compliant claim PDF using ReportLab.

Page 1 — Claim Summary
Page 2 — Photo Evidence (original + mask overlay)
"""

import logging
import os
import uuid
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image as RLImage, PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

logger = logging.getLogger("bimasetu.pdf")

PDF_OUTPUT_DIR = Path("static/pdfs")
PDF_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Brand colours ──────────────────────────────────────────────────
GREEN_DARK  = colors.HexColor("#1B4332")
GREEN_MID   = colors.HexColor("#2D6A4F")
GREEN_LIGHT = colors.HexColor("#D8F3DC")
GOLD        = colors.HexColor("#B7950B")
WHITE       = colors.white
GREY        = colors.HexColor("#6B7280")
LIGHT_GREY  = colors.HexColor("#F3F4F6")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm


def generate_claim_pdf(
    *,
    claim_id: str,
    uid: str,
    display_name: str,
    lat: float,
    lng: float,
    timestamp: str,
    damage_pct: float,
    damage_type: str,
    confidence: float,
    original_image_path: str,
    mask_image_path: str,
) -> str:
    """
    Build and save the PDF. Returns the relative path to the saved file.
    """
    filename = f"{claim_id}.pdf"
    out_path = PDF_OUTPUT_DIR / filename

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
    )

    styles = _build_styles()
    story = []

    # ── PAGE 1: CLAIM SUMMARY ──────────────────────────────────────
    story += _build_header(styles, claim_id)
    story.append(Spacer(1, 6 * mm))
    story += _build_farmer_section(styles, uid, display_name, timestamp, lat, lng)
    story.append(Spacer(1, 6 * mm))
    story += _build_damage_section(styles, damage_pct, damage_type, confidence)
    story.append(Spacer(1, 6 * mm))
    story += _build_disclaimer(styles)

    story.append(PageBreak())

    # ── PAGE 2: PHOTO EVIDENCE ─────────────────────────────────────
    story += _build_evidence_page(styles, original_image_path, mask_image_path)

    doc.build(story, onFirstPage=_draw_page_border, onLaterPages=_draw_page_border)
    logger.info("PDF saved to %s", out_path)
    return str(out_path)


# ── Style definitions ──────────────────────────────────────────────

def _build_styles():
    base = getSampleStyleSheet()
    custom = {}

    custom["title"] = ParagraphStyle(
        "title",
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=WHITE,
        alignment=TA_CENTER,
        spaceAfter=2 * mm,
    )
    custom["subtitle"] = ParagraphStyle(
        "subtitle",
        fontName="Helvetica",
        fontSize=11,
        textColor=GREEN_LIGHT,
        alignment=TA_CENTER,
        spaceAfter=0,
    )
    custom["section_head"] = ParagraphStyle(
        "section_head",
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=GREEN_DARK,
        spaceAfter=3 * mm,
        spaceBefore=2 * mm,
    )
    custom["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.black,
        spaceAfter=1.5 * mm,
    )
    custom["small_grey"] = ParagraphStyle(
        "small_grey",
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=GREY,
        alignment=TA_CENTER,
        spaceAfter=0,
    )
    custom["damage_big"] = ParagraphStyle(
        "damage_big",
        fontName="Helvetica-Bold",
        fontSize=36,
        textColor=GREEN_DARK,
        alignment=TA_CENTER,
        spaceAfter=1 * mm,
    )
    custom["evidence_head"] = ParagraphStyle(
        "evidence_head",
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=WHITE,
        alignment=TA_CENTER,
    )
    return custom


# ── Page sections ──────────────────────────────────────────────────

def _build_header(styles, claim_id):
    """Dark green header bar with title."""
    usable_w = PAGE_W - 2 * MARGIN

    header_data = [[
        Paragraph("PMFBY Crop Damage Claim Report", styles["title"]),
        Paragraph("Pradhan Mantri Fasal Bima Yojana", styles["subtitle"]),
    ]]
    # Stack them
    header_table = Table(
        [[Paragraph("PMFBY Crop Damage Claim Report", styles["title"])],
         [Paragraph("Pradhan Mantri Fasal Bima Yojana", styles["subtitle"])],
         [Paragraph(f"Claim ID: {claim_id}", styles["subtitle"])]],
        colWidths=[usable_w],
    )
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN_DARK),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [GREEN_DARK]),
    ]))
    return [header_table]


def _build_farmer_section(styles, uid, display_name, timestamp, lat, lng):
    """Farmer & location info table."""
    usable_w = PAGE_W - 2 * MARGIN

    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        date_str = dt.strftime("%d %B %Y")
        time_str = dt.strftime("%H:%M:%S UTC")
    except Exception:
        date_str = timestamp[:10]
        time_str = timestamp[11:19] if len(timestamp) > 18 else "—"

    section_title = Paragraph("Farmer & Location Details", styles["section_head"])

    data = [
        ["Farmer Name", display_name or "—", "Farmer UID", uid],
        ["Date of Damage", date_str, "Time of Damage", time_str],
        ["GPS Latitude", f"{lat:.6f}°", "GPS Longitude", f"{lng:.6f}°"],
    ]

    col_w = usable_w / 4
    t = Table(data, colWidths=[col_w * 0.8, col_w * 1.2, col_w * 0.8, col_w * 1.2])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (0, -1), GREEN_LIGHT),
        ("BACKGROUND",   (2, 0), (2, -1), GREEN_LIGHT),
        ("FONTNAME",     (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",     (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 9),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
    ]))

    return [section_title, t]


def _build_damage_section(styles, damage_pct, damage_type, confidence):
    """Big damage % + type + confidence gauge."""
    usable_w = PAGE_W - 2 * MARGIN

    section_title = Paragraph("Damage Assessment Results", styles["section_head"])

    # Colour-code severity
    if damage_pct >= 75:
        sev_color = colors.HexColor("#DC2626")
        severity  = "SEVERE"
    elif damage_pct >= 50:
        sev_color = colors.HexColor("#F59E0B")
        severity  = "HIGH"
    elif damage_pct >= 25:
        sev_color = colors.HexColor("#F97316")
        severity  = "MODERATE"
    else:
        sev_color = colors.HexColor("#16A34A")
        severity  = "LOW"

    damage_style = ParagraphStyle(
        "dmg_pct", fontName="Helvetica-Bold", fontSize=42,
        textColor=sev_color, alignment=TA_CENTER,
    )
    sev_style = ParagraphStyle(
        "sev", fontName="Helvetica-Bold", fontSize=13,
        textColor=sev_color, alignment=TA_CENTER, spaceAfter=3*mm,
    )

    pct_block = Table(
        [[Paragraph(f"{damage_pct:.1f}%", damage_style)],
         [Paragraph(f"Severity: {severity}", sev_style)]],
        colWidths=[usable_w / 2],
    )
    pct_block.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), LIGHT_GREY),
        ("BOX",           (0, 0), (-1, -1), 1, sev_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    type_style = ParagraphStyle(
        "dtype", fontName="Helvetica-Bold", fontSize=22,
        textColor=GREEN_DARK, alignment=TA_CENTER,
    )
    conf_style = ParagraphStyle(
        "conf", fontName="Helvetica", fontSize=11,
        textColor=GREY, alignment=TA_CENTER,
    )
    type_block = Table(
        [[Paragraph(damage_type.upper(), type_style)],
         [Paragraph(f"Classifier Confidence: {confidence * 100:.1f}%", conf_style)]],
        colWidths=[usable_w / 2],
    )
    type_block.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), LIGHT_GREY),
        ("BOX",           (0, 0), (-1, -1), 1, GREEN_MID),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    side_by_side = Table([[pct_block, type_block]], colWidths=[usable_w / 2, usable_w / 2])
    side_by_side.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))

    return [section_title, side_by_side]


def _build_disclaimer(styles):
    hr = HRFlowable(width="100%", thickness=1, color=GREEN_MID, spaceAfter=4*mm)
    text = Paragraph(
        "⚠️  Generated by BimaSetu AI — for insurer review only. "
        "This report is auto-generated and must be verified by a licensed agricultural assessor "
        "before formal claim processing.",
        styles["small_grey"],
    )
    return [hr, text]


def _build_evidence_page(styles, original_path, mask_path):
    """Full-width photos on page 2."""
    usable_w = PAGE_W - 2 * MARGIN
    usable_h = (PAGE_H - 2 * MARGIN - 30 * mm) / 2  # half page each

    header = Table(
        [[Paragraph("Photo Evidence", styles["evidence_head"])]],
        colWidths=[usable_w],
    )
    header.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), GREEN_DARK),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements = [header, Spacer(1, 6 * mm)]

    def _add_photo(path, caption):
        nonlocal elements
        if path and Path(path).exists():
            img = RLImage(path, width=usable_w, height=usable_h)
            elements.append(img)
        else:
            placeholder = Table(
                [[Paragraph(f"[{caption} — image not available]",
                            ParagraphStyle("ph", fontName="Helvetica-Oblique",
                                           fontSize=10, textColor=GREY, alignment=TA_CENTER))]],
                colWidths=[usable_w],
            )
            placeholder.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), LIGHT_GREY),
                ("BOX",           (0, 0), (-1, -1), 0.5, GREY),
                ("TOPPADDING",    (0, 0), (-1, -1), usable_h / 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), usable_h / 2),
            ]))
            elements.append(placeholder)
        cap = ParagraphStyle(
            "cap", fontName="Helvetica-Oblique", fontSize=9,
            textColor=GREY, alignment=TA_CENTER, spaceAfter=4*mm,
        )
        elements.append(Paragraph(caption, cap))
        elements.append(Spacer(1, 4 * mm))

    _add_photo(original_path, "Original Uploaded Photograph")
    _add_photo(mask_path, "SAM (Segment Anything) Damage Segmentation Overlay")

    return elements


# ── Page decorator ─────────────────────────────────────────────────

def _draw_page_border(canvas, doc):
    """Draw a green border and footer on every page."""
    canvas.saveState()
    w, h = A4
    border_margin = 8 * mm

    canvas.setStrokeColor(GREEN_DARK)
    canvas.setLineWidth(2)
    canvas.rect(
        border_margin, border_margin,
        w - 2 * border_margin, h - 2 * border_margin,
    )

    # Footer
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(GREY)
    canvas.drawCentredString(w / 2, border_margin + 3, f"BimaSetu AI — PMFBY Claim Report — Page {doc.page}")
    canvas.restoreState()
