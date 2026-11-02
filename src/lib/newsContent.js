// src/lib/newsContent.js — ubah teks biasa ⇄ blok konten berita (p / h2 / list).
//
// Cara menulis:
//   baris kosong   → paragraf baru
//   ## Judul       → sub-judul (h2)
//   - item         → daftar (baris berurutan yang diawali "- ")

export function textToBlocks(text) {
  const blocks = [];
  let para = [];
  let list = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  const flushList = () => {
    if (list?.length) blocks.push({ type: "list", items: list });
    list = null;
  };

  for (const raw of String(text ?? "").replace(/\r/g, "").split("\n")) {
    const line = raw.trim();

    if (!line) {
      flushPara();
      flushList();
    } else if (line === "##" || line.startsWith("## ")) {
      flushPara();
      flushList();
      const t = line.slice(2).trim();
      if (t) blocks.push({ type: "h2", text: t });
    } else if (/^[-•]\s+/.test(line)) {
      flushPara();
      (list ??= []).push(line.replace(/^[-•]\s+/, ""));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

export function blocksToText(blocks) {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((b) => {
      if (b?.type === "h2") return `## ${b.text ?? ""}`;
      if (b?.type === "list") return (b.items ?? []).map((i) => `- ${i}`).join("\n");
      return String(b?.text ?? "");
    })
    .filter((s) => s !== "")
    .join("\n\n");
}

export function slugifyTitle(title) {
  return String(title ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function todayLabel(now = new Date()) {
  return now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
