import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown, safeHref } from "@/lib/chat/markdown";

describe("chat markdown", () => {
  it("keeps site, https, mailto and tel links only", () => {
    expect(safeHref("/tours/ella")).toEqual({ href: "/tours/ella", external: false });
    expect(safeHref("https://wa.me/94776205149")).toEqual({ href: "https://wa.me/94776205149", external: true });
    expect(safeHref("mailto:hi@example.com")?.external).toBe(true);
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("//evil.example")).toBeNull();
    expect(safeHref("http://insecure.example")).toBeNull();
  });

  it("parses bold and links, dropping unsafe links to text", () => {
    expect(parseInline("See **Ella** at [this page](/destinations/ella) or [x](javascript:void)")).toEqual([
      { type: "text", text: "See " },
      { type: "bold", text: "Ella" },
      { type: "text", text: " at " },
      { type: "link", text: "this page", href: "/destinations/ella", external: false },
      { type: "text", text: " or " },
      { type: "text", text: "x" },
    ]);
  });

  it("groups paragraphs and lists", () => {
    const blocks = parseMarkdown("Hello there.\nSecond line.\n\n- One\n- Two\n1. Three\n\nBye");
    expect(blocks.map((b) => b.type)).toEqual(["p", "ul", "p"]);
    expect(blocks[1]).toMatchObject({ type: "ul", items: [[{ text: "One" }], [{ text: "Two" }], [{ text: "Three" }]] });
    expect(blocks[0]).toMatchObject({ parts: [{ text: "Hello there. Second line." }] });
  });

  it("treats headings as plain paragraphs", () => {
    expect(parseMarkdown("## Tours")).toEqual([{ type: "p", parts: [{ type: "text", text: "Tours" }] }]);
  });
});
