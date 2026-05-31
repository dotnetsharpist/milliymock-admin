import { useEffect } from "react";
import "./DesmosCalculator.css";

const calculatorCssUrl = new URL(
  "../../desmos-calculator/saveweb2zip-com-www-desmos-com/css/shared_calculator_desktop-b823b189be5be25b8402ca03ec1946d578a810b2.css",
  import.meta.url
).href;

const analyticsScriptUrl = new URL(
  "../../desmos-calculator/saveweb2zip-com-www-desmos-com/js/js.js",
  import.meta.url
).href;

const calculatorScriptUrl = new URL(
  "../../desmos-calculator/saveweb2zip-com-www-desmos-com/js/shared_calculator_desktop-0abcc698c630b0859b915d239bfbd2a97797e4da.js",
  import.meta.url
).href;

const faviconUrl = new URL(
  "../../desmos-calculator/saveweb2zip-com-www-desmos-com/images/favicon.ico",
  import.meta.url
).href;

const appleTouchIconUrl = new URL(
  "../../desmos-calculator/saveweb2zip-com-www-desmos-com/images/apple-touch-icon.png",
  import.meta.url
).href;

const WHITE_BACKGROUND_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wLEhYhKmtn2wYAAAAidEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVAgb24gYSBNYWOHqHdDAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC";

declare global {
  interface Window {
    Desmos?: {
      config?: Record<string, unknown>;
      commit?: string;
      [key: string]: unknown;
    };
    Sd?: {
      initialProduct?: string;
    };
    _paq?: unknown[];
    paqTest?: unknown[];
  }
}

function appendLink(id: string, href: string, rel: string, type?: string) {
  const existing = document.getElementById(id);
  if (existing) {
    return existing;
  }

  const link = document.createElement("link");
  link.id = id;
  link.rel = rel;
  link.href = href;

  if (type) {
    link.type = type;
  }

  document.head.appendChild(link);
  return link;
}

function appendScript(id: string, src: string, async = false) {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    return Promise.resolve(existing);
  }

  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = async;

  const loaded = new Promise<HTMLScriptElement>((resolve, reject) => {
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
  });

  document.body.appendChild(script);
  return loaded;
}

export function DesmosCalculator() {
  useEffect(() => {
    const previousTitle = document.title;
    const previousBodyLoadData = document.body.getAttribute("data-load-data");
    const hadNoGlAttribute = document.documentElement.hasAttribute("no_gl");

    document.title = "Desmos | Grafische rekenmachine";
    document.documentElement.setAttribute("no_gl", "true");
    document.documentElement.classList.add("dcg-calculator-api-container-v1_13");
    document.body.setAttribute("data-load-data", '{"initialProduct":"graphing"}');

    window.Desmos = window.Desmos ?? {};
    window.Desmos.config = {};
    window.Desmos.commit = "e4c54154d4638f53a5774a799f2eac199f913264";
    window.Sd = { initialProduct: "graphing" };
    window._paq = window._paq ?? [];
    window.paqTest = window.paqTest ?? [];

    window._paq.push(["disableCookies"]);
    window._paq.push(["enableLinkTracking"]);

    appendLink("desmos-calculator-css", calculatorCssUrl, "stylesheet");
    appendLink("desmos-calculator-favicon", faviconUrl, "icon", "image/x-icon");
    appendLink("desmos-calculator-apple-touch-icon", appleTouchIconUrl, "apple-touch-icon");

    appendScript("desmos-calculator-analytics", analyticsScriptUrl, true).catch(() => undefined);
    appendScript("desmos-calculator-runtime", calculatorScriptUrl).catch(() => undefined);

    if (window.location.protocol === "file:") {
      window.history.pushState = () => undefined;
      window.history.replaceState = () => undefined;
    }

    return () => {
      document.title = previousTitle;
      document.documentElement.classList.remove("dcg-calculator-api-container-v1_13");

      if (!hadNoGlAttribute) {
        document.documentElement.removeAttribute("no_gl");
      }

      if (previousBodyLoadData === null) {
        document.body.removeAttribute("data-load-data");
      } else {
        document.body.setAttribute("data-load-data", previousBodyLoadData);
      }
    };
  }, []);

  return (
    <div className="desmos-calculator-page">
      <div className="dcg-loading-div-container">
        <div className="dcg-loading-background-div" />
        <div className="dcg-loading-div">Loading...</div>
      </div>
      <div className="dcg-sliding-interior">
        <div id="dcg-header-container" />
        <div id="dcg-main-content" />
      </div>
      <div id="mygraphs-container" />
      <div id="dcg-modal-container" handleevent="true" />
      <img src={WHITE_BACKGROUND_PIXEL} id="whitebg" aria-hidden="true" alt="" />
    </div>
  );
}
