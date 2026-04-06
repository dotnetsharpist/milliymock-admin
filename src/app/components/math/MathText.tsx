import { useEffect, useRef } from "react";
import { cn } from "../ui/utils";

interface MathTextProps {
  value?: string | null;
  className?: string;
  as?: "div" | "span";
  emptyFallback?: string;
}

export function MathText({
  value,
  className,
  as = "div",
  emptyFallback = "",
}: MathTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("mathlive").then(({ renderMathInElement }) => {
      if (!rootRef.current || isCancelled) return;

      rootRef.current.textContent = value?.trim() || emptyFallback;
      renderMathInElement(rootRef.current, {
        renderAccessibleContent: "mathml",
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [emptyFallback, value]);

  if (as === "span") {
    return (
      <span
        ref={(node) => {
          rootRef.current = node;
        }}
        className={cn("math-rich-text", className)}
      />
    );
  }

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
      }}
      className={cn("math-rich-text", className)}
    />
  );
}
