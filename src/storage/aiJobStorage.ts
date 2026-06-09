import AsyncStorage from "@react-native-async-storage/async-storage";

const AI_JOBS_KEY = "ai_jobs_in_progress_v1";

export type AIJobRecord = {
  jobId: string;
  pendingTxId: string;
  cloudinaryPublicId: string;
  createdAt: string;
  source: "camera" | "voice" ;
};

class AIJobStorage {
  private queue: AIJobRecord[] = [];

  async load() {
    try {
      const raw = await AsyncStorage.getItem(AI_JOBS_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
        console.log("📋 Loaded AI jobs:", this.queue.length);
      }
    } catch (err) {
      console.warn("⚠️ Load AI jobs failed:", err);
    }
  }

  private async persist() {
    try {
      await AsyncStorage.setItem(AI_JOBS_KEY, JSON.stringify(this.queue));
    } catch (err) {
      console.warn("⚠️ Persist AI jobs failed:", err);
    }
  }

  async add(job: AIJobRecord) {
    this.queue.push(job);
    await this.persist();
    console.log("➕ AI job added:", job.jobId);
    return job;
  }

  async remove(jobId: string) {
    const before = this.queue.length;
    this.queue = this.queue.filter((j) => j.jobId !== jobId);
    
    if (this.queue.length < before) {
      await this.persist();
      console.log("🗑️ AI job removed:", jobId);
    }
  }

  getAll(): AIJobRecord[] {
    return [...this.queue];
  }

  find(jobId: string): AIJobRecord | undefined {
    return this.queue.find((j) => j.jobId === jobId);
  }

  async clear() {
    this.queue = [];
    await AsyncStorage.removeItem(AI_JOBS_KEY);
    console.log("🧹 Cleared all AI jobs");
  }
}

export default new AIJobStorage();
