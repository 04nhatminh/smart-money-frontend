import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SuggestionApi } from "../api/suggestion.api";
import { Suggestion, SuggestionStatus } from "../types/suggestion.types";

/**
 * Adaptive-engine suggestions (GET /api/v1/suggestions?status=...).
 * Refetches when the status changes and whenever the screen regains focus,
 * so a decision made on the card screen is reflected when navigating back.
 */
export function useSuggestions(status: SuggestionStatus) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
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

    const res = await SuggestionApi.getSuggestions(status);
    if (!mountedRef.current) return;

    if (res.success) {
      setSuggestions(res.data ?? []);
    } else {
      setError(res.message);
    }
    setLoading(false);
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { suggestions, loading, error, reload: load };
}
