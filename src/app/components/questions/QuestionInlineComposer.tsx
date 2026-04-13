import { useEffect, useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";
import { createPortal } from "react-dom";
import { Keyboard } from "lucide-react";
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
  type QuestionInlineMathHandle,
} from "./QuestionInlineKeyboard";

interface QuestionInlineComposerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const createFormulaId = () =>
  `formula-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  const mathInputHandleRef = useRef<QuestionInlineMathHandle | null>(null);
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
  const [isFormulaInsertMode, setIsFormulaInsertMode] = useState(false);

  // --- NEW: INLINE SWAPPING HELPERS ---

  const mountMathFieldToChip = (chip: HTMLElement) => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    // Clear the static formula render
    chip.innerHTML = "";

    // Move the active MathLive element inside the chip
    chip.appendChild(mathField);

    // Make the mathField visible and flow inline
    mathField.style.position = "static";
    mathField.style.opacity = "1";
    mathField.style.width = "auto";
    mathField.style.height = "auto";
    mathField.style.pointerEvents = "auto";
  };

  const unmountMathField = (chip: HTMLElement) => {
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    // Move math field back to a hidden staging state to protect it
    mathField.style.position = "fixed";
    mathField.style.left = "-9999px";
    mathField.style.opacity = "0";
    mathField.style.pointerEvents = "none";

    // Append it safely to the root container so it isn't destroyed
    rootRef.current?.appendChild(mathField);

    // Recreate the static render target
    chip.innerHTML = "";
    const renderTarget = document.createElement("span");
    renderTarget.dataset.formulaRender = "true";
    chip.appendChild(renderTarget);

    // Re-render the static math
    renderFormulaChip(chip);
  };

  // --- END HELPERS ---

  const setFormulaSelection = (formulaId: string | null) => {
    // Unmount previously active formula
    if (activeFormulaIdRef.current && activeFormulaIdRef.current !== formulaId) {
      const prevChip = findFormulaChip(activeFormulaIdRef.current);
      if (prevChip) unmountMathField(prevChip);
    }

    activeFormulaIdRef.current = formulaId;
    setActiveFormulaId(formulaId);
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

    // Rescue math field before clearing the editor
    if (mathFieldRef.current && editor.contains(mathFieldRef.current)) {
      rootRef.current?.appendChild(mathFieldRef.current);
      mathFieldRef.current.style.position = "fixed";
      mathFieldRef.current.style.left = "-9999px";
      mathFieldRef.current.style.opacity = "0";
      mathFieldRef.current.style.pointerEvents = "none";
    }

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

  const getEmptyFormulaChips = () =>
    Array.from(
      editorRef.current?.querySelectorAll<HTMLElement>("[data-formula-id]") ?? []
    ).filter((chip) => !(chip.dataset.latex ?? "").trim());

  const removeFormulaChipNode = (chip: HTMLElement) => {
    const ghostNode = chip.nextSibling;
    chip.remove();

    if (
      ghostNode &&
      ghostNode.nodeType === Node.TEXT_NODE &&
      ghostNode.textContent === INLINE_EDITOR_GHOST_CHAR
    ) {
      ghostNode.remove();
    }
  };

  const cleanupExtraEmptyFormulaChips = (preserveFormulaId?: string | null) => {
    const emptyChips = getEmptyFormulaChips().filter(
      (chip) => chip.dataset.formulaId !== preserveFormulaId
    );

    if (emptyChips.length === 0) return;

    emptyChips.forEach((chip) => {
      removeFormulaChipNode(chip);
    });

    if (editorRef.current && !editorRef.current.childNodes.length) {
      editorRef.current.appendChild(document.createTextNode(""));
    }

    syncValueFromEditor();
  };

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
    mountMathFieldToChip(chip);

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

  const insertFormulaChipAtSelection = (initialLatex = "") => {
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
    const chip = createFormulaChip(formulaId, initialLatex);
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
    setIsEditorEmpty(false);

    focusFormula(formulaId);
    return formulaId;
  };

  const removeFormula = (formulaId: string) => {
    const chip = findFormulaChip(formulaId);
    if (!chip) return;

    // Rescue the math-field if we are deleting the currently active formula
    if (activeFormulaIdRef.current === formulaId && mathFieldRef.current) {
      rootRef.current?.appendChild(mathFieldRef.current);
      mathFieldRef.current.style.position = "fixed";
      mathFieldRef.current.style.left = "-9999px";
      mathFieldRef.current.style.opacity = "0";
      mathFieldRef.current.style.pointerEvents = "none";
    }

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
    setIsFormulaInsertMode(false);
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

    cleanupExtraEmptyFormulaChips();
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
    
    // We do NOT call renderFormulaChip(chip) here because the user is currently editing it
    // and the chip contains the live math-field, not a static render.
    syncValueFromEditor();
  };

  const insertMathLatex = (latex: string) => {
    let mathField = mathFieldRef.current;
    let formulaId = activeFormulaIdRef.current;

    if (!formulaId) {
      formulaId = insertFormulaChipAtSelection();
      mathField = mathFieldRef.current;
    }

    if (!mathField || !formulaId) return;

    mathField.focus();
    mathField.insert(latex, {
      focus: true,
      format: "latex",
      mode: "math",
      selectionMode: "placeholder",
    });
    syncSelectedFormulaFromMathField();
    setIsFormulaInsertMode(false);
    hideLibraryKeyboard();
  };

  const executeMathCommand = (command: string) => {
    switch (command) {
      case "\\frac":
        insertMathLatex("\\frac{#@}{#?}");
        return;
      case "^":
        insertMathLatex("#@^{#?}");
        return;
      case "_":
        insertMathLatex("#@_{#?}");
        return;
      case "\\sqrt":
        insertMathLatex("\\sqrt{#?}");
        return;
      case "\\nthroot":
        insertMathLatex("\\sqrt[#?]{#?}");
        return;
      default:
        insertMathLatex(command);
    }
  };

  const executeMathKeystroke = (key: string) => {
    const mathField = mathFieldRef.current;
    if (!mathField || !activeFormulaIdRef.current) return;

    const commandMap: Record<string, string> = {
      Left: "moveToPreviousChar",
      Right: "moveToNextChar",
      Backspace: "deleteBackward",
      Tab: "moveToNextPlaceholder",
    };

    const command = commandMap[key];
    if (command && typeof mathField.executeCommand === "function") {
      mathField.executeCommand(command);
      syncSelectedFormulaFromMathField();
      hideLibraryKeyboard();
    }
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

  const handleAddFormula = () => {
    if (disabled || !isMathReady) return;

    const emptyChips = getEmptyFormulaChips();
    if (emptyChips.length > 0) {
      const existingChip = emptyChips[0];
      const existingFormulaId = existingChip.dataset.formulaId ?? "";

      cleanupExtraEmptyFormulaChips(existingFormulaId);
      handleOpenFormulaFromChip(existingFormulaId);
      return;
    }

    setFormulaSelection(null);
    setIsFormulaInsertMode(true);
    setIsKeyboardOpen(true);
  };

  const handleOpenFormulaFromChip = (formulaId: string) => {
    cleanupExtraEmptyFormulaChips(formulaId);
    focusFormula(formulaId);
    setIsFormulaInsertMode(false);
    setIsKeyboardOpen(true);
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

  mathInputHandleRef.current = {
    cmd: (latexCmd) => {
      executeMathCommand(latexCmd);
    },
    write: (latex) => {
      insertMathLatex(latex);
    },
    typedText: (text) => {
      insertMathLatex(text);
    },
    keystroke: (key) => {
      executeMathKeystroke(key);
    },
    focus: () => {
      mathFieldRef.current?.focus();
      hideLibraryKeyboard();
    },
    getLatex: () => mathFieldRef.current?.value ?? "",
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "space-y-4",
        isKeyboardOpen && "pb-[42rem] lg:pb-[19rem]",
        className
      )}
    >
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddFormula}
              disabled={disabled || !isMathReady}
              title="Open formula keyboard"
              aria-label="Open formula keyboard"
            >
              <Keyboard className="h-4 w-4" />
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

              // Handle clicking outside a formula chip
              if (!formulaChip) {
                setFormulaSelection(null);
                closeKeyboard();
                return;
              }

              event.preventDefault();
              handleOpenFormulaFromChip(formulaChip.dataset.formulaId ?? "");
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
              opacity: 0,
              pointerEvents: "none"
            }}
          />
        </div>
      </div>

      {isKeyboardOpen &&
        createPortal(
          <div
            ref={keyboardRef}
            className="fixed bottom-0 left-0 right-0 z-[70]"
          >
            <QuestionInlineKeyboard
              mathInputRef={mathInputHandleRef}
              isVisible={isKeyboardOpen && !disabled}
              onClose={dismissKeyboard}
            />
          </div>,
          document.body
        )}
    </div>
  );
}