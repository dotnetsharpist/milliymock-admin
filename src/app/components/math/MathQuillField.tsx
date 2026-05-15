import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Keyboard, Menu } from "lucide-react";
import type {
  MathfieldElement,
  Selector,
  VirtualKeyboardLayout,
  VirtualKeyboardName,
} from "mathlive";
import { Label } from "../ui/label";
import { CustomMathKeyboard } from "./CustomMathKeyboard";

/**
 * Keyboard switch:
 *  - `false` -> original hand-built `CustomMathKeyboard` (active).
 *  - `true`  -> MathLive's built-in virtual keyboard + custom tabs.
 *
 * The custom keyboard is the active one. Its `{` cases button now works
 * ideally because the underlying field is MathLive (renders `\begin{cases}`).
 */
const USE_MATHLIVE_KEYBOARD = false;

export const CASES_TEMPLATE = "\\begin{cases}#@ & #?\\\\#? & #?\\end{cases}";

// MathLive's built-in layouts have no one-tap piecewise/cases key,
// so we add our own tab. Exported so the test page can reuse it.
export const CASES_LAYOUT: VirtualKeyboardLayout = {
  id: "piecewise-cases",
  label: "{ }",
  tooltip: "Piecewise / cases",
  layers: [
    {
      id: "cases-layer",
      rows: [
        [
          {
            latex: "\\begin{cases}#@ & #?\\end{cases}",
            label: "{ 1 row",
            width: 2,
            tooltip: "Cases — 1 row",
          },
          {
            latex: "\\begin{cases}#@ & #?\\\\#? & #?\\end{cases}",
            label: "{ 2 rows",
            width: 2,
            tooltip: "Cases — 2 rows",
          },
          {
            latex: "\\begin{cases}#@ & #?\\\\#? & #?\\\\#? & #?\\end{cases}",
            label: "{ 3 rows",
            width: 2,
            tooltip: "Cases — 3 rows",
          },
        ],
        [
          { latex: "&", label: "→ column", width: 2, tooltip: "Next column" },
          { class: "action", label: "+ row", command: "addRowAfter", width: 2 },
          { latex: "\\left(#@\\right)", label: "( )" },
          { latex: "\\left[#@\\right]", label: "[ ]" },
        ],
        ["[left]", "[right]", "[backspace]", "[return]", "[hide-keyboard]"],
      ],
    },
  ],
};

// Full symbol tab — replicates every key from the old custom keyboard
// so nothing is lost in the migration to MathLive's keyboard.
export const SYMBOLS_LAYOUT: VirtualKeyboardLayout = {
  id: "all-symbols",
  label: "x² √ π",
  tooltip: "All symbols & structures",
  layers: [
    {
      id: "all-symbols-layer",
      rows: [
        [
          { latex: "#@^{2}", label: "x²", tooltip: "Square" },
          { latex: "#@^{#?}", label: "xⁿ", tooltip: "Power" },
          { latex: "#@_{#?}", label: "xₙ", tooltip: "Subscript" },
          { latex: "\\sqrt{#?}", tooltip: "Square root" },
          { latex: "\\sqrt[#?]{#?}", label: "ⁿ√", tooltip: "Nth root" },
          { latex: "\\frac{#?}{#?}", label: "a/b", tooltip: "Fraction" },
          { latex: "\\left|#@\\right|", label: "|x|" },
          { latex: "\\left(#@\\right)", label: "( )" },
          { latex: "\\left[#@\\right]", label: "[ ]" },
        ],
        [
          { latex: "\\le" },
          { latex: "\\ge" },
          { latex: "\\ne" },
          { latex: "\\approx" },
          { latex: "\\sim" },
          { latex: "\\pm" },
          { latex: "\\times" },
          { latex: "\\div" },
          { latex: "\\cdot" },
        ],
        [
          { latex: "\\pi" },
          { latex: "\\theta" },
          { latex: "\\alpha" },
          { latex: "\\beta" },
          { latex: "\\gamma" },
          { latex: "\\Delta" },
          { latex: "\\infty" },
          { latex: "\\int" },
          { latex: "#@^{\\circ}", label: "°", tooltip: "Degree" },
        ],
        [
          { latex: "\\in" },
          { latex: "\\notin" },
          { latex: "\\cup" },
          { latex: "\\cap" },
          { latex: "\\subseteq" },
          { latex: "\\subset" },
          { latex: "\\emptyset" },
          { latex: "\\perp" },
          { latex: "\\sum" },
        ],
        ["[left]", "[right]", "[backspace]", "[return]", "[hide-keyboard]"],
      ],
    },
  ],
};

const KEYBOARD_LAYOUTS: Array<VirtualKeyboardLayout | VirtualKeyboardName> = [
  "numeric",
  SYMBOLS_LAYOUT,
  CASES_LAYOUT,
  "symbols",
  "alphabetic",
  "greek",
];

