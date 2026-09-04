#!/usr/bin/env node
// Zero-dependency WCAG 2.2 contrast check for every text/background color
// pair actually used in css/styles.css. No image, no external tool needed.

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance([r, g, b]) {
  const chan = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [r, g, b].map(chan);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA, hexB) {
  const lA = relLuminance(hexToRgb(hexA));
  const lB = relLuminance(hexToRgb(hexB));
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

// pairs: [label, foreground, background, minimum ratio required]
const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

const pairs = [
  ["body text on page background", "#e8ecf4", "#0a0e17", AA_NORMAL],
  ["dimmed paragraph text on page background", "#9aa5b8", "#0a0e17", AA_NORMAL],
  ["dimmed paragraph text on card background", "#9aa5b8", "#131926", AA_NORMAL],
  ["faint meta text on page background", "#828da6", "#0a0e17", AA_NORMAL],
  ["faint meta text on card background", "#828da6", "#131926", AA_NORMAL],
  ["accent eyebrow/link text on page background", "#5eead4", "#0a0e17", AA_NORMAL],
  ["primary button text on button background", "#04140f", "#5eead4", AA_NORMAL],
  ["heading text on raised case-study background", "#e8ecf4", "#10151f", AA_NORMAL],
  ["nav link text on header background", "#9aa5b8", "#0a0e17", AA_NORMAL],
];

let failures = 0;
for (const [label, fg, bg, min] of pairs) {
  const ratio = contrastRatio(fg, bg);
  const ok = ratio >= min;
  console.log(`${ok ? "ok" : "FAIL"}: ${label} — ${ratio.toFixed(2)}:1 (min ${min}:1)`);
  if (!ok) failures++;
}

if (failures > 0) {
  console.error(`a11y contrast FAILED: ${failures} pair(s) below WCAG 2.2 AA`);
  process.exit(1);
}
console.log("a11y contrast PASSED (WCAG 2.2 AA, all checked pairs)");
