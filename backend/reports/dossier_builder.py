"""
dossier_builder.py
------------------
Orchestrates the full report generation pipeline:

  DB / Live Payload
    → analytics_provider  (structured data)
    → narrative_provider  (LLM text enrichment)
    → Jinja2 HTML render  (premium template)
    → Playwright          (Chromium → PDF bytes)

Returns PDF as bytes for streaming to the client.
"""

import logging
import os
import tempfile
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session

from reports.analytics_provider import build_analytics_payload
from reports.narrative_provider import enhance_payload_with_narratives
from reports.report_schema import DossierPayload

logger = logging.getLogger(__name__)

# Path to the Jinja2 templates directory (same folder as this file → templates/)
_TEMPLATES_DIR = Path(__file__).parent / "templates"

# Directory where cached PDFs are stored
_PDF_CACHE_DIR = Path(__file__).parent.parent / "uploads" / "reports"
_PDF_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _render_html(payload: DossierPayload) -> str:
    """Render the Jinja2 HTML template with the populated payload."""
    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATES_DIR)),
        autoescape=True,
    )
    template = env.get_template("placement_dossier.html")
    return template.render(
        student=payload.student,
        readiness=payload.readiness,
        probability=payload.probability,
        executive_assessment=payload.executive_assessment,
        strengths=payload.strengths,
        gaps=payload.gaps,
        skills=payload.skills,
        role_matches=payload.role_matches,
        companies=payload.companies,
        domains=payload.domains,
        improvement_simulation=payload.improvement_simulation,
        roadmap=payload.roadmap,
        learning_priorities=payload.learning_priorities,
        advisor_verdict=payload.advisor_verdict,
        ats_data=payload.ats_data,
        jd_data=payload.jd_data,
    )


async def _html_to_pdf(html_content: str) -> bytes:
    """Use Playwright (Chromium) to render HTML → PDF bytes.

    Runs sync_playwright in a ThreadPoolExecutor so it works correctly
    on Windows where asyncio.create_subprocess_exec is not available
    in the Uvicorn SelectorEventLoop.
    """
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except ImportError:
        raise RuntimeError(
            "Playwright is not installed. Run: pip install playwright && playwright install chromium"
        )

    import concurrent.futures

    def _render_pdf() -> bytes:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            )
            page = browser.new_page()

            # Write HTML to a temp file so fonts and assets resolve correctly
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".html", delete=False, encoding="utf-8"
            ) as f:
                f.write(html_content)
                tmp_path = f.name

            try:
                page.goto(f"file://{tmp_path}", wait_until="networkidle", timeout=30_000)
                pdf_bytes = page.pdf(
                    format="A4",
                    print_background=True,
                    margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
                )
            finally:
                os.unlink(tmp_path)
                browser.close()

        return pdf_bytes

    loop = __import__("asyncio").get_event_loop()
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        pdf_bytes = await loop.run_in_executor(pool, _render_pdf)

    return pdf_bytes



def _save_pdf_to_disk(pdf_bytes: bytes, user_id: int, report_hash: str) -> str:
    """Persist the PDF to disk and return the file path."""
    filename = f"dossier_{user_id}_{report_hash}.pdf"
    path = _PDF_CACHE_DIR / filename
    with open(path, "wb") as f:
        f.write(pdf_bytes)
    return str(path)


def _load_cached_pdf(pdf_path: str) -> Optional[bytes]:
    """Return cached PDF bytes if file exists on disk."""
    p = Path(pdf_path)
    if p.exists() and p.stat().st_size > 0:
        return p.read_bytes()
    return None


async def generate_dossier(
    user_id: int,
    db: Session,
    live_payload: Optional[dict] = None,
    cached_pdf_path: Optional[str] = None,
    cached_analysis_id: Optional[int] = None,
) -> tuple[bytes, Optional[str], Optional[int], Optional[str]]:
    """
    Full pipeline: data → narratives → HTML → PDF

    Returns:
      (pdf_bytes, pdf_path_on_disk, analysis_id, report_hash)

    Uses cached PDF when cache hit is fresh (same analysis_id).
    """

    # ── 1. Build analytics payload ────────────────────────────────────────────
    payload, analysis_id, report_hash = build_analytics_payload(
        user_id=user_id,
        db=db,
        live_payload=live_payload,
    )

    # ── 2. Cache hit check ────────────────────────────────────────────────────
    if (
        cached_pdf_path
        and cached_analysis_id
        and cached_analysis_id == analysis_id
    ):
        cached = _load_cached_pdf(cached_pdf_path)
        if cached:
            logger.info(f"[dossier] Cache hit for user {user_id}, analysis {analysis_id}")
            return cached, cached_pdf_path, analysis_id, report_hash

    # ── 3. LLM narrative enrichment ───────────────────────────────────────────
    logger.info(f"[dossier] Generating narratives for user {user_id}")
    payload = enhance_payload_with_narratives(payload)

    # ── 4. Render HTML ────────────────────────────────────────────────────────
    logger.info(f"[dossier] Rendering HTML template for user {user_id}")
    html = _render_html(payload)

    # ── 5. Playwright → PDF ───────────────────────────────────────────────────
    logger.info(f"[dossier] Launching Playwright for user {user_id}")
    pdf_bytes = await _html_to_pdf(html)

    # ── 6. Persist to disk ────────────────────────────────────────────────────
    pdf_path = None
    if report_hash:
        try:
            pdf_path = _save_pdf_to_disk(pdf_bytes, user_id, report_hash)
            logger.info(f"[dossier] PDF saved to {pdf_path}")
        except Exception as e:
            logger.warning(f"[dossier] Failed to cache PDF: {e}")

    return pdf_bytes, pdf_path, analysis_id, report_hash
