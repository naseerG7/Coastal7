from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.connection_manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/notifications")
async def notifications_socket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            await manager.broadcast({"type": "message", "message": message})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
