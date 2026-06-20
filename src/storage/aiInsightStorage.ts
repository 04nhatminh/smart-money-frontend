import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "AI_INSIGHT_CACHE";

export type InsightItem = {
  text: string;
  state: "Positive" | "Negative";
};

export interface CachedInsight {
  data: InsightItem[]; // ✅ chuẩn
  createdAt: number;
}

class AIInsightStorage {
  async save(data: InsightItem[], createdAt: number) {
    const payload: CachedInsight = {
      data,
      createdAt,
    };

    await AsyncStorage.setItem(
      KEY,
      JSON.stringify(payload)
    );
  }

  async get(): Promise<CachedInsight | null> {
    const raw = await AsyncStorage.getItem(KEY);

    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);

      // ✅ Case 1: data mới (đúng format)
      if (Array.isArray(parsed.data)) {
        return parsed;
      }

      // ✅ Case 2: data cũ string[]
      if (Array.isArray(parsed.text)) {
        return {
          data: parsed.text.map((t: string) => ({
            text: t,
            state: "Positive", // fallback
          })),
          createdAt: parsed.createdAt,
        };
      }

      return null;

    } catch {
      return null;
    }
  }

  async clear() {
    await AsyncStorage.removeItem(KEY);
  }
}

export default new AIInsightStorage();