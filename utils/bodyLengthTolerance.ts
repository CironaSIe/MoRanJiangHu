export const 计算正文字数容错字数 = (requiredLength: number): number => {
    const required = Number.isFinite(requiredLength) ? Math.max(50, Math.floor(requiredLength)) : 50;
    const preferred = Math.min(200, Math.max(100, Math.floor(required * 0.1)));
    return Math.max(0, Math.min(preferred, required - 50));
};

export const 正文字数差距在容错内 = (actualLength: number, requiredLength: number): boolean => {
    const actual = Number.isFinite(actualLength) ? Math.max(0, Math.floor(actualLength)) : 0;
    const required = Number.isFinite(requiredLength) ? Math.max(50, Math.floor(requiredLength)) : 50;
    if (actual >= required) return true;
    return required - actual <= 计算正文字数容错字数(required);
};
