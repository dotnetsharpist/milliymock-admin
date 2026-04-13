import { cn } from "../ui/utils";

export type QuestionInlineKeyboardAction =
  | {
      type: "insert";
      value: string;
    }
  | {
      type: "backspace";
    }
  | {
      type: "clear";
    }
  | {
      type: "done";
    };

interface QuestionInlineKeyboardProps {
  disabled?: boolean;
  onAction: (action: QuestionInlineKeyboardAction) => void;
}

interface KeyboardKey {
  label: string;
  action: QuestionInlineKeyboardAction;
  span?: number;
  tone?: "default" | "danger" | "primary";
}

const KEYBOARD_ROWS: KeyboardKey[][] = [
  [
    { label: "1", action: { type: "insert", value: "1" } },
    { label: "2", action: { type: "insert", value: "2" } },
    { label: "3", action: { type: "insert", value: "3" } },
    { label: "+", action: { type: "insert", value: "+" } },
    { label: "-", action: { type: "insert", value: "-" } },
  ],
  [
    { label: "4", action: { type: "insert", value: "4" } },
    { label: "5", action: { type: "insert", value: "5" } },
    { label: "6", action: { type: "insert", value: "6" } },
    { label: "×", action: { type: "insert", value: "\\times" } },
    { label: "ⁿ√", action: { type: "insert", value: "\\sqrt[#?]{#?}" } },
  ],
  [
    { label: "7", action: { type: "insert", value: "7" } },
    { label: "8", action: { type: "insert", value: "8" } },
    { label: "9", action: { type: "insert", value: "9" } },
    { label: "(", action: { type: "insert", value: "(" } },
    { label: ")", action: { type: "insert", value: ")" } },
  ],
  [
    { label: "0", action: { type: "insert", value: "0" }, span: 2 },
    { label: ".", action: { type: "insert", value: "." } },
    { label: "√", action: { type: "insert", value: "\\sqrt{#?}" } },
    { label: "^", action: { type: "insert", value: "#@^{#?}" } },
  ],
  [
    { label: "π", action: { type: "insert", value: "\\pi" } },
    { label: ",", action: { type: "insert", value: "," } },
    { label: "⌫", action: { type: "backspace" } },
    { label: "C", action: { type: "clear" }, tone: "danger", span: 2 },
  ],
  [
    { label: "TAYYOR", action: { type: "done" }, tone: "primary", span: 5 },
  ],
];

export function QuestionInlineKeyboard({
  disabled = false,
  onAction,
}: QuestionInlineKeyboardProps) {
  return (
    <div className="space-y-2">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-5 gap-2"
        >
          {row.map((key, keyIndex) => (
            <button
              key={`${rowIndex}-${keyIndex}-${key.label}`}
              type="button"
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onAction(key.action)}
              className={cn(
                "flex h-10 items-center justify-center rounded-sm border border-[#e0ddd7] bg-white px-2 text-sm font-medium text-[#1a1814] shadow-sm transition-all active:scale-95 hover:border-[#1a1814] hover:bg-[#e0ddd7] disabled:cursor-not-allowed disabled:opacity-45",
                key.span === 2 && "col-span-2",
                key.span === 5 && "col-span-5",
                key.tone === "danger" && "text-red-600",
                key.tone === "primary" &&
                  "border-[#1a1814] bg-[#1a1814] text-white hover:bg-black hover:border-black"
              )}
            >
              {key.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
