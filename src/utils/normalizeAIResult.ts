export interface NormalizedAITransaction {
    category: string;
    type: "INCOME" | "EXPENSE";
    expense: number;
    description: string;
    confidence: number;
}

export interface NormalizedAIResult {
    jobId?: string;
    text?: string;
    date?: string;
    transactions: NormalizedAITransaction[];
}
export function normalizeAIResult(result: any): NormalizedAIResult {
    let transactions: any[] = [];

    // Case 1
    if (typeof result.transactions === "string") {
        try {
            transactions = JSON.parse(result.transactions);
        } catch {
            transactions = [];
        }
    }

    // Case 2
    else if (Array.isArray(result.transactions)) {
        transactions = result.transactions;
    }

    // Case 3 (receipt)
    else if (
        result.category &&
        result.type &&
        result.expense !== undefined
    ) {
        transactions = [
            {
                category: result.category,
                type: result.type,
                expense: result.expense,
                description: result.description,
                confidence: result.confidence,
            },
        ];
    }

    return {
        jobId: result.jobId,
        text: result.text,
        date: result.date,
        transactions: transactions.map(tx => ({
            category: tx.category,
            type: tx.type,
            expense: Number(tx.expense) || 0,
            description: tx.description ?? "",
            confidence: Number(tx.confidence) || 0,
        })),
    };
}