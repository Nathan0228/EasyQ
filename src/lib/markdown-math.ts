export type MathSource = { tex: string; source: string };

type InlinePart =
  | { kind: "text" | "strong" | "code"; text: string }
  | { kind: "link"; text: string; href: string }
  | ({ kind: "math" } & MathSource);

function scanClose(text: string, start: number, delimiter: string, depth = 0, inline = false) {
  for (let i = start; i < text.length; i++) {
    if (!depth && text.startsWith(delimiter, i)) return { index: i, depth };
    const char = text[i];
    if (inline && !depth && char === "\x60") break;
    if (char === "\\") i++;
    else if (char === "{") depth++;
    else if (char === "}" && depth) depth--;
  }
  return { index: -1, depth };
}

export function codeFence(line: string) {
  return line.match(/^ {0,3}(\x60{3,}|~{3,})/)?.[1];
}

export function readDisplayMath(lines: readonly string[], start: number): (MathSource & { end: number }) | undefined {
  const first = lines[start].trimStart();
  const opening = first.startsWith("$$") ? "$$" : first.startsWith("\\[") ? "\\[" : undefined;
  if (!opening) return;
  const closing = opening === "$$" ? "$$" : "\\]";
  const body: string[] = [];
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    const line = i === start ? first.slice(opening.length) : lines[i];
    // An unmatched opener must not consume subsequent code or a new block.
    if (i !== start && (codeFence(line) || line.trimStart().startsWith("\\["))) return;
    const found = scanClose(line, 0, closing, depth);
    if (found.index >= 0) {
      if (line.slice(found.index + closing.length).trim()) return;
      const tex = [...body, line.slice(0, found.index)].join("\n").trim();
      if (tex) return { tex, source: lines.slice(start, i + 1).join("\n"), end: i };
      return;
    }
    depth = found.depth;
    body.push(line);
  }
}

export function inlineParts(text: string): InlinePart[] {
  const markers = /\\[$\\(]|\$+|\x60+|\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: InlinePart[] = [];
  let cursor = 0;
  for (let match = markers.exec(text); match; match = markers.exec(text)) {
    const [marker, bold, label, href] = match;
    const start = match.index;
    let end = markers.lastIndex;
    let part: InlinePart;
    if (marker[0] === "\x60") {
      const runs = /\x60+/g;
      runs.lastIndex = end;
      let close = runs.exec(text);
      while (close && close[0].length !== marker.length) close = runs.exec(text);
      if (!close) continue;
      part = { kind: "code", text: text.slice(end, close.index) };
      end = runs.lastIndex;
    } else if (bold !== undefined) {
      part = { kind: "strong", text: bold };
    } else if (label !== undefined) {
      part = { kind: "link", text: label, href };
    } else if (marker === "\\$" || marker === "\\\\") {
      part = { kind: "text", text: marker[1] };
    } else {
      if (marker !== "$" && marker !== "\\(") continue;
      const closing = marker === "$" ? "$" : "\\)";
      if (marker === "$" && /[\s$]/.test(text[end] ?? "")) continue;
      const { index } = scanClose(text, end, closing, 0, true);
      if (index < 0) continue;
      // Dollar math follows the usual Markdown whitespace/currency rules.
      if (marker === "$" && (/\s/.test(text[index - 1] ?? "") || /[\d$]/.test(text[index + 1] ?? ""))) continue;
      const tex = text.slice(end, index).trim();
      if (!tex) continue;
      end = index + closing.length;
      part = { kind: "math", tex, source: text.slice(start, end) };
    }
    if (cursor < start) parts.push({ kind: "text", text: text.slice(cursor, start) });
    parts.push(part);
    cursor = markers.lastIndex = end;
  }
  if (cursor < text.length) parts.push({ kind: "text", text: text.slice(cursor) });
  return parts;
}
