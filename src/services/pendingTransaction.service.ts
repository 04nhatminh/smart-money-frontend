import PendingStorage, { pendingEventBus, PendingTransaction } from "../storage/pendingTransactionStorage";
import TransactionApi from "../api/transaction.api";
import EventEmitter from "eventemitter3";

class PendingTransactionService {
  private eventBus = new EventEmitter();

  constructor() {
    // Listen to PendingStorage updates and forward them
    pendingEventBus.on("updated", () => {
      console.log("📢 PendingStorage updated, forwarding to service");
      this.eventBus.emit("updated", this.getAll());
    });
  }

  getEventBus() {
    return this.eventBus;
  }

  getAll() {
    return PendingStorage.getAll();
  }

  async approve(id: string) {
    const tx = PendingStorage.find(id);
    if (!tx) return;

    // Only send the required fields to the backend, exclude the 'id' field
    const payload = {
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      description: tx.description,
      date: tx.date,
    };

    console.log(payload);

    console.log("📤 Sending pending transaction to backend:", JSON.stringify(payload, null, 2));

    const res = await TransactionApi.create(payload);

    if (res?.success) {
      await PendingStorage.remove(id);

      this.eventBus.emit("updated", this.getAll());
      this.eventBus.emit("approved", res.data);
    }
  }

  async reject(id: string) {
    await PendingStorage.remove(id);
    this.eventBus.emit("updated", this.getAll());
  }

  async update(id: string, updates: Partial<Omit<PendingTransaction, "id">>) {
    PendingStorage.update(id, updates);
    this.eventBus.emit("updated", this.getAll());
  }
}

export default new PendingTransactionService();