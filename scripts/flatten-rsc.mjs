// Next 16's static export nests segment payloads (expenses/__next.expenses/__PAGE__.txt), but the client
// prefetches them by a flat, dot-joined name (expenses/__next.expenses.__PAGE__.txt). Write a flat copy of each.
import { copyFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import assert from "node:assert";

// "a/__next.b/c/D.txt" -> "a/__next.b.c.D.txt"; null when the path has no nested __next. folder.
export function flatName(rel) {
  const parts = rel.split("/");
  const i = parts.findIndex((p, k) => p.startsWith("__next.") && k < parts.length - 1);
  return i === -1 ? null : [...parts.slice(0, i), parts.slice(i).join(".")].join("/");
}

assert.equal(flatName("expenses/__next.expenses/__PAGE__.txt"), "expenses/__next.expenses.__PAGE__.txt");
assert.equal(flatName("__next.__PAGE__.txt"), null);

const [src = "out"] = process.argv.slice(2);
let n = 0;
for (const d of readdirSync(src, { recursive: true, withFileTypes: true })) {
  if (!d.isFile() || !d.name.endsWith(".txt")) continue;
  const rel = relative(src, join(d.parentPath, d.name)).split(sep).join("/");
  const flat = flatName(rel);
  if (flat) { copyFileSync(join(src, rel), join(src, flat)); n++; }
}
console.log(`Wrote ${n} flat RSC payload copies in ${src}/`);
