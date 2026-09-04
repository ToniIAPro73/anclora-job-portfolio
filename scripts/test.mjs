#!/usr/bin/env node
// Zero-dependency smoke tests: required sections exist in both locales,
// CV files are present and byte-identical to the approved source, images referenced exist.
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
let failures = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL: " + msg);
    failures++;
  } else {
    console.log("ok: " + msg);
  }
}

function sha256(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

const REQUIRED_IDS = ["top", "about", "experience", "anclora", "work", "case-study", "aos", "how-i-work", "skills", "open-to-work", "contact"];

for (const locale of ["index.html", "es/index.html"]) {
  const p = path.join(ROOT, locale);
  assert(existsSync(p), `${locale} exists`);
  const content = readFileSync(p, "utf8");
  for (const id of REQUIRED_IDS) {
    assert(content.includes(`id="${id}"`), `${locale} contains section #${id}`);
  }
  assert(content.includes('lang="en"') || content.includes('lang="es"'), `${locale} declares html lang`);
  assert(/<title>[^<]+<\/title>/.test(content), `${locale} has a non-empty <title>`);
  assert(content.includes('name="description"'), `${locale} has a meta description`);
}

// CV integrity: public copies must byte-match the approved source files.
const cvPairs = [
  ["public/cv/Toni-Ballesteros-CV-EN.pdf", "../job-portfolio-input/cv/CV_Antonio_Ballesteros_EN_sin_foto.pdf"],
  ["public/cv/Toni-Ballesteros-CV-ES.pdf", "../job-portfolio-input/cv/CV_Antonio_Ballesteros_ES_sin_foto.pdf"],
];
for (const [pub, src] of cvPairs) {
  const pubPath = path.join(ROOT, pub);
  const srcPath = path.join(ROOT, src);
  assert(existsSync(pubPath), `${pub} exists`);
  if (existsSync(srcPath) && existsSync(pubPath)) {
    assert(sha256(pubPath) === sha256(srcPath), `${pub} is byte-identical to approved source`);
  }
}

// Referenced local images must exist on disk.
for (const locale of ["index.html", "es/index.html"]) {
  const dir = path.dirname(path.join(ROOT, locale));
  const content = readFileSync(path.join(ROOT, locale), "utf8");
  const imgSrcs = [...content.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  for (const src of imgSrcs) {
    const resolved = path.resolve(dir, src);
    assert(existsSync(resolved), `${locale}: referenced image ${src} exists`);
  }
}

if (failures > 0) {
  console.error(`test FAILED: ${failures} failure(s)`);
  process.exit(1);
}
console.log("test PASSED");
