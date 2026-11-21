"""
Shared Gemini client with API-key rotation and model fallback.

Keys are read from the environment (.env):
    GEMINI_API_KEY              primary key
    FALLBACK_GEMINI_API_KEYS    comma-separated extra keys, tried in order
    FALLBACK_GEMINI_API_KEY     (legacy) single extra key
    GEMINI_MODELS               optional comma-separated model chain

Behaviour:
  * The client remembers which key is currently working and starts there.
  * When a key runs out of quota (429) or is rejected (401/403/invalid key),
    it is put on a cooldown and the next key becomes the current one.
  * When a model is overloaded / unavailable (5xx, 404, timeout), the next
    model in the chain is tried with the same key.

Calls go straight to the REST API (no global genai.configure state), so
concurrent requests can safely use different keys.
"""
import os
import time
import json
import asyncio
import logging
import threading

import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

_ROOT_ENV = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
load_dotenv(_ROOT_ENV if os.path.exists(_ROOT_ENV) else None)

_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
_DEFAULT_MODELS = "gemini-flash-latest,gemini-flash-lite-latest"
_TIMEOUT_S = 60
_RATE_LIMIT_COOLDOWN_S = 60          # 429: per-minute limits usually recover quickly
_DAILY_QUOTA_COOLDOWN_S = 6 * 3600   # 429 mentioning a per-day quota
_INVALID_KEY_COOLDOWN_S = 24 * 3600  # 401/403/invalid key

_MODEL_COOLDOWN_S = 120             # overloaded / timed-out model is skipped for a while

_lock = threading.Lock()
_current_idx = 0
_cooldown_until: dict[str, float] = {}
_model_cooldown_until: dict[str, float] = {}


class GeminiError(Exception):
    pass


class GeminiResponse:
    """Minimal stand-in for genai's response object (callers use `.text`)."""

    def __init__(self, text: str, raw: dict, model: str, key_index: int):
        self.text = text
        self.raw = raw
        self.model = model
        self.key_index = key_index


def get_all_keys() -> list[str]:
    keys: list[str] = []
    pk = os.environ.get("GEMINI_API_KEY", "").strip()
    if pk:
        keys.append(pk)
    for k in os.environ.get("FALLBACK_GEMINI_API_KEYS", "").split(","):
        k = k.strip()
        if k and k not in keys:
            keys.append(k)
    old = os.environ.get("FALLBACK_GEMINI_API_KEY", "").strip()
    if old and old not in keys:
        keys.append(old)
    return keys


def _models() -> list[str]:
    raw = os.environ.get("GEMINI_MODELS", "") or _DEFAULT_MODELS
    models = [m.strip() for m in raw.split(",") if m.strip()]
    now = time.time()
    ready = [m for m in models if _model_cooldown_until.get(m, 0) <= now]
    # Keep cooling-down models at the end so they are still tried as a last resort.
    return ready + [m for m in models if m not in ready]


def _cool_model(model: str) -> None:
    with _lock:
        _model_cooldown_until[model] = time.time() + _MODEL_COOLDOWN_S


def _key_order(keys: list[str]) -> list[int]:
    """Indices starting at the current key, skipping keys on cooldown when possible."""
    with _lock:
        start = _current_idx % len(keys)
    order = [(start + i) % len(keys) for i in range(len(keys))]
    now = time.time()
    ready = [i for i in order if _cooldown_until.get(keys[i], 0) <= now]
    # If every key is cooling down, still try them all rather than fail outright.
    return ready or order


def _mark_key_bad(keys: list[str], idx: int, seconds: float, reason: str) -> None:
    global _current_idx
    with _lock:
        _cooldown_until[keys[idx]] = time.time() + seconds
        if _current_idx % len(keys) == idx:
            _current_idx = (idx + 1) % len(keys)
            logger.warning(f"[Gemini] Key #{idx + 1} {reason}; switching to key #{_current_idx + 1}")


def _set_current(idx: int) -> None:
    global _current_idx
    with _lock:
        _current_idx = idx


def _extract_text(data: dict) -> str:
    try:
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts if not p.get("thought"))
    except (KeyError, IndexError, TypeError):
        reason = (data.get("promptFeedback") or {}).get("blockReason") or "empty response"
        raise GeminiError(f"Gemini returned no text ({reason})")


def generate_content(prompt: str, generation_config: dict | None = None) -> GeminiResponse:
    """
    Generate content, rotating keys and models as needed.

    generation_config uses REST names, e.g.
        {"temperature": 0.2, "responseMimeType": "application/json", "maxOutputTokens": 1024}
    snake_case names (response_mime_type, max_output_tokens) are also accepted.
    """
    keys = get_all_keys()
    if not keys:
        raise GeminiError("No Gemini API keys configured (set GEMINI_API_KEY in .env)")

    cfg = _normalise_config(generation_config or {})
    body = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
    if cfg:
        body["generationConfig"] = cfg

    models = _models()
    last_error: Exception | None = None

    for idx in _key_order(keys):
        key = keys[idx]
        key_failed = False
        for model in models:
            try:
                r = requests.post(
                    _API_URL.format(model=model),
                    headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                    json=body,
                    timeout=_TIMEOUT_S,
                )
            except requests.RequestException as e:
                last_error = e
                _cool_model(model)
                logger.warning(f"[Gemini] {model} with key #{idx + 1}: network error {type(e).__name__}; trying next model")
                continue

            if r.status_code == 200:
                data = r.json()
                _set_current(idx)
                return GeminiResponse(_extract_text(data), data, model, idx)

            msg = _error_message(r)
            last_error = GeminiError(f"{r.status_code} from {model}: {msg}")

            if r.status_code == 429:
                daily = "PerDay" in msg or "per day" in msg.lower()
                _mark_key_bad(keys, idx, _DAILY_QUOTA_COOLDOWN_S if daily else _RATE_LIMIT_COOLDOWN_S,
                              "hit its daily quota" if daily else "is rate-limited")
                key_failed = True
                break
            if r.status_code in (401, 403) or "API_KEY_INVALID" in msg or "API key not valid" in msg:
                _mark_key_bad(keys, idx, _INVALID_KEY_COOLDOWN_S, "was rejected")
                key_failed = True
                break
            if r.status_code in (404, 500, 502, 503, 504):
                _cool_model(model)
                logger.warning(f"[Gemini] {model} unavailable ({r.status_code}); trying next model")
                continue
            # Other 4xx: the request itself is bad; other keys won't help.
            raise last_error

        if not key_failed:
            # Every model failed for a non-key reason with this key; another key
            # won't fix an overloaded model, so stop here.
            break

    logger.error(f"[Gemini] All keys/models failed: {last_error}")
    raise last_error or GeminiError("Gemini request failed")


async def generate_content_async(prompt: str, generation_config: dict | None = None) -> GeminiResponse:
    return await asyncio.to_thread(generate_content, prompt, generation_config)


_SNAKE_TO_CAMEL = {
    "response_mime_type": "responseMimeType",
    "max_output_tokens": "maxOutputTokens",
    "top_p": "topP",
    "top_k": "topK",
    "candidate_count": "candidateCount",
    "stop_sequences": "stopSequences",
}


def _normalise_config(cfg: dict) -> dict:
    return {_SNAKE_TO_CAMEL.get(k, k): v for k, v in cfg.items()}


def _error_message(r: requests.Response) -> str:
    try:
        err = r.json().get("error", {})
        return f"{err.get('status', '')} {err.get('message', '')} {json.dumps(err.get('details', ''))}"[:500]
    except ValueError:
        return r.text[:300]
