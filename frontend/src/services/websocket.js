const WS_URL = "ws://127.0.0.1:8000/ws";

let socket = null;

export function connectWebSocket(onMessage) {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return socket;
}

export function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}