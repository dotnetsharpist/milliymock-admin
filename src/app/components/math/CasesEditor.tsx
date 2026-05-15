import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

interface CasesEditorProps {
  open: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
  initialRows?: string[];
}

export function CasesEditor({
  open,
  onClose,
  onInsert,
  initialRows,
}: CasesEditorProps) {
  const [rows, setRows] = useState<string[]>(
    initialRows && initialRows.length > 0 ? initialRows : ["", ""]
  );
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(initialRows && initialRows.length > 0 ? initialRows : ["", ""]);
    window.setTimeout(() => firstInputRef.current?.focus(), 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const updateRow = (index: number, value: string) => {
    setRows((current) => current.map((row, i) => (i === index ? value : row)));
  };

  const addRow = () => {
    setRows((current) => [...current, ""]);
  };

  const removeRow = (index: number) => {
    setRows((current) =>
      current.length <= 1 ? current : current.filter((_, i) => i !== index)
    );
  };

  const handleInsert = () => {
    const cleaned = rows.map((row) => row.trim()).filter((row) => row.length > 0);
    if (cleaned.length === 0) {
      onClose();
      return;
    }
    const latex = `\\begin{cases}${cleaned.join(" \\\\ ")}\\end{cases}`;
    onInsert(latex);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Piecewise function editor"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Piecewise function
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Har qatorga bitta ifoda yozing. Insert bosgach formulaga qo'shiladi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-stretch gap-3">
          <div
            className="flex select-none items-stretch font-serif text-neutral-900"
            style={{ fontSize: `${Math.max(rows.length * 56, 110)}px`, lineHeight: 0.9 }}
          >
            {"{"}
          </div>

          <div className="flex flex-1 flex-col justify-center gap-3">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  ref={index === 0 ? firstInputRef : undefined}
                  value={row}
                  onChange={(event) => updateRow(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (index === rows.length - 1) addRow();
                    }
                  }}
                  placeholder={index === 0 ? "8+x,\\ x<0" : "2-x,\\ x\\ge 0"}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base font-serif text-neutral-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="rounded-md p-1 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="mt-1 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              Add row
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
