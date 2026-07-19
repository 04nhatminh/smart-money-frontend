import { useState } from "react";

export function useSyncLockscreenTransactions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    synced: 0,
    unsynced: 0,
  });

  const syncNow = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock sync implementation
    } catch (e: any) {
      setError(e.message || "Failed to sync");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = async () => {
    setStats({ total: 0, synced: 0, unsynced: 0 });
  };

  return {
    isLoading,
    error,
    stats,
    syncNow,
    clearAll,
  };
}
