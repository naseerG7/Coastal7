import csv
import io
import time
import asyncio
from typing import Dict, Any, List

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import Product
from app.core.celery_app import (
    celery_app,
    update_task_progress,
    complete_task,
    fail_task,
)


async def _async_insert_products(rows: List[Dict[str, Any]], task_id: str | None = None) -> Dict[str, Any]:
    total_rows = len(rows)
    imported = 0
    errors = []

    async with AsyncSessionLocal() as session:
        for index, row in enumerate(rows, 1):
            name = (row.get("name") or "").strip()
            category = (row.get("category") or "General").strip()
            description = (row.get("description") or "").strip() or None
            
            raw_price = str(row.get("price") or "0").replace("₹", "").replace(",", "").strip()
            try:
                price = float(raw_price)
            except ValueError:
                price = 0.0

            raw_stock = str(row.get("stock") or "0").replace(",", "").strip()
            try:
                stock = int(raw_stock)
            except ValueError:
                stock = 0

            image_url = (row.get("image_url") or "").strip() or None

            if not name:
                errors.append(f"Row {index}: Skipped due to missing product name.")
                continue

            percent = int((index / total_rows) * 100) if total_rows > 0 else 100
            msg = f"Importing [{index}/{total_rows}]: {name[:30]}"

            if task_id:
                update_task_progress(
                    task_id=task_id,
                    current=index,
                    total=total_rows,
                    percent=percent,
                    message=msg,
                )

            # Small throttle so UI progress polling is smoothly visible
            await asyncio.sleep(0.04)

            product = Product(
                name=name,
                category=category,
                description=description,
                price=price,
                stock=stock,
                image_url=image_url,
            )
            session.add(product)
            imported += 1

            if imported % 10 == 0:
                await session.flush()

        await session.commit()

    return {
        "total_rows": total_rows,
        "total_imported": imported,
        "errors": errors,
    }


def process_csv_import(csv_text: str, task_id: str | None = None) -> Dict[str, Any]:
    """
    Parse CSV text and import products into the database, updating progress.
    """
    if task_id:
        update_task_progress(task_id, 0, 100, 5, "Parsing CSV file structure...")
    time.sleep(0.3)

    f = io.StringIO(csv_text.strip())
    reader = csv.DictReader(f)

    # Normalize column names: lowercase and stripped
    rows = []
    if reader.fieldnames:
        for raw_row in reader:
            normalized_row = {
                k.strip().lower(): v.strip() for k, v in raw_row.items() if k
            }
            rows.append(normalized_row)

    if not rows:
        error_msg = "CSV file is empty or missing valid header rows (name, category, price, stock)."
        if task_id:
            fail_task(task_id, error_msg)
        return {
            "total_rows": 0,
            "total_imported": 0,
            "errors": [error_msg],
        }

    total_rows = len(rows)
    if task_id:
        update_task_progress(task_id, 0, total_rows, 10, f"Found {total_rows} products to import. Starting...")
    time.sleep(0.3)

    # Execute database insertion in event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_async_insert_products(rows, task_id))
    finally:
        loop.close()

    if task_id:
        complete_task(
            task_id,
            result,
            f"Successfully imported {result['total_imported']} of {total_rows} products!",
        )

    return result


# =========================================================
# CELERY TASK DEFINITION
# =========================================================

@celery_app.task(bind=True, name="tasks.bulk_import_products_csv")
def bulk_import_products_csv(self, csv_text: str):
    task_id = self.request.id
    try:
        self.update_state(state="PROGRESS", meta={"current": 0, "total": 100, "percent": 5, "message": "Reading CSV data..."})
        update_task_progress(task_id, 0, 100, 5, "Reading CSV data...")

        result = process_csv_import(csv_text, task_id=task_id)

        self.update_state(state="SUCCESS", meta=result)
        return result
    except Exception as exc:
        fail_task(task_id, str(exc))
        self.update_state(state="FAILURE", meta={"error": str(exc)})
        raise

