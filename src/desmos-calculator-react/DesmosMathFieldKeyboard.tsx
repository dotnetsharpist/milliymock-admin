/**
 * DesmosMathFieldKeyboard — the Desmos-look keyboard from this folder, wired to
 * drive the app's MathLive math field (`MathInputHandle`).
 *
 * This is a drop-in replacement for the old `MathQuillKeyboard` /
 * `CustomMathKeyboard` used across the question pages: same props
 * (`mathInputRef`, `isVisible`, `onClose`), same imperative field API, but it
 * renders with the Desmos styling defined in `DesmosKeyboard.css`.
 *
 * Key → LaTeX mappings mirror the previously-working `DesmosMathKeyboard`, so
 * formula input (fractions, roots, π, cases, …) behaves exactly as before.
 */
import { useState, type ReactNode, type RefObject } from "react";
import { ArrowLeft, ArrowRight, CornerDownLeft, Delete, X } from "lucide-react";
import type { MathInputHandle } from "../app/components/math/MathQuillField";
import "./DesmosKeyboard.css";

const CASES_TEMPLATE = "\\begin{cases}#@ & #?\\\\#? & #?\\end{cases}";

type Tab = "main" | "letters" | "functions";

type Action =
  | { type: "cmd"; value: string }
  | { type: "write"; value: string }
  | { type: "typed"; value: string }
  | { type: "key"; value: string };

function dispatch(field: MathInputHandle, action: Action) {
  switch (action.type) {
    case "cmd":
      field.cmd(action.value);
      break;
    case "write":
      field.write(action.value);
      break;
    case "typed":
      field.typedText(action.value);
      break;
    case "key":
      field.keystroke(action.value);
      break;
  }
}

export interface DesmosMathFieldKeyboardProps {
  mathInputRef: RefObject<MathInputHandle | null>;
  isVisible?: boolean;
  onClose: () => void;
}

interface KeyDef {
  id: string;
  label: ReactNode;
  action?: Action;
  onPress?: () => void;
  variant?: "num" | "tint" | "primary" | "muted";
  wide?: boolean;
  tall?: boolean;
  title?: string;
}

