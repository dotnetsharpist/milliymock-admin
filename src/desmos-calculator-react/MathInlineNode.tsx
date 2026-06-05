/**
 * MathInline — a TipTap inline atom node that holds one LaTeX formula and edits
 * it with a real MathLive `<math-field>` (the gold-standard WYSIWYG math editor,
 * with its own Desmos-style virtual keyboard and placeholder navigation).
 *
 *  - Display mode: the formula is rendered (read-only) exactly as students see it.
 *  - Edit mode: clicking it (or inserting a new one) swaps in a `<math-field>`;
 *    on blur / Enter the LaTeX is written back to the node. Empty formulas are
 *    removed on blur.
 *
 * The currently-edited field is published on `editor.storage.mathInline.active`
 * so the toolbar / imperative handle can insert snippets into it.
 */
import { useEffect, useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import type { MathfieldElement } from "mathlive";
import { cn } from "../app/components/ui/utils";

function MathInlineView({
  node,
  updateAttributes,
  editor,
  getPos,
  selected,
}: NodeViewProps) {
  const latex: string = node.attrs.latex ?? "";
  const [editing, setEditing] = useState(
    () => latex.trim() === "" || !!node.attrs.autofocus,
  );
  const mfRef = useRef<MathfieldElement | null>(null);
  const dispRef = useRef<HTMLSpanElement | null>(null);

  // Display mode → render the formula with MathLive.
  useEffect(() => {
    if (editing) return;
    const el = dispRef.current;
    if (!el) return;
    let cancelled = false;
    void import("mathlive").then(({ renderMathInElement }) => {
      if (cancelled || !el) return;
      el.textContent = latex.trim() ? `\\(${latex}\\)` : "\\(\\square\\)";
      renderMathInElement(el, { renderAccessibleContent: "mathml" });
    });
    return () => {
      cancelled = true;
    };
  }, [latex, editing]);

  // Edit mode → wire up the math-field, focus it, show the Desmos keyboard.
  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    void import("mathlive").then(() => {
      const f = mfRef.current;
      if (cancelled || !f) return;
      // the hand-built on-screen keyboard drives the field — keep MathLive's
      // own virtual keyboard fully off.
      f.mathVirtualKeyboardPolicy = "manual";
      f.smartFence = true;
      editor.storage.mathInline.active = f;
      const template: string = node.attrs.insert ?? "";
      if (template) {
        // fresh template → insert via MathLive so the first placeholder is selected
        f.value = "";
        f.focus();
        f.insert(template, {
          selectionMode: "placeholder",
          format: "latex",
          focus: true,
        });
      } else {
        // existing formula → load it, caret at the end
        f.value = latex;
        f.focus();
      }
    });
    return () => {
      cancelled = true;
      if (editor.storage.mathInline.active === mfRef.current) {
        editor.storage.mathInline.active = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const commit = () => {
    const f = mfRef.current;
    const next = f ? f.value : latex;
    if (editor.storage.mathInline.active === f) {
      editor.storage.mathInline.active = null;
    }
    if (!next.trim() && typeof getPos === "function") {
      const pos = getPos();
      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .run();
      return;
    }
    updateAttributes({ latex: next, autofocus: false, insert: "" });
    setEditing(false);
  };

  return (
    <NodeViewWrapper as="span" className="mi-node">
      {editing ? (
        <math-field
          ref={(n: MathfieldElement | null) => {
            mfRef.current = n;
          }}
          class="mi-field"
          onBlur={commit}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              mfRef.current?.blur();
            }
          }}
        />
      ) : (
        <span
          ref={dispRef}
          className={cn("mi-display", selected && "mi-display--selected")}
          onMouseDown={(e) => {
            e.preventDefault();
            setEditing(true);
          }}
          title="Tahrirlash uchun bosing"
        />
      )}
    </NodeViewWrapper>
  );
}

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addStorage() {
    return { active: null as MathfieldElement | null };
  },

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-latex") ?? "",
        renderHTML: (attrs) => ({ "data-latex": attrs.latex }),
      },
      // transient: makes a freshly-inserted node open in edit mode
      autofocus: { default: false, rendered: false },
      // transient: MathLive insert-syntax template (with #? placeholders)
      insert: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-math-inline]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-math-inline": "" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView);
  },
});

export default MathInline;
