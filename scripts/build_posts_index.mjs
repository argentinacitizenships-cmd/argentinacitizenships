import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const OUTPUT_DIR = path.join(ROOT, "data");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "posts.json");

function parseFrontMatter(content) {
  if (!content.startsWith("---")) {
    return { data: {}, body: content };
  }

  const parts = content.split(/^-{3,}\s*$/m);
  if (parts.length < 3) {
    return { data: {}, body: content };
  }

  const front = parts[1].trim();
  const body = parts.slice(2).join("\n---\n").trim();
  const data = {};

  front.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    if (!key) return;
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  });

  return { data, body };
}

async function buildIndex() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const entries = [];

  const files = await fs.readdir(POSTS_DIR);
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const fullPath = path.join(POSTS_DIR, file);
    const raw = await fs.readFile(fullPath, "utf-8");
    const { data } = parseFrontMatter(raw);
    const slug = file.replace(/\.md$/, "");
    const entry = {
      slug,
      title: data.title || slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      summary: data.summary || "",
      date: data.date || "",
      thumbnail: data.thumbnail || "",
      path: `/content/posts/${file}`,
    };
    entries.push(entry);
  }

  entries.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
  });

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(entries, null, 2), "utf-8");
  console.log(`Wrote ${entries.length} entries to ${OUTPUT_PATH}`);
}

buildIndex().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

