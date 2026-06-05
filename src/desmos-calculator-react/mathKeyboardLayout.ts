/**
 * Desmos-style MathLive virtual keyboard layout, shared by the math editor.
 * Mirrors the layout used elsewhere in the app so formula input feels the same.
 */
import type { VirtualKeyboardLayout } from "mathlive";

export const DESMOS_STYLE_LAYOUT: VirtualKeyboardLayout = {
  id: "milliy-desmos-style-layout",
  label: "Input",
  displayEditToolbar: false,
  layers: [
    {
      id: "letters",
      rows: [
        [
          { latex: "\\sin\\left(#?\\right)", label: "sin" },
          { latex: "\\cos\\left(#?\\right)", label: "cos" },
          { latex: "\\tan\\left(#?\\right)", label: "tan" },
          { latex: "\\log\\left(#?\\right)", label: "log" },
          { latex: "\\sqrt{#?}", label: "sqrt" },
          { latex: "\\frac{#@}{#?}", label: "a/b" },
          { latex: "#@^{#?}", label: "x^n" },
          { latex: "#?_{#?}", label: "x_n" },
        ],
        [
          { latex: "q", label: "q", shift: "Q" },
          { latex: "w", label: "w", shift: "W" },
          { latex: "e", label: "e", shift: "E" },
          { latex: "r", label: "r", shift: "R" },
          { latex: "t", label: "t", shift: "T" },
          { latex: "y", label: "y", shift: "Y" },
          { latex: "u", label: "u", shift: "U" },
          { latex: "i", label: "i", shift: "I" },
          { latex: "o", label: "o", shift: "O" },
          { latex: "p", label: "p", shift: "P" },
        ],
        [
          { latex: "a", label: "a", shift: "A" },
          { latex: "s", label: "s", shift: "S" },
          { latex: "d", label: "d", shift: "D" },
          { latex: "f", label: "f", shift: "F" },
          { latex: "g", label: "g", shift: "G" },
          { latex: "h", label: "h", shift: "H" },
          { latex: "j", label: "j", shift: "J" },
          { latex: "k", label: "k", shift: "K" },
          { latex: "l", label: "l", shift: "L" },
          { latex: "\\theta", label: "θ", shift: "\\Theta" },
        ],
        [
          "[shift]",
          { latex: "z", label: "z", shift: "Z" },
          { latex: "x", label: "x", shift: "X" },
          { latex: "c", label: "c", shift: "C" },
          { latex: "v", label: "v", shift: "V" },
          { latex: "b", label: "b", shift: "B" },
          { latex: "n", label: "n", shift: "N" },
          { latex: "m", label: "m", shift: "M" },
          "[backspace]",
        ],
        [
          { label: "123", class: "action", layer: "symbols", width: 1.5 },
          { latex: "+", label: "+" },
          { latex: "-", label: "-" },
          { latex: "=", label: "=" },
          { latex: "\\left(#?\\right)", label: "( )" },
          { latex: "\\pi", label: "π" },
          { latex: ",", label: "," },
          { latex: ".", label: "." },
          "[return]",
          "[hide-keyboard]",
        ],
      ],
    },
    {
      id: "symbols",
      rows: [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        [
          { latex: "+", label: "+" },
          { latex: "-", label: "-" },
          { latex: "=", label: "=" },
          { latex: "\\times", label: "×" },
          { latex: "\\div", label: "÷" },
          { latex: "\\cdot", label: "·" },
          { latex: "\\sqrt{#?}", label: "sqrt" },
          { latex: "\\frac{#@}{#?}", label: "a/b" },
          { latex: "#@^{#?}", label: "x^n" },
          { latex: "#?_{#?}", label: "x_n" },
        ],
        [
          { latex: "\\sin\\left(#?\\right)", label: "sin" },
          { latex: "\\cos\\left(#?\\right)", label: "cos" },
          { latex: "\\tan\\left(#?\\right)", label: "tan" },
          { latex: "\\log\\left(#?\\right)", label: "log" },
          { latex: "\\ln\\left(#?\\right)", label: "ln" },
          { latex: "\\left[#?\\right]", label: "[ ]" },
          { latex: "\\left\\{#?\\right\\}", label: "{ }" },
          { latex: "\\left|#?\\right|", label: "|x|" },
          { latex: "\\pi", label: "π" },
          { latex: "\\theta", label: "θ" },
        ],
        [
          { label: "ABC", class: "action", layer: "letters", width: 1.5 },
          "[left]",
          "[right]",
          "[backspace]",
          "[return]",
          "[hide-keyboard]",
        ],
      ],
    },
  ],
};

/** Apply the Desmos layout to the global MathLive virtual keyboard (idempotent). */
export function applyDesmosKeyboard(): void {
  if (typeof window === "undefined" || !window.mathVirtualKeyboard) return;
  window.mathVirtualKeyboard.layouts = [DESMOS_STYLE_LAYOUT];
  window.mathVirtualKeyboard.editToolbar = "none";
}
