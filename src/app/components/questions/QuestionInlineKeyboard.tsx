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
    };

interface QuestionInlineKeyboardProps {
  disabled?: boolean;
  onAction: (action: QuestionInlineKeyboardAction) => void;
}

interface KeyboardKey {
  label: string;
  action: QuestionInlineKeyboardAction;
  span?: number;
  tone?: "default" | "danger";
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
    { label: "⌫", action: { type: "backspace" } },
    { label: "C", action: { type: "clear" }, tone: "danger", span: 2 },
  ],
];

export function QuestionInlineKeyboard({
  disabled = false,
  onAction,
}: QuestionInlineKeyboardProps) {
  return (
    <div className="space-y-2.5">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-5 gap-2.5"
        >
          {row.map((key, keyIndex) => (
            <button
              key={`${rowIndex}-${keyIndex}-${key.label}`}
              type="button"
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onAction(key.action)}
              className={cn(
                "flex h-13 items-center justify-center rounded-[1.05rem] border border-[#dccdbb] bg-white text-lg font-medium text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_10px_24px_-24px_rgba(120,53,15,0.42)] hover:border-[#ccb9a3] disabled:cursor-not-allowed disabled:opacity-45",
                key.span === 2 && "col-span-2",
                key.tone === "danger" && "text-red-600"
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
