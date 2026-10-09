import { Fragment, type ReactNode } from "react";

/**
 * Renders owner-editable plain text safely (no HTML): blank lines separate
 * paragraphs, "## " starts a heading, "- " starts a bullet. Headings and
 * bullet runs are recognised on any line, with or without a blank line around them.
 */
export function SimpleContent({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: ReactNode[] = [];
  blocks.forEach((block, i) => {
    let para: string[] = [];
    let list: string[] = [];
    const flush = (k: number) => {
      if (para.length) {
        out.push(
          <p key={`${i}-${k}-p`}>
            {para.map((l, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {l}
              </Fragment>
            ))}
          </p>,
        );
        para = [];
      }
      if (list.length) {
        out.push(<ul key={`${i}-${k}-ul`}>{list.map((l, j) => <li key={j}>{l}</li>)}</ul>);
        list = [];
      }
    };
    block.split("\n").forEach((line, k) => {
      if (line.startsWith("## ") || line.startsWith("### ")) {
        flush(k);
        out.push(line.startsWith("## ") ? <h2 key={`${i}-${k}`}>{line.slice(3)}</h2> : <h3 key={`${i}-${k}`}>{line.slice(4)}</h3>);
      } else if (line.startsWith("- ")) {
        if (para.length) flush(k);
        list.push(line.slice(2));
      } else {
        if (list.length) flush(k);
        para.push(line);
      }
    });
    flush(-1);
  });
  return <div className="prose-travel text-[1.05rem]">{out}</div>;
}
