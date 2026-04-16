import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { FileUpload } from "../ui/file-upload";
import { Question, QuestionTypeForQuestion } from "../../models/questions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import {
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Keyboard,
  Menu,
  ArrowLeft,
  ArrowRight,
  Delete,
  CornerDownLeft,
  X,
} from "lucide-react";
import { questionService } from "../../services/questionService";
import { optionService } from "../../services/optionService";
import { testService } from "../../services/testService";
import { toast } from "sonner";
import { BASE_URL } from "../../config/api";

// ─── MathQuill CDN Loader (Singleton) ────────────────────────────────────────

type MQInterface = any;
let _mqState: "idle" | "loading" | "ready" | "error" = "idle";
let _mqInstance: MQInterface | null = null;
const _mqWaiters: Array<(mq: MQInterface) => void> = [];

function loadMathQuill(): Promise<MQInterface> {
  return new Promise((resolve) => {
    if (_mqState === "ready") {
      resolve(_mqInstance);
      return;
    }
    _mqWaiters.push(resolve);
    if (_mqState === "loading") return;

    _mqState = "loading";

    const appendScript = (src: string): Promise<void> =>
      new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          res();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onload = () => res();
        s.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    const appendCSS = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      document.head.appendChild(l);
    };

    (async () => {
      try {
        if (!(window as any).jQuery) {
          await appendScript(
            "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"
          );
        }

        appendCSS(
          "https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.css"
        );

        await appendScript(
          "https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.js"
        );

        const MQ: MQInterface = (window as any).MathQuill.getInterface(2);
        _mqInstance = MQ;
        _mqState = "ready";
        _mqWaiters.forEach((cb) => cb(MQ));
        _mqWaiters.length = 0;
      } catch (e) {
        console.error("[MathInput] MathQuill CDN load failed:", e);
        _mqState = "error";
      }
    })();
  });
}

loadMathQuill();

// ─── MathInput Component & Types ──────────────────────────────────────────────

export interface MathInputHandle {
  cmd: (latexCmd: string) => void;
  write: (latex: string) => void;
  typedText: (text: string) => void;
  keystroke: (key: string) => void;
  focus: () => void;
  getLatex: () => string;
}

interface MathInputProps {
  label?: string; // Made optional to support options
  onInput?: (latex: string) => void;
  initialValue?: string;
  onFocus?: () => void;
  onToggleKeyboard?: () => void;
  disabled?: boolean;
  compact?: boolean; // New prop to make the input smaller for option lists
}