export function DesmosMathFieldKeyboard({
  mathInputRef,
  isVisible = true,
  onClose,
}: DesmosMathFieldKeyboardProps) {
  const [tab, setTab] = useState<Tab>("main");
  const [pressed, setPressed] = useState<string | null>(null);

  if (!isVisible) return null;

  const fire = (key: KeyDef) => {
    setPressed(key.id);
    window.setTimeout(() => setPressed(null), 110);
    if (key.onPress) {
      key.onPress();
      return;
    }
    const field = mathInputRef.current;
    if (field && key.action) dispatch(field, key.action);
  };

  const renderKey = (key: KeyDef) => {
    const cls = [
      "dk-key",
      key.variant ? `dk-key--${key.variant}` : "",
      key.wide ? "dk-key--wide" : "",
      key.tall ? "dk-key--tall" : "",
      pressed === key.id ? "dk-key--pressed" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button
        key={key.id}
        type="button"
        className={cls}
        title={key.title}
        aria-label={key.title}
        onMouseDown={(e) => {
          e.preventDefault();
          fire(key);
        }}
      >
        {key.label}
      </button>
    );
  };

  const leftKeys = tab === "letters" ? letterKeys() : tab === "functions" ? functionKeys() : mainKeys();

  const numberKeys: KeyDef[] = [
    { id: "7", label: "7", variant: "num", action: { type: "typed", value: "7" } },
    { id: "8", label: "8", variant: "num", action: { type: "typed", value: "8" } },
    { id: "9", label: "9", variant: "num", action: { type: "typed", value: "9" } },
    { id: "div", label: "÷", action: { type: "write", value: "\\div" } },
    { id: "4", label: "4", variant: "num", action: { type: "typed", value: "4" } },
    { id: "5", label: "5", variant: "num", action: { type: "typed", value: "5" } },
    { id: "6", label: "6", variant: "num", action: { type: "typed", value: "6" } },
    { id: "mul", label: "×", action: { type: "write", value: "\\cdot" } },
    { id: "1", label: "1", variant: "num", action: { type: "typed", value: "1" } },
    { id: "2", label: "2", variant: "num", action: { type: "typed", value: "2" } },
    { id: "3", label: "3", variant: "num", action: { type: "typed", value: "3" } },
    { id: "sub", label: "−", action: { type: "typed", value: "-" } },
    { id: "0", label: "0", variant: "num", wide: true, action: { type: "typed", value: "0" } },
    { id: "dot", label: ".", variant: "num", action: { type: "typed", value: "." } },
    { id: "add", label: "+", action: { type: "typed", value: "+" } },
  ];

  const controlKeys: KeyDef[] = [
    {
      id: "left",
      label: <ArrowLeft size={18} />,
      variant: "muted",
      action: { type: "key", value: "Left" },
      title: "Move left",
    },
    {
      id: "right",
      label: <ArrowRight size={18} />,
      variant: "muted",
      action: { type: "key", value: "Right" },
      title: "Move right",
    },
    {
      id: "backspace",
      label: <Delete size={18} />,
      variant: "muted",
      wide: true,
      action: { type: "key", value: "Backspace" },
      title: "Backspace",
    },
    {
      id: "enter",
      label: <CornerDownLeft size={20} />,
      variant: "primary",
      wide: true,
      tall: true,
      action: { type: "key", value: "Enter" },
      title: "Enter",
    },
  ];

  return (
    <div className="dk-dock math-keyboard">
      <div className="dk-keyboard" role="group" aria-label="Math keyboard">
        <div className="dk-inner">
          <div className="dk-controlbar">
            <div className="dk-tabs">
              {(
                [
                  ["main", "123"],
                  ["letters", "ABC"],
                  ["functions", "f(x)"],
                ] as Array<[Tab, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`dk-tab ${tab === id ? "dk-tab--active" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setTab(id);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="dk-close"
              onMouseDown={(e) => {
                e.preventDefault();
                onClose();
              }}
              title="Close keyboard"
            >
              <X size={16} /> Close
            </button>
          </div>

          <div className="dk-body">
            <div className="dk-block">
              <div className="dk-grid dk-grid--4">{leftKeys.map(renderKey)}</div>
            </div>
            <div className="dk-block">
              <div className="dk-grid dk-grid--4">{numberKeys.map(renderKey)}</div>
            </div>
            <div className="dk-block dk-block--control">
              <div className="dk-grid dk-grid--2">{controlKeys.map(renderKey)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── left-panel key sets ─────────────────────────────────────────────────── */

function mainKeys(): KeyDef[] {
  return [
    { id: "x", label: <em>x</em>, variant: "tint", title: "x", action: { type: "typed", value: "x" } },
    { id: "y", label: <em>y</em>, variant: "tint", title: "y", action: { type: "typed", value: "y" } },
    { id: "sq", label: (<span><em>a</em><sup>2</sup></span>), title: "square", action: { type: "write", value: "^{2}" } },
    { id: "pow", label: (<span><em>a</em><sup><em>b</em></sup></span>), title: "power", action: { type: "cmd", value: "^" } },
    { id: "lp", label: "(", action: { type: "typed", value: "(" } },
    { id: "rp", label: ")", action: { type: "typed", value: ")" } },
    { id: "lt", label: "<", title: "less than", action: { type: "typed", value: "<" } },
    { id: "gt", label: ">", title: "greater than", action: { type: "typed", value: ">" } },
    { id: "cases", label: "{", title: "piecewise / cases", action: { type: "write", value: CASES_TEMPLATE } },
    { id: "le", label: "≤", title: "less or equal", action: { type: "write", value: "\\le" } },
    { id: "ge", label: "≥", title: "greater or equal", action: { type: "write", value: "\\ge" } },
    { id: "pi", label: "π", title: "pi", action: { type: "write", value: "\\pi" } },
    { id: "sub", label: (<span><em>a</em><sub><em>b</em></sub></span>), title: "subscript", action: { type: "cmd", value: "_" } },
    { id: "sqrt", label: "√", title: "square root", action: { type: "cmd", value: "\\sqrt" } },
    { id: "nthroot", label: (<span className="dk-root"><span className="dk-root-index">n</span>√</span>), title: "nth root", action: { type: "cmd", value: "\\nthroot" } },
    { id: "abs", label: (<span>|<em>a</em>|</span>), title: "absolute value", action: { type: "write", value: "\\left|#@\\right|" } },
  ];
}

function functionKeys(): KeyDef[] {
  const w = (value: string): Action => ({ type: "write", value });
  return [
    { id: "sin", label: "sin", action: w("\\sin(#?)") },
    { id: "cos", label: "cos", action: w("\\cos(#?)") },
    { id: "tan", label: "tan", action: w("\\tan(#?)") },
    { id: "log", label: "log", action: w("\\log(#?)") },
    { id: "ln", label: "ln", action: w("\\ln(#?)") },
    { id: "sqrtf", label: "√", title: "square root", action: { type: "cmd", value: "\\sqrt" } },
    { id: "absf", label: (<span>|<em>a</em>|</span>), action: w("\\left|#@\\right|") },
    { id: "sum", label: "Σ", title: "sum", action: w("\\sum") },
    { id: "asin", label: (<span>sin<sup>-1</sup></span>), action: w("\\sin^{-1}(#?)") },
    { id: "acos", label: (<span>cos<sup>-1</sup></span>), action: w("\\cos^{-1}(#?)") },
    { id: "atan", label: (<span>tan<sup>-1</sup></span>), action: w("\\tan^{-1}(#?)") },
    { id: "pif", label: "π", title: "pi", action: w("\\pi") },
  ];
}

function letterKeys(): KeyDef[] {
  return "abcdefghijklmnopqrstuvwxyz".split("").map((ch) => ({
    id: `ltr-${ch}`,
    label: <em>{ch}</em>,
    title: ch,
    action: { type: "typed", value: ch } as Action,
  }));
}

export default DesmosMathFieldKeyboard;
