#!/usr/bin/env node
// "Build" for a static site with no bundler: verify every local href/src
// resolves to a real file, so a broken link never ships.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
let errors = 0;

function checkFile(file) {
  const dir = path.dirname(file);
  const content = readFileSync(file, "utf8");
  const refs = [
    ...[...content.matchAll(/href="([^"]+)"/g)].map((m) => m[1]),
    ...[...content.matchAll(/src="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const ref of refs) {
    if (ref.startsWith("http") || ref.startsWith("mailto:") || ref.startsWith("#") || ref.startsWith("//")) continue;
    const clean = ref.split("#")[0];
    if (!clean) continue;
    const resolved = path.resolve(dir, clean);
    if (!existsSync(resolved)) {
      console.error(`ERROR ${path.relative(ROOT, file)}: broken local reference "${ref}"`);
      errors++;
    }
  }
}

for (const f of ["index.html", "es/index.html"]) {
  checkFile(path.join(ROOT, f));
}

if (errors > 0) {
  console.error(`build FAILED: ${errors} broken reference(s)`);
  process.exit(1);
}
console.log("build PASSED: all local references resolve");
