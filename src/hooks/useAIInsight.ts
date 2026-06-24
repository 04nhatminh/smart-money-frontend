import { useEffect, useRef, useState } from "react";
import assistantApi from "../api/assistant.api";
import aiApi from "../api/ai.api";
import aiInsightStorage from "../storage/aiInsightStorage";
import { subscribeJob } from "../services/websocket";
import { parseAIResult as resultAIParse } from "../utils/resultAIParse";
import { parseAIJson } from "../utils/parseAIJson";

const CACHE_DURATION = 30 * 60 * 1000;

type InsightItem = {
  text: string;
  state: "Positive" | "Negative";
};

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export function useAIInsight() {
  const [insight, setInsight] = useState<InsightItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const controllerRef =
    useRef<AbortController | null>(null);

  useEffect(() => {
    init();

    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const init = async () => {
    try {
      const cached = await aiInsightStorage.get();

      if (cached) {
        setInsight(cached.data);

        const age = Date.now() - cached.createdAt;

        if (age < CACHE_DURATION) {
          return;
        }

        return;
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

    const MAX_RETRY = 20;

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