import { useState, type ReactNode, type RefObject } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Delete,
  CornerDownLeft,
  X,
} from "lucide-react";

export interface QuestionInlineMathHandle {
  cmd: (latexCmd: string) => void;
  write: (latex: string) => void;
  typedText: (text: string) => void;
  keystroke: (key: string) => void;
  focus: () => void;
  getLatex: () => string;
}

interface QuestionInlineKeyboardProps {
  mathInputRef: RefObject<QuestionInlineMathHandle | null>;
  isVisible?: boolean;
  onClose?: () => void;
}

type Action =
  | { type: "cmd"; arg: string }
  | { type: "write"; arg: string }
  | { type: "typed"; arg: string }
  | { type: "key"; arg: string }
  | { type: "custom"; fn: (mf: QuestionInlineMathHandle) => void };

function dispatch(mf: QuestionInlineMathHandle, action: Action) {
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

export function QuestionInlineKeyboard({
  mathInputRef,
  isVisible = true,
  onClose,
}: QuestionInlineKeyboardProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isAlphabetMode, setIsAlphabetMode] = useState(false);

  const fire = (keyId: string, action: Action) => {
    setActiveKey(keyId);
    const mathField = mathInputRef.current;
    if (mathField) {
      dispatch(mathField, action);
    }
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
    const isActive = activeKey === id;
    const baseClasses = [
      "rounded-lg select-none cursor-pointer flex items-center justify-center",
      "transition-all duration-75 shadow-sm active:scale-95",
      tall ? "h-16" : "h-14",
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
    <div className="relative bg-gray-50 border-t-2 border-gray-300 shadow-2xl py-3 px-4">
      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          onClose?.();
        }}
        className="absolute right-4 top-3 z-10 inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
      >
        <X className="h-3.5 w-3.5" />
        Yopish
      </button>
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-3 items-end">
          <div className="grid grid-cols-4 gap-2">
            {!isAlphabetMode ? (
              <>
                <Key
                  id="x"
                  action={{ type: "typed", arg: "x" }}
                  title="Variable x"
                >
                  <em>x</em>
                </Key>
                <Key
                  id="y"
                  action={{ type: "typed", arg: "y" }}
                  title="Variable y"
                >
                  <em>y</em>
                </Key>
                <Key
                  id="sq"
                  action={{ type: "write", arg: "#@^{2}" }}
                  title="Square (x²)"
                >
                  <span>
                    <em>a</em>
                    <sup>2</sup>
                  </span>
                </Key>
                <Key
                  id="pow"
                  action={{ type: "cmd", arg: "^" }}
                  title="Power"
                >
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
                <Key id="lt" action={{ type: "typed", arg: "<" }} title="Less than">
                  &lt;
                </Key>
                <Key id="gt" action={{ type: "typed", arg: ">" }} title="Greater than">
                  &gt;
                </Key>

                <Key
                  id="abs"
                  action={{ type: "write", arg: "\\left|#?\\right|" }}
                  title="Absolute value"
                >
                  <span>
                    |<em>a</em>|
                  </span>
                </Key>
                <Key id="sub" action={{ type: "cmd", arg: "_" }} title="Subscript">
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

                <Key id="pi" action={{ type: "write", arg: "\\pi" }} title="π">
                  π
                </Key>
                <Key
                  id="nthroot"
                  action={{ type: "cmd", arg: "\\nthroot" }}
                  title="Nth root"
                >
                  <span className="relative inline-block text-lg">
                    <span className="absolute -top-1 -left-2 text-[10px]">n</span>
                    <span>√</span>
                  </span>
                </Key>
                <Key
                  id="sqrt"
                  action={{ type: "cmd", arg: "\\sqrt" }}
                  title="Square root"
                >
                  √
                </Key>
                <Key
                  id="ABC"
                  variant="gray"
                  onClick={() => setIsAlphabetMode(true)}
                  title="Switch to letters"
                >
                  <span className="text-sm tracking-widest">A B C</span>
                </Key>
              </>
            ) : (
              <>
                <Key id="neq" action={{ type: "write", arg: "\\ne" }} title="≠">
                  ≠
                </Key>
                <Key id="int" action={{ type: "write", arg: "\\int" }} title="∫">
                  ∫
                </Key>
                <Key
                  id="deg"
                  action={{ type: "write", arg: "^{\\circ}" }}
                  title="Degree"
                >
                  <span className="text-2xl">°</span>
                </Key>
                <Key
                  id="cases"
                  action={{
                    type: "custom",
                    fn: (mf) => {
                      mf.write("\\begin{cases}#?\\\\#?\\end{cases}");
                    },
                  }}
                  title="System of equations"
                >
                  <span className="text-xl">{"{"}</span>
                </Key>

                <Key
                  id="emptyset"
                  action={{ type: "write", arg: "\\emptyset" }}
                  title="∅"
                >
                  ∅
                </Key>
                <Key id="perp" action={{ type: "write", arg: "\\perp" }} title="⊥">
                  <span className="font-bold text-lg">⊥</span>
                </Key>
                <Key id="in" action={{ type: "write", arg: "\\in" }} title="∈">
                  ∈
                </Key>
                <Key
                  id="infty"
                  action={{ type: "write", arg: "\\infty" }}
                  title="∞"
                >
                  ∞
                </Key>

                <Key id="cup" action={{ type: "write", arg: "\\cup" }} title="∪">
                  ∪
                </Key>
                <Key id="cap" action={{ type: "write", arg: "\\cap" }} title="∩">
                  ∩
                </Key>
                <Key
                  id="subseteq"
                  action={{ type: "write", arg: "\\subseteq" }}
                  title="⊆"
                >
                  ⊆
                </Key>
                <Key
                  id="nsubseteq"
                  action={{ type: "write", arg: "\\not\\subseteq" }}
                  title="⊈"
                >
                  ⊈
                </Key>

                <Key
                  id="subset"
                  action={{ type: "write", arg: "\\subset" }}
                  title="⊂"
                >
                  ⊂
                </Key>
                <Key
                  id="cdot"
                  action={{ type: "write", arg: "\\cdot" }}
                  title="·"
                >
                  <span className="font-bold text-2xl">·</span>
                </Key>
                <Key
                  id="alpha"
                  action={{ type: "write", arg: "\\alpha" }}
                  title="α"
                >
                  <span className="text-lg">α</span>
                </Key>
                <Key
                  id="approx"
                  action={{ type: "write", arg: "\\approx" }}
                  title="≈"
                >
                  ≈
                </Key>

                <Key
                  id="tilde"
                  action={{ type: "write", arg: "\\sim" }}
                  title="~"
                >
                  ~
                </Key>
                <Key
                  id="beta"
                  action={{ type: "write", arg: "\\beta" }}
                  title="β"
                >
                  <span className="text-lg">β</span>
                </Key>
                <Key
                  id="gamma"
                  action={{ type: "write", arg: "\\gamma" }}
                  title="γ"
                >
                  <span className="text-lg">γ</span>
                </Key>
                <Key
                  id="123"
                  variant="gray"
                  span={2}
                  onClick={() => setIsAlphabetMode(false)}
                  title="Switch to numbers"
                >
                  <span className="text-sm tracking-widest">123</span>
                </Key>
              </>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Key id="7" action={{ type: "typed", arg: "7" }} variant="gray">
              7
            </Key>
            <Key id="8" action={{ type: "typed", arg: "8" }} variant="gray">
              8
            </Key>
            <Key id="9" action={{ type: "typed", arg: "9" }} variant="gray">
              9
            </Key>
            <Key
              id="frac"
              action={{ type: "cmd", arg: "\\frac" }}
              variant="white"
              title="Fraction"
            >
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
            <Key
              id="mul"
              action={{ type: "write", arg: "\\cdot" }}
              variant="white"
              title="Multiply"
            >
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
            <Key
              id="sub"
              action={{ type: "typed", arg: "-" }}
              variant="white"
              title="Subtract"
            >
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
            <Key
              id="add"
              action={{ type: "typed", arg: "+" }}
              variant="white"
              title="Add"
            >
              +
            </Key>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Key id="fn" variant="gray" span={2} title="Functions">
              <span className="text-sm tracking-wide">functions</span>
            </Key>
            <Key
              id="space"
              action={{ type: "write", arg: "\\ " }}
              variant="gray"
              span={2}
              title="Space"
            >
              <span className="text-sm tracking-wider">SPACE</span>
            </Key>
            <Key
              id="left"
              action={{ type: "key", arg: "Left" }}
              variant="gray"
              title="Move left"
            >
              <ArrowLeft className="w-5 h-5" />
            </Key>
            <Key
              id="right"
              action={{ type: "key", arg: "Right" }}
              variant="gray"
              title="Move right"
            >
              <ArrowRight className="w-5 h-5" />
            </Key>
            <Key
              id="bs"
              action={{ type: "key", arg: "Backspace" }}
              variant="gray"
              span={2}
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </Key>
            <Key
              id="enter"
              action={{ type: "key", arg: "Enter" }}
              variant="blue"
              span={2}
              tall
              title="Enter"
            >
              <CornerDownLeft className="w-6 h-6" />
            </Key>
          </div>
        </div>
      </div>
    </div>
  );
}
