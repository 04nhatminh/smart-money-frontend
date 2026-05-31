import { initWebSocket, subscribeJob } from "./websocket";
import authApi from "../api/auth.api";

export async function waitForAIResult(
  jobId: string,
  timeoutMs: number = 10000
): Promise<any> {
  try {
    const userRes = await authApi.getCurrentUser();

    if (!userRes.success || !userRes.data) {
      throw new Error("Cannot get current user");
    }

    const userId = userRes.data.id;

    await initWebSocket(userId);

    return new Promise((resolve) => {
      let done = false;

      const unsubscribe = subscribeJob(jobId, (data) => {
        if (done) return;

        done = true;

        clearTimeout(timeout);

        unsubscribe();

        console.log("📨 AI result received:", data);

        resolve({
          status: "SUCCESS",
          data,
        });
      });

      const timeout = setTimeout(() => {
        if (done) return;

        done = true;

        unsubscribe();

        console.warn("⏱️ AI timeout:", timeoutMs);

        resolve({
          status: "TIMEOUT",
        });
      }, timeoutMs);

      console.log("⏳ Waiting AI result:", jobId);
    });
  } catch (error: any) {
    console.error("❌ waitForAIResult error:", error);

    throw new Error(
      `Failed waiting AI result: ${error?.message || "Unknown error"}`
    );
  }
}