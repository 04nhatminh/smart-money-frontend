import { initWebSocket, subscribeJob } from "./websocket";
import authApi from "../api/auth.api";

export async function waitForAIResult(
  jobId: string,
  timeoutMs: number = 10000
): Promise<any> {

  const userRes = await authApi.getCurrentUser();

  if (!userRes.success || !userRes.data) {
    throw new Error("Cannot get current user");
  }


  return new Promise((resolve) => {
    let done = false;
    let unsubscribe: (() => void) | null = null;

    // ✅ Subscribe async
    subscribeJob(jobId, (data) => {
      console.log("🔥 WS CALLBACK:", data);

      if (done) return;

      done = true;
      clearTimeout(timeout);

      if (unsubscribe) {
        unsubscribe();
      }

      resolve({
        status: "SUCCESS",
        data,
      });
    }).then((unsub) => {
      unsubscribe = unsub;
      console.log("✅ Subscription ready for job:", jobId);
    }).catch((err) => {
      console.error("❌ Subscription error:", err);
      // If subscription fails, resolve timeout
      if (!done) {
        done = true;
        resolve({
          status: "TIMEOUT",
        });
      }
    });

    const timeout = setTimeout(() => {
      if (done) return;

      console.log("⚠️ WS timeout → fallback polling");

      resolve({
        status: "TIMEOUT",
      });

      // ❌ KHÔNG unsubscribe ở đây
    }, timeoutMs);
  });
}
