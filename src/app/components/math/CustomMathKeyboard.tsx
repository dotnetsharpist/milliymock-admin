/**
 * PRESERVED — original custom virtual keyboard.
 *
 * This is the hand-built keyboard that was used before the migration to
 * MathLive's built-in keyboard. It is kept intact so it can be restored:
 * flip `USE_MATHLIVE_KEYBOARD` in `MathQuillField.tsx` back to `false`.
 *
 * It still works — it drives the math field through the `MathInputHandle`
 * imperative API, which is backed by MathLive.
 */
import { useState, type ReactNode, type RefObject } from "react";
import { ArrowLeft, ArrowRight, CornerDownLeft, Delete, X } from "lucide-react";
import type { MathInputHandle } from "./MathQuillField";

const CASES_TEMPLATE = "\\begin{cases}#@ & #?\\\\#? & #?\\end{cases}";

type Action =
  | { type: "cmd"; arg: string }
  | { type: "write"; arg: string }
  | { type: "typed"; arg: string }
  | { type: "key"; arg: string }
  | { type: "custom"; fn: (mf: MathInputHandle) => void };

function dispatch(mf: MathInputHandle, action: Action) {
  switch (action.type) {
    case "cmd":
      mf.cmd(action.arg);
      break;
    case "write":
      mf.write(action.arg);
      break;
    case "typed":
      mf.typedText(action.arg);
      break;
    case "key":
      mf.keystroke(action.arg);
      break;
    case "custom":
      action.fn(mf);
      break;
  }
}

interface CustomMathKeyboardProps {
  mathInputRef: RefObject<MathInputHandle | null>;
  isVisible?: boolean;
  onClose: () => void;
}

