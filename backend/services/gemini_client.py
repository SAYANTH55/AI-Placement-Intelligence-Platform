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
_DEFAULT_MODELS = (
    "gemini-flash-latest,gemini-3-flash-preview,"
    "gemini-flash-lite-latest,gemini-3.1-flash-lite,gemini-2.5-flash-lite"
)
_TIMEOUT = (5, 25)                   # (connect, read) seconds
_RATE_LIMIT_COOLDOWN_S = 60          # 429: per-minute limits usually recover quickly
_DAILY_QUOTA_COOLDOWN_S = 6 * 3600   # 429 mentioning a per-day quota
_INVALID_KEY_COOLDOWN_S = 24 * 3600  # 401/403/invalid key
_MODEL_DOWN_COOLDOWN_S = 90          # 5xx / timeout: model overloaded for everyone
_MODEL_MISSING_COOLDOWN_S = 3600     # 404: model not available

_lock = threading.Lock()
_current_idx = 0
_key_cooldown: dict[str, float] = {}                 # key -> until
_key_model_cooldown: dict[tuple[str, str], float] = {}  # (key, model) -> until (quota)
_model_cooldown: dict[str, float] = {}               # model -> until (overloaded/missing)


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


def _all_models() -> list[str]:
    raw = os.environ.get("GEMINI_MODELS", "") or _DEFAULT_MODELS
    return [m.strip() for m in raw.split(",") if m.strip()]


def _cool(table: dict, item, seconds: float) -> None:
    with _lock:
        table[item] = time.time() + seconds


def _ready(table: dict, item, now: float) -> bool:
    return table.get(item, 0) <= now


def _switch_from(keys: list[str], idx: int, reason: str) -> None:
    global _current_idx
    with _lock:
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
    Generate content, rotating models and keys as needed.

    Order: stay on the current key and walk the model chain; a model that hits
    this key's quota (429) is skipped for this key only. When every model is
    exhausted for the key, move on to the next key and make it current.
    Overloaded/missing models are skipped for all keys for a short while.
    If everything is cooling down, fail immediately so callers can use their
    non-LLM fallbacks instead of waiting.

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

    models = _all_models()
    with _lock:
        start = _current_idx % len(keys)
    last_error: Exception | None = None
    attempted = False

    for idx in [(start + i) % len(keys) for i in range(len(keys))]:
        key = keys[idx]
        now = time.time()
        if not _ready(_key_cooldown, key, now):
            continue
        key_rejected = False
        for model in models:
            now = time.time()
            if not _ready(_model_cooldown, model, now) or not _ready(_key_model_cooldown, (key, model), now):
                continue
            attempted = True
            try:
                r = requests.post(
                    _API_URL.format(model=model),
                    headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                    json=body,
                    timeout=_TIMEOUT,
                )
            except requests.RequestException as e:
                last_error = e
                _cool(_model_cooldown, model, _MODEL_DOWN_COOLDOWN_S)
                logger.warning(f"[Gemini] {model}: {type(e).__name__}; trying next model")
                continue

            if r.status_code == 200:
                data = r.json()
                _set_current(idx)
                return GeminiResponse(_extract_text(data), data, model, idx)

            msg = _error_message(r)
            last_error = GeminiError(f"{r.status_code} from {model}: {msg}")

            if r.status_code == 429:
                daily = "PerDay" in msg or "per day" in msg.lower()
                _cool(_key_model_cooldown, (key, model),
                      _DAILY_QUOTA_COOLDOWN_S if daily else _RATE_LIMIT_COOLDOWN_S)
                logger.warning(f"[Gemini] Key #{idx + 1} out of quota for {model}"
                               f"{' (daily)' if daily else ''}; trying next model")
                continue
            if r.status_code in (401, 403) or "API_KEY_INVALID" in msg or "API key not valid" in msg:
                _cool(_key_cooldown, key, _INVALID_KEY_COOLDOWN_S)
                key_rejected = True
                break
            if r.status_code == 404:
                _cool(_model_cooldown, model, _MODEL_MISSING_COOLDOWN_S)
                logger.warning(f"[Gemini] {model} not available (404); trying next model")
                continue
            if r.status_code >= 500:
                _cool(_model_cooldown, model, _MODEL_DOWN_COOLDOWN_S)
                logger.warning(f"[Gemini] {model} overloaded ({r.status_code}); trying next model")
                continue
            # Other 4xx: the request itself is bad; other keys won't help.
            raise last_error

        now = time.time()
        exhausted = all(not _ready(_key_model_cooldown, (key, m), now) for m in models)
        if key_rejected or exhausted:
            _switch_from(keys, idx, "was rejected" if key_rejected else "has no quota left on any model")

    if not attempted:
        raise GeminiError("All Gemini keys/models are cooling down; skipping LLM call")
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