// MathQuill cmd() -> MathLive latex template
const CMD_TEMPLATES: Record<string, string> = {
  "^": "^{#?}",
  _: "_{#?}",
  "\\frac": "\\frac{#?}{#?}",
  "\\sqrt": "\\sqrt{#?}",
  "\\nthroot": "\\sqrt[#?]{#?}",
  "/": "\\frac{#?}{#?}",
};

// MathQuill keystroke() -> MathLive command
const KEY_COMMANDS: Record<string, Selector> = {
  Left: "moveToPreviousChar",
  Right: "moveToNextChar",
  Backspace: "deleteBackward",
  Enter: "addRowAfter",
};

// Helper "insert" buttons shown under each field — quick access to the
// most-used structures and symbols without opening the keyboard.
const HELPER_BUTTONS: Array<{ label: string; latex: string }> = [
  { label: "{ cases", latex: CASES_TEMPLATE },
  { label: "a/b", latex: "\\frac{#?}{#?}" },
  { label: "√", latex: "\\sqrt{#?}" },
  { label: "ⁿ√", latex: "\\sqrt[#?]{#?}" },
  { label: "x²", latex: "#@^{2}" },
  { label: "xⁿ", latex: "#@^{#?}" },
  { label: "xₙ", latex: "#@_{#?}" },
  { label: "°", latex: "#@^{\\circ}" },
  { label: "( )", latex: "\\left(#@\\right)" },
  { label: "|x|", latex: "\\left|#@\\right|" },
  { label: "π", latex: "\\pi" },
  { label: "≤", latex: "\\le" },
  { label: "≥", latex: "\\ge" },
  { label: "≠", latex: "\\ne" },
  { label: "·", latex: "\\cdot" },
  { label: "∞", latex: "\\infty" },
];

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
    const hostRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<MathfieldElement | null>(null);
    const onInputRef = useRef(onInput);
    const [status, setStatus] = useState<"loading" | "ready" | "error">(
      "loading"
    );

    // keep latest onInput without re-running the mount effect
    useEffect(() => {
      onInputRef.current = onInput;
    }, [onInput]);

    // create the MathLive <math-field> imperatively
    useEffect(() => {
      let cancelled = false;

      void import("mathlive")
        .then(({ MathfieldElement }) => {
          if (cancelled || !hostRef.current) return;

          const field = new MathfieldElement();
          field.className = `math-live-field ${compact ? "compact" : ""}`;
          field.setAttribute("aria-label", "Math formula input");
          field.mathVirtualKeyboardPolicy = "manual";
          field.defaultMode = "math";
          // Always pure math mode — matches the old MathQuill keyboard.
          // smartMode could drift into text mode and render `^{2}` literally.
          field.smartMode = false;
          field.smartFence = true;
          // Physical space bar inserts a space in math mode, matching the
          // on-screen SPACE key (`\;`). Without this, space does nothing.
          field.mathModeSpace = "\\;";

          if (initialValue) {
            field.value = initialValue.replace(/\\circ/g, "\\text{°}");
          }

          field.addEventListener("input", () => {
            onInputRef.current?.(field.value);
          });

          // `{` opens a piecewise / cases block
          field.addEventListener(
            "keydown",
            (event: KeyboardEvent) => {
              if (event.key === "{") {
                event.preventDefault();
                event.stopPropagation();
                field.insert(CASES_TEMPLATE, {
                  format: "latex",
                  mode: "math",
                  focus: true,
                  selectionMode: "placeholder",
                });
              }
            },
            true
          );

          hostRef.current.innerHTML = "";
          hostRef.current.appendChild(field);
          fieldRef.current = field;
          setStatus("ready");
        })
        .catch((error) => {
          console.error("[MathQuillField] MathLive load failed:", error);
          if (!cancelled) setStatus("error");
        });

      return () => {
        cancelled = true;
        fieldRef.current?.remove();
        fieldRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const field = fieldRef.current;
      if (field) field.readOnly = Boolean(disabled);
    }, [status, disabled]);

    useEffect(() => {
      const field = fieldRef.current;
      if (field) {
        field.className = `math-live-field ${compact ? "compact" : ""}`;
      }
    }, [status, compact]);

    useImperativeHandle(ref, () => ({
      cmd: (latexCmd) => {
        const field = fieldRef.current;
        if (!field) return;
        field.focus();
        field.insert(CMD_TEMPLATES[latexCmd] ?? latexCmd, {
          format: "latex",
          mode: "math",
          focus: true,
          selectionMode: "placeholder",
        });
      },
      write: (latex) => {
        const field = fieldRef.current;
        if (!field) return;
        field.focus();
        field.insert(latex, {
          format: "latex",
          mode: "math",
          focus: true,
          selectionMode: "placeholder",
        });
      },
      typedText: (text) => {
        const field = fieldRef.current;
        if (!field) return;
        field.focus();
        field.insert(text, { format: "latex", mode: "math", focus: true });
      },
      keystroke: (key) => {
        const field = fieldRef.current;
        if (!field) return;
        field.focus();
        const command = KEY_COMMANDS[key];
        if (command) field.executeCommand(command);
      },
      focus: () => fieldRef.current?.focus(),
      getLatex: () => fieldRef.current?.value ?? "",
    }));

    const insertHelper = (latex: string) => {
      const field = fieldRef.current;
      if (!field || disabled) return;
      field.focus();
      field.insert(latex, {
        format: "latex",
        mode: "math",
        focus: true,
        selectionMode: "placeholder",
      });
    };

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

          {status === "error" && (
            <div
              className={`flex items-center px-6 text-sm text-red-500 ${
                compact ? "min-h-[56px]" : "min-h-[120px] py-6"
              }`}
            >
              Math editor failed to load.
            </div>
          )}

          <div
            ref={hostRef}
            style={{ display: status === "ready" ? "block" : "none" }}
          />

          <div
            className={`absolute right-4 z-10 flex items-start gap-3 ${
              compact ? "top-2" : "top-4"
            }`}
          >
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onToggleKeyboard?.();
              }}
              className="rounded-md p-3 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Toggle keyboard"
            >
              <Keyboard className="h-5 w-5" />
            </button>
            {!compact && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                className="rounded-md p-3 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Options"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Helper insert buttons */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HELPER_BUTTONS.map((button) => (
            <button
              key={button.label}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                insertHelper(button.latex);
              }}
              disabled={disabled}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            >
              {button.label}
            </button>
          ))}
        </div>

        <style>{`
          .math-live-field {
            display: block;
            width: 100%;
            min-height: 120px;
            max-height: 400px;
            overflow-x: auto;
            overflow-y: auto;
            padding: 28px 112px 28px 32px;
            font-size: 22px;
            font-weight: 700;
            color: #111827;
            background: transparent;
            border: none;
            outline: none;
            box-shadow: none;
            --caret-color: #2563eb;
            --primary-color: #2563eb;
            --selection-background-color: rgba(37, 99, 235, 0.15);
            --contains-highlight-background-color: transparent;
          }

          .math-live-field.compact {
            min-height: 56px;
            padding: 12px 72px 12px 20px;
            font-size: 20px;
          }

          .math-live-field:focus,
          .math-live-field:focus-within {
            outline: none;
            box-shadow: none;
          }

          .math-live-field::part(menu-toggle),
          .math-live-field::part(virtual-keyboard-toggle) {
            display: none;
          }
        `}</style>
      </div>
    );
  }
);

