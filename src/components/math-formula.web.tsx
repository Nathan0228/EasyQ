import "katex/dist/katex.min.css";
import { renderToString } from "katex";
import { useMemo } from "react";
import type { MathFormulaProps } from "./math-formula";

export function MathFormula({ tex, source, display = false }: MathFormulaProps) {
  const html = useMemo(() => {
    if (tex.length > 20000) return;
    try {
      return renderToString(tex, {
        displayMode: display,
        trust: false,
        throwOnError: true,
        strict: "ignore",
        maxExpand: 1000,
        maxSize: 20,
      });
    } catch {
      return;
    }
  }, [tex, display]);

  // Only KaTeX output goes into the DOM as markup. Failed TeX stays plain text.
  const content = html
    ? <span dangerouslySetInnerHTML={{ __html: html }} />
    : <code className="markdown-math-source">{source}</code>;
  return display ? <div className="markdown-math-block">{content}</div> : content;
}
