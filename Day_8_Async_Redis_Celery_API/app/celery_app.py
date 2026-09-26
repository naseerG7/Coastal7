from celery import Celery
from app.config import settings

celery_app = Celery("day8_tasks", broker=settings.celery_broker_url,
                    backend=settings.celery_result_backend)
celery_app.conf.update(
    task_track_started=True,
    timezone="UTC",
    beat_schedule={
        "health-check-every-minute": {
            "task": "app.tasks.health_check_task",
            "schedule": 60.0,
        }
    },
)