MathQuillInput.displayName = "MathQuillInput";

interface MathQuillKeyboardProps {
  mathInputRef: RefObject<MathInputHandle | null>;
  isVisible?: boolean;
  onClose: () => void;
}

/**
 * Thin controller for MathLive's built-in virtual keyboard.
 * Renders nothing itself — MathLive paints its own keyboard panel.
 */
function MathLiveKeyboard({
  mathInputRef,
  isVisible = true,
  onClose,
}: MathQuillKeyboardProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !window.mathVirtualKeyboard) return;
    const keyboard = window.mathVirtualKeyboard;
    const previousLayouts = keyboard.layouts;
    const previousEditToolbar = keyboard.editToolbar;

    keyboard.layouts = KEYBOARD_LAYOUTS;
    keyboard.editToolbar = "default";

    return () => {
      keyboard.layouts = previousLayouts;
      keyboard.editToolbar = previousEditToolbar;
      keyboard.hide();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.mathVirtualKeyboard) return;
    const keyboard = window.mathVirtualKeyboard;

    if (isVisible) {
      mathInputRef.current?.focus();
      keyboard.show();
    } else {
      keyboard.hide();
    }
  }, [isVisible, mathInputRef]);

  // Keep `onClose` in sync when the user dismisses MathLive's own keyboard.
  useEffect(() => {
    if (typeof window === "undefined" || !window.mathVirtualKeyboard) return;
    const keyboard = window.mathVirtualKeyboard;

    const handleGeometryChange = () => {
      if (!keyboard.visible && isVisible) onClose();
    };
    keyboard.addEventListener("geometrychange", handleGeometryChange);
    return () => {
      keyboard.removeEventListener("geometrychange", handleGeometryChange);
    };
  }, [isVisible, onClose]);

  return null;
}

export function MathQuillKeyboard(props: MathQuillKeyboardProps) {
  if (USE_MATHLIVE_KEYBOARD) {
    return <MathLiveKeyboard {...props} />;
  }
  return <CustomMathKeyboard {...props} />;
}
