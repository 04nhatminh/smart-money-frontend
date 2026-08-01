import { useEffect, useRef, useState } from "react";
import assistantApi from "../api/assistant.api";
import aiApi from "../api/ai.api";
import aiInsightStorage from "../storage/aiInsightStorage";
import { subscribeJob } from "../services/websocket";
import { parseAIResult as resultAIParse } from "../utils/resultAIParse";
import { parseAIJson } from "../utils/parseAIJson";
import { useAuth } from "../context/AuthContext";

type InsightItem = {
  text: string;
  state: "Positive" | "Negative";
};

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Insight chỉ được làm mới vào đầu tuần: cache tạo từ 00:00 thứ Hai tuần này
// trở đi được coi là còn hạn; cache thuộc tuần trước mới bị refresh nền.
const startOfCurrentWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const daysSinceMonday = (d.getDay() + 6) % 7; // getDay(): 0=CN..6=T7 → thứ Hai = 0
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
};

export function useAIInsight() {
  const { isSignedIn } = useAuth();
  const [insight, setInsight] = useState<InsightItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const controllerRef =
    useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      // Đăng xuất: hủy job đang chờ và xóa insight khỏi RAM để phiên đăng nhập
      // kế tiếp trên cùng máy không thấy dữ liệu của user trước (cache trong
      // AsyncStorage đã được clearAuthData dọn ở AuthContext.logout).
      controllerRef.current?.abort();
      setInsight([]);
      setLoading(false);
      return;
    }

    init();

    return () => {
      controllerRef.current?.abort();
    };
  }, [isSignedIn]);

  const init = async () => {
    try {
      const cached = await aiInsightStorage.get();

      if (cached) {
        // Hiện cache ngay cho khỏi trống màn hình; chỉ refresh nền khi cache
        // thuộc tuần trước (chính sách: làm mới mỗi tuần vào thứ Hai).
        setInsight(cached.data);

        if (cached.createdAt >= startOfCurrentWeek()) {
          return;
        }
      }

      refreshInsight();

    } catch (err) {
      console.error(err);
    }
  };

  const refreshInsight = async () => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);

      // STEP 1
      const contextResponse = await assistantApi.analyze();
      const financialContext = contextResponse.data;

      // STEP 2
      const jobResponse =
        await aiApi.submitFinancialAssistantJob(financialContext);

      const jobId = jobResponse.jobId;

      if (!jobId) throw new Error("No jobId");

      // ✅ STEP 3: SUBSCRIBE WS (QUAN TRỌNG)
      const unsubscribe = await subscribeJob(jobId, async (data) => {
        console.log("🔔 AI job update:", data);

        if (controller.signal.aborted) return;

        try {
          const raw = data?.result;

          const parsed = parseAIJson(raw);

          if (!parsed) {
            throw new Error("Invalid AI response");
          }

          const insights: InsightItem[] = [];

          if (parsed?.spending?.text && parsed?.spending?.state) {
            insights.push({
              text: parsed.spending.text,
              state: parsed.spending.state,
            });
          }

          if (parsed?.saving?.text && parsed?.saving?.state) {
            insights.push({
              text: parsed.saving.text,
              state: parsed.saving.state,
            });
          }

          console.log("🔔 AI insight received (WS):", insights);

          if (insights.length > 0) {
            setInsight(insights); // ✅ đúng type

            await aiInsightStorage.save(insights, Date.now());

            console.log("✅ AI insight updated (WS)");
          }

        } catch (err) {
          console.error("❌ Parse AI result failed", err);
        }

        if (data.status === "COMPLETED") {
          setLoading(false);
          unsubscribe();
        }
      });

      setTimeout(async () => {
        const text = await pollJob(jobId, controller.signal);

        if (text) {
          console.log("📦 Fallback poll result:", text);

          const parsed = JSON.parse(text);

          const insights: InsightItem[] = [];

          if (parsed?.spending) {
            insights.push({
              text: parsed.spending.text,
              state: parsed.spending.state,
            });
          }

          if (parsed?.saving) {
            insights.push({
              text: parsed.saving.text,
              state: parsed.saving.state,
            });
          }

          setInsight(insights);
          await aiInsightStorage.save(insights, Date.now());
        }
        unsubscribe()
      }, 3000);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const pollJob = async (
    jobId: string,
    signal?: AbortSignal
  ): Promise<string | null> => {

    const MAX_RETRY = 5;

    for (
      let retry = 0;
      retry < MAX_RETRY;
      retry++
    ) {

      if (signal?.aborted) {
        return null;
      }

      try {

        const result =
          await aiApi.getJobResult(
            jobId
          );

        if (result?.text) {
          return result.text;
        }

      } catch (err) {
        console.log(
          "poll retry",
          retry
        );
      }

      await sleep(3000);
    }

    return null;
  };

  return {
    insight: insight,
    loading,
    reload: refreshInsight,
  };
}