import React, {
  createContext,
  useContext,
  useState,
  useCallback
} from "react";
import AIAPI from "../api/ai.api";

type SuggestionContextType = {
  questions: string[];
  loading: boolean;
  preload: () => Promise<void>;
};

const AISuggestionContext = createContext<SuggestionContextType | null>(null);

export function AISuggestionProvider({ children }: { children: React.ReactNode }) {
  const [questions, setQuestions] = useState<string[]>([]);   // renamed
  const [loading, setLoading] = useState(false);

  const preload = useCallback(async () => {
    if (loading || questions.length > 0) return;             // use questions

    try {
      setLoading(true);
      const res = await AIAPI.getSuggestions("");

      if (res.success && res.data?.questions) {
        setQuestions(res.data.questions);                     // use setQuestions
      }
    } catch (e) {
        setQuestions([])
      console.error("Suggestion preload failed", e);
    } finally {
      setLoading(false);
    }
  }, [loading, questions]);                                  // updated deps

  return (
    <AISuggestionContext.Provider
      value={{ questions, loading, preload }}                // works now
    >
      {children}
    </AISuggestionContext.Provider>
  );
}

export const useAISuggestions = () => {
  const ctx = useContext(AISuggestionContext);
  if (!ctx) throw new Error("AISuggestionProvider missing");
  return ctx;
};