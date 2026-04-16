import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  Delete,
  Keyboard,
  Menu,
  X,
} from "lucide-react";
import { Label } from "../ui/label";

type MQInterface = any;
let mqState: "idle" | "loading" | "ready" | "error" = "idle";
let mqInstance: MQInterface | null = null;
const mqWaiters: Array<(mq: MQInterface) => void> = [];

function loadMathQuill(): Promise<MQInterface> {
  return new Promise((resolve) => {
    if (mqState === "ready") {
      resolve(mqInstance);
      return;
    }

    mqWaiters.push(resolve);
    if (mqState === "loading") return;

    mqState = "loading";

    const appendScript = (src: string): Promise<void> =>
      new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          res();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => res();
        script.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });

    const appendCss = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    };

    void (async () => {
      try {
        if (!(window as any).jQuery) {
          await appendScript(
            "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"
          );
        }

        appendCss(
          "https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.css"
        );

        await appendScript(
          "https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.js"
        );

        const mq: MQInterface = (window as any).MathQuill.getInterface(2);
        mqInstance = mq;
        mqState = "ready";
        mqWaiters.forEach((waiter) => waiter(mq));
        mqWaiters.length = 0;
      } catch (error) {
        console.error("[MathQuillField] MathQuill CDN load failed:", error);
        mqState = "error";
      }
    })();
  });
}

void loadMathQuill();

export interface MathInputHandle {
  cmd: (latexCmd: string) => void;
  write: (latex: string) => void;
  typedText: (text: string) => void;
  keystroke: (key: string) => void;
  focus: () => void;
  getLatex: () => string;
}

