/**
 * DesmosField — a math input backed by a real embedded Desmos calculator, so it
 * uses the genuine 1:1 Desmos keypad (identical to the /desmos-calculator page).
 *
 * It is a DROP-IN replacement for `MathQuillInput`: same props and the same
 * imperative `MathInputHandle`, so existing forms keep working by only changing
 * their import. The value is captured as LaTeX from the Desmos expression and
 * reported through `onInput`, matching the previous MathLive behaviour.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Label } from "../app/components/ui/label";
import type { MathInputHandle } from "../app/components/math/MathQuillField";
import {
  loadDesmos,
  CONTAINER_CLASS,
  type DesmosCalculatorInstance,
} from "./desmosLoader";

const EXPR_ID = "dcg-field-input";

// Options that turn the graphing calculator into a single math-input surface:
// no graph paper, no settings/zoom, just the expression row + the keypad.
const FIELD_OPTIONS: Record<string, unknown> = {
  keypad: true,
  graphpaper: false,
  expressions: true,
  expressionsTopbar: false,
  settingsMenu: false,
  zoomButtons: false,
  border: false,
  autosize: true,
};

interface DesmosFieldProps {
  label?: string;
  onInput?: (latex: string) => void;
  initialValue?: string;
  onFocus?: () => void;
  onToggleKeyboard?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const DesmosField = forwardRef<MathInputHandle, DesmosFieldProps>(
  (
    { label, onInput, initialValue = "", onFocus, disabled, compact },
    ref
  ) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const calcRef = useRef<DesmosCalculatorInstance | null>(null);
    const onInputRef = useRef(onInput);
    const [status, setStatus] = useState<"loading" | "ready" | "error">(
      "loading"
    );

    useEffect(() => {
      onInputRef.current = onInput;
    }, [onInput]);

    useEffect(() => {
      let cancelled = false;

      loadDesmos()
        .then((Desmos) => {
          if (cancelled || !hostRef.current) return;

          const calc = Desmos.GraphingCalculator(hostRef.current, FIELD_OPTIONS);
          calc.setExpression({ id: EXPR_ID, latex: initialValue });

          const readLatex = () => {
            const list = calc.getExpressions();
            const own = list.find((e) => e.id === EXPR_ID) ?? list[0];
            return own?.latex ?? "";
          };

          calc.observeEvent("change", () => {
            onInputRef.current?.(readLatex());
          });

          calcRef.current = calc;
          setStatus("ready");
          // sync the seeded value so the form sees it without a manual edit
          if (initialValue) onInputRef.current?.(initialValue);
        })
        .catch((error) => {
          console.error("[DesmosField] failed to load Desmos:", error);
          if (!cancelled) setStatus("error");
        });

      return () => {
        cancelled = true;
        try {
          calcRef.current?.unobserveEvent("change");
          calcRef.current?.destroy();
        } catch {
          /* ignore teardown errors */
        }
        calcRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currentLatex = () => {
      const calc = calcRef.current;
      if (!calc) return "";
      const list = calc.getExpressions();
      const own = list.find((e) => e.id === EXPR_ID) ?? list[0];
      return own?.latex ?? "";
    };

    // The Desmos instance carries its own keypad, so the old external-keyboard
    // methods mostly just keep focus. We still expose the full handle so the
    // shared form code that references it keeps type-checking.
    useImperativeHandle(ref, () => ({
      focus: () => calcRef.current?.focusFirstExpression?.(),
      getLatex: () => currentLatex(),
      cmd: () => calcRef.current?.focusFirstExpression?.(),
      write: (latex: string) => {
        const calc = calcRef.current;
        if (!calc) return;
        calc.setExpression({ id: EXPR_ID, latex: currentLatex() + latex });
        onInputRef.current?.(currentLatex());
      },
      typedText: (text: string) => {
        const calc = calcRef.current;
        if (!calc) return;
        calc.setExpression({ id: EXPR_ID, latex: currentLatex() + text });
        onInputRef.current?.(currentLatex());
      },
      keystroke: () => calcRef.current?.focusFirstExpression?.(),
    }));

    return (
      <div className="relative" onFocusCapture={onFocus}>
        {label && <Label className="mb-2 block">{label}</Label>}

        <div
          className={`relative overflow-hidden rounded-xl border-2 border-gray-300 bg-white shadow-sm transition-colors duration-150 focus-within:border-blue-500 hover:border-gray-400 ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {/* host stays mounted & visible so Desmos always gets a laid-out node */}
          <div
            ref={hostRef}
            className={`dcg-embed-host ${CONTAINER_CLASS}`}
            style={{
              width: "100%",
              // tall enough that the Desmos keypad (~260px) has room to open
              height: compact ? 330 : 380,
            }}
          />

          {status !== "ready" && (
            <div
              className={`absolute inset-0 flex items-center bg-white px-6 text-sm ${
                status === "error"
                  ? "text-red-500"
                  : "text-gray-400 animate-pulse"
              }`}
            >
              {status === "error"
                ? "Desmos failed to load."
                : "Loading Desmos…"}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DesmosField.displayName = "DesmosField";

export default DesmosField;
