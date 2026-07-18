import AsyncStorage from "@react-native-async-storage/async-storage";
import EventEmitter from "eventemitter3";
export const pendingEventBus = new EventEmitter();

export const getPendingEventBus = () => pendingEventBus;
const PENDING_KEY = "pending_transactions_v1";
const MAX_PENDING = 10;

export type ProcessingStatus = 'uploading' | 'ai_submitting' | 'ai_processing' | 'completed' | 'failed';

export interface ProcessingEvent {
  pendingId: string;
  status: ProcessingStatus;
  message?: string;
  error?: string;
}

export type PendingTransaction = {
  id: string;
  amount: number;
  category: string;
  type: "INCOME" | "EXPENSE";
  date: string;
  source: "camera" | "voice" | "notification"; 
  groupId?: string;
  groupText?: string;
  processingStatus?: ProcessingStatus;
  processingError?: string;
};

class PendingStorage {
  private queue: PendingTransaction[] = [];

  async load() {
    try {
      const raw = await AsyncStorage.getItem(PENDING_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
    } catch {
      console.warn("⚠️ Load pending failed");
    }
  }

  async persist() {
    try {
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(this.queue));
    } catch {
      console.warn("⚠️ Persist pending failed");
    }
  }

  getAll() {
    return [...this.queue]; 
  }

  async add(tx: Omit<PendingTransaction, "id">) {
    const newTx: PendingTransaction = {
      id: Date.now().toString(),
      ...tx,
    };

    this.queue.unshift(newTx);

    if (this.queue.length > MAX_PENDING) {
      this.queue.pop(); // remove oldest
    }

    await this.persist();
    pendingEventBus.emit("updated");
    return newTx;
  }

  async remove(id: string) {
    this.queue = this.queue.filter((t) => t.id !== id);
    await this.persist();
    pendingEventBus.emit("updated");
  }

  find(id: string) {
    return this.queue.find((t) => t.id === id);
  }

  update(id: string, updatedFields: Partial<Omit<PendingTransaction, "id">>) {
    const index = this.queue.findIndex((t) => t.id === id);
    if (index === -1) return;

    this.queue[index] = { ...this.queue[index], ...updatedFields };
    this.persist();
    pendingEventBus.emit("updated");
  }

  
}

export default new PendingStorage();