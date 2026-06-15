import logging
import json
import os

# Ensure logs directory exists
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'logs')
if not os.path.isdir(log_dir):
    os.makedirs(log_dir, exist_ok=True)

log_file_path = os.path.join(log_dir, 'pipeline_debug.log')
log = logging.getLogger('pipeline_debug')
log.setLevel(logging.INFO)
handler = logging.FileHandler(log_file_path)
handler.setFormatter(logging.Formatter('%(asctime)s %(message)s'))
log.addHandler(handler)

def _size(obj):
    if isinstance(obj, (str, bytes)):
        return len(obj)
    if isinstance(obj, (list, tuple, set, dict)):
        return len(obj)
    return 1

def _sample(obj):
    if isinstance(obj, dict):
        # Return up to 3 key-value pairs
        return {k: obj[k] for k in list(obj)[:3]}
    if isinstance(obj, (list, tuple)):
        return obj[:3]
    if isinstance(obj, str):
        return (obj[:200] + ('…' if len(obj) > 200 else ''))
    return str(obj)

def dump_checkpoint(name: str, inp, outp):
    """Log a pipeline checkpoint.

    Records input and output size, field count (for dicts), a short sample,
    and whether the output is EMPTY (size == 0) or NON‑EMPTY.
    Also asserts that output is not None.
    """
    status = 'EMPTY' if _size(outp) == 0 else 'NON-EMPTY'
    log.info(
        f"--- CHECKPOINT {name} ---\n"
        f"INPUT  size:{_size(inp)} fields:{len(inp) if isinstance(inp, dict) else 'N/A'} sample:{json.dumps(_sample(inp), ensure_ascii=False)}\n"
        f"OUTPUT size:{_size(outp)} fields:{len(outp) if isinstance(outp, dict) else 'N/A'} sample:{json.dumps(_sample(outp), ensure_ascii=False)}\n"
        f"STATUS {status}\n"
        f"--- END {name} ---"
    )
    assert outp is not None, f"{name}: output is None"
