/**
 * The small Markdown subset the assistant writes (paragraphs, "- " lists,
 * **bold**, [links](...)), parsed into plain data so the widget never renders
 * raw HTML. Links are kept only for site paths, https, mailto and tel.
 */
export type Inline = { type: "text"; text: string } | { type: "bold"; text: string } | { type: "link"; text: string; href: string; external: boolean };
export type Block = { type: "p"; parts: Inline[] } | { type: "ul"; items: Inline[][] };

export function safeHref(href: string): { href: string; external: boolean } | null {
  const h = href.trim();
  if (h.startsWith("/") && !h.startsWith("//")) return { href: h, external: false };
  if (/^https:\/\/[^\s]+$/i.test(h) || /^mailto:[^\s]+$/i.test(h) || /^tel:[+\d\s-]+$/i.test(h)) return { href: h, external: true };
  return null;
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) {
      const safe = safeHref(m[2]);
      out.push(safe ? { type: "link", text: m[1], ...safe } : { type: "text", text: m[1] });
    } else {
      out.push({ type: "bold", text: m[3] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let items: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", parts: parseInline(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (items.length) blocks.push({ type: "ul", items: items.map(parseInline) });
    items = [];
  };
  for (const raw of src.replace(/\r/g, "").split("\n")) {
    const line = raw.trim().replace(/^#{1,6}\s+/, "");
    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (item) {
      flushPara();
      items.push(item[1]);
    } else if (line === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
