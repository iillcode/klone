import { NextRequest, NextResponse } from "next/server";

/**
 * PDF generation works in two completely separate modes:
 *
 * 1. PRODUCTION (Cloudflare Workers) → Cloudflare Browser Run. The route
 *    grabs the `BROWSER` binding that OpenNext exposes on the Cloudflare
 *    context and calls its `quickAction("pdf", ...)` endpoint. Nothing is
 *    installed or bundled — the browser runs on Cloudflare's infrastructure.
 *    IMPORTANT: puppeteer/chromium must NEVER be imported at the top level
 *    here; OpenNext bundles the server with esbuild and a static
 *    `import "puppeteer-core"` crashes the bundle (unresolvable bidi dynamic
 *    imports) — and a local Chromium could not run in a Worker anyway.
 *
 * 2. LOCAL DEV (`next dev`, Node.js) → the system Chrome via puppeteer-core,
 *    loaded through an INDIRECT dynamic import (non-literal specifier) so the
 *    bundler cannot resolve it into the worker bundle, but the Node dev
 *    runtime resolves it normally at request time.
 */

// Minimal shape of the Cloudflare Browser Run workers binding.
type BrowserRunBinding = {
  quickAction(action: string, options?: unknown): Promise<Response>;
};

/** Reads the `BROWSER` binding from the Cloudflare context (workers only). */
function getBrowserRunBinding(): BrowserRunBinding | null {
  const ctx = (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("__cloudflare-context__")
  ] as { env?: { BROWSER?: BrowserRunBinding } } | undefined;
  return ctx?.env?.BROWSER ?? null;
}

export interface PdfGenerationOptions {
  html?: string;
  url?: string;
  css?: string;
  options?: {
    format?: "a4" | "letter" | "legal" | "tabloid";
    landscape?: boolean;
    margin?: {
      top?: string;
      bottom?: string;
      left?: string;
      right?: string;
    };
    scale?: number;
    printBackground?: boolean;
  };
}

/** Shared print options for both engines. No PDF margins — the HTML handles
 *  its own inner padding. Viewport is the EXACT A4 page (210x297mm at 96dpi)
 *  so layout computes exactly as it will print and any leftover vh/100% rule
 *  resolves to exactly ONE page. */
function printOptions(options: PdfGenerationOptions["options"]) {
  return {
    format: "a4" as const,
    landscape: options?.landscape || false,
    printBackground: options?.printBackground ?? true,
    scale: options?.scale || 1,
    margin: {
      top: options?.margin?.top || "0",
      bottom: options?.margin?.bottom || "0",
      left: options?.margin?.left || "0",
      right: options?.margin?.right || "0",
    },
    preferCSSPageSize: false,
  };
}

// ── Production: Cloudflare Browser Run (browser binding quick action) ──

async function renderWithBrowserRun(
  binding: BrowserRunBinding,
  body: PdfGenerationOptions,
) {
  const payload: Record<string, unknown> = {
    viewport: { width: 794, height: 1123 },
    pdfOptions: printOptions(body.options),
    gotoOptions: { waitUntil: "networkidle0" },
  };
  if (body.html) {
    payload.html = body.html;
    if (body.css) payload.addStyleTag = [{ content: body.css }];
  } else if (body.url) {
    payload.url = body.url;
  }

  const res = await binding.quickAction("pdf", payload);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Browser Run PDF failed (${res.status}): ${errText}`);
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="document.pdf"',
    },
  });
}

// ── Local dev: system Chrome via puppeteer-core (Node runtime only) ──

let devBrowser: {
  connected: boolean;
  newPage: () => Promise<any>;
  close: () => Promise<void>;
} | null = null;

async function getDevBrowser() {
  if (devBrowser && devBrowser.connected) return devBrowser;
  // Indirect (NON-literal) specifier: keeps esbuild — which bundles the
  // production Worker — from ever seeing/inlining puppeteer-core, while the
  // local Node dev runtime still resolves the package normally.
  const pkg = "puppeteer-core";
  const puppeteer = (await import(/* webpackIgnore: true */ pkg)).default;
  const launched = await puppeteer.launch({
    headless: true,
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
  devBrowser = launched;
  return launched;
}

async function renderWithLocalChrome(body: PdfGenerationOptions) {
  const browser = await getDevBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 794, height: 1123 });

    if (body.html) {
      let fullHtml = body.html;
      if (body.css) {
        const styleTag = `<style>${body.css}</style>`;
        fullHtml = fullHtml.replace(/<head>/i, `<head>${styleTag}`);
      }
      await page.setContent(fullHtml, { waitUntil: "load" });
    } else if (body.url) {
      await page.goto(body.url, { waitUntil: "load" });
    }

    // The export represents the editor preview: keep screen-media styles
    // instead of letting print rules alter the document's appearance.
    await page.emulateMediaType("screen");
    await page.evaluate(async () => {
      const rootStyle = document.documentElement.style;
      const bodyStyle = document.body.style;
      const bodyComputed = getComputedStyle(document.body).backgroundColor;
      if (
        bodyComputed === "transparent" ||
        bodyComputed === "rgba(0, 0, 0, 0)"
      ) {
        bodyStyle.backgroundColor = "rgb(30, 30, 30)";
      }
      // The <html> root background paints the ENTIRE print canvas
      // (including page-break gaps); a coloured root (app shells commonly
      // ship #161617) shows as dark strips around the page box on EVERY
      // PDF page. Make the root transparent so the body background
      // propagates to the canvas and all pages look uniform.
      rootStyle.backgroundColor = "transparent";
      rootStyle.background = "transparent";

      await document.fonts?.ready;
      await Promise.all(
        Array.from(document.images)
          .filter((image) => !image.complete)
          .map(
            (image) =>
              new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve(), { once: true });
                image.addEventListener("error", () => resolve(), {
                  once: true,
                });
              }),
          ),
      );
    });

    const pdfBuffer: Buffer = await page.pdf(printOptions(body.options));
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="document.pdf"',
      },
    });
  } finally {
    await page.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PdfGenerationOptions = await request.json();

    if (!body.html && !body.url) {
      return NextResponse.json(
        { error: "Either 'html' or 'url' must be provided" },
        { status: 400 },
      );
    }

    // Production (Cloudflare Workers): Browser Run binding.
    const binding = getBrowserRunBinding();
    if (binding) {
      return await renderWithBrowserRun(binding, body);
    }

    // Local dev (Node): system Chrome.
    if (process.env.NODE_ENV === "development") {
      return await renderWithLocalChrome(body);
    }

    return NextResponse.json(
      { error: "PDF rendering is not configured (no BROWSER binding)" },
      { status: 500 },
    );
  } catch (error) {
    console.error("[PDF Generation Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