interface MathQuillInputProps {
  label?: string;
  onInput?: (latex: string) => void;
  initialValue?: string;
  onFocus?: () => void;
  onToggleKeyboard?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const MathQuillInput = forwardRef<MathInputHandle, MathQuillInputProps>(
  (
    {
      label,
      onInput,
      initialValue = "",
      onFocus,
      onToggleKeyboard,
      disabled,
      compact,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mqFieldRef = useRef<MQInterface | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">(
      "loading"
    );

    useEffect(() => {
      let cancelled = false;

      loadMathQuill().then((MQ) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";

        const mathField = MQ.MathField(containerRef.current, {
          spaceBehavesLikeTab: false,
          leftRightIntoCmdGoes: "up",
          restrictMismatchedBrackets: false,
          supSubsRequireOperand: false,
          charsThatBreakOutOfSupSub: "+-=<>",
          autoCommands: "theta sqrt nthroot",
          autoOperatorNames: "dummyop",
          handlers: {
            edit: () => {
              onInput?.(mathField.latex());
            },
          },
        } as any);

        if (initialValue) {
          const fixedInitialValue = initialValue.replace(
            /\\circ/g,
            "\\text{°}"
          );
          mathField.latex(fixedInitialValue);
        }

        mqFieldRef.current = mathField;
        setStatus("ready");
      });

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const mathField = mqFieldRef.current;
        if (!mathField) return;

        const isMathFieldFocused = containerRef.current?.contains(
          document.activeElement
        );
        if (!isMathFieldFocused) return;

        const isInsideSystemBlock = () => {
          const latex = mqFieldRef.current?.latex() || "";
          return latex.includes("\\left\\{");
        };

        if (event.key === "/") {
          if (isInsideSystemBlock()) {
            event.preventDefault();
            event.stopPropagation();
            mathField.write("/");
            return;
          }
        }

        if ((event.key === "Enter" || event.keyCode === 13) && event.shiftKey) {
          if (isInsideSystemBlock()) {
            event.preventDefault();
            event.stopPropagation();
            mathField.cmd("/");
            return;
          }
        }

        if (event.key === " " || event.code === "Space") {
          event.preventDefault();
          mathField.write("\\ ");
          return;
        }

        if (event.key === "{") {
          event.preventDefault();
          mathField.write("\\left\\{\\right\\}");
          mathField.keystroke("Left");
        }
      };

      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, []);

    useImperativeHandle(ref, () => ({
      cmd: (latexCmd) => {
        const mathField = mqFieldRef.current;
        if (!mathField) return;
        mathField.focus();
        mathField.cmd(latexCmd);
      },
      write: (latex) => {
        const mathField = mqFieldRef.current;
        if (!mathField) return;
        mathField.focus();
        mathField.write(latex);
      },
      typedText: (text) => {
        const mathField = mqFieldRef.current;
        if (!mathField) return;
        mathField.focus();
        mathField.typedText(text);
      },
      keystroke: (key) => {
        const mathField = mqFieldRef.current;
        if (!mathField) return;
        mathField.keystroke(key);
      },
      focus: () => mqFieldRef.current?.focus(),
      getLatex: () => mqFieldRef.current?.latex() ?? "",
    }));

    return (
      <div className="relative" onFocusCapture={onFocus}>
        {label && <Label className="mb-2 block">{label}</Label>}

        <div
          className={`relative overflow-hidden rounded-xl border-2 border-gray-300 bg-white shadow-sm transition-colors duration-150 focus-within:border-blue-500 hover:border-gray-400 ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {status === "loading" && (
            <div
              className={`flex items-center px-6 text-sm text-gray-400 animate-pulse ${
                compact ? "min-h-[56px]" : "min-h-[120px] py-6"
              }`}
            >
              Loading math editor...
            </div>
          )}

          <div
            ref={containerRef}
            className={`mq-host mq-field-root ${compact ? "mq-compact" : ""}`}
            style={{ display: status === "loading" ? "none" : "block" }}
          />

          <div
            className={`absolute right-3 z-10 flex items-start gap-2 ${
              compact ? "top-1.5" : "top-3"
            }`}
          >
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onToggleKeyboard?.();
              }}
              className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Toggle keyboard"
            >
              <Keyboard className="h-5 w-5" />
            </button>
            {!compact && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Options"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <style>{`
          .mq-field-root {
            display: block !important;
            width: 100% !important;
            min-height: 120px !important;
            max-height: 400px !important;
            overflow-x: auto !important;
            overflow-y: auto !important;
            padding-left: 32px !important;
            padding-right: 90px !important;
          }

          .mq-compact {
            min-height: 56px !important;
            padding-left: 16px !important;
            padding-right: 50px !important;
          }

          .mq-compact .mq-root-block {
            padding-top: 14px !important;
            padding-bottom: 14px !important;
          }

          .mq-field-root .mq-editable-field {
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            display: block !important;
            width: 100% !important;
            min-height: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            font-size: 20px !important;
            font-weight: 700 !important;
            color: #111827 !important;
            background: transparent !important;
            cursor: text;
            overflow: visible !important;
            word-wrap: break-word !important;
          }

          .mq-field-root .mq-root-block {
            display: inline-block !important;
            font-weight: 700 !important;
            padding-top: 35px !important;
            padding-bottom: 35px !important;
          }

          .mq-field-root .mq-nthroot {
            margin-left: 4px !important;
          }

          .mq-field-root .mq-editable-field.mq-focused {
            box-shadow: none !important;
            outline: none !important;
          }

          .mq-field-root .mq-math-mode,
          .mq-field-root .mq-math-mode * {
            color: #111827 !important;
            font-weight: 700 !important;
          }

          .mq-field-root .mq-cursor {
            border-left: 2px solid #2563eb !important;
          }

          .mq-field-root .mq-selection,
          .mq-field-root .mq-selection .mq-non-leaf,
          .mq-field-root .mq-selection span {
            background-color: rgba(37, 99, 235, 0.15) !important;
            color: #111827 !important;
          }

          .mq-field-root .mq-fraction .mq-fraction-line,
          .mq-field-root .mq-numerator,
          .mq-field-root .mq-denominator {
            color: #111827 !important;
          }

          .mq-field-root .mq-fraction .mq-fraction-line {
            border-top-color: #111827 !important;
            border-top-width: 1.5px !important;
          }

          .mq-field-root .mq-sup,
          .mq-field-root .mq-sub {
            color: #111827 !important;
            font-size: 1.2em !important;
          }

          .mq-field-root .mq-sup .mq-text {
            font-size: 1.6em !important;
            line-height: 0.8 !important;
            font-family: "Arial", sans-serif !important;
            display: inline-block;
            transform: translateY(2px);
          }

          .mq-field-root .mq-sqrt-stem {
            padding-top: 2px !important;
          }

          .mq-field-root .mq-sqrt-stem .mq-sqrt,
          .mq-field-root .mq-sqrt-stem .mq-nthroot {
            margin-top: 3px !important;
            margin-left: 3px !important;
          }

          .mq-field-root .mq-sqrt-prefix,
          .mq-field-root .mq-nthroot {
            color: #111827 !important;
          }

          .mq-field-root .mq-nthroot .mq-sup {
            font-size: 0.6em !important;
            color: #111827 !important;
          }

          .mq-field-root .mq-nthroot > .mq-sup-only {
            margin-right: 0.1em !important;
          }

          .mq-field-root .mq-empty .mq-root-block:before {
            content: "";
          }

          .mq-field-root .mq-non-leaf,
          .mq-field-root .mq-array.mq-non-leaf {
            background: transparent !important;
          }

          .mq-field-root .mq-paren,
          .mq-field-root .mq-bracket-l,
          .mq-field-root .mq-bracket-r {
            color: #374151 !important;
            padding: 0 1px !important;
            font-weight: 700 !important;
            font-size: 0.75em !important;
            vertical-align: baseline !important;
          }
        `}</style>
      </div>
    );
  }
);

MathQuillInput.displayName = "MathQuillInput";

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

interface MathQuillKeyboardProps {
  mathInputRef: RefObject<MathInputHandle | null>;
  isVisible?: boolean;
  onClose: () => void;
}

export function MathQuillKeyboard({
  mathInputRef,
  isVisible = true,
  onClose,
}: MathQuillKeyboardProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isAlphabetMode, setIsAlphabetMode] = useState(false);

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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-gray-300 bg-gray-50 px-4 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
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

        <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-[1fr_1fr_320px]">
          <div className="grid grid-cols-4 gap-2">
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
                  action={{
                    type: "custom",
                    fn: (mf) => {
                      mf.write("\\left\\{\\right.");
                      mf.keystroke("Left");
                    },
                  }}
                  title="System of Equations"
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
                <Key id="int" action={{ type: "typed", arg: "∫" }}>
                  <span className="text-2xl">∫</span>
                </Key>
                <Key id="deg" action={{ type: "write", arg: "^{\\text{°}}" }}>
                  <span className="text-2xl">°</span>
                </Key>
                <Key
                  id="cases"
                  action={{
                    type: "custom",
                    fn: (mf) => {
                      mf.typedText("{");
                    },
                  }}
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

          <div className="grid grid-cols-2 gap-2">
            <Key id="fn" variant="gray" span={2} title="Insert function (coming soon)">
              <span className="text-sm tracking-wide">functions</span>
            </Key>
            <Key id="space" action={{ type: "write", arg: "\\ " }} variant="gray" span={2}>
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
