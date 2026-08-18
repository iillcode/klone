import { NextRequest, NextResponse } from "next/server";
import puppeteerCore, { type Browser } from "puppeteer-core";

// Lazy-initialize browser instance
let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) {
    return browser;
  }

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // In development, use the system Chrome
    browser = await puppeteerCore.launch({
      headless: true,
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });
  } else {
    // In production (Cloudflare Workers), use @sparticuz/chromium
    const chromiumMod = await import("@sparticuz/chromium");
    const chromium: any = chromiumMod.default || chromiumMod;
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  return browser;
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

export async function POST(request: NextRequest) {
  try {
    const body: PdfGenerationOptions = await request.json();
    const { html, url, css, options } = body;

    if (!html && !url) {
      return NextResponse.json(
        { error: "Either 'html' or 'url' must be provided" },
        { status: 400 },
      );
    }

    const browser = await getBrowser();
    const page = await browser.newPage();

    // Set viewport to the EXACT A4 page size so layout is computed
    // exactly as it will print (794 x 1123 px = 210 x 297 mm at 96 DPI).
    // Puppeteer maps the viewport to the printable area, so content
    // laid out at 794px wide fills the A4 width, and any vh/100%-height
    // rule left in the template resolves to exactly ONE page — no
    // oversized fragments that make the PDF hard to scroll.
    await page.setViewport({
      width: 794,
      height: 1123,
    });

    // Set content
    if (html) {
      // If custom CSS provided, inject it
      let fullHtml = html;
      if (css) {
        const styleTag = `<style>${css}</style>`;
        fullHtml = fullHtml.replace(/<head>/i, `<head>${styleTag}`);
      }

      await page.setContent(fullHtml, { waitUntil: "load" });
    } else if (url) {
      await page.goto(url, { waitUntil: "load" });
    }

    // The export represents the editor preview, so retain screen-media styles
    // instead of allowing print media rules to alter the document's appearance.
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
      // The html (root) background paints the ENTIRE print canvas —
      // including every page-break gap — while the body box only covers
      // the flow area. A coloured <html> (app shells commonly ship
      // #161617) therefore shows up as dark strips around the page box
      // on EVERY PDF page. Make the root transparent so the body
      // background propagates to the canvas and all pages look uniform.
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
                image.addEventListener("error", () => resolve(), { once: true });
              }),
          ),
      );
    });

    // No PDF margins — the HTML handles its own inner padding via the body.
    const margin = {
      top: options?.margin?.top || "0",
      bottom: options?.margin?.bottom || "0",
      left: options?.margin?.left || "0",
      right: options?.margin?.right || "0",
    };

    const pdfOptions = {
      format: "a4" as const,
      landscape: options?.landscape || false,
      printBackground: options?.printBackground ?? true,
      scale: options?.scale || 1,
      margin,
      preferCSSPageSize: false,
    };

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    // Close the page (but keep browser open for reuse)
    await page.close();

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="document.pdf"',
      },
    });
  } catch (error) {
    console.error("[PDF Generation Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}

// Cleanup browser on process exit
process.on("exit", async () => {
  if (browser) {
    await browser.close();
  }
});
