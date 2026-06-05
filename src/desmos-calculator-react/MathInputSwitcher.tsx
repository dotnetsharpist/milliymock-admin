/**
 * MathInputSwitcher — a rich-text question-content field built on TipTap, with
 * formulas edited inline by a real MathLive `<math-field>` (Desmos-grade WYSIWYG
 * math editor). Prose typing is native and flawless; each formula is an inline
 * node you click to edit. The admin never touches raw LaTeX.
 *
 * Input is driven by the hand-built `DesmosMathFieldKeyboard` (123/ABC/f(x)),
 * routed to whichever math-field is active (or the prose). MathLive's own
 * virtual keyboard is kept off so the two don't fight.
 *
 * Storage format is unchanged — the value is serialised back to the project's
 * standard `text + \(latex\)` string. Keeps the old `MathQuillInput` prop/ref
 * surface so the forms don't change.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { MathfieldElement } from "mathlive";
import { Label } from "../app/components/ui/label";
import { cn } from "../app/components/ui/utils";
import type { MathInputHandle } from "../app/components/math/MathQuillField";
import { MathInline } from "./MathInlineNode";
import { DesmosMathFieldKeyboard } from "./DesmosMathFieldKeyboard";
import "./DesmosKeyboard.css";

const INLINE_MATH = /\\\(([\s\S]+?)\\\)/g;

/** Editor document → the project's `text + \(latex\)` string. */
function serialize(editor: Editor): string {
  const lines: string[] = [];
  editor.state.doc.forEach((block) => {
    let s = "";
    block.forEach((child) => {
      if (child.type.name === "mathInline") {
        const l = (child.attrs.latex ?? "").trim();
        if (l) s += `\\(${l}\\)`;
      } else if (child.isText) {
        s += child.text ?? "";
      } else if (child.type.name === "hardBreak") {
        s += "\n";
      }
    });
    lines.push(s);
  });
  return lines.join("\n");
}

/** `text + \(latex\)` string → editor document JSON. */
function parse(value: string): Record<string, unknown> {
  const lines = (value ?? "").split("\n");
  return {
    type: "doc",
    content: lines.map((line) => {
      const content: Array<Record<string, unknown>> = [];
      let last = 0;
      let m: RegExpExecArray | null;
      INLINE_MATH.lastIndex = 0;
      while ((m = INLINE_MATH.exec(line))) {
        if (m.index > last) {
          content.push({ type: "text", text: line.slice(last, m.index) });
        }
        content.push({ type: "mathInline", attrs: { latex: m[1].trim() } });
        last = INLINE_MATH.lastIndex;
      }
      if (last < line.length) {
        content.push({ type: "text", text: line.slice(last) });
      }
      return content.length
        ? { type: "paragraph", content }
        : { type: "paragraph" };
    }),
  };
}

/** Quick-insert templates (MathLive insert syntax: `#?` / `#@` = placeholders). */
const HELPER_BUTTONS: Array<{ label: string; latex: string }> = [
  { label: "{ cases", latex: "\\begin{cases}#@ & #?\\\\#? & #?\\end{cases}" },
  { label: "a/b", latex: "\\frac{#@}{#?}" },
  { label: "√", latex: "\\sqrt{#?}" },
  { label: "ⁿ√", latex: "\\sqrt[#?]{#?}" },
  { label: "x²", latex: "#@^{2}" },
  { label: "xⁿ", latex: "#@^{#?}" },
  { label: "xₙ", latex: "#@_{#?}" },
  { label: "°", latex: "#@^{\\circ}" },
  { label: "( )", latex: "\\left(#?\\right)" },
  { label: "|x|", latex: "\\left|#?\\right|" },
  { label: "π", latex: "\\pi" },
  { label: "≤", latex: "\\le" },
  { label: "≥", latex: "\\ge" },
  { label: "≠", latex: "\\ne" },
  { label: "·", latex: "\\cdot" },
  { label: "∞", latex: "\\infty" },
];

/** cmd() shortcuts (driven by the keyboard) → MathLive insert latex. */
const CMD_LATEX: Record<string, string> = {
  "^": "#@^{#?}",
  _: "#@_{#?}",
  "\\sqrt": "\\sqrt{#?}",
  "\\nthroot": "\\sqrt[#?]{#?}",
  "\\frac": "\\frac{#@}{#?}",
  "/": "\\frac{#@}{#?}",
};

const MF_KEY: Record<string, string> = {
  Backspace: "deleteBackward",
  Left: "moveToPreviousChar",
  Right: "moveToNextChar",
};

