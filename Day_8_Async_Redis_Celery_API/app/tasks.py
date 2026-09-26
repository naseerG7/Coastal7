import time
from app.celery_app import celery_app

@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def process_report(self, report_name: str):
    time.sleep(5)
    return {"status": "completed", "report": report_name}

@celery_app.task
def health_check_task():
    return {"status": "Celery Beat task executed"}