export function CustomMathKeyboard({
  mathInputRef,
  isVisible = true,
  onClose,
}: CustomMathKeyboardProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isAlphabetMode, setIsAlphabetMode] = useState(false);

  const insertCasesBlock = () => {
    setActiveKey("cases");
    mathInputRef.current?.write(CASES_TEMPLATE);
    window.setTimeout(() => setActiveKey(null), 120);
  };

  const fire = (keyId: string, action: Action) => {
    setActiveKey(keyId);
    const mathField = mathInputRef.current;
    if (mathField) dispatch(mathField, action);
    window.setTimeout(() => setActiveKey(null), 120);
  };

  const Key = ({
    id,
    action,
    variant = "white",
    span,
    tall,
    title,
    children,
    onClick,
  }: {
    id: string;
    action?: Action;
    variant?: "white" | "gray" | "blue";
    span?: 2;
    tall?: boolean;
    title?: string;
    children: ReactNode;
    onClick?: () => void;
  }) => {
    const baseClasses = [
      "rounded-lg select-none cursor-pointer flex items-center justify-center",
      "transition-all duration-75 shadow-sm active:scale-95",
      tall ? "h-20" : "h-16",
      span === 2 ? "col-span-2" : "",
    ].join(" ");

    const variantClasses = {
      white:
        "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 active:bg-gray-100",
      gray:
        "bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 active:bg-gray-400",
      blue:
        "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md",
    }[variant];

    const isActive = activeKey === id;
    const activeClass = isActive
      ? variant === "blue"
        ? "brightness-75"
        : "brightness-90"
      : "";

    return (
      <button
        type="button"
        title={title}
        onMouseDown={(event) => {
          event.preventDefault();
          if (onClick) {
            onClick();
            return;
          }
          if (action) {
            fire(id, action);
          }
        }}
        className={`${baseClasses} ${variantClasses} ${activeClass}`}
      >
        {children}
      </button>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="math-keyboard fixed bottom-0 left-0 right-0 z-50 border-t-2 border-gray-300 bg-gray-50 px-6 py-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Virtual Keyboard
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 rounded-md p-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
            title="Close Keyboard"
          >
            <span className="hidden sm:inline">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[1fr_1fr_340px]">
          <div className="grid grid-cols-4 gap-3">
            {!isAlphabetMode ? (
              <>
                <Key id="x" action={{ type: "typed", arg: "x" }} title="Variable x">
                  <em>x</em>
                </Key>
                <Key id="y" action={{ type: "typed", arg: "y" }} title="Variable y">
                  <em>y</em>
                </Key>
                <Key id="sq" action={{ type: "write", arg: "^{2}" }} title="Square">
                  <span>
                    <em>a</em>
                    <sup>2</sup>
                  </span>
                </Key>
                <Key id="pow" action={{ type: "cmd", arg: "^" }} title="Power">
                  <span>
                    <em>a</em>
                    <sup>
                      <em>b</em>
                    </sup>
                  </span>
                </Key>
                <Key id="lp" action={{ type: "typed", arg: "(" }} title="(">
                  (
                </Key>
                <Key id="rp" action={{ type: "typed", arg: ")" }} title=")">
                  )
                </Key>
                <Key
                  id="system"
                  onClick={insertCasesBlock}
                  title="Piecewise / cases"
                >
                  <span className="text-xl">{"{"}</span>
                </Key>
                <Key id="lt" action={{ type: "typed", arg: "<" }} title="Less than">
                  &lt;
                </Key>
                <Key id="gt" action={{ type: "typed", arg: ">" }} title="Greater than">
                  &gt;
                </Key>
                <Key id="abs" action={{ type: "typed", arg: "|" }} title="Absolute value">
                  <span>
                    |<em>a</em>|
                  </span>
                </Key>
                <Key id="sub_script" action={{ type: "cmd", arg: "_" }} title="Subscript">
                  <span>
                    <em>a</em>
                    <sub>
                      <em>b</em>
                    </sub>
                  </span>
                </Key>
                <Key id="le" action={{ type: "write", arg: "\\le" }} title="≤">
                  ≤
                </Key>
                <Key id="ge" action={{ type: "write", arg: "\\ge" }} title="≥">
                  ≥
                </Key>
                <Key id="pi" action={{ type: "write", arg: "\\pi" }} title="Pi">
                  π
                </Key>
                <Key id="nthroot" action={{ type: "cmd", arg: "\\nthroot" }} title="Nth root">
                  <span className="relative inline-block text-lg">
                    <span className="absolute -left-2 -top-1 text-[10px]">n</span>
                    <span>√</span>
                  </span>
                </Key>
                <Key id="sqrt" action={{ type: "cmd", arg: "\\sqrt" }} title="Square root">
                  √
                </Key>
                <Key id="ABC" variant="gray" onClick={() => setIsAlphabetMode(true)}>
                  <span className="text-sm tracking-widest">A B C</span>
                </Key>
              </>
            ) : (
              <>
                <Key id="neq" action={{ type: "write", arg: "\\ne" }}>
                  ≠
                </Key>
                <Key id="int" action={{ type: "write", arg: "\\int" }}>
                  <span className="text-2xl">∫</span>
                </Key>
                <Key id="deg" action={{ type: "write", arg: "^{\\circ}" }}>
                  <span className="text-2xl">°</span>
                </Key>
                <Key
                  id="cases"
                  onClick={insertCasesBlock}
                  title="Piecewise / cases"
                >
                  <span className="text-xl">{"{"}</span>
                </Key>
                <Key id="emptyset" action={{ type: "write", arg: "\\emptyset" }}>
                  ∅
                </Key>
                <Key id="perp" action={{ type: "write", arg: "\\perp" }}>
                  <span className="text-lg font-bold">⊥</span>
                </Key>
                <Key id="in" action={{ type: "write", arg: "\\in" }}>
                  ∈
                </Key>
                <Key id="infty" action={{ type: "write", arg: "\\infty" }}>
                  ∞
                </Key>
                <Key id="cup" action={{ type: "write", arg: "\\cup" }}>
                  ∪
                </Key>
                <Key id="cap" action={{ type: "write", arg: "\\cap" }}>
                  ∩
                </Key>
                <Key id="subseteq" action={{ type: "write", arg: "\\subseteq" }}>
                  ⊆
                </Key>
                <Key id="nsubseteq" action={{ type: "write", arg: "\\not\\subseteq" }}>
                  ⊈
                </Key>
                <Key id="subset" action={{ type: "write", arg: "\\subset" }}>
                  ⊂
                </Key>
                <Key id="cdot" action={{ type: "write", arg: "\\cdot" }}>
                  <span className="text-2xl font-bold">·</span>
                </Key>
                <Key id="alpha" action={{ type: "write", arg: "\\alpha" }}>
                  <span className="text-lg">α</span>
                </Key>
                <Key id="approx" action={{ type: "write", arg: "\\approx" }}>
                  ≈
                </Key>
                <Key id="tilde" action={{ type: "write", arg: "\\sim" }}>
                  ~
                </Key>
                <Key id="beta" action={{ type: "write", arg: "\\beta" }}>
                  <span className="text-lg">β</span>
                </Key>
                <Key id="gamma" action={{ type: "write", arg: "\\gamma" }}>
                  <span className="text-lg">γ</span>
                </Key>
                <Key id="123" variant="gray" span={2} onClick={() => setIsAlphabetMode(false)}>
                  <span className="text-sm tracking-widest">123</span>
                </Key>
              </>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Key id="7" action={{ type: "typed", arg: "7" }} variant="gray">
              7
            </Key>
            <Key id="8" action={{ type: "typed", arg: "8" }} variant="gray">
              8
            </Key>
            <Key id="9" action={{ type: "typed", arg: "9" }} variant="gray">
              9
            </Key>
            <Key id="frac" action={{ type: "cmd", arg: "\\frac" }} variant="white">
              <span className="flex flex-col items-center gap-[2px] leading-none">
                <span className="text-[11px]">a</span>
                <span className="w-4 border-t border-gray-700" />
                <span className="text-[11px]">b</span>
              </span>
            </Key>
            <Key id="4" action={{ type: "typed", arg: "4" }} variant="gray">
              4
            </Key>
            <Key id="5" action={{ type: "typed", arg: "5" }} variant="gray">
              5
            </Key>
            <Key id="6" action={{ type: "typed", arg: "6" }} variant="gray">
              6
            </Key>
            <Key id="mul" action={{ type: "write", arg: "\\cdot" }} variant="white">
              ×
            </Key>
            <Key id="1" action={{ type: "typed", arg: "1" }} variant="gray">
              1
            </Key>
            <Key id="2" action={{ type: "typed", arg: "2" }} variant="gray">
              2
            </Key>
            <Key id="3" action={{ type: "typed", arg: "3" }} variant="gray">
              3
            </Key>
            <Key id="sub" action={{ type: "typed", arg: "-" }} variant="white">
              −
            </Key>
            <Key id="0" action={{ type: "typed", arg: "0" }} variant="gray">
              0
            </Key>
            <Key id="dot" action={{ type: "typed", arg: "." }} variant="gray">
              .
            </Key>
            <Key id="eq" action={{ type: "typed", arg: "=" }} variant="gray">
              =
            </Key>
            <Key id="add" action={{ type: "typed", arg: "+" }} variant="white">
              +
            </Key>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Key id="fn" variant="gray" span={2} title="Insert function (coming soon)">
              <span className="text-sm tracking-wide">functions</span>
            </Key>
            <Key id="space" action={{ type: "write", arg: "\\;" }} variant="gray" span={2}>
              <span className="text-sm tracking-wider">SPACE</span>
            </Key>
            <Key id="left" action={{ type: "key", arg: "Left" }} variant="gray">
              <ArrowLeft className="h-5 w-5" />
            </Key>
            <Key id="right" action={{ type: "key", arg: "Right" }} variant="gray">
              <ArrowRight className="h-5 w-5" />
            </Key>
            <Key id="bs" action={{ type: "key", arg: "Backspace" }} variant="gray" span={2}>
              <Delete className="h-5 w-5" />
            </Key>
            <Key id="enter" action={{ type: "key", arg: "Enter" }} variant="blue" span={2} tall>
              <CornerDownLeft className="h-6 w-6" />
            </Key>
          </div>
        </div>
      </div>
    </div>
  );
}
