import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { Extension } from "@codemirror/state";

export type SupportedLanguages =
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "html"
  | "css"
  | "json"
  | "markdown";

export const getLanguageExtension = (
  language: SupportedLanguages,
): Extension => {
  switch (language) {
    case "javascript":
      return javascript();
    case "typescript":
    case "tsx":
    case "jsx":
      return javascript({ jsx: true, typescript: true });
    case "html":
      return html();
    case "css":
      return css();
    case "json":
      return json();
    case "markdown":
      return markdown();
    default:
      return javascript();
  }
};

// Helper function to determine language from file extension
export function getLanguageFromFileExtension(
  fileName: string,
): SupportedLanguages {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "js":
      return "javascript";
    case "ts":
      return "typescript";
    case "jsx":
      return "jsx";
    case "tsx":
      return "tsx";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "md":
      return "markdown";
    default:
      return "javascript";
  }
}
