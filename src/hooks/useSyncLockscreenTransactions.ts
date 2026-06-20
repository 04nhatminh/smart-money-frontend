import { useCallback, useEffect, useMemo, useState } from "react";

import PendingStorage, {
  getPendingEventBus,
  PendingTransaction,
} from "../storage/pendingTransactionStorage";

type LockscreenStats = {
  total: number;
  synced: number;
  unsynced: number;
};

export function useSyncLockscreenTransactions() {
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setTransactions(PendingStorage.getAll());
  }, []);

  useEffect(() => {
    let mounted = true;

    PendingStorage.load()
      .then(() => {
        if (mounted) refresh();
      })
      .catch((err: any) => {
        if (mounted) setError(err?.message ?? "Failed to load transactions");
      });

    const eventBus = getPendingEventBus();
    eventBus.on("updated", refresh);

    return () => {
      mounted = false;
      eventBus.off("updated", refresh);
    };
  }, [refresh]);

  const stats = useMemo<LockscreenStats>(
    () => ({
      total: transactions.length,
      synced: 0,
      unsynced: transactions.length,
    }),
    [transactions.length]
  );

  const syncNow = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await PendingStorage.load();
      refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to sync transactions");
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const clearAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const current = PendingStorage.getAll();
      await Promise.all(current.map((item) => PendingStorage.remove(item.id)));
      refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to clear transactions");
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  return {
    isLoading,
    error,
    stats,
    syncNow,
    clearAll,
  };
}
