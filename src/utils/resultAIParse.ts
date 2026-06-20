const safeParse = (input: any) => {
  if (!input) return null;

  try {
    // nếu đã là object
    if (typeof input === "object") return input;

    let str = String(input).trim();

    // 🔥 remove backticks nếu có
    str = str.replace(/^`+|`+$/g, "");

    // 🔥 remove quotes wrapping JSON string
    if (str.startsWith('"') && str.endsWith('"')) {
      str = JSON.parse(str);
    }

    return JSON.parse(str);

  } catch (err) {
    console.error("❌ safeParse failed:", input);
    return null;
  }
};

export const parseAIResult = (input: any) => {
  const parsed = safeParse(input);
    if (!parsed) return null;
    return parsed;
};