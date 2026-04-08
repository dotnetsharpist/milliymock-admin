import { wrapInlineMath } from "./math";

export interface InlineQuestionToken {
  type: "text" | "math";
  value: string;
}

export const INLINE_EDITOR_GHOST_CHAR = "\u200B";

const INLINE_MATH_GLOBAL_PATTERN = /\\\(([\s\S]+?)\\\)/g;

export const stripInlineEditorGhostChars = (value: string) =>
  value.replaceAll(INLINE_EDITOR_GHOST_CHAR, "");

export const parseInlineQuestionValue = (
  value?: string | null
): InlineQuestionToken[] => {
  const source = value ?? "";
  const tokens: InlineQuestionToken[] = [];
  let cursor = 0;

  source.replace(INLINE_MATH_GLOBAL_PATTERN, (match, latex, offset: number) => {
    if (offset > cursor) {
      tokens.push({
        type: "text",
        value: source.slice(cursor, offset),
      });
    }

    tokens.push({
      type: "math",
      value: String(latex ?? "").trim(),
    });

    cursor = offset + match.length;
    return match;
  });

  if (cursor < source.length) {
    tokens.push({
      type: "text",
      value: source.slice(cursor),
    });
  }

  return tokens.length > 0 ? tokens : [{ type: "text", value: "" }];
};

const serializeInlineQuestionNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return stripInlineEditorGhostChars(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;

  if (element.dataset.formulaId) {
    return wrapInlineMath(element.dataset.latex ?? "");
  }

  if (element.tagName === "BR") {
    return "\n";
  }

  return Array.from(element.childNodes)
    .map((child) => serializeInlineQuestionNode(child))
    .join("");
};

export const serializeInlineQuestionRoot = (root: HTMLElement) =>
  Array.from(root.childNodes)
    .map((child) => serializeInlineQuestionNode(child))
    .join("");