const MathInput = forwardRef<MathInputHandle, MathInputProps>(
  (
    { label, onInput, initialValue = "", onFocus, onToggleKeyboard, disabled, compact },
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

        const mf = MQ.MathField(containerRef.current, {
          spaceBehavesLikeTab: false,
          leftRightIntoCmdGoes: "up",
          restrictMismatchedBrackets: false,
          supSubsRequireOperand: false,
          charsThatBreakOutOfSupSub: "+-=<>",
          autoCommands: "theta sqrt nthroot",
          // The fix: We must provide a string of ONLY letters to pass validation. 
          // "dummyop" overwrites the default list and will never be typed naturally.
          autoOperatorNames: "dummyop", 
          handlers: {
            edit: () => {
              onInput?.(mf.latex());
            },
          },
        } as any);

        if (initialValue) {
          const fixedInitialValue = initialValue.replace(/\\circ/g, '\\text{°}');
          mf.latex(fixedInitialValue);
        }

        mqFieldRef.current = mf;
        setStatus("ready");
      });

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const mf = mqFieldRef.current;
        if (!mf) return;

        const isMathFieldFocused = containerRef.current?.contains(
          document.activeElement
        );
        if (!isMathFieldFocused) return;

        const isInsideSystemBlock = () => {
          const latex = mqFieldRef.current?.latex() || "";
          return latex.includes("\\left\\{");
        };

        const isInsideSystem = isInsideSystemBlock();

        if (e.key === "/") {
          if (isInsideSystem) {
            e.preventDefault();
            e.stopPropagation();
            mf.write("/");
            return;
          }
        }

        if ((e.key === "Enter" || e.keyCode === 13) && e.shiftKey) {
          if (isInsideSystemBlock()) {
            e.preventDefault();
            e.stopPropagation();
            mf.cmd("/"); 
            return;
          }
        }

        if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          mf.write("\\ ");
          return;
        }

        if (e.key === "{") {
          e.preventDefault();
          mf.write("\\left\\{\\right\\}");
          mf.keystroke("Left");
          return;
        }
      };

      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, []);

    useImperativeHandle(ref, () => ({
      cmd: (latexCmd) => {
        const mf = mqFieldRef.current;
        if (!mf) return;
        mf.focus();
        mf.cmd(latexCmd);
      },
      write: (latex) => {
        const mf = mqFieldRef.current;
        if (!mf) return;
        mf.focus();
        mf.write(latex);
      },
      typedText: (text) => {
        const mf = mqFieldRef.current;
        if (!mf) return;
        mf.focus();
        mf.typedText(text);
      },
      keystroke: (key) => {
        const mf = mqFieldRef.current;
        if (!mf) return;
        mf.keystroke(key);
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
            <div className={`flex items-center px-6 text-sm text-gray-400 animate-pulse ${compact ? "min-h-[56px]" : "min-h-[120px] py-6"}`}>
              Loading math editor…
            </div>
          )}

          <div
            ref={containerRef}
            className={`mq-host mq-field-root ${compact ? "mq-compact" : ""}`}
            style={{ display: status === "loading" ? "none" : "block" }}
          />

          <div className={`absolute right-3 z-10 flex items-start gap-2 ${compact ? 'top-1.5' : 'top-3'}`}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
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
                onMouseDown={(e) => e.preventDefault()}
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
            font-family: 'Arial', sans-serif !important; 
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
            content: '';
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
MathInput.displayName = "MathInput";

// ─── MathKeyboard Component ──────────────────────────────────────────────────

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

interface MathKeyboardProps {
  mathInputRef: React.RefObject<MathInputHandle | null>;
  isVisible?: boolean;
  onClose: () => void;
}

function MathKeyboard({ mathInputRef, isVisible = true, onClose }: MathKeyboardProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isAlphabetMode, setIsAlphabetMode] = useState(false);

  const fire = (keyId: string, action: Action) => {
    setActiveKey(keyId);
    const mf = mathInputRef.current;
    if (mf) dispatch(mf, action);
    setTimeout(() => setActiveKey(null), 120);
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
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    const base = [
      "rounded-lg select-none cursor-pointer flex items-center justify-center",
      "transition-all duration-75 shadow-sm active:scale-95",
      tall ? "h-16" : "h-14",
      span === 2 ? "col-span-2" : "",
    ].join(" ");

    const theme = {
      white:
        "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 active:bg-gray-100",
      gray: "bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 active:bg-gray-400",
      blue: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md",
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
        onMouseDown={(e) => {
          e.preventDefault();
          if (onClick) {
            onClick();
          } else if (action) {
            fire(id, action);
          }
        }}
        className={`${base} ${theme} ${activeClass}`}
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
                <Key id="x" action={{ type: "typed", arg: "x" }} title="Variable x"><em>x</em></Key>
                <Key id="y" action={{ type: "typed", arg: "y" }} title="Variable y"><em>y</em></Key>
                <Key id="sq" action={{ type: "write", arg: "^{2}" }} title="Square"><span><em>a</em><sup>2</sup></span></Key>
                <Key id="pow" action={{ type: "cmd", arg: "^" }} title="Power"><span><em>a</em><sup><em>b</em></sup></span></Key>
                <Key id="lp" action={{ type: "typed", arg: "(" }} title="(">(</Key>
                <Key id="rp" action={{ type: "typed", arg: ")" }} title=")">)</Key>
                
                <Key 
                  id="system" 
                  action={{ 
                    type: "custom", 
                    fn: (mf) => { 
                      mf.write("\\left\\{\\right."); 
                      mf.keystroke("Left"); 
                    } 
                  }} 
                  title="System of Equations"
                >
                  <span className="text-xl">{`{`}</span>
                </Key>

                <Key id="lt" action={{ type: "typed", arg: "<" }} title="Less than">&lt;</Key>
                <Key id="gt" action={{ type: "typed", arg: ">" }} title="Greater than">&gt;</Key>
                <Key id="abs" action={{ type: "typed", arg: "|" }} title="Absolute value"><span>|<em>a</em>|</span></Key>
                <Key id="sub_script" action={{ type: "cmd", arg: "_" }} title="Subscript"><span><em>a</em><sub><em>b</em></sub></span></Key>
                <Key id="le" action={{ type: "write", arg: "\\le" }} title="≤">≤</Key>
                <Key id="ge" action={{ type: "write", arg: "\\ge" }} title="≥">≥</Key>
                <Key id="pi" action={{ type: "write", arg: "\\pi" }} title="Pi">π</Key>
                <Key id="nthroot" action={{ type: "cmd", arg: "\\nthroot" }} title="Nth root">
                  <span className="relative inline-block text-lg">
                    <span className="absolute -left-2 -top-1 text-[10px]">n</span>
                    <span>√</span>
                  </span>
                </Key>
                <Key id="sqrt" action={{ type: "cmd", arg: "\\sqrt" }} title="Square root">√</Key>
                <Key id="ABC" variant="gray" onClick={() => setIsAlphabetMode(true)}>
                  <span className="text-sm tracking-widest">A B C</span>
                </Key>
              </>
            ) : (
              <>
                <Key id="neq" action={{ type: "write", arg: "\\ne" }}>≠</Key>
                <Key id="int" action={{ type: "typed", arg: "∫" }}><span className="text-2xl">∫</span></Key>
                <Key id="deg" action={{ type: "write", arg: "^{\\text{°}}" }}><span className="text-2xl">°</span></Key>
                <Key 
                  id="cases" 
                  action={{ 
                    type: "custom", 
                    fn: (mf) => { 
                      mf.typedText("{");
                    } 
                  }}
                >
                  <span className="text-xl">{`{`}</span>
                </Key>
                <Key id="emptyset" action={{ type: "write", arg: "\\emptyset" }}>∅</Key>
                <Key id="perp" action={{ type: "write", arg: "\\perp" }}><span className="text-lg font-bold">⊥</span></Key>
                <Key id="in" action={{ type: "write", arg: "\\in" }}>∈</Key>
                <Key id="infty" action={{ type: "write", arg: "\\infty" }}>∞</Key>
                <Key id="cup" action={{ type: "write", arg: "\\cup" }}>∪</Key>
                <Key id="cap" action={{ type: "write", arg: "\\cap" }}>∩</Key>
                <Key id="subseteq" action={{ type: "write", arg: "\\subseteq" }}>⊆</Key>
                <Key id="nsubseteq" action={{ type: "write", arg: "\\not\\subseteq" }}>⊈</Key>
                <Key id="subset" action={{ type: "write", arg: "\\subset" }}>⊂</Key>
                <Key id="cdot" action={{ type: "write", arg: "\\cdot" }}><span className="text-2xl font-bold">·</span></Key>
                <Key id="alpha" action={{ type: "write", arg: "\\alpha" }}><span className="text-lg">α</span></Key>
                <Key id="approx" action={{ type: "write", arg: "\\approx" }}>≈</Key>
                <Key id="tilde" action={{ type: "write", arg: "\\sim" }}>~</Key>
                <Key id="beta" action={{ type: "write", arg: "\\beta" }}><span className="text-lg">β</span></Key>
                <Key id="gamma" action={{ type: "write", arg: "\\gamma" }}><span className="text-lg">γ</span></Key>
                <Key id="123" variant="gray" span={2} onClick={() => setIsAlphabetMode(false)}><span className="text-sm tracking-widest">123</span></Key>
              </>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Key id="7" action={{ type: "typed", arg: "7" }} variant="gray">7</Key>
            <Key id="8" action={{ type: "typed", arg: "8" }} variant="gray">8</Key>
            <Key id="9" action={{ type: "typed", arg: "9" }} variant="gray">9</Key>
            <Key id="frac" action={{ type: "cmd", arg: "\\frac" }} variant="white">
              <span className="flex flex-col items-center gap-[2px] leading-none">
                <span className="text-[11px]">a</span>
                <span className="w-4 border-t border-gray-700" />
                <span className="text-[11px]">b</span>
              </span>
            </Key>
            <Key id="4" action={{ type: "typed", arg: "4" }} variant="gray">4</Key>
            <Key id="5" action={{ type: "typed", arg: "5" }} variant="gray">5</Key>
            <Key id="6" action={{ type: "typed", arg: "6" }} variant="gray">6</Key>
            <Key id="mul" action={{ type: "write", arg: "\\cdot" }} variant="white">×</Key>
            <Key id="1" action={{ type: "typed", arg: "1" }} variant="gray">1</Key>
            <Key id="2" action={{ type: "typed", arg: "2" }} variant="gray">2</Key>
            <Key id="3" action={{ type: "typed", arg: "3" }} variant="gray">3</Key>
            <Key id="sub" action={{ type: "typed", arg: "-" }} variant="white">−</Key>
            <Key id="0" action={{ type: "typed", arg: "0" }} variant="gray">0</Key>
            <Key id="dot" action={{ type: "typed", arg: "." }} variant="gray">.</Key>
            <Key id="eq" action={{ type: "typed", arg: "=" }} variant="gray">=</Key>
            <Key id="add" action={{ type: "typed", arg: "+" }} variant="white">+</Key>
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

// ─── Main StandaloneQuestionForm Component ───────────────────────────────────

export interface StandaloneQuestionFormQuestion {
  id: string;
  testId: string;
  textUz: string | null;
  textRu: string | null;
  imagePathUz?: string | null;
  imagePathRu?: string | null;
  type: QuestionTypeForQuestion;
  order: number;
  score?: number | null;
  correctAnswer?: string | null;
}

interface StandaloneQuestionFormState {
  id: string;
  testId: string;
  textUz: string | null;
  textRu: string | null;
  imagePathUz?: string | null;
  imagePathRu?: string | null;
  type: QuestionTypeForQuestion;
  order: number;
  score?: number | null;
  correctAnswer?: string | null;
}

interface NormalizedTestOption {
  id: string;
  title: string;
}

type QuestionEditorVariant = "basic" | "inline";

interface StandaloneQuestionFormProps {
  question?: StandaloneQuestionFormQuestion;
  defaultTestId?: string | null;
  onCancel: () => void;
  onSuccess: (question: Question) => void;
  questionEditorVariant?: QuestionEditorVariant;
}

export function StandaloneQuestionForm({
  question,
  defaultTestId,
  onCancel,
  onSuccess,
}: StandaloneQuestionFormProps) {
  const [formData, setFormData] = useState<StandaloneQuestionFormState>({
    id: "",
    testId: "",
    textUz: "",
    textRu: "",
    imagePathUz: "",
    imagePathRu: "",
    score: 1,
    type: "MultipleChoice",
    order: 1,
  });

  const [tests, setTests] = useState<NormalizedTestOption[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [options, setOptions] = useState<
    Array<{ id: string; text: string; isCorrect: boolean }>
  >([]);
  
  const [imageFileUz, setImageFileUz] = useState<File | null>(null);
  const [imageFileRu, setImageFileRu] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [imagePreviewRu, setImagePreviewRu] = useState<string | undefined>();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Focus & Keyboard State
  const mathInputUzRef = useRef<MathInputHandle>(null);
  const mathInputRuRef = useRef<MathInputHandle>(null);
  
  // Track dynamically generated refs for the options loop
  const optionsRefs = useRef<Record<string, MathInputHandle | null>>({});
  
  const [activeInputFocus, setActiveInputFocus] = useState<string>("uz");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Dynamically resolve the reference for the active math input so the keyboard points to the right one
  const getActiveMathRef = (): React.RefObject<MathInputHandle | null> => {
    if (activeInputFocus === "uz") return mathInputUzRef;
    if (activeInputFocus === "ru") return mathInputRuRef;
    if (activeInputFocus.startsWith("option-")) {
      const optionId = activeInputFocus.replace("option-", "");
      return { current: optionsRefs.current[optionId] || null };
    }
    return mathInputUzRef;
  };
  
  const activeMathRef = getActiveMathRef();

  const getImageUrl = (imagePath: string | undefined | null) => {
    if (!imagePath) return undefined;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    void fetchTests();
  }, []);

  useEffect(() => {
    if (question) {
      setFormData({
        id: question.id,
        testId: String(question.testId),
        textUz: question.textUz ?? "",
        textRu: question.textRu ?? "",
        imagePathUz: question.imagePathUz ?? "",
        imagePathRu: question.imagePathRu ?? "",
        type: question.type,
        order: question.order,
        correctAnswer: question.correctAnswer ?? "",
        score: question.score ?? 0,
      });

      setImagePreview(getImageUrl(question.imagePathUz));
      setImagePreviewRu(getImageUrl(question.imagePathRu));
      setImageFileUz(null);
      setImageFileRu(null);

      if (question.type === "MultipleChoice") {
        void loadOptions(question.id);
      } else {
        setOptions([]);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      textUz: "",
      textRu: "",
      imagePathUz: "",
      imagePathRu: "",
      type: "MultipleChoice",
      order: 1,
      correctAnswer: "",
      score: 0,
    }));
    setOptions([]);
    setImagePreview(undefined);
    setImagePreviewRu(undefined);
    setImageFileUz(null);
    setImageFileRu(null);
  }, [question]);

  const fetchTests = async () => {
    try {
      setIsLoadingTests(true);
      const response = await testService.getTests();

      if (response.success && response.data) {
        const normalizedTests = response.data.map((test) => ({
          id: String(test.id),
          title: test.title,
        }));

        setTests(normalizedTests);

        if (!question && normalizedTests.length > 0) {
          const preferredTestId =
            defaultTestId &&
            normalizedTests.some((test) => test.id === defaultTestId)
              ? defaultTestId
              : normalizedTests[0].id;

          setFormData((prev) => ({
            ...prev,
            testId: prev.testId || preferredTestId,
          }));
        }
      } else {
        toast.error("Failed to load tests");
        setTests([]);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Error loading tests");
      setTests([]);
    } finally {
      setIsLoadingTests(false);
    }
  };

  const loadOptions = async (questionId: string) => {
    try {
      setIsLoadingOptions(true);
      const response = await optionService.getOptionsByQuestionId(questionId);

      if (response.success && response.data) {
        const existingOptions = response.data.map((option) => ({
          id: typeof option.id === "string" ? option.id : String(option.id),
          text: option.text,
          isCorrect: option.isCorrect,
        }));

        setOptions(existingOptions.length > 0 ? existingOptions : []);
      }
    } catch (error) {
      console.error("Error loading options:", error);
      setOptions([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleImageChangeUz = (file: File | null) => setImageFileUz(file);
  const handleImageChangeRu = (file: File | null) => setImageFileRu(file);

  const handleImageRemoveUz = () => {
    setImageFileUz(null);
    setImagePreview(undefined);
  };
  const handleImageRemoveRu = () => {
    setImageFileRu(null);
    setImagePreviewRu(undefined);
  };

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, text: "", isCorrect: false },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleOptionChange = (index: number, text: string) => {
    setOptions((prev) =>
      prev.map((option, itemIndex) =>
        itemIndex === index ? { ...option, text } : option
      )
    );
  };

  const handleToggleCorrect = (index: number) => {
    setOptions((prev) =>
      prev.map((option, itemIndex) => ({
        ...option,
        isCorrect: itemIndex === index,
      }))
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.testId) {
      toast.error("Please select a test");
      return;
    }

    if (formData.order === "" || formData.score === "") {
      toast.error("Please fill in order and score");
      return;
    }

    if (formData.type === "MultipleChoice") {
      if (options.length === 0) {
        toast.error("Multiple choice questions must have at least one option");
        return;
      }

      if (!options.some((option) => option.isCorrect)) {
        toast.error("Please select one correct answer");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (question) {
        const response = await questionService.updateQuestion(question.id, {
          testId: parseInt(question.testId),
          textUz: formData.textUz,
          textRu: formData.textRu,
          type: formData.type,
          order: formData.order,
          score: formData.score,
          correctAnswer: formData.correctAnswer,
          imageUz: imageFileUz || undefined,
          imageRu: imageFileRu || undefined,
        });

        if (response.success && response.data) {
          toast.success("Question updated successfully");
          onSuccess(response.data);
        } else {
          toast.error("Failed to update question");
        }
      } else {
        const response = await questionService.createQuestion({
          testId: parseInt(formData.testId),
          textUz: formData.textUz,
          textRu: formData.textRu,
          imageUz: imageFileUz,
          imageRu: imageFileRu,
          type: formData.type,
          score: formData.score,
          order: formData.order,
          correctAnswer: formData.correctAnswer,
          options: options,
        });

        if (response.success && response.data) {
          toast.success("Question created successfully");
          onSuccess(response.data);
        } else {
          toast.error("Failed to create question");
        }
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Error saving question");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${isKeyboardVisible ? "pb-[300px]" : ""}`}
    >
      {!question && (
        <div className="space-y-2">
          <Label htmlFor="test">Test</Label>
          <Select
            value={formData.testId}
            onValueChange={(nextValue) =>
              setFormData((prev) => ({ ...prev, testId: nextValue }))
            }
            disabled={isLoadingTests || isSubmitting}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isLoadingTests ? "Loading tests..." : "Select a test"}
              />
            </SelectTrigger>
            <SelectContent>
              {tests.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            min="1"
            value={formData.order}
            onChange={(event) => {
              const nextValue = event.target.value;
              setFormData((prev) => ({
                ...prev,
                order: nextValue === "" ? "" : parseInt(nextValue),
              }));
            }}
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            required
            disabled={isSubmitting}
          />
        </div>

          <div className="space-y-2">
              <Label htmlFor="score">Score</Label>

              <Select
                  value={formData.score?.toString() ?? ""}
                  onValueChange={(nextValue) =>
                      setFormData((prev) => ({
                          ...prev,
                          score: parseFloat(nextValue),
                      }))
                  }
                  disabled={isSubmitting}
              >
                  <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                  </SelectTrigger>

                  <SelectContent>
                      <SelectItem value="1.3">1.3</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="1.7">1.7</SelectItem>
                      <SelectItem value="2.2">2.2</SelectItem>
                  </SelectContent>
              </Select>
          </div>


        <div className="space-y-2">
          <Label htmlFor="type">Question Type</Label>
          <Select
            value={formData.type}
            onValueChange={(nextValue) =>
              setFormData((prev) => ({
                ...prev,
                type: nextValue as QuestionTypeForQuestion,
              }))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MultipleChoice">Multiple Choice</SelectItem>
              <SelectItem value="FreeAnswer">Free Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Image UZ (optional)</Label>
          <FileUpload
            value={imagePreview}
            onChange={handleImageChangeUz}
            onRemove={handleImageRemoveUz}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label>Image RU (optional)</Label>
          <FileUpload
            value={imagePreviewRu}
            onChange={handleImageChangeRu}
            onRemove={handleImageRemoveRu}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <MathInput
        ref={mathInputUzRef}
        label="Question Content UZ"
        initialValue={question?.textUz ?? ""}
        onInput={(latex) =>
          setFormData((prev) => ({ ...prev, textUz: latex }))
        }
        onFocus={() => setActiveInputFocus("uz")}
        onToggleKeyboard={() => {
          setActiveInputFocus("uz");
          setIsKeyboardVisible((p) => !p);
        }}
        disabled={isSubmitting}
      />

      <MathInput
        ref={mathInputRuRef}
        label="Question Content RU"
        initialValue={question?.textRu ?? ""}
        onInput={(latex) =>
          setFormData((prev) => ({ ...prev, textRu: latex }))
        }
        onFocus={() => setActiveInputFocus("ru")}
        onToggleKeyboard={() => {
          setActiveInputFocus("ru");
          setIsKeyboardVisible((p) => !p);
        }}
        disabled={isSubmitting}
      />

      {formData.type === "MultipleChoice" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Answer Options</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              disabled={isSubmitting}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Option
            </Button>
          </div>

          {isLoadingOptions ? (
            <div className="flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p className="text-sm text-neutral-600">Loading options...</p>
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
              <p className="text-sm text-neutral-600">
                No options yet. Click "Add Option" to create answer choices.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-start gap-2">
                  <Button
                    type="button"
                    variant={option.isCorrect ? "default" : "outline"}
                    size="icon"
                    className="shrink-0 mt-1"
                    onClick={() => handleToggleCorrect(index)}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1">
                    <MathInput
                      ref={(el) => {
                        if (el) optionsRefs.current[option.id] = el;
                      }}
                      compact
                      initialValue={option.text}
                      onInput={(latex) => handleOptionChange(index, latex)}
                      onFocus={() => setActiveInputFocus(`option-${option.id}`)}
                      onToggleKeyboard={() => {
                        setActiveInputFocus(`option-${option.id}`);
                        setIsKeyboardVisible((p) => !p);
                      }}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 mt-1"
                    onClick={() => handleRemoveOption(index)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-neutral-600">
            Click the check icon to mark the correct answer
          </p>
        </div>
      )}

      {formData.type === "FreeAnswer" && (
        <div className="space-y-2">
          <Label htmlFor="questionAnswer">Question answer</Label>
          <Textarea
            id="questionAnswer"
            value={formData.correctAnswer || ""}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                correctAnswer: event.target.value,
              }))
            }
            placeholder="Enter answer..."
            rows={3}
            required
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {question ? "Updating..." : "Creating..."}
            </>
          ) : question ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </div>

      <MathKeyboard
        mathInputRef={activeMathRef}
        isVisible={isKeyboardVisible && !isSubmitting}
        onClose={() => setIsKeyboardVisible(false)}
      />
    </form>
  );
}