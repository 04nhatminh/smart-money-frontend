import PendingStorage, { PendingTransaction } from "../storage/pendingTransactionStorage";

type DeduplicationCandidate = Omit<PendingTransaction, "id"> & {
    dedupKey?: string;
};

export default class DeduplicationService {

    private static WINDOW_MS = 2 * 60 * 1000;
    private static recentKeys = new Map<string, number>();

    static findDuplicate(candidate: DeduplicationCandidate) {
        const now = Date.now();
        const key = this.buildKey(candidate);

        if (key) {
            const seenAt = this.recentKeys.get(key);
            if (seenAt && now - seenAt < this.WINDOW_MS) {
                return true;
            }
        }

        const all = PendingStorage.getAll();

        return all.find(tx => {
            if (tx.amount <= 0) {
                return false;
            }

            const sameType = tx.type === candidate.type;
            const sameAmount = Math.abs(tx.amount - candidate.amount) <= 100;
            const timeDiff = Math.abs(
                new Date(tx.date).getTime() - new Date(candidate.date).getTime()
            );

            const sameGroupText =
                !candidate.groupText ||
                !tx.groupText ||
                tx.groupText === candidate.groupText;

            return sameType && sameAmount && timeDiff < this.WINDOW_MS && sameGroupText;
        });
    }

    static markProcessed(candidate: DeduplicationCandidate) {
        const key = this.buildKey(candidate);
        if (key) {
            this.recentKeys.set(key, Date.now());
        }
    }

    static isDuplicateByKey(key: string) {
        const now = Date.now();
        const seenAt = this.recentKeys.get(key);
        return !!seenAt && now - seenAt < this.WINDOW_MS;
    }

    static registerKey(key: string) {
        this.recentKeys.set(key, Date.now());
    }

    private static buildKey(candidate: DeduplicationCandidate) {
        if (candidate.dedupKey) {
            return candidate.dedupKey;
        }

        const normalizedDate = new Date(candidate.date).getTime();
        if (Number.isNaN(normalizedDate)) {
            return null;
        }

        const amountBucket = Math.round(candidate.amount / 100) * 100;
        const groupText = (candidate.groupText || "").trim().toLowerCase();
        return `${candidate.type}_${amountBucket}_${Math.floor(normalizedDate / this.WINDOW_MS)}_${groupText}`;
    }

}