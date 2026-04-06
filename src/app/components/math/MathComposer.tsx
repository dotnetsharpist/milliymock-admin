import { useEffect, useMemo, useRef, useState } from "react";
import type { MathfieldElement, VirtualKeyboardLayout } from "mathlive";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { MathText } from "./MathText";
import { wrapInlineMath } from "../../lib/math";

const FORMULA_KEYBOARD_LAYOUT: VirtualKeyboardLayout = {
  id: "question-formula-layout",
  label: "Formula",
  rows: [
    ["[7]", "[8]", "[9]", "[/]", { latex: "\\sqrt{#?}", label: "sqrt" }],
    ["[4]", "[5]", "[6]", "[*]", { latex: "\\frac{#@}{#?}", label: "a/b" }],
    ["[1]", "[2]", "[3]", "[-]", { latex: "#@^{#?}", label: "x^n" }],
    ["[0]", "[.]", "[(]", "[)]", "[+]"],
    [
      { latex: "\\log\\left(#?\\right)", label: "log" },
      { latex: "\\ln\\left(#?\\right)", label: "ln" },
      { latex: "\\cos\\left(#?\\right)", label: "cos" },
      { latex: "\\sin\\left(#?\\right)", label: "sin" },
      { latex: "\\tan\\left(#?\\right)", label: "tan" },
    ],
    ["[left]", "[right]", "[backspace]", "[return]", "[hide-keyboard]"],
  ],
};

const QUICK_SNIPPETS = [
  { label: "+", latex: "+" },
  { label: "-", latex: "-" },
  { label: "×", latex: "\\cdot" },
  { label: "÷", latex: "\\frac{#@}{#?}" },
  { label: "sqrt", latex: "\\sqrt{#?}" },
  { label: "log", latex: "\\log\\left(#?\\right)" },
  { label: "cos", latex: "\\cos\\left(#?\\right)" },
  { label: "sin", latex: "\\sin\\left(#?\\right)" },
];

interface MathComposerProps {
  value: string;
  onChange: (value: string) => void;
  onInsert: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
}

export function MathComposer({
  value,
  onChange,
  onInsert,
  disabled = false,
  className,
  title = "Math Input",
  description = "Formula yozing, keyin uni savol matniga kursor turgan joyga qo‘shing.",
  actionLabel = "Insert into question",
}: MathComposerProps) {
  const mathFieldRef = useRef<MathfieldElement | null>(null);
  const [isMathLiveReady, setIsMathLiveReady] = useState(false);
  const previewValue = useMemo(
    () => (value.trim() ? wrapInlineMath(value) : ""),
    [value]
  );

  useEffect(() => {
    let isCancelled = false;

    void import("mathlive").then(() => {
      if (!isCancelled) {
        setIsMathLiveReady(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMathLiveReady) return;

    const mathField = mathFieldRef.current;
    if (!mathField) return;

    const handleInput = () => {
      onChange(mathField.value);
    };

    mathField.mathVirtualKeyboardPolicy = "manual";
    mathField.defaultMode = "math";
    mathField.smartMode = true;
    mathField.smartFence = true;
    mathField.readOnly = disabled;
    mathField.addEventListener("input", handleInput);

    return () => {
      mathField.removeEventListener("input", handleInput);
    };
  }, [disabled, isMathLiveReady, onChange]);

  useEffect(() => {
    if (!isMathLiveReady) return;

    const mathField = mathFieldRef.current;
    if (!mathField) return;

    if (mathField.value !== value) {
      mathField.setValue(value);
    }
  }, [isMathLiveReady, value]);

  useEffect(() => {
    if (!isMathLiveReady || typeof window === "undefined" || !window.mathVirtualKeyboard) {
      return;
    }

    const previousLayouts = window.mathVirtualKeyboard.layouts;
    window.mathVirtualKeyboard.layouts = [FORMULA_KEYBOARD_LAYOUT];

    return () => {
      window.mathVirtualKeyboard.layouts = previousLayouts;
    };
  }, [isMathLiveReady]);

  const handleInsertSnippet = (latex: string) => {
    const mathField = mathFieldRef.current;
    if (!mathField || disabled) return;

    mathField.focus();
    mathField.insert(latex, {
      focus: true,
      format: "latex",
      mode: "math",
      selectionMode: "placeholder",
    });
    onChange(mathField.value);
  };

  const handleToggleKeyboard = () => {
    if (typeof window === "undefined" || !window.mathVirtualKeyboard || disabled) {
      return;
    }

    window.mathVirtualKeyboard.layouts = [FORMULA_KEYBOARD_LAYOUT];
    mathFieldRef.current?.focus();

    if (window.mathVirtualKeyboard.visible) {
      window.mathVirtualKeyboard.hide();
      return;
    }

    window.mathVirtualKeyboard.show();
  };

  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-orange-200 bg-[linear-gradient(160deg,rgba(255,247,237,0.96),rgba(255,255,255,0.98))] p-4 shadow-[0_24px_60px_-40px_rgba(154,52,18,0.55)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          <p className="text-xs leading-5 text-neutral-600">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleKeyboard}
          disabled={disabled}
          className="border-orange-200 bg-white/80 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
        >
          Keyboard
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <math-field
          ref={(node) => {
            mathFieldRef.current = node;
          }}
          className="math-composer__field"
          aria-label="Math formula input"
        >
          {value}
        </math-field>

        <div className="flex flex-wrap gap-2">
          {QUICK_SNIPPETS.map((snippet) => (
            <Button
              key={snippet.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInsertSnippet(snippet.latex)}
              disabled={disabled}
              className="rounded-full border-orange-200 bg-white/80 px-3 text-xs text-neutral-700 hover:bg-orange-50"
            >
              {snippet.label}
            </Button>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
              Preview
            </p>
            <Button
              type="button"
              size="sm"
              onClick={onInsert}
              disabled={disabled || !value.trim()}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {actionLabel}
            </Button>
          </div>

          {previewValue ? (
            <MathText
              value={previewValue}
              className="mt-3 text-base text-neutral-900"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
