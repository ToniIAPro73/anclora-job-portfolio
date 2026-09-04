#!/usr/bin/env node
// Zero-dependency lint for the static portfolio: forbidden terms, TODO markers,
// and basic HTML tag-balance sanity across every tracked .html file.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git"].includes(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
}

const files = [];
walk(ROOT, files);

const htmlFiles = files.filter((f) => f.endsWith(".html"));
const jsFiles = files.filter((f) => f.endsWith(".js") && !f.includes("/scripts/"));

const FORBIDDEN_TERMS = ["SyncXML", "syncxml"];
let errors = [];
let warnings = [];

for (const f of [...htmlFiles, ...jsFiles]) {
  const content = readFileSync(f, "utf8");
  for (const term of FORBIDDEN_TERMS) {
    if (content.includes(term)) {
      errors.push(`${path.relative(ROOT, f)}: forbidden term "${term}" found`);
    }
  }
  if (/\bTODO\b|\bFIXME\b/.test(content)) {
    warnings.push(`${path.relative(ROOT, f)}: contains TODO/FIXME marker`);
  }
}

// Basic tag-balance check for common block tags in each HTML file.
const TAGS_TO_BALANCE = ["div", "section", "header", "footer", "main", "nav", "article", "ul", "dl"];
for (const f of htmlFiles) {
  const content = readFileSync(f, "utf8");
  for (const tag of TAGS_TO_BALANCE) {
    const openCount = (content.match(new RegExp(`<${tag}(\\s|>)`, "g")) || []).length;
    const closeCount = (content.match(new RegExp(`</${tag}>`, "g")) || []).length;
    if (openCount !== closeCount) {
      errors.push(`${path.relative(ROOT, f)}: unbalanced <${tag}> tags (open=${openCount}, close=${closeCount})`);
    }
  }
}

console.log(`lint: checked ${htmlFiles.length} HTML file(s), ${jsFiles.length} JS file(s)`);
for (const w of warnings) console.warn("WARN " + w);
for (const e of errors) console.error("ERROR " + e);

if (errors.length > 0) {
  console.error(`lint FAILED: ${errors.length} error(s)`);
  process.exit(1);
}
console.log("lint PASSED");
