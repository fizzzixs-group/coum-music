import type { ReactNode } from "react";

/**
 * Простой разбор описания релиза с GitHub.
 * Нужен, чтобы список изменений выглядел как текст, а не как сырой Markdown
 * с решётками и звёздочками.
 */
export function renderNotes(notes: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul className="update__list" key={key}>
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  notes
    .replace(/\r/g, "")
    .split("\n")
    .forEach((rawLine, index) => {
      const line = rawLine.trim();

      if (line.startsWith("### ") || line.startsWith("## ")) {
        flushList(`list-${index}`);
        blocks.push(
          <h4 className="update__notes-head" key={`h-${index}`}>
            {inline(line.replace(/^#+\s*/, ""))}
          </h4>,
        );
        return;
      }

      if (line.startsWith("- ") || line.startsWith("* ")) {
        list.push(line.slice(2));
        return;
      }

      flushList(`list-${index}`);

      if (!line) return;

      blocks.push(
        <p className="update__notes-line" key={`p-${index}`}>
          {inline(line)}
        </p>,
      );
    });

  flushList("list-end");
  return blocks;
}

/** `**жирный**` и `` `код` `` превращаем в разметку. */
function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];

    if (token.startsWith("**")) {
      parts.push(<b key={match.index}>{token.slice(2, -2)}</b>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={match.index}>{token.slice(1, -1)}</code>);
    } else {
      const label = token.slice(1, token.indexOf("]"));
      parts.push(
        <span className="update__link" key={match.index}>
          {label}
        </span>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
