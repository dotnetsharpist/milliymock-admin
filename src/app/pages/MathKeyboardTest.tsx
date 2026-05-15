import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MathfieldElement,
  VirtualKeyboardLayout,
  VirtualKeyboardName,
} from "mathlive";
import { Button } from "../components/ui/button";
import { MathText } from "../components/math/MathText";
import { CASES_LAYOUT } from "../components/math/MathQuillField";

const KEYBOARD_LAYOUTS: Array<VirtualKeyboardLayout | VirtualKeyboardName> = [
  "numeric",
  CASES_LAYOUT,
  "symbols",
  "alphabetic",
  "greek",
];

export function MathKeyboardTest() {
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathfieldElement | null>(null);
  const [ready, setReady] = useState(false);
  const [latex, setLatex] = useState("");

  const preview = useMemo(
    () => (latex.trim() ? `$$${latex}$$` : ""),
    [latex]
  );

  useEffect(() => {
    let cancelled = false;

    void import("mathlive").then(({ MathfieldElement }) => {
      if (cancelled || !hostRef.current) return;

      const field = new MathfieldElement();
      field.style.fontSize = "1.5rem";
      field.style.width = "100%";
      field.style.minHeight = "80px";
      field.style.padding = "8px";
      field.mathVirtualKeyboardPolicy = "manual";
      field.smartMode = true;
      field.smartFence = true;

      field.addEventListener("input", () => setLatex(field.value));

      hostRef.current.innerHTML = "";
      hostRef.current.appendChild(field);
      fieldRef.current = field;
      setReady(true);
    });

    return () => {
      cancelled = true;
      fieldRef.current?.remove();
      fieldRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined" || !window.mathVirtualKeyboard) {
      return;
    }
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
  }, [ready]);

  const showKeyboard = () => {
    fieldRef.current?.focus();
    window.mathVirtualKeyboard?.show();
  };

  const hideKeyboard = () => {
    window.mathVirtualKeyboard?.hide();
  };

  const insert = (snippet: string) => {
    const field = fieldRef.current;
    if (!field) return;
    field.focus();
    field.insert(snippet, {
      focus: true,
      format: "latex",
      mode: "math",
      selectionMode: "placeholder",
    });
    setLatex(field.value);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-900">
          MathLive Keyboard Test
        </h1>
        <p className="text-sm text-neutral-600">
          MathLive's built-in virtual keyboard (numeric, symbols, alphabetic,
          greek) plus the custom "{`{ }`}" cases tab. MathLive renders
          <code> \begin&#123;cases&#125;</code> natively — no fraction line.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={showKeyboard}>
          Show keyboard
        </Button>
        <Button type="button" variant="outline" onClick={hideKeyboard}>
          Hide keyboard
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => insert("\\begin{cases} #? & #? \\\\ #? & #? \\end{cases}")}
        >
          Insert cases
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => insert("\\frac{#?}{#?}")}
        >
          Insert fraction
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => insert("\\sqrt{#?}")}
        >
          Insert sqrt
        </Button>
      </div>

      <div className="rounded-xl border-2 border-gray-300 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Math field (MathLive)
        </p>
        <div ref={hostRef} />
        {!ready && (
          <div className="animate-pulse text-sm text-gray-400">
            Loading math editor...
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          LaTeX output
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm text-neutral-800">
          {latex || "(empty)"}
        </pre>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Rendered preview
        </p>
        {preview ? (
          <MathText value={preview} className="text-2xl text-neutral-900" />
        ) : (
          <span className="text-sm text-gray-400">(empty)</span>
        )}
      </div>
    </div>
  );
}
