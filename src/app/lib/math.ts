const INLINE_MATH_PATTERN = /\\\(([\s\S]+?)\\\)/;
const DISPLAY_MATH_PATTERN = /\$\$([\s\S]+?)\$\$/;

export const wrapInlineMath = (latex: string) => `\\(${latex.trim()}\\)`;

export const extractFirstMathExpression = (value?: string | null) => {
  if (!value) return "";

  const inlineMatch = value.match(INLINE_MATH_PATTERN);
  if (inlineMatch?.[1]) {
    return inlineMatch[1].trim();
  }

  const displayMatch = value.match(DISPLAY_MATH_PATTERN);
  if (displayMatch?.[1]) {
    return displayMatch[1].trim();
  }

  return "";
};

export const hasInlineMath = (value?: string | null, latex?: string | null) => {
  if (!value || !latex?.trim()) return false;

  const normalized = latex.trim();
  return (
    value.includes(wrapInlineMath(normalized)) ||
    value.includes(`$$${normalized}$$`)
  );
};
