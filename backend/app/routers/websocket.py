from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.security import decode_access_token

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manage WebSocket connections for authenticated users."""

    def __init__(self):
        self.active_connections: dict[int, set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        """Register a connection for an authenticated user."""
        self.active_connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        """Remove a user's connection."""
        connections = self.active_connections.get(user_id)

        if connections:
            connections.discard(websocket)

            if not connections:
                self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, message: dict):
        """Send a message only to the specified user's connections."""
        connections = self.active_connections.get(user_id, set())
        disconnected = []

        for connection in list(connections):
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(user_id, connection)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Authenticate the client and handle its WebSocket connection."""
    await websocket.accept()
    user_id = None

    try:
        # The frontend must send its authentication message first.
        auth_message = await websocket.receive_json()

        if not isinstance(auth_message, dict):
            await websocket.close(
                code=1008,
                reason="Authentication required",
            )
            return

        token = auth_message.get("token")

        if auth_message.get("type") != "auth" or not isinstance(token, str):
            await websocket.close(
                code=1008,
                reason="Invalid authentication message",
            )
            return

        try:
            user_id = decode_access_token(token)
        except (ValueError, TypeError):
            await websocket.close(
                code=1008,
                reason="Invalid or expired token",
            )
            return

        # Register the authenticated connection.
        await manager.connect(user_id, websocket)

        # The frontend hook waits for this exact confirmation.
        await websocket.send_json({
            "type": "connection",
            "status": "authenticated",
            "user_id": user_id,
        })

        # Keep the connection alive until the client disconnects.
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass

    finally:
        if user_id is not None:
            manager.disconnect(user_id, websocket)


async def send_order_status_update(
    user_id: int,
    order_id: int,
    status: str,
):
    """Notify only the customer who owns the order."""
    await manager.send_to_user(
        user_id,
        {
            "type": "order_status",
            "order_id": order_id,
            "user_id": user_id,
            "status": status,
            "message": (
                f"Your order #{order_id} is now "
                f"{status.replace('_', ' ').title()}."
            ),
        },
    )