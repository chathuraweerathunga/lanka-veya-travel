import { Fragment } from "react";

/**
 * Renders owner-editable plain text safely (no HTML): blank lines separate
 * paragraphs, "## " starts a heading, "- " starts a bullet.
 */
export function SimpleContent({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose-travel text-[1.05rem]">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) return <h2 key={i}>{block.slice(3)}</h2>;
        if (block.startsWith("### ")) return <h3 key={i}>{block.slice(4)}</h3>;
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {l}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
