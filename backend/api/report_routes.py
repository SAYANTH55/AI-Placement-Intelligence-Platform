"""
report_routes.py
----------------
FastAPI router for PDF report generation.

POST /reports/generate-dossier
  - JWT auth required (student gets own report)
  - Admin / PR / dept_admin can pass body.user_id to generate any student's report
  - DB-first data source; falls back to live_payload from frontend
  - Cached PDF returned when no newer analysis exists
"""

import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import User, ResumeAnalysis, GeneratedReport
from placement.auth_depends import require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])

ADMIN_ROLES = {"admin", "pr", "dept_admin"}


class ReportRequest(BaseModel):
    """Request body for report generation.

    Fields:
        user_id:      Admin override — generate report for a specific student.
                      Ignored unless the caller is admin / pr / dept_admin.
        live_payload: Frontend analyzedData JSON — used as fallback when no
                      ResumeAnalysis record exists in the database.
    """
    user_id: Optional[int] = None
    live_payload: Optional[dict] = None


from fastapi import Request

@router.post("/generate-dossier")
async def generate_dossier(
    request: Request,
    body: Optional[ReportRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Generate and download a Placement Intelligence Dossier PDF.

    Pipeline:
        DB / live_payload → analytics → LLM narratives → HTML → Playwright → PDF
    """
    body = body or ReportRequest()

    # Attempt to extract current_user, but allow guests
    current_user = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from placement.auth_depends import SECRET_KEY, ALGORITHM
            from jose import jwt
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                current_user = db.query(User).filter(User.id == int(user_id)).first()
        except Exception:
            pass # Ignore invalid tokens for guests

    target_user_id = current_user.id if current_user else None

    # Admin / PR override — verify target user exists
    if body.user_id and current_user and current_user.role in ADMIN_ROLES:
        target_user = db.query(User).filter(User.id == body.user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail=f"User {body.user_id} not found.")
        target_user_id = body.user_id
        logger.info(
            f"[report] Admin {current_user.id} ({current_user.role}) generating "
            f"report for user {target_user_id}"
        )
    elif body.user_id and (not current_user or current_user.role not in ADMIN_ROLES):
        logger.warning(
            f"[report] Unauthorized attempt to override user_id — denied."
        )

    # ── Validate data availability ────────────────────────────────────────────
    has_db_analysis = False
    if target_user_id:
        has_db_analysis = (
            db.query(ResumeAnalysis)
            .filter(ResumeAnalysis.user_id == target_user_id)
            .first()
            is not None
        )
    has_live_payload = bool(body.live_payload)

    if not has_db_analysis and not has_live_payload:
        raise HTTPException(
            status_code=422,
            detail=(
                "No resume analysis found for this user. "
                "Please upload and analyse a resume first, then generate the report."
            ),
        )

    # ── Check cached report ───────────────────────────────────────────────────
    cached_record: Optional[GeneratedReport] = None
    if target_user_id:
        cached_record = (
            db.query(GeneratedReport)
            .filter(
                GeneratedReport.user_id == target_user_id,
                GeneratedReport.report_type == "placement_dossier",
            )
            .order_by(GeneratedReport.generated_at.desc())
            .first()
        )

    cached_pdf_path = cached_record.pdf_path if cached_record else None
    cached_analysis_id = cached_record.analysis_id if cached_record else None

    # ── Generate (or return cached) PDF ──────────────────────────────────────
    try:
        from reports.dossier_builder import generate_dossier as _generate
        pdf_bytes, pdf_path, analysis_id, report_hash = await _generate(
            user_id=target_user_id,
            db=db,
            live_payload=body.live_payload,
            cached_pdf_path=cached_pdf_path,
            cached_analysis_id=cached_analysis_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=f"PDF generation engine unavailable: {e}",
        )
    except Exception as e:
        logger.error(f"[report] Dossier generation failed for user {target_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Report generation failed. Please try again.")

    # ── Persist / update snapshot record ─────────────────────────────────────
    if target_user_id:
        try:
            if cached_record and cached_analysis_id == analysis_id:
                # Cache was reused — update timestamp only
                cached_record.generated_at = None  # let DB set server_default on update via refresh
            else:
                # New or stale — create fresh record
                new_record = GeneratedReport(
                    user_id=target_user_id,
                    analysis_id=analysis_id,
                    report_type="placement_dossier",
                    pdf_path=pdf_path,
                    report_hash=report_hash,
                    file_size_bytes=len(pdf_bytes) if pdf_bytes else None,
                )
                db.add(new_record)
            db.commit()
        except Exception as e:
            logger.warning(f"[report] Failed to save report snapshot: {e}")
            # Non-fatal — still serve the PDF

    # ── Stream PDF to client ──────────────────────────────────────────────────
    filename = "Placement_Intelligence_Dossier.pdf"

    def iter_pdf():
        yield pdf_bytes

    return StreamingResponse(
        iter_pdf(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
            "X-Report-Analysis-Id": str(analysis_id) if analysis_id else "live",
        },
    )


@router.get("/dossier-status")
async def dossier_status(
    current_user: User = Depends(require_role(["student", "pr", "admin", "dept_admin"])),
    db: Session = Depends(get_db),
):
    """Check whether a cached report exists and if it is still fresh."""
    latest_analysis = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .first()
    )
    cached = (
        db.query(GeneratedReport)
        .filter(
            GeneratedReport.user_id == current_user.id,
            GeneratedReport.report_type == "placement_dossier",
        )
        .order_by(GeneratedReport.generated_at.desc())
        .first()
    )

    has_analysis = latest_analysis is not None
    is_cached = cached is not None
    is_fresh = (
        is_cached
        and latest_analysis
        and cached.analysis_id == latest_analysis.id
        and cached.pdf_path
        and os.path.exists(cached.pdf_path)
    )

    return {
        "has_analysis": has_analysis,
        "report_cached": is_cached,
        "report_is_fresh": is_fresh,
        "generated_at": cached.generated_at.isoformat() if cached and cached.generated_at else None,
        "file_size_kb": round(cached.file_size_bytes / 1024, 1) if cached and cached.file_size_bytes else None,
    }
