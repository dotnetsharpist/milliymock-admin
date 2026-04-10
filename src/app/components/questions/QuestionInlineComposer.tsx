import { useEffect, useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import {
  INLINE_EDITOR_GHOST_CHAR,
  parseInlineQuestionValue,
  serializeInlineQuestionRoot,
} from "../../lib/question-inline";
import { wrapInlineMath } from "../../lib/math";
import {
  QuestionInlineKeyboard,
  QuestionInlineKeyboardAction,
} from "./QuestionInlineKeyboard";

interface QuestionInlineComposerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

interface KeyboardAnchorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const createFormulaId = () =>
  `formula-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const KEYBOARD_WIDTH = 420;
const KEYBOARD_HEIGHT = 360;
const KEYBOARD_MARGIN = 12;

export function QuestionInlineComposer({
  value,
  onChange,
  disabled = false,
  className,
}: QuestionInlineComposerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const keyboardRef = useRef<HTMLDivElement | null>(null);
  const mathFieldRef = useRef<MathfieldElement | null>(null);
  const renderMathRef = useRef<
    ((element: HTMLElement, options?: Record<string, unknown>) => void) | null
  >(null);
  const lastSerializedValueRef = useRef("");
  const selectionRef = useRef<Range | null>(null);
  const activeFormulaIdRef = useRef<string | null>(null);

  const [activeFormulaId, setActiveFormulaId] = useState<string | null>(null);
  const [isMathReady, setIsMathReady] = useState(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(!(value ?? "").trim());
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardAnchorRect, setKeyboardAnchorRect] =
    useState<KeyboardAnchorRect | null>(null);

  const setFormulaSelection = (formulaId: string | null) => {
    activeFormulaIdRef.current = formulaId;
    setActiveFormulaId(formulaId);
  };

  const setKeyboardAnchorFromRect = (rect: DOMRect) => {
    setKeyboardAnchorRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const getKeyboardPosition = () => {
    if (!keyboardAnchorRect || typeof window === "undefined") {
      return null;
    }

    const width = Math.min(KEYBOARD_WIDTH, window.innerWidth - 16);
    const left = Math.min(
      Math.max(8, keyboardAnchorRect.left),
      Math.max(8, window.innerWidth - width - 8)
    );

    const preferredTop =
      keyboardAnchorRect.top + keyboardAnchorRect.height + KEYBOARD_MARGIN;
    const fitsBelow = preferredTop + KEYBOARD_HEIGHT <= window.innerHeight - 8;
    const top = fitsBelow
      ? preferredTop
      : Math.max(8, keyboardAnchorRect.top - KEYBOARD_HEIGHT - KEYBOARD_MARGIN);

    return { left, top, width };
  };

  const hideLibraryKeyboard = () => {
    if (typeof window !== "undefined" && window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.hide();
    }
  };

  const renderFormulaChip = (chip: HTMLElement) => {
    const renderTarget = chip.querySelector<HTMLElement>(
      "[data-formula-render]"
    );

    if (!renderTarget) return;

    renderTarget.textContent = wrapInlineMath(chip.dataset.latex ?? "");
    renderMathRef.current?.(renderTarget, {
      renderAccessibleContent: "mathml",
    });
  };

  const createFormulaChip = (formulaId: string, latex: string) => {
    const chip = document.createElement("span");
    chip.className = "question-inline-editor__formula-chip";
    chip.dataset.formulaId = formulaId;
    chip.dataset.latex = latex;
    chip.contentEditable = "false";

    const renderTarget = document.createElement("span");
    renderTarget.dataset.formulaRender = "true";
    chip.appendChild(renderTarget);

    renderFormulaChip(chip);
    return chip;
  };

  const syncValueFromEditor = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextValue = serializeInlineQuestionRoot(editor);
    lastSerializedValueRef.current = nextValue;
    setIsEditorEmpty(!nextValue.trim());
    onChange(nextValue);
  };

  const hydrateEditor = (nextValue: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.innerHTML = "";

    parseInlineQuestionValue(nextValue).forEach((token) => {
      if (token.type === "math") {
        editor.appendChild(createFormulaChip(createFormulaId(), token.value));
        editor.appendChild(document.createTextNode(INLINE_EDITOR_GHOST_CHAR));
        return;
      }

      editor.appendChild(document.createTextNode(token.value));
    });

    if (!editor.childNodes.length) {
      editor.appendChild(document.createTextNode(""));
    }

    lastSerializedValueRef.current = nextValue;
    setIsEditorEmpty(!(nextValue ?? "").trim());
  };

  const findFormulaChip = (formulaId: string) =>
    editorRef.current?.querySelector<HTMLElement>(
      `[data-formula-id="${formulaId}"]`
    ) ?? null;

  const captureEditorSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
      return;
    }

    selectionRef.current = range.cloneRange();
  };

  const placeCaretAtEnd = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) return;

    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    selectionRef.current = range.cloneRange();
  };

  const restoreEditorSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) return;

    editor.focus();

    if (
      selectionRef.current &&
      selectionRef.current.startContainer.isConnected &&
      editor.contains(selectionRef.current.startContainer)
    ) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
      return;
    }

    placeCaretAtEnd();
  };

  const focusFormula = (formulaId: string) => {
    const chip = findFormulaChip(formulaId);
    const mathField = mathFieldRef.current;

    if (!chip || !mathField) return;

    setFormulaSelection(formulaId);

    const latex = chip.dataset.latex ?? "";
    if (mathField.value !== latex) {
      mathField.setValue(latex);
    }

    mathField.focus();

    if (typeof mathField.executeCommand === "function") {
      mathField.executeCommand("moveToMathfieldEnd");
    }
    hideLibraryKeyboard();
  };

  const insertFormulaChipAtSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) return null;

    restoreEditorSelection();

    if (!selection.rangeCount) {
      placeCaretAtEnd();
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const formulaId = createFormulaId();
    const chip = createFormulaChip(formulaId, "");
    const ghostNode = document.createTextNode(INLINE_EDITOR_GHOST_CHAR);
    const fragment = document.createDocumentFragment();
    fragment.append(chip, ghostNode);
    range.insertNode(fragment);

    const nextRange = document.createRange();
    nextRange.setStart(ghostNode, ghostNode.textContent?.length ?? 1);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    selectionRef.current = nextRange.cloneRange();

    focusFormula(formulaId);
    return formulaId;
  };

  const removeFormula = (formulaId: string) => {
    const chip = findFormulaChip(formulaId);
    if (!chip) return;

    const selection = window.getSelection();
    const ghostNode = chip.nextSibling;
    chip.remove();

    if (
      ghostNode &&
      ghostNode.nodeType === Node.TEXT_NODE &&
      ghostNode.textContent === INLINE_EDITOR_GHOST_CHAR
    ) {
      const nextRange = document.createRange();
      nextRange.setStart(ghostNode, 1);
      nextRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(nextRange);
      selectionRef.current = nextRange.cloneRange();
    } else {
      placeCaretAtEnd();
    }

    setFormulaSelection(null);
    syncValueFromEditor();
    editorRef.current?.focus();
  };

  const closeKeyboard = () => {
    setIsKeyboardOpen(false);
    setKeyboardAnchorRect(null);
    hideLibraryKeyboard();
  };

  const dismissKeyboard = () => {
    cleanupEmptyActiveFormula();
    closeKeyboard();
  };

  const cleanupEmptyActiveFormula = () => {
    const formulaId = activeFormulaIdRef.current;
    const chip = formulaId ? findFormulaChip(formulaId) : null;
    const latex = chip?.dataset.latex?.trim() ?? "";

    if (formulaId && !latex) {
      removeFormula(formulaId);
      return;
    }

    setFormulaSelection(null);
  };

  const syncSelectedFormulaFromMathField = () => {
    const formulaId = activeFormulaIdRef.current;
    const mathField = mathFieldRef.current;
    const chip = formulaId ? findFormulaChip(formulaId) : null;

    if (!formulaId || !mathField || !chip) return;

    const latex = mathField.value.trim();

    if (!latex) {
      removeFormula(formulaId);
      return;
    }

    chip.dataset.latex = latex;
    renderFormulaChip(chip);
    syncValueFromEditor();
  };

  const insertPlainText = (text: string) => {
    const selection = window.getSelection();
    if (!selection) return;

    restoreEditorSelection();

    if (!selection.rangeCount) {
      placeCaretAtEnd();
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    const nextRange = document.createRange();
    nextRange.setStart(textNode, text.length);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    selectionRef.current = nextRange.cloneRange();
    setFormulaSelection(null);
    syncValueFromEditor();
  };

  const handleAddFormula = (anchorRect: DOMRect) => {
    if (disabled || !isMathReady) return;

    const formulaId = insertFormulaChipAtSelection();
    if (!formulaId) return;

    setKeyboardAnchorFromRect(anchorRect);
    setIsKeyboardOpen(true);
  };

  const handleOpenFormulaFromChip = (formulaId: string, rect: DOMRect) => {
    focusFormula(formulaId);
    setKeyboardAnchorFromRect(rect);
    setIsKeyboardOpen(true);
  };

  const handleKeyboardAction = (action: QuestionInlineKeyboardAction) => {
    const mathField = mathFieldRef.current;
    const formulaId = activeFormulaIdRef.current;

    if (disabled || !isMathReady || !mathField || !formulaId) return;

    if (action.type === "clear") {
      removeFormula(formulaId);
      closeKeyboard();
      return;
    }

    if (action.type === "backspace") {
      if (typeof mathField.executeCommand === "function") {
        mathField.executeCommand("deleteBackward");
      } else {
        mathField.setValue(mathField.value.slice(0, -1));
      }

      syncSelectedFormulaFromMathField();

      if (!activeFormulaIdRef.current) {
        closeKeyboard();
      }
      return;
    }

    mathField.insert(action.value, {
      focus: true,
      format: "latex",
      mode: "math",
      selectionMode: "placeholder",
    });
    syncSelectedFormulaFromMathField();
    hideLibraryKeyboard();
  };

  useEffect(() => {
    let isCancelled = false;

    void import("mathlive").then(({ renderMathInElement }) => {
      if (isCancelled) return;

      renderMathRef.current = renderMathInElement;
      setIsMathReady(true);
      hideLibraryKeyboard();
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("question-inline-composer--custom-only");

    return () => {
      document.body.classList.remove("question-inline-composer--custom-only");
    };
  }, []);

  useEffect(() => {
    if (!isMathReady) return;
    hydrateEditor(value);
  }, [isMathReady]);

  useEffect(() => {
    if (!isMathReady) return;
    if (value === lastSerializedValueRef.current) return;

    hydrateEditor(value);
    setFormulaSelection(null);
  }, [isMathReady, value]);

  useEffect(() => {
    const mathField = mathFieldRef.current;
    if (!isMathReady || !mathField) return;

    const handleInput = () => {
      syncSelectedFormulaFromMathField();
    };

    mathField.mathVirtualKeyboardPolicy = "manual";
    mathField.defaultMode = "math";
    mathField.smartFence = true;
    mathField.smartMode = true;
    mathField.readOnly = disabled;
    hideLibraryKeyboard();
    mathField.addEventListener("input", handleInput);

    return () => {
      mathField.removeEventListener("input", handleInput);
    };
  }, [disabled, isMathReady]);

  useEffect(() => {
    if (!isKeyboardOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (keyboardRef.current?.contains(target)) {
        return;
      }

      if (rootRef.current?.contains(target)) {
        return;
      }

      dismissKeyboard();
    };

    const handleViewportResize = () => {
      dismissKeyboard();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissKeyboard();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("resize", handleViewportResize);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("resize", handleViewportResize);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isKeyboardOpen]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor
      .querySelectorAll<HTMLElement>("[data-formula-id]")
      .forEach((chip) => {
        chip.classList.toggle(
          "is-active",
          chip.dataset.formulaId === activeFormulaId
        );
      });
  }, [activeFormulaId, value]);

  const keyboardPosition = getKeyboardPosition();

  return (
    <div ref={rootRef} className={cn("space-y-4", className)}>
      <div className="rounded-[2rem] border border-[#ecd8c1] bg-[linear-gradient(160deg,rgba(255,250,245,0.98),rgba(255,255,255,0.98))] p-4 shadow-[0_26px_70px_-52px_rgba(120,53,15,0.55)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900">
              Question Content
            </p>
            <p className="text-xs leading-5 text-neutral-500">
              Matnni shu maydonga yozing, formula kerak bo‘lsa `Add Formula`
              orqali ichiga qo‘shing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeFormulaId && (
              <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-orange-700">
                Formula Selected
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) =>
                handleAddFormula(event.currentTarget.getBoundingClientRect())
              }
              disabled={disabled || !isMathReady}
            >
              <Plus className="h-4 w-4" />
              Add Formula
            </Button>
          </div>
        </div>

        <div className="relative rounded-[1.6rem] border border-[#e8d6c4] bg-white px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_36px_-34px_rgba(120,53,15,0.4)]">
          {isEditorEmpty && (
            <p className="pointer-events-none absolute left-5 top-4 right-5 text-[1.02rem] leading-8 text-neutral-400">
              Savol matnini yozing va formulalarni keyboard orqali shu yerning
              ichiga qo‘shing...
            </p>
          )}

          <div
            id="question-inline-editor"
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            className="question-inline-editor min-h-[8rem] whitespace-pre-wrap break-words text-[1.02rem] leading-8 text-neutral-900 outline-none"
            onInput={() => {
              captureEditorSelection();
              setFormulaSelection(null);
              syncValueFromEditor();
            }}
            onFocus={() => {
              captureEditorSelection();
            }}
            onKeyUp={() => {
              captureEditorSelection();
              setFormulaSelection(null);
            }}
            onMouseUp={() => {
              captureEditorSelection();
            }}
            onPaste={(event) => {
              event.preventDefault();
              insertPlainText(event.clipboardData.getData("text/plain"));
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              insertPlainText("\n");
            }}
            onMouseDown={(event) => {
              const target = event.target as HTMLElement;
              const formulaChip = target.closest<HTMLElement>("[data-formula-id]");

              if (!formulaChip) {
                dismissKeyboard();
                return;
              }

              event.preventDefault();
              handleOpenFormulaFromChip(
                formulaChip.dataset.formulaId ?? "",
                formulaChip.getBoundingClientRect()
              );
            }}
          />

          <math-field
            ref={(node) => {
              mathFieldRef.current = node;
            }}
            aria-hidden="true"
            className="question-inline-composer__mathfield pointer-events-none"
            style={{
              position: "fixed",
              left: "-9999px",
              top: "-9999px",
              width: "1px",
              height: "1px",
              opacity: 0,
              overflow: "hidden",
            }}
          />
        </div>
      </div>

      {isKeyboardOpen &&
        keyboardPosition &&
        createPortal(
          <div
            ref={keyboardRef}
            style={{
              position: "fixed",
              left: keyboardPosition.left,
              top: keyboardPosition.top,
              width: keyboardPosition.width,
              zIndex: 60,
            }}
            className="rounded-[1.6rem] border border-[#ead9c6] bg-[linear-gradient(180deg,rgba(255,252,247,0.99),rgba(255,255,255,0.98))] p-3.5 shadow-[0_28px_70px_-42px_rgba(120,53,15,0.48)]"
          >
          <QuestionInlineKeyboard
            disabled={disabled || !isMathReady || !activeFormulaId}
            onAction={handleKeyboardAction}
          />
          </div>,
          document.body
        )}
    </div>
  );
}
