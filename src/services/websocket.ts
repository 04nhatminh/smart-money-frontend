import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

let stompClient: Client | null = null;

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const WS_URL: string | null = BASE_URL ? `${BASE_URL}/ws` : null;

// 🎯 Define type rõ ràng
type ConnectParams = {
  userId?: string;
  jobIds?: string[];
  onNotification?: (data: any) => void;
  onResult?: (jobId: string, data: any) => void;
  onConnected?: (stompClient: Client) => void;
};

export const connectWebSocket = ({
  userId,
  jobIds = [],
  onNotification,
  onResult,
  onConnected,
}: ConnectParams): void => {
  if (!WS_URL) {
    console.error("❌ WS_URL is missing");
    return;
  }

  const socket = new SockJS(WS_URL);

  stompClient = new Client({
    webSocketFactory: () => socket as any,
    reconnectDelay: 5000,
    debug: (str: string) => console.log("[WS]", str),
  });

  stompClient.onConnect = () => {
    console.log("✅ Connected WebSocket");

    // 🔔 Notification
    if (userId) {
      stompClient?.subscribe(
        `/topic/notifications/${userId}`,
        (message: IMessage) => {
          try {
            const data = JSON.parse(message.body);
            onNotification?.(data);
          } catch (err) {
            console.error("❌ Notification parse error", err);
          }
        }
      );
    }

    // 🤖 Result
    jobIds.forEach((jobId: string) => {
      stompClient?.subscribe(
        `/topic/ai/${jobId}`,
        (message: IMessage) => {
          try {
            console.log("📨 Message received on /topic/ai/", jobId);
            console.log("📨 Raw message body:", message.body);
            const data = JSON.parse(message.body);
            console.log("📨 Parsed data:", data);
            onResult?.(jobId, data);
          } catch (err) {
            console.error("❌ Result parse error", err);
          }
        }
      );
      console.log("✅ Subscribed to /topic/ai/" + jobId);
    });

    // 👉 Call onConnected callback AFTER setup
    if (stompClient) {
      onConnected?.(stompClient);
    }
  };

  stompClient.onWebSocketError = (err: Event) => {
    console.error("❌ WS error", err);
  };

  stompClient.activate();
};

export const disconnectWebSocket = (): void => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};