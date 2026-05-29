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

const UNICODE_LATEX_REPLACEMENTS: Array<[RegExp, string]> = [
  [/≥/g, "\\ge "],
  [/≤/g, "\\le "],
  [/≠/g, "\\ne "],
  [/≈/g, "\\approx "],
  [/∞/g, "\\infty "],
  [/π/g, "\\pi "],
  [/θ/g, "\\theta "],
  [/α/g, "\\alpha "],
  [/β/g, "\\beta "],
  [/γ/g, "\\gamma "],
  [/∅/g, "\\emptyset "],
  [/∈/g, "\\in "],
  [/∉/g, "\\notin "],
  [/⊆/g, "\\subseteq "],
  [/⊈/g, "\\not\\subseteq "],
  [/⊂/g, "\\subset "],
  [/∪/g, "\\cup "],
  [/∩/g, "\\cap "],
  [/⊥/g, "\\perp "],
  [/×/g, "\\times "],
  [/÷/g, "\\div "],
  [/·/g, "\\cdot "],
  [/∫/g, "\\int "],
  [/−/g, "-"],
];

const SLASH_COMMAND_PATTERN =
  /\/(circ|frac|sqrt|le|ge|ne|approx|sim|pm|times|div|cdot|pi|theta|alpha|beta|gamma|Delta|infty|int|in|notin|cup|cap|subseteq|subset|emptyset|perp|sum)(?=\b|\{|$)/g;

export const normalizeMathLatexForBackend = (value?: string | null) => {
  if (!value) return "";

  let normalized = value
    .replace(/\\text\s*\{\s*[°º]\s*\}/g, "\\circ")
    .replace(/[°º]/g, "\\circ")
    .replace(SLASH_COMMAND_PATTERN, "\\$1");

  for (const [pattern, replacement] of UNICODE_LATEX_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/[ \t]{2,}/g, " ").trim();
};
