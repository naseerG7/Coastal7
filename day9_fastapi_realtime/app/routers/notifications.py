from fastapi import APIRouter

from app.services.connection_manager import manager

router = APIRouter(tags=["notifications"])


@router.post("/notifications")
async def send_notification(message: str) -> dict[str, str]:
    payload = {"type": "notification", "message": message}
    await manager.broadcast(payload)
    return payload
