export const formatVND = (amount: number): string => {
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
    return `${formatted} VND`;
};

// Format number with thousand separator
export const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};
