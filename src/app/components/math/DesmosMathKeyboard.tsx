import { useState, type ReactNode, type RefObject } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  Delete,
  Keyboard,
  X,
} from "lucide-react";
import type { MathInputHandle } from "./MathQuillField";

const CASES_TEMPLATE = "\\begin{cases}#@ & #?\\\\#? & #?\\end{cases}";

type KeyboardMode = "main" | "functions" | "letters";

type Action =
  | { type: "cmd"; value: string }
  | { type: "write"; value: string }
  | { type: "typed"; value: string }
  | { type: "key"; value: string };

interface DesmosMathKeyboardProps {
  mathInputRef: RefObject<MathInputHandle | null>;
  isVisible?: boolean;
  onClose: () => void;
}

function dispatch(mathField: MathInputHandle, action: Action) {
  switch (action.type) {
    case "cmd":
      mathField.cmd(action.value);
      break;
    case "write":
      mathField.write(action.value);
      break;
    case "typed":
      mathField.typedText(action.value);
      break;
    case "key":
      mathField.keystroke(action.value);
      break;
  }
}

export function DesmosMathKeyboard({
  mathInputRef,
  isVisible = true,
  onClose,
}: DesmosMathKeyboardProps) {
  const [mode, setMode] = useState<KeyboardMode>("main");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  if (!isVisible) return null;

  const fire = (keyId: string, action: Action) => {
    setActiveKey(keyId);
    const mathField = mathInputRef.current;
    if (mathField) {
      dispatch(mathField, action);
    }
    window.setTimeout(() => setActiveKey(null), 120);
  };

  const insertCasesBlock = () => {
    setActiveKey("cases");
    mathInputRef.current?.write(CASES_TEMPLATE);
    window.setTimeout(() => setActiveKey(null), 120);
  };

  const Key = ({
    id,
    action,
    children,
    className = "",
    title,
    onPress,
    wide = false,
    tall = false,
    selected = false,
  }: {
    id: string;
    action?: Action;
    children: ReactNode;
    className?: string;
    title?: string;
    onPress?: () => void;
    wide?: boolean;
    tall?: boolean;
    selected?: boolean;
  }) => {
    const active = activeKey === id;

    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={(event) => {
          event.preventDefault();
          if (onPress) {
            onPress();
            return;
          }
          if (action) {
            fire(id, action);
          }
        }}
        className={[
          "flex select-none items-center justify-center rounded-[3px] border text-[17px] font-medium shadow-sm transition",
          "border-[#c9c9c9] bg-[#f8f8f8] text-[#333] hover:bg-white active:translate-y-px",
          "h-10 min-w-10",
          wide ? "col-span-2" : "",
          tall ? "row-span-2 h-full" : "",
          selected ? "border-[#2d70b3] bg-[#e5f0fb] text-[#2d70b3]" : "",
          active ? "brightness-90" : "",
          className,
        ].join(" ")}
      >
        {children}
      </button>
    );
  };

  const renderLeftPanel = () => {
    if (mode === "functions") {
      return (
        <>
          <Key id="sin" action={{ type: "write", value: "\\sin(#?)" }}>
            sin
          </Key>
          <Key id="cos" action={{ type: "write", value: "\\cos(#?)" }}>
            cos
          </Key>
          <Key id="tan" action={{ type: "write", value: "\\tan(#?)" }}>
            tan
          </Key>
          <Key id="log" action={{ type: "write", value: "\\log(#?)" }}>
            log
          </Key>
          <Key id="ln" action={{ type: "write", value: "\\ln(#?)" }}>
            ln
          </Key>
          <Key id="sqrt" action={{ type: "cmd", value: "\\sqrt" }}>
            sqrt
          </Key>
          <Key id="abs" action={{ type: "write", value: "\\left|#@\\right|" }}>
            |a|
          </Key>
          <Key id="sum" action={{ type: "write", value: "\\sum" }}>
            sum
          </Key>
          <Key id="back-main" onPress={() => setMode("main")} wide>
            main
          </Key>
        </>
      );
    }

    if (mode === "letters") {
      return "abcdefghijklmnopqrstuvwxyz".split("").map((letter) => (
        <Key
          key={letter}
          id={`letter-${letter}`}
          action={{ type: "typed", value: letter }}
        >
          {letter}
        </Key>
      ));
    }

    return (
      <>
        <Key id="x" action={{ type: "typed", value: "x" }} title="x">
          <em>x</em>
        </Key>
        <Key id="y" action={{ type: "typed", value: "y" }} title="y">
          <em>y</em>
        </Key>
        <Key id="square" action={{ type: "write", value: "^{2}" }} title="a squared">
          <span>
            <em>a</em>
            <sup>2</sup>
          </span>
        </Key>
        <Key id="power" action={{ type: "cmd", value: "^" }} title="a superscript b">
          <span>
            <em>a</em>
            <sup>
              <em>b</em>
            </sup>
          </span>
        </Key>
        <Key id="lp" action={{ type: "typed", value: "(" }}>
          (
        </Key>
        <Key id="rp" action={{ type: "typed", value: ")" }}>
          )
        </Key>
        <Key id="lt" action={{ type: "typed", value: "<" }}>
          &lt;
        </Key>
        <Key id="gt" action={{ type: "typed", value: ">" }}>
          &gt;
        </Key>
        <Key id="cases" onPress={insertCasesBlock} title="Piecewise cases">
          {"{"}
        </Key>
        <Key id="le" action={{ type: "write", value: "\\le" }}>
          &lt;=
        </Key>
        <Key id="ge" action={{ type: "write", value: "\\ge" }}>
          &gt;=
        </Key>
        <Key id="pi" action={{ type: "write", value: "\\pi" }}>
          pi
        </Key>
        <Key id="subscript" action={{ type: "cmd", value: "_" }} title="Subscript">
          <span>
            <em>a</em>
            <sub>
              <em>b</em>
            </sub>
          </span>
        </Key>
        <Key id="sqrt-main" action={{ type: "cmd", value: "\\sqrt" }}>
          sqrt
        </Key>
        <Key id="nthroot" action={{ type: "cmd", value: "\\nthroot" }}>
          n√
        </Key>
        <Key id="abs-main" action={{ type: "write", value: "\\left|#@\\right|" }}>
          |a|
        </Key>
      </>
    );
  };

  return (
    <div className="math-keyboard fixed bottom-0 left-0 right-0 z-50 border-t border-[#bbb] bg-[#f1f1f1] px-3 py-3 shadow-[0_-8px_28px_rgba(0,0,0,0.18)]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-3 md:grid-cols-[1fr_300px_132px]">
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {renderLeftPanel()}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <Key id="seven" action={{ type: "typed", value: "7" }} className="bg-[#e9e9e9]">
            7
          </Key>
          <Key id="eight" action={{ type: "typed", value: "8" }} className="bg-[#e9e9e9]">
            8
          </Key>
          <Key id="nine" action={{ type: "typed", value: "9" }} className="bg-[#e9e9e9]">
            9
          </Key>
          <Key id="divide" action={{ type: "write", value: "\\div" }}>
            /
          </Key>
          <Key id="four" action={{ type: "typed", value: "4" }} className="bg-[#e9e9e9]">
            4
          </Key>
          <Key id="five" action={{ type: "typed", value: "5" }} className="bg-[#e9e9e9]">
            5
          </Key>
          <Key id="six" action={{ type: "typed", value: "6" }} className="bg-[#e9e9e9]">
            6
          </Key>
          <Key id="times" action={{ type: "write", value: "\\cdot" }}>
            x
          </Key>
          <Key id="one" action={{ type: "typed", value: "1" }} className="bg-[#e9e9e9]">
            1
          </Key>
          <Key id="two" action={{ type: "typed", value: "2" }} className="bg-[#e9e9e9]">
            2
          </Key>
          <Key id="three" action={{ type: "typed", value: "3" }} className="bg-[#e9e9e9]">
            3
          </Key>
          <Key id="minus" action={{ type: "typed", value: "-" }}>
            -
          </Key>
          <Key id="zero" action={{ type: "typed", value: "0" }} className="bg-[#e9e9e9]" wide>
            0
          </Key>
          <Key id="dot" action={{ type: "typed", value: "." }} className="bg-[#e9e9e9]">
            .
          </Key>
          <Key id="plus" action={{ type: "typed", value: "+" }}>
            +
          </Key>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <Key id="keyboard" onPress={() => setMode("main")} selected={mode === "main"}>
            <Keyboard className="h-5 w-5" />
          </Key>
          <Key id="close" onPress={onClose} title="Close keyboard">
            <X className="h-5 w-5" />
          </Key>
          <Key id="functions" onPress={() => setMode("functions")} selected={mode === "functions"} wide>
            funcs
          </Key>
          <Key id="letters" onPress={() => setMode("letters")} selected={mode === "letters"} wide>
            ABC
          </Key>
          <Key id="left" action={{ type: "key", value: "Left" }}>
            <ArrowLeft className="h-5 w-5" />
          </Key>
          <Key id="right" action={{ type: "key", value: "Right" }}>
            <ArrowRight className="h-5 w-5" />
          </Key>
          <Key id="backspace" action={{ type: "key", value: "Backspace" }} wide>
            <Delete className="h-5 w-5" />
          </Key>
          <Key id="enter" action={{ type: "key", value: "Enter" }} className="bg-[#2d70b3] text-white hover:bg-[#235a91]" wide>
            <CornerDownLeft className="h-5 w-5" />
          </Key>
        </div>
      </div>
    </div>
  );
}
