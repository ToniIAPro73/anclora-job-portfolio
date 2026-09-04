#!/usr/bin/env node
// Zero-dependency secret scan across tracked source files (no .env, no
// node_modules). Mirrors the intent of AOS secret-env-audit for this repo.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".git"]);
const TEXT_EXT = new Set([".html", ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".md"]);

const PATTERNS = [
  [/sk-[a-zA-Z0-9]{20,}/, "OpenAI-style secret key"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key ID"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "PEM private key"],
  [/postgres(ql)?:\/\/[^\s"']+:[^\s"']+@/, "Postgres connection string with credentials"],
  [/xox[baprs]-[0-9A-Za-z-]{10,}/, "Slack token"],
];

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TEXT_EXT.has(path.extname(entry.name))) out.push(full);
  }
}

const files = [];
walk(ROOT, files);

let hits = 0;
for (const f of files) {
  const content = readFileSync(f, "utf8");
  for (const [re, label] of PATTERNS) {
    if (re.test(content)) {
      console.error(`ERROR ${path.relative(ROOT, f)}: possible ${label}`);
      hits++;
    }
  }
}

// public/cv PDFs are binary and intentionally excluded from text scan; they are
// verified byte-identical to the pre-approved source in test.mjs instead.

console.log(`secret-scan: checked ${files.length} text file(s)`);
if (hits > 0) {
  console.error(`secret-scan FAILED: ${hits} finding(s)`);
  process.exit(1);
}
console.log("secret-scan PASSED: no known secret patterns found");
