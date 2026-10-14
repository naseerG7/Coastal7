import uuid
import threading
from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from app.core.celery_app import (
    get_task_status,
    register_task,
)

router = APIRouter(
    prefix="/tasks",
    tags=["Background Tasks"],
)


@router.get("/{task_id}")
async def check_task_status(task_id: str) -> Dict[str, Any]:
    """
    Poll the status of a Celery background task.
    Returns current state, progress percentage (0-100), status message, and final result.
    """
    status_info = get_task_status(task_id)
    return status_info

def dispatch_background_job(
    celery_func: Any,
    fallback_func: Any,
    args: tuple = (),
    kwargs: dict | None = None,
    task_name: str = "Background Job",
) -> str:
    """
    Dispatch a task through Celery when available.
    If the broker is unavailable, run the fallback in a thread.
    """
    if kwargs is None:
        kwargs = {}

    task_id = str(uuid.uuid4())
    register_task(task_id, name=task_name)

    try:
        # Fail quickly if Redis is unavailable.
        with celery_func.app.connection_for_write() as connection:
            connection.ensure_connection(max_retries=0)

        celery_func.apply_async(
            args=args,
            kwargs=kwargs,
            task_id=task_id,
        )

    except Exception as exc:
        print(
            f"[Background Task] Celery dispatch failed: {exc}. "
            "Using background thread fallback."
        )

        def _run_in_thread():
            try:
                fallback_func(*args, task_id=task_id, **kwargs)
            except Exception as error:
                from app.core.celery_app import fail_task
                fail_task(task_id, str(error))

        thread = threading.Thread(
            target=_run_in_thread,
            daemon=True,
        )
        thread.start()

    return task_id

