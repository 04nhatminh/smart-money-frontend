import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

// 🔥 lấy base URL từ env
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// 👉 build WS endpoint từ base URL
const WS_URL = BASE_URL ? `${BASE_URL}/ws` : null;

export const connectWebSocket = (userId, onMessage) => {
  if (!WS_URL) {
    console.error("❌ WS_URL is missing");
    return;
  }

  const socket = new SockJS(WS_URL);

  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    debug: (str) => console.log("[WS]", str),
  });

  stompClient.onConnect = () => {
    console.log("✅ Connected WebSocket");

    stompClient.subscribe(
      `/topic/notifications/${userId}`,
      (message) => {
        try {
          const data = JSON.parse(message.body);
          onMessage(data);
        } catch (err) {
          console.error("❌ Parse error", err);
        }
      }
    );
  };

  stompClient.onWebSocketError = (err) => {
    console.error("❌ WS error", err);
  };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};