import { useCallback, useEffect, useRef, useState } from "react";
import { InsightApi } from "../api/insight.api";
import { Insight } from "../types/insight.types";

/**
 * Adaptive-engine insights feed (GET /api/v1/insights).
 * Ordered by the server — consumers must render in the given order.
 *
 * @param asOf optional YYYY-MM-DD to analyze a past month (demo/testing only).
 */
export function useInsights(asOf?: string) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await InsightApi.getInsights(asOf);
    if (!mountedRef.current) return;

    if (res.success) {
      setInsights(res.data ?? []);
    } else {
      setError(res.message);
    }
    setLoading(false);
  }, [asOf]);

  useEffect(() => {
    load();
  }, [load]);

  return { insights, loading, error, reload: load };
}
