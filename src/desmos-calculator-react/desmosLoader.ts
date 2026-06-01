/**
 * desmosLoader — loads the (already-vendored) Desmos calculator bundle exactly
 * once and resolves with the global `Desmos` API object.
 *
 * The bundle under src/desmos-calculator/ is the real Desmos API build, so once
 * it's on the page `window.Desmos.GraphingCalculator(...)` is available — no API
 * key and no network needed. This is what lets the question forms use the true
 * 1:1 Desmos keypad.
 */

// Vite rewrites these to hashed asset URLs at build time (same trick the
// /desmos-calculator page uses).
const SCRIPT_URL = new URL(
  "../desmos-calculator/saveweb2zip-com-www-desmos-com/js/shared_calculator_desktop-0abcc698c630b0859b915d239bfbd2a97797e4da.js",
  import.meta.url
).href;

const CSS_URL = new URL(
  "../desmos-calculator/saveweb2zip-com-www-desmos-com/css/shared_calculator_desktop-b823b189be5be25b8402ca03ec1946d578a810b2.css",
  import.meta.url
).href;

// The vendored CSS is scoped under this class. It must go on the calculator's
// own container element (NOT <html>) — putting it on <html> applies Desmos's
// global resets/overflow to the whole page, breaking scroll and layout.
export const CONTAINER_CLASS = "dcg-calculator-api-container-v1_13";

export type DesmosApi = {
  GraphingCalculator: (
    el: HTMLElement,
    options?: Record<string, unknown>
  ) => DesmosCalculatorInstance;
  [key: string]: unknown;
};

export interface DesmosExpression {
  id?: string;
  latex?: string;
  [key: string]: unknown;
}

export interface DesmosCalculatorInstance {
  setExpression: (expr: DesmosExpression) => void;
  getExpressions: () => DesmosExpression[];
  removeExpression: (expr: { id: string }) => void;
  observeEvent: (event: string, handler: () => void) => void;
  unobserveEvent: (event: string) => void;
  focusFirstExpression?: () => void;
  destroy: () => void;
  [key: string]: unknown;
}

let loaderPromise: Promise<DesmosApi> | null = null;
let rejectionGuardInstalled = false;

// The vendored bundle is the full desmos.com APP, which auto-bootstraps itself
// by mounting into `#dcg-main-content`. Our pages don't have that element, so
// that bootstrap throws "Must pass an HTMLElement for the node" — an uncaught
// promise rejection that is harmless to the embedded fields (which mount into
// their own host nodes). Swallow ONLY that exact, known message.
function installRejectionGuard() {
  if (rejectionGuardInstalled || typeof window === "undefined") return;
  rejectionGuardInstalled = true;
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { message?: string } | undefined;
    if (
      typeof reason?.message === "string" &&
      reason.message.includes("Must pass an HTMLElement for the node")
    ) {
      event.preventDefault();
    }
  });
}

function injectCssOnce() {
  if (document.getElementById("desmos-embed-css")) return;
  const link = document.createElement("link");
  link.id = "desmos-embed-css";
  link.rel = "stylesheet";
  link.href = CSS_URL;
  document.head.appendChild(link);
}

export function loadDesmos(): Promise<DesmosApi> {
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<DesmosApi>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Desmos can only load in the browser"));
      return;
    }

    const w = window as unknown as { Desmos?: DesmosApi };

    installRejectionGuard();

    // If the API is already present (e.g. the /desmos-calculator page loaded it),
    // reuse it.
    if (w.Desmos && typeof w.Desmos.GraphingCalculator === "function") {
      injectCssOnce();
      resolve(w.Desmos);
      return;
    }

    injectCssOnce();

    const existing = document.getElementById(
      "desmos-embed-runtime"
    ) as HTMLScriptElement | null;

    const waitForApi = () => {
      const start = performance.now();
      const tick = () => {
        if (w.Desmos && typeof w.Desmos.GraphingCalculator === "function") {
          resolve(w.Desmos);
        } else if (performance.now() - start > 15000) {
          reject(new Error("Desmos API did not initialise in time"));
        } else {
          window.setTimeout(tick, 50);
        }
      };
      tick();
    };

    if (existing) {
      waitForApi();
      return;
    }

    const script = document.createElement("script");
    script.id = "desmos-embed-runtime";
    script.src = SCRIPT_URL;
    script.async = false;
    script.onload = waitForApi;
    script.onerror = () => reject(new Error("Failed to load the Desmos bundle"));
    document.body.appendChild(script);
  });

  return loaderPromise;
}
