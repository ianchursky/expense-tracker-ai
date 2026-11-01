// Zips out/ (the static export) with files at the archive root, as Cloudflare Pages' drag-and-drop upload expects.
// Uses only Node built-ins: system `tar` differs by OS and PATH, and GNU tar silently writes a tar instead of a zip.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { crc32, deflateRawSync } from "node:zlib";

const [src = "out", dest = "expense-tracker-cloudflare.zip"] = process.argv.slice(2);
const files = readdirSync(src, { recursive: true, withFileTypes: true })
  .filter((d) => d.isFile())
  .map((d) => join(d.parentPath, d.name));

const locals = [];
const centrals = [];
let offset = 0;
for (const file of files) {
  const name = Buffer.from(relative(src, file).split(sep).join("/"));
  const data = readFileSync(file);
  const packed = deflateRawSync(data);
  const [method, body] = packed.length < data.length ? [8, packed] : [0, data];
  // Version, flags (bit 11: UTF-8 names), method, DOS time/date (fixed for reproducible archives), crc, sizes.
  const common = [[20, 2], [0x800, 2], [method, 2], [0, 2], [0x21, 2], [crc32(data), 4], [body.length, 4], [data.length, 4], [name.length, 2], [0, 2]];
  const local = header(0x04034b50, common);
  const central = header(0x02014b50, [[20, 2], ...common, [0, 2], [0, 2], [0, 2], [0, 4], [offset, 4]]);
  locals.push(local, name, body);
  centrals.push(central, name);
  offset += local.length + name.length + body.length;
}
const directory = Buffer.concat(centrals);
const end = header(0x06054b50, [[0, 2], [0, 2], [files.length, 2], [files.length, 2], [directory.length, 4], [offset, 4], [0, 2]]);
writeFileSync(dest, Buffer.concat([...locals, directory, end]));
console.log(`Wrote ${dest}: ${files.length} files from ${src}/`);

function header(signature, fields) {
  const buf = Buffer.alloc(4 + fields.reduce((n, [, size]) => n + size, 0));
  buf.writeUInt32LE(signature, 0);
  let at = 4;
  for (const [value, size] of fields) {
    if (size === 2) buf.writeUInt16LE(value, at);
    else buf.writeUInt32LE(value >>> 0, at);
    at += size;
  }
  return buf;
}
