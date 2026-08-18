// One-off verification: load the editor-iframe.ts source, extract the editor
// script template literal, evaluate it (the same way the app injects it into
// the preview iframe srcDoc), and assert that the INJECTED JavaScript still
// contains correctly escaped regex character classes. The bug we guard
// against: a template literal silently eating a single backslash escape,
// turning /\s+/ into /s+/ (which matches the letter "s").
import { readFileSync } from "node:fs";

const src = readFileSync(
  new URL("../apps/web/components/editor/editor-iframe.ts", import.meta.url),
  "utf8",
);

// Extract the template literal between `return \`<script>` and the closing `\`;`
const marker = "return `<script>";
const start = src.indexOf(marker);
if (start === -1) throw new Error("template literal start not found");
const openedBacktick = src.indexOf("`", start);
const body = src.slice(openedBacktick);
// find the matching closing backtick honoring escaped backticks
let depthIndex = -1;
for (let i = 1; i < body.length; i++) {
  const ch = body[i];
  if (ch === "\\") {
    i++; // skip escaped char
    continue;
  }
  if (ch === "`") {
    depthIndex = i;
    break;
  }
  if (ch === "$" && body[i + 1] === "{") {
    console.warn("template literal contains interpolation ${ ... }");
  }
}
if (depthIndex === -1) throw new Error("closing backtick not found");
const templateLiteral = body.slice(0, depthIndex + 1);

// Evaluate the template literal to get the actual injected script string.
const fn = new Function("return " + templateLiteral);
const injected = fn();

const checks = [
  // must appear in the INJECTED script with a single backslash (correct JS)
  { name: "className split whitespace", needle: "split(/\\s+/)" },
  { name: "layer text snippet collapse", needle: "replace(/\\s+/g,' ').trim()" },
  { name: "translate parser", needle: "/translate\\((-?[\\d.]+)px,\\s*(-?[\\d.]+)px\\)/" },
  { name: "matrix parsers", needle: "/matrix3d\\(([^)]+)\\)/" },
  { name: "edit overlay text normalize", needle: "rawText.replace(/\\s+/g,' ').trim()" },
];

let fail = 0;
for (const c of checks) {
  const ok = injected.includes(c.needle);
  console.log((ok ? "OK  " : "FAIL") + "  " + c.name);
  if (!ok) fail++;
}

// also ensure no residual double-escaped classes leaked into the injected code
const leaked = injected.split("\n").filter((l) => /\\\\[sdwbntr]/.test(l));
if (leaked.length) {
  console.log("\nDouble-escaped classes leaked into injected code:");
  leaked.forEach((l) => console.log("  " + l.trim()));
  fail += leaked.length;
}

process.exit(fail ? 1 : 0);
