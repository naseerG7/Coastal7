import { useEffect, useRef, useState } from "react";

const WS_URL = "ws://127.0.0.1:8000/ws";

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const AUTH_TIMEOUT = 5000;

export function useWebSocket(onMessage) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const reconnectTimerRef = useRef(null);
  const authTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(false);

  const [connected, setConnected] = useState(false);

  // Keep the latest component callback without reconnecting.
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    shouldReconnectRef.current = true;

    let currentSocket = null;
    let disposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const clearAuthTimer = () => {
      if (authTimerRef.current !== null) {
        clearTimeout(authTimerRef.current);
        authTimerRef.current = null;
      }
    };

    const clearTimers = () => {
      clearReconnectTimer();
      clearAuthTimer();
    };

    const scheduleReconnect = () => {
      if (
        disposed ||
        !shouldReconnectRef.current ||
        reconnectTimerRef.current !== null
      ) {
        return;
      }

      const delay = Math.min(
        INITIAL_RECONNECT_DELAY *
          2 ** reconnectAttemptsRef.current,
        MAX_RECONNECT_DELAY
      );

      reconnectAttemptsRef.current += 1;

      console.log(
        `[ShopFlow WS] Reconnecting in ${delay / 1000}s`
      );

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (disposed || !shouldReconnectRef.current) {
        return;
      }

      // Avoid opening another connection while one is active.
      if (
        currentSocket &&
        (currentSocket.readyState === WebSocket.CONNECTING ||
          currentSocket.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      const token = localStorage.getItem("access_token");

      if (!token) {
        setConnected(false);

        console.warn(
          "[ShopFlow WS] No access token. Log in to connect."
        );

        // Do not repeatedly retry without a token.
        return;
      }

      console.log("[ShopFlow WS] Connecting to", WS_URL);

      let socket;

      try {
        socket = new WebSocket(WS_URL);
      } catch (error) {
        console.error(
          "[ShopFlow WS] Could not create connection:",
          error
        );

        scheduleReconnect();
        return;
      }

      currentSocket = socket;
      socketRef.current = socket;

      let authenticated = false;

      socket.onopen = () => {
        if (disposed || currentSocket !== socket) {
          return;
        }

        console.log(
          "[ShopFlow WS] Socket opened. Sending JWT authentication."
        );

        try {
          socket.send(
            JSON.stringify({
              type: "auth",
              token,
            })
          );
        } catch (error) {
          console.error(
            "[ShopFlow WS] Failed to send authentication:",
            error
          );

          socket.close();
          return;
        }

        authTimerRef.current = setTimeout(() => {
          if (
            !disposed &&
            currentSocket === socket &&
            !authenticated &&
            socket.readyState === WebSocket.OPEN
          ) {
            console.error(
              "[ShopFlow WS] Authentication timed out."
            );

            socket.close(4000, "Authentication timeout");
          }
        }, AUTH_TIMEOUT);
      };

      socket.onmessage = (event) => {
        if (disposed || currentSocket !== socket) {
          return;
        }

        let data;

        try {
          data = JSON.parse(event.data);
        } catch {
          console.error(
            "[ShopFlow WS] Received invalid JSON."
          );
          return;
        }

        // The backend must confirm successful authentication.
        if (
          data.type === "connection" &&
          data.status === "authenticated"
        ) {
          authenticated = true;

          clearAuthTimer();

          reconnectAttemptsRef.current = 0;
          setConnected(true);

          console.log(
            `[ShopFlow WS] AUTHENTICATED as user ${data.user_id}`
          );

          return;
        }

        // Never deliver application messages before authentication.
        if (!authenticated) {
          console.warn(
            "[ShopFlow WS] Ignoring message before authentication."
          );
          return;
        }

        if (data.type === "order_status") {
          console.log("[ShopFlow WS] ORDER STATUS UPDATE", {
            order_id: data.order_id,
            user_id: data.user_id,
            status: data.status,
            message: data.message,
          });
        } else {
          console.log(
            "[ShopFlow WS] Message received:",
            data.type
          );
        }

        // Pass authenticated messages to Orders.jsx or another component.
        if (typeof onMessageRef.current === "function") {
          onMessageRef.current(data);
        }
      };

      socket.onerror = () => {
        if (disposed || currentSocket !== socket) {
          return;
        }

        console.error(
          "[ShopFlow WS] Connection error. Check the backend terminal."
        );

        // The close handler handles reconnection.
        socket.close();
      };

      socket.onclose = (event) => {
        if (currentSocket !== socket) {
          return;
        }

        console.log("[ShopFlow WS] Connection closed:", {
          code: event.code,
          reason: event.reason || "(no reason supplied)",
          wasClean: event.wasClean,
        });

        clearAuthTimer();

        currentSocket = null;
        socketRef.current = null;

        if (!disposed) {
          setConnected(false);
        }

        if (disposed || !shouldReconnectRef.current) {
          return;
        }

        // A policy violation commonly indicates rejected authentication.
        if (event.code === 1008) {
          console.error(
            "[ShopFlow WS] Authentication rejected. Log in again and verify the backend token protocol."
          );
          return;
        }

        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;
      shouldReconnectRef.current = false;

      clearTimers();

      const socket = currentSocket;
      currentSocket = null;

      if (socket) {
        // Prevent cleanup from triggering reconnection.
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (
          socket.readyState === WebSocket.CONNECTING ||
          socket.readyState === WebSocket.OPEN
        ) {
          socket.close(1000, "Component cleanup");
        }
      }

      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  return {
    connected,
    socket: socketRef.current,
  };
}