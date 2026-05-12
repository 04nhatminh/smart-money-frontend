import { initWebSocket, subscribeJob } from "./websocket";
import authApi from "../api/auth.api";

export async function waitForAIResult(
  jobId: string,
  timeoutMs: number = 60000
): Promise<any> {
  const userRes = await authApi.getCurrentUser();
  if (!userRes.success || !userRes.data) {
    throw new Error("Cannot get current user");
  }

  const userId = userRes.data.id;

  // ✅ đảm bảo WS đã connect
  await initWebSocket(userId);

  return new Promise((resolve, reject) => {
    let done = false;

    const unsubscribe = subscribeJob(jobId, (data) => {
      if (done) return;
      done = true;

      clearTimeout(timeout);
      unsubscribe();

      resolve(data);
    });

    const timeout = setTimeout(() => {
      if (done) return;
      done = true;

      unsubscribe();


       resolve({ status: "TIMEOUT" });
    }, timeoutMs);
  });
}