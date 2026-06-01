/**
 * MathInputSwitcher — a math input with a small 2-tab toggle:
 *
 *   [ Desmos ]  → the real embedded Desmos calculator + its 1:1 keypad
 *   [ Keyboard ] → the previous setup: the MathLive field + the on-screen keyboard
 *
 * It is a DROP-IN for `MathQuillInput`/`DesmosField` (same props + the same
 * imperative `MathInputHandle`), so the forms only change their import.
 *
 * The current LaTeX is tracked here and fed as `initialValue` to whichever mode
 * is active, so switching tabs preserves what the user has typed.
 */
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Label } from "../app/components/ui/label";
import {
  MathQuillInput,
  type MathInputHandle,
} from "../app/components/math/MathQuillField";
import { DesmosField } from "./DesmosField";
import { DesmosMathFieldKeyboard } from "./DesmosMathFieldKeyboard";

type Mode = "desmos" | "keyboard";

interface MathInputSwitcherProps {
  label?: string;
  onInput?: (latex: string) => void;
  initialValue?: string;
  onFocus?: () => void;
  onToggleKeyboard?: () => void;
  disabled?: boolean;
  compact?: boolean;
  /** which tab is selected on first render */
  defaultMode?: Mode;
}

export const MathInputSwitcher = forwardRef<
  MathInputHandle,
  MathInputSwitcherProps
>(
  (
    { label, onInput, initialValue = "", onFocus, disabled, compact, defaultMode = "desmos" },
    ref
  ) => {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [liveValue, setLiveValue] = useState(initialValue);
  const [kbVisible, setKbVisible] = useState(false);
  const innerRef = useRef<MathInputHandle>(null);

  // Forward the active inner field's handle, whichever mode is mounted.
  useImperativeHandle(ref, () => ({
    focus: () => innerRef.current?.focus(),
    getLatex: () => innerRef.current?.getLatex() ?? liveValue,
    cmd: (a: string) => innerRef.current?.cmd(a),
    write: (a: string) => innerRef.current?.write(a),
    typedText: (a: string) => innerRef.current?.typedText(a),
    keystroke: (a: string) => innerRef.current?.keystroke(a),
  }));

  const handleInput = (latex: string) => {
    setLiveValue(latex);
    onInput?.(latex);
  };

  const Tab = ({ value, children }: { value: Mode; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        setMode(value);
        if (value === "desmos") setKbVisible(false);
      }}
      className={`px-3 py-1 text-xs font-semibold transition-colors ${
        mode === value
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        {label ? (
          <Label className="block">{label}</Label>
        ) : (
          <span />
        )}
        <div className="inline-flex overflow-hidden rounded-md border border-gray-200">
          <Tab value="desmos">Desmos</Tab>
          <span className="w-px bg-gray-200" />
          <Tab value="keyboard">Keyboard</Tab>
        </div>
      </div>

      {mode === "desmos" ? (
        <DesmosField
          ref={innerRef}
          initialValue={liveValue}
          onInput={handleInput}
          onFocus={onFocus}
          disabled={disabled}
          compact={compact}
        />
      ) : (
        <>
          <MathQuillInput
            ref={innerRef}
            initialValue={liveValue}
            onInput={handleInput}
            onFocus={() => {
              setKbVisible(true);
              onFocus?.();
            }}
            onToggleKeyboard={() => setKbVisible((v) => !v)}
            disabled={disabled}
            compact={compact}
          />
          <DesmosMathFieldKeyboard
            mathInputRef={innerRef}
            isVisible={kbVisible && !disabled}
            onClose={() => setKbVisible(false)}
          />
        </>
      )}
    </div>
  );
});

MathInputSwitcher.displayName = "MathInputSwitcher";

export default MathInputSwitcher;
