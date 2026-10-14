import os
import time
import uuid
import asyncio
from typing import Any, Callable, Dict
from celery import Celery
from celery.result import AsyncResult

# =========================================================
# CELERY CONFIGURATION
# =========================================================

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

celery_app = Celery(
    "ecommerce_tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.invoice",
        "app.tasks.csv_import",
    ],
)

celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_always_eager=os.getenv("CELERY_ALWAYS_EAGER", "False").lower() in ("true", "1"),
)

# =========================================================
# UNIFIED TASK REGISTRY & PROGRESS TRACKER
# =========================================================

# In-memory store for task states (synchronizes across threads / background runners)
_task_store: Dict[str, Dict[str, Any]] = {}


def register_task(task_id: str, name: str = "Background Task") -> Dict[str, Any]:
    task_info = {
        "task_id": task_id,
        "name": name,
        "status": "PENDING",
        "current": 0,
        "total": 100,
        "percent": 0,
        "message": "Task queued...",
        "result": None,
        "error": None,
        "start_time": time.time(),
        "end_time": None,
    }
    _task_store[task_id] = task_info
    return task_info


def update_task_progress(
    task_id: str,
    current: int,
    total: int,
    percent: int | None = None,
    message: str | None = None,
):
    if task_id not in _task_store:
        register_task(task_id)

    if percent is None and total > 0:
        percent = min(100, int((current / total) * 100))

    _task_store[task_id].update({
        "status": "PROGRESS",
        "current": current,
        "total": total,
        "percent": percent or 0,
        "message": message or f"Progress: {percent}%",
    })


def complete_task(task_id: str, result: Any, message: str = "Task completed successfully"):
    if task_id not in _task_store:
        register_task(task_id)

    _task_store[task_id].update({
        "status": "SUCCESS",
        "current": _task_store[task_id].get("total", 100),
        "percent": 100,
        "result": result,
        "message": message,
        "end_time": time.time(),
    })


def fail_task(task_id: str, error: str):
    if task_id not in _task_store:
        register_task(task_id)

    _task_store[task_id].update({
        "status": "FAILURE",
        "error": error,
        "message": f"Task failed: {error}",
        "end_time": time.time(),
    })


def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    Get task status from Celery AsyncResult if available,
    falling back to unified task store.
    """
    # 1. Check Celery backend if configured
    try:
        res = AsyncResult(task_id, app=celery_app)
        if res and res.state:
            state = res.state
            if state == "PROGRESS" and isinstance(res.info, dict):
                return {
                    "task_id": task_id,
                    "status": "PROGRESS",
                    "current": res.info.get("current", 0),
                    "total": res.info.get("total", 100),
                    "percent": res.info.get("percent", 0),
                    "message": res.info.get("message", "Processing..."),
                    "result": None,
                    "error": None,
                }
            elif state == "SUCCESS":
                return {
                    "task_id": task_id,
                    "status": "SUCCESS",
                    "current": 100,
                    "total": 100,
                    "percent": 100,
                    "message": "Task completed successfully",
                    "result": res.result,
                    "error": None,
                }
            elif state == "FAILURE":
                return {
                    "task_id": task_id,
                    "status": "FAILURE",
                    "current": 0,
                    "total": 100,
                    "percent": 0,
                    "message": str(res.result),
                    "result": None,
                    "error": str(res.result),
                }
    except Exception:
        # Broker/backend may be offline or task not in Celery backend
        pass

    # 2. Check unified in-memory registry
    if task_id in _task_store:
        return _task_store[task_id]

    return {
        "task_id": task_id,
        "status": "PENDING",
        "current": 0,
        "total": 100,
        "percent": 0,
        "message": "Task is pending...",
        "result": None,
        "error": None,
    }