interface MathInputSwitcherProps {
  label?: string;
  onInput?: (value: string) => void;
  initialValue?: string;
  onFocus?: () => void;
  onToggleKeyboard?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const MathInputSwitcher = forwardRef<
  MathInputHandle,
  MathInputSwitcherProps
>(({ label, onInput, initialValue = "", onFocus, disabled, compact }, ref) => {
  const lastEmitted = useRef(initialValue);
  const [kbOpen, setKbOpen] = useState(false);

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        listItem: false,
        orderedList: false,
        strike: false,
      }),
      MathInline,
    ],
    content: parse(initialValue),
    onUpdate: ({ editor }) => {
      const next = serialize(editor);
      lastEmitted.current = next;
      onInput?.(next);
    },
    onFocus: () => {
      setKbOpen(true);
      onFocus?.();
    },
  });

  // reflect external initialValue changes (e.g. edit-mode data loading late)
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    if (initialValue === lastEmitted.current) return;
    lastEmitted.current = initialValue;
    editor.commands.setContent(parse(initialValue), false);
  }, [editor, initialValue]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const activeField = (): MathfieldElement | null =>
    (editor?.storage.mathInline?.active as MathfieldElement | null) ?? null;

  /** Insert a snippet into the active math-field, or as a new formula node. */
  const insertSnippet = (latex: string) => {
    if (!editor) return;
    const active = activeField();
    if (active) {
      active.focus();
      active.insert(latex, {
        focus: true,
        format: "latex",
        mode: "math",
        selectionMode: "placeholder",
      });
      return;
    }
    const value = latex.replace(/#[@?]/g, "\\placeholder{}");
    editor
      .chain()
      .focus()
      .insertContent({
        type: "mathInline",
        attrs: { latex: value, autofocus: true, insert: latex },
      })
      .run();
  };

  const doTyped = (text: string) => {
    const active = activeField();
    if (active) active.insert(text, { focus: true });
    else editor?.commands.insertContent(text);
  };

  const doKeystroke = (key: string) => {
    const active = activeField();
    if (active) {
      if (key === "Enter") active.blur();
      else if (MF_KEY[key]) active.executeCommand(MF_KEY[key]);
      return;
    }
    if (!editor) return;
    const { from, empty } = editor.state.selection;
    if (key === "Backspace") {
      editor.commands.focus();
      if (empty) editor.commands.deleteRange({ from: Math.max(0, from - 1), to: from });
      else editor.commands.deleteSelection();
    } else if (key === "Left") {
      editor.commands.setTextSelection(Math.max(0, from - 1));
    } else if (key === "Right") {
      editor.commands.setTextSelection(from + 1);
    } else if (key === "Enter") {
      editor.commands.splitBlock();
    }
  };

  // imperative handle shared by the on-screen keyboard and the forms' refs
  const handleRef = useRef<MathInputHandle>({
    cmd: () => undefined,
    write: () => undefined,
    typedText: () => undefined,
    keystroke: () => undefined,
    focus: () => undefined,
    getLatex: () => "",
  });
  handleRef.current = {
    cmd: (c) => insertSnippet(CMD_LATEX[c] ?? c),
    write: (latex) => insertSnippet(latex),
    typedText: (text) => doTyped(text),
    keystroke: (key) => doKeystroke(key),
    focus: () => editor?.commands.focus(),
    getLatex: () => (editor ? serialize(editor) : ""),
  };

  useImperativeHandle(ref, () => ({
    focus: () => handleRef.current.focus(),
    getLatex: () => handleRef.current.getLatex(),
    write: (a: string) => handleRef.current.write(a),
    cmd: (a: string) => handleRef.current.cmd(a),
    typedText: (a: string) => handleRef.current.typedText(a),
    keystroke: (a: string) => handleRef.current.keystroke(a),
  }));

  return (
    <div className="relative">
      {label && <Label className="mb-2 block">{label}</Label>}

      <div
        className={cn(
          "math-editor rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-lg leading-relaxed text-gray-900 shadow-sm transition-colors focus-within:border-blue-500",
          compact ? "min-h-[60px]" : "min-h-[96px]",
          disabled ? "opacity-60" : "",
        )}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) editor?.commands.focus("end");
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* hint */}
      <p className="mt-1 text-[11px] text-gray-400">
        Matn yozing. Formula qo'shish uchun pastdagi tugmalardan foydalaning yoki{" "}
        <span className="font-semibold text-gray-500">fx</span> ni bosing; formula
        ustiga bosib tahrirlaysiz.
      </p>

      {/* quick-insert buttons */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            insertSnippet("");
          }}
          className="rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
        >
          fx Formula
        </button>
        {HELPER_BUTTONS.map((button) => (
          <button
            key={button.label}
            type="button"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              insertSnippet(button.latex);
            }}
            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
          >
            {button.label}
          </button>
        ))}
      </div>

      <DesmosMathFieldKeyboard
        mathInputRef={handleRef}
        isVisible={kbOpen && !disabled}
        onClose={() => setKbOpen(false)}
      />
    </div>
  );
});

MathInputSwitcher.displayName = "MathInputSwitcher";

export default MathInputSwitcher;
