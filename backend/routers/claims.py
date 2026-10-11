"""
backend/routers/claims.py

GET  /api/claims        — list all claims for a farmer (uid query param)
GET  /api/claims/{id}   — fetch a single claim
DELETE /api/claims/{id} — delete a claim
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from database import get_connection, init_db

logger = logging.getLogger("bimasetu.claims")
router = APIRouter()
init_db()


def _row_to_dict(row) -> dict:
    return dict(row)


@router.get("/claims")
def list_claims(uid: str = Query(..., description="Farmer Firebase UID")):
    """Return all claims for the given uid, newest first."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM claims WHERE uid = ? ORDER BY created_at DESC",
        (uid,),
    ).fetchall()
    conn.close()
    return {
        "success": True,
        "data": {"claims": [_row_to_dict(r) for r in rows]},
        "error": "",
    }


@router.get("/claims/{claim_id}")
def get_claim(claim_id: str):
    """Fetch a single claim by ID."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Claim not found")
    return {"success": True, "data": _row_to_dict(row), "error": ""}


@router.delete("/claims/{claim_id}")
def delete_claim(claim_id: str):
    """Delete a claim by ID."""
    conn = get_connection()
    conn.execute("DELETE FROM claims WHERE id = ?", (claim_id,))
    conn.commit()
    conn.close()
    return {"success": True, "data": {"deleted": claim_id}, "error": ""}
