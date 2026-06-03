export const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Format number with thousand separator
export const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};