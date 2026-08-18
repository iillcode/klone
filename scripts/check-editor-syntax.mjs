// Extract the injected editor script from editor-iframe.ts and syntax-check
// it. Guards against template-literal edits silently breaking the runtime.
import { readFileSync } from "node:fs";

const src = readFileSync(
  new URL("../apps/web/components/editor/editor-iframe.ts", import.meta.url),
  "utf8",
);
const marker = "return `<script>";
const start = src.indexOf(marker);
if (start === -1) throw new Error("template literal start not found");
const opened = src.indexOf("`", start);
const body = src.slice(opened);
let end = -1;
for (let i = 1; i < body.length; i++) {
  if (body[i] === "\\") { i++; continue; }
  if (body[i] === "`") { end = i; break; }
}
if (end === -1) throw new Error("closing backtick not found");
const lit = body.slice(0, end + 1);
const injected = new Function("return " + lit)();
const js = injected.replace(/^<script>/, "").replace(/<\/script>$/, "");
try {
  new Function(js);
  console.log("SYNTAX OK, injected length:", js.length);
} catch (e) {
  console.log("SYNTAX ERROR:", String(e));
  const m = String(e).match(/position (\d+)/);
  if (m) {
    const pos = +m[1];
    console.log("CONTEXT:\n", js.slice(Math.max(0, pos - 300), pos + 300));
  }
  process.exit(1);
}
