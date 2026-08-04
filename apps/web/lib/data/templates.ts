/**
 * Starter document templates used by the dashboard "New from template" flow.
 * Each template is a self-contained HTML document (embedded <style> allowed)
 * that the editor can load and the PDF endpoint can render.
 *
 * NOTE: templates do NOT embed the editor script — `HtmlPreview.injectEditorScript`
 * adds it at render time via `</body>` replacement.
 */

export interface Colors {
  body: string;
  h1: string;
  h2: string;
  h3: string;
  muted: string;
  subtle: string;
  border: string;
  tableTh: string;
  tableTd: string;
  tdCode: string;
  tagBg: string;
  tagFg: string;
  codeBg: string;
  codeBorder: string;
  codeFg: string;
  comment: string;
  key: string;
  str: string;
  num: string;
  bool: string;
  methodHl: string;
  footer: string;
  statusBorder: string;
  method: {
    get: { bg: string; fg: string };
    post: { bg: string; fg: string };
    put: { bg: string; fg: string };
    del: { bg: string; fg: string };
  };
  path: string;
  desc: string;
  scrollThumb: string;
  scrollThumbHover: string;
}

export const dark: Colors = {
  body: "#e4e4e7",
  h1: "#f4f4f5",
  h2: "#f4f4f5",
  h3: "#d4d4d8",
  muted: "#a1a1aa",
  subtle: "#71717a",
  border: "#27272a",
  tableTh: "#a1a1aa",
  tableTd: "#d4d4d8",
  tdCode: "#c084fc",
  tagBg: "#1e1e21",
  tagFg: "#a1a1aa",
  codeBg: "#0a0a0b",
  codeBorder: "#27272a",
  codeFg: "#d4d4d8",
  comment: "#71717a",
  key: "#c084fc",
  str: "#4ade80",
  num: "#facc15",
  bool: "#60a5fa",
  methodHl: "#f87171",
  footer: "#52525b",
  statusBorder: "#27272a",
  path: "#e4e4e7",
  desc: "#a1a1aa",
  scrollThumb: "#3f3f46",
  scrollThumbHover: "#52525b",
  method: {
    get: { bg: "#1a3a2a", fg: "#4ade80" },
    post: { bg: "#1e2a4a", fg: "#60a5fa" },
    put: { bg: "#2a2a1a", fg: "#facc15" },
    del: { bg: "#3a1a1a", fg: "#f87171" },
  },
};

export const light: Colors = {
  body: "#18181b",
  h1: "#111111",
  h2: "#111111",
  h3: "#27272a",
  muted: "#52525b",
  subtle: "#71717a",
  border: "#e4e4e7",
  tableTh: "#52525b",
  tableTd: "#27272a",
  tdCode: "#7c3aed",
  tagBg: "#f4f4f5",
  tagFg: "#52525b",
  codeBg: "#fafafa",
  codeBorder: "#e4e4e7",
  codeFg: "#18181b",
  comment: "#9ca3af",
  key: "#7c3aed",
  str: "#16a34a",
  num: "#ca8a04",
  bool: "#2563eb",
  methodHl: "#dc2626",
  footer: "#a1a1aa",
  statusBorder: "#e4e4e7",
  path: "#18181b",
  desc: "#52525b",
  scrollThumb: "#d4d4d8",
  scrollThumbHover: "#a1a1aa",
  method: {
    get: { bg: "#dcfce7", fg: "#166534" },
    post: { bg: "#dbeafe", fg: "#1e40af" },
    put: { bg: "#fef9c3", fg: "#854d0e" },
    del: { bg: "#fee2e2", fg: "#991b1b" },
  },
};

/** The classic "PDF Generator API" documentation page. */
export function buildHtml(c: Colors): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Generator API - Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { overflow: hidden; height: 100%; }
    body { font-family: system-ui, -apple-system, sans-serif; background: transparent; color: ${c.body}; line-height: 1.5; }
    .scroll-wrapper { height: 100%; overflow-y: auto; padding: 2.5rem; max-width: 794px; margin: 0 auto; scrollbar-width: thin; scrollbar-color: ${c.scrollThumb} transparent; }
    .scroll-wrapper::-webkit-scrollbar { width: 10px; }
    .scroll-wrapper::-webkit-scrollbar-track { background: transparent; }
    .scroll-wrapper::-webkit-scrollbar-thumb { background-color: ${c.scrollThumb}; border-radius: 9999px; border: 3px solid transparent; background-clip: content-box; }
    .scroll-wrapper::-webkit-scrollbar-thumb:hover { background-color: ${c.scrollThumbHover}; background-clip: content-box; }
    .header { margin-bottom: 2rem; border-bottom: 1px solid ${c.border}; padding-bottom: 1.5rem; }
    .header h1 { font-size: 1.75rem; font-weight: 700; color: ${c.h1}; letter-spacing: -0.02em; }
    .header .subtitle { color: ${c.muted}; margin-top: 0.25rem; font-size: 0.875rem; }
    .header .meta { display: flex; gap: 1.5rem; margin-top: 0.75rem; font-size: 0.8rem; color: ${c.subtle}; }
    .section { margin-bottom: 2rem; }
    .section h2 { font-size: 1.1rem; font-weight: 600; color: ${c.h2}; margin-bottom: 0.75rem; letter-spacing: -0.01em; }
    .section h3 { font-size: 0.95rem; font-weight: 600; color: ${c.h3}; margin-bottom: 0.5rem; margin-top: 1rem; }
    .section p { color: ${c.muted}; font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem; }
    .endpoint { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .method { display: inline-block; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .method.get { background: ${c.method.get.bg}; color: ${c.method.get.fg}; }
    .method.post { background: ${c.method.post.bg}; color: ${c.method.post.fg}; }
    .method.put { background: ${c.method.put.bg}; color: ${c.method.put.fg}; }
    .method.delete { background: ${c.method.del.bg}; color: ${c.method.del.fg}; }
    .path { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.85rem; color: ${c.path}; }
    .desc { color: ${c.desc}; font-size: 0.85rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.25rem; font-size: 0.8rem; }
    th { text-align: left; padding: 0.5rem 0.75rem; color: ${c.tableTh}; font-weight: 600; border-bottom: 1px solid ${c.border}; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #1a1a1d; color: ${c.tableTd}; }
    td:first-child { font-family: 'SF Mono', 'Fira Code', monospace; color: ${c.tdCode}; }
    td .tag { display: inline-block; font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 3px; background: ${c.tagBg}; color: ${c.tagFg}; font-family: system-ui; }
    .code-block { background: ${c.codeBg}; border: 1px solid ${c.codeBorder}; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; overflow-x: auto; }
    .code-block pre { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8rem; color: ${c.codeFg}; line-height: 1.6; white-space: pre; }
    .code-block .comment { color: ${c.comment}; }
    .code-block .key { color: ${c.key}; }
    .code-block .string { color: ${c.str}; }
    .code-block .number { color: ${c.num}; }
    .code-block .bool { color: ${c.bool}; }
    .code-block .method-hl { color: ${c.methodHl}; }
    .status-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; margin-bottom: 0.5rem; border-bottom: 1px solid ${c.statusBorder}; }
    .status-bar .label { color: ${c.subtle}; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid ${c.border}; display: flex; justify-content: space-between; font-size: 0.75rem; color: ${c.footer}; }
  </style>
</head>
<body>
  <div class="scroll-wrapper">
    <div class="header">
      <h1>PDF Generator API</h1>
    <div class="subtitle">RESTful API for programmatic PDF document generation — v2.1.0</div>
    <div class="meta">
      <span>Base URL: https://api.pdfgen.dev/v2</span>
      <span>Auth: Bearer Token</span>
      <span>Format: JSON</span>
    </div>
  </div>

  <div class="section">
    <h2>Generate PDF</h2>
    <p>Creates a PDF document from HTML content or a template ID. Returns a presigned download URL.</p>

    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/documents</span>
    </div>

    <h3>Request Body</h3>
    <table>
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>template_id</td>
          <td>string <span class="tag">uuid</span></td>
          <td>conditional*</td>
          <td>ID of a pre-registered template</td>
        </tr>
        <tr>
          <td>html</td>
          <td>string</td>
          <td>conditional*</td>
          <td>Raw HTML content to render</td>
        </tr>
        <tr>
          <td>options.page_size</td>
          <td>string</td>
          <td>optional</td>
          <td>A4, Letter, or custom (default: A4)</td>
        </tr>
        <tr>
          <td>options.margin</td>
          <td>number</td>
          <td>optional</td>
          <td>Margin in mm (default: 20)</td>
        </tr>
        <tr>
          <td>options.orientation</td>
          <td>string</td>
          <td>optional</td>
          <td>portrait or landscape</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size:0.8rem;color:${c.subtle};">* Either template_id or html is required.</p>

    <h3>Example Request</h3>
    <div class="code-block">
      <pre><span class="method-hl">POST</span> https://api.pdfgen.dev/v2/documents
<span class="key">Authorization</span>: Bearer sk_live_abc123def456

{<span class="comment">
  "Use a pre-registered template":</span>
  <span class="key">"template_id"</span>: <span class="string">"tmpl_9a8b7c6d"</span>,<span class="comment">
  "Or inline HTML":</span>
  <span class="key">"html"</span>: <span class="string">"<h1>Hello</h1><p>World</p>"</span>,
  <span class="key">"options"</span>: {
    <span class="key">"page_size"</span>: <span class="string">"A4"</span>,
    <span class="key">"margin"</span>: <span class="number">20</span>,
    <span class="key">"orientation"</span>: <span class="string">"portrait"</span>
  },
  <span class="key">"metadata"</span>: {
    <span class="key">"title"</span>: <span class="string">"Invoice #1024"</span>,
    <span class="key">"tags"</span>: [<span class="string">"invoice"</span>, <span class="string">"production"</span>]
  }
}</pre>
    </div>

    <h3>Example Response</h3>
    <div class="code-block">
      <pre>{
  <span class="key">"id"</span>: <span class="string">"doc_e3f2a1b0"</span>,
  <span class="key">"status"</span>: <span class="string">"completed"</span>,
  <span class="key">"download_url"</span>: <span class="string">"https://storage.pdfgen.dev/d/e3f2a1b0.pdf?X-Amz-Signature=..."</span>,
  <span class="key">"expires_in"</span>: <span class="number">3600</span>,
  <span class="key">"pages"</span>: <span class="number">4</span>,
  <span class="key">"size_bytes"</span>: <span class="number">128_420</span>,
  <span class="key">"created_at"</span>: <span class="string">"2026-03-15T10:30:00Z"</span>
}</pre>
    </div>
  </div>

  <div class="section">
    <h2>Manage Templates</h2>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/templates</span>
      <span class="desc">List all templates with pagination</span>
    </div>

    <table>
      <thead>
        <tr><th>Query Param</th><th>Type</th><th>Default</th><th>Description</th></tr>
      </thead>
      <tbody>
        <tr><td>page</td><td>integer</td><td>1</td><td>Page number</td></tr>
        <tr><td>per_page</td><td>integer</td><td>20</td><td>Items per page (max 100)</td></tr>
        <tr><td>search</td><td>string</td><td>—</td><td>Filter by name</td></tr>
      </tbody>
    </table>

    <div class="endpoint">
      <span class="method put">PUT</span>
      <span class="path">/templates/:id</span>
      <span class="desc">Update a template's HTML or options</span>
    </div>

    <div class="endpoint">
      <span class="method delete">DELETE</span>
      <span class="path">/templates/:id</span>
      <span class="desc">Remove a template permanently</span>
    </div>
  </div>

  <div class="status-bar">
    <span class="label">Status</span>
    <span style="color:#4ade80;font-size:0.85rem;">● All systems operational</span>
  </div>

  <div class="footer">
    <span>PDF Generator API — v2.1.0</span>
    <span>Generated 2026-07-29</span>
  </div>
  </div>
</body>
</html>`;
}

const BLANK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Untitled Document</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { overflow: hidden; height: 100%; }
    body { font-family: system-ui, -apple-system, sans-serif; background: transparent; color: #e4e4e7; line-height: 1.5; }
    .scroll-wrapper { height: 100%; overflow-y: auto; padding: 2.5rem; max-width: 794px; margin: 0 auto; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #f4f4f5; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
    p { color: #a1a1aa; font-size: 0.9rem; max-width: 34rem; }
  </style>
</head>
<body>
  <div class="scroll-wrapper">
    <h1>Untitled Document</h1>
    <p>Start from scratch. Press V to enter inspect mode, select an element to edit its properties, and double-click any text to edit it in place.</p>
  </div>
</body>
</html>`;

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acme — Landing Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { overflow: hidden; height: 100%; }
    body { font-family: system-ui, -apple-system, sans-serif; background: transparent; color: #e4e4e7; line-height: 1.5; }
    .scroll-wrapper { height: 100%; overflow-y: auto; padding: 2.5rem; max-width: 794px; margin: 0 auto; scrollbar-width: thin; scrollbar-color: #3f3f46 transparent; }
    .nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
    .logo { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.5rem; }
    .logo .mark { width: 1.5rem; height: 1.5rem; border-radius: 6px; background: #22c55e; display: inline-flex; align-items: center; justify-content: center; color: #052e16; font-weight: 800; font-size: 0.8rem; }
    .nav-links { display: flex; gap: 1.5rem; font-size: 0.85rem; color: #a1a1aa; }
    .nav-cta { background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7; font-size: 0.8rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px; }
    .hero { text-align: center; padding: 2rem 0 3rem; border-bottom: 1px solid #27272a; margin-bottom: 3rem; }
    .hero .badge { display: inline-flex; align-items: center; gap: 0.4rem; background: #1a3a2a; color: #4ade80; font-size: 0.75rem; font-weight: 600; padding: 0.3rem 0.75rem; border-radius: 9999px; margin-bottom: 1.25rem; }
    .hero h1 { font-size: 2.75rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin-bottom: 1rem; }
    .hero h1 .accent { color: #22c55e; }
    .hero p { color: #a1a1aa; font-size: 1.1rem; max-width: 34rem; margin: 0 auto 1.75rem; }
    .hero .cta-row { display: flex; gap: 0.75rem; justify-content: center; }
    .cta { display: inline-flex; align-items: center; gap: 0.5rem; background: #22c55e; color: #052e16; font-weight: 600; font-size: 0.9rem; padding: 0.7rem 1.5rem; border-radius: 10px; }
    .cta.secondary { background: transparent; border: 1px solid #3f3f46; color: #e4e4e7; }
    .logo-strip { display: flex; justify-content: space-between; align-items: center; color: #52525b; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 3rem; }
    .section { margin-bottom: 3rem; }
    .section-head { text-align: center; margin-bottom: 2rem; }
    .section-head .eyebrow { color: #22c55e; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
    .section-head h2 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
    .section-head p { color: #a1a1aa; font-size: 0.95rem; }
    .features { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
    .feature { border: 1px solid #27272a; border-radius: 12px; padding: 1.5rem; background: rgba(39, 39, 42, 0.25); }
    .feature .icon { width: 2.5rem; height: 2.5rem; border-radius: 8px; background: #1e2a4a; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; margin-bottom: 1rem; }
    .feature h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.4rem; }
    .feature p { font-size: 0.85rem; color: #a1a1aa; }
    .steps { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
    .step { border: 1px solid #27272a; border-radius: 12px; padding: 1.5rem; }
    .step .num { font-size: 0.8rem; font-weight: 700; color: #22c55e; margin-bottom: 0.75rem; }
    .step h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.4rem; }
    .step p { font-size: 0.85rem; color: #a1a1aa; }
    .testimonials { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
    .quote { border: 1px solid #27272a; border-radius: 12px; padding: 1.5rem; background: rgba(39, 39, 42, 0.25); }
    .quote .stars { color: #facc15; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .quote p { font-size: 0.9rem; color: #d4d4d8; margin-bottom: 1rem; }
    .quote .who { display: flex; align-items: center; gap: 0.75rem; }
    .quote .avatar { width: 2rem; height: 2rem; border-radius: 9999px; background: #3f3f46; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: #e4e4e7; }
    .quote .who .name { font-size: 0.85rem; font-weight: 600; }
    .quote .who .role { font-size: 0.75rem; color: #71717a; }
    .pricing { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
    .plan { border: 1px solid #27272a; border-radius: 12px; padding: 1.5rem; }
    .plan.highlight { border-color: #22c55e; background: rgba(34, 197, 94, 0.06); }
    .plan .plan-name { font-size: 0.85rem; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.75rem; }
    .plan .price { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
    .plan .price span { font-size: 0.85rem; font-weight: 400; color: #71717a; }
    .plan .plan-desc { font-size: 0.8rem; color: #a1a1aa; margin-bottom: 1rem; }
    .plan ul { list-style: none; font-size: 0.85rem; color: #d4d4d8; margin-bottom: 1.25rem; }
    .plan li { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
    .plan li::before { content: "✓"; color: #22c55e; font-weight: 700; }
    .plan .plan-cta { display: block; text-align: center; background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7; font-size: 0.85rem; font-weight: 600; padding: 0.6rem 1rem; border-radius: 8px; }
    .plan.highlight .plan-cta { background: #22c55e; border-color: #22c55e; color: #052e16; }
    .faq { max-width: 36rem; margin: 0 auto; }
    .faq-item { border-bottom: 1px solid #27272a; padding: 1rem 0; }
    .faq-item h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.35rem; }
    .faq-item p { font-size: 0.85rem; color: #a1a1aa; }
    .cta-band { text-align: center; border: 1px solid #27272a; border-radius: 16px; padding: 3rem 2rem; background: linear-gradient(180deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02)); margin-bottom: 3rem; }
    .cta-band h2 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
    .cta-band p { color: #a1a1aa; font-size: 0.95rem; margin-bottom: 1.5rem; }
    .footer { border-top: 1px solid #27272a; padding-top: 1.5rem; display: flex; justify-content: space-between; font-size: 0.75rem; color: #71717a; }
    .footer .links { display: flex; gap: 1.25rem; }
  </style>
</head>
<body>
  <div class="scroll-wrapper">
    <div class="nav">
      <div class="logo"><span class="mark">A</span> Acme</div>
      <div class="nav-links"><span>Product</span><span>Pricing</span><span>Docs</span></div>
      <span class="nav-cta">Sign in</span>
    </div>

    <div class="hero">
      <span class="badge">● New — PDF API v2 is live</span>
      <h1>Ship beautiful PDFs<br/>from plain <span class="accent">HTML</span></h1>
      <p>Acme converts your HTML templates into pixel-perfect PDF documents — fast, styled, and secure. Ready to download or embed.</p>
      <div class="cta-row">
        <span class="cta">Get started free</span>
        <span class="cta secondary">View documentation</span>
      </div>
    </div>

    <div class="logo-strip"><span>Trusted by teams at</span><span>Nimbus</span><span>Vertex</span><span>Orbit</span><span>Halcyon</span><span>Prism</span></div>

    <div class="section">
      <div class="section-head">
        <div class="eyebrow">Features</div>
        <h2>Everything you need to ship PDFs</h2>
        <p>A complete toolkit for generating, styling, and delivering documents.</p>
      </div>
      <div class="features">
        <div class="feature"><div class="icon">⚡</div><h3>Fast rendering</h3><p>Server-side PDF generation in milliseconds with a global edge network.</p></div>
        <div class="feature"><div class="icon">🎨</div><h3>Full styling</h3><p>Custom CSS, web fonts, and theme support for pixel-perfect output.</p></div>
        <div class="feature"><div class="icon">🔒</div><h3>Secure</h3><p>Documents are private to your account with granular API keys.</p></div>
        <div class="feature"><div class="icon">🧩</div><h3>Templates</h3><p>Reusable HTML templates with merge fields for dynamic content.</p></div>
        <div class="feature"><div class="icon">📊</div><h3>Analytics</h3><p>Track views, downloads, and generation volume in real time.</p></div>
        <div class="feature"><div class="icon">🔌</div><h3>Webhooks</h3><p>Async callbacks when generation completes or a document is viewed.</p></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <div class="eyebrow">How it works</div>
        <h2>Up and running in minutes</h2>
      </div>
      <div class="steps">
        <div class="step"><div class="num">01</div><h3>Design</h3><p>Build an HTML template in the Klone editor or bring your own markup.</p></div>
        <div class="step"><div class="num">02</div><h3>Generate</h3><p>Call the API — we render it server-side into a high-fidelity PDF.</p></div>
        <div class="step"><div class="num">03</div><h3>Deliver</h3><p>Download, share, or embed the result anywhere in your product.</p></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <div class="eyebrow">Testimonials</div>
        <h2>Loved by developers</h2>
      </div>
      <div class="testimonials">
        <div class="quote"><div class="stars">★★★★★</div><p>“Replaced our flaky PDF pipeline overnight. Output is consistently pixel-perfect.”</p><div class="who"><span class="avatar">SK</span><div><div class="name">Sara Khan</div><div class="role">Staff Eng, Nimbus</div></div></div></div>
        <div class="quote"><div class="stars">★★★★★</div><p>“The editor makes creating templates feel like Figma. Our sales team ships decks weekly.”</p><div class="who"><span class="avatar">JM</span><div><div class="name">Jonas Meyer</div><div class="role">Growth Lead, Orbit</div></div></div></div>
        <div class="quote"><div class="stars">★★★★☆</div><p>“Simple API, beautiful output, and the webhook flow just works. Highly recommended.”</p><div class="who"><span class="avatar">AT</span><div><div class="name">Aisha Turner</div><div class="role">CTO, Prism</div></div></div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <div class="eyebrow">Pricing</div>
        <h2>Simple, transparent pricing</h2>
      </div>
      <div class="pricing">
        <div class="plan"><div class="plan-name">Starter</div><div class="price">$0<span>/mo</span></div><div class="plan-desc">For side projects and evaluation.</div><ul><li>100 PDFs / month</li><li>1 template</li><li>Community support</li></ul><span class="plan-cta">Start free</span></div>
        <div class="plan highlight"><div class="plan-name">Pro</div><div class="price">$29<span>/mo</span></div><div class="plan-desc">For growing teams.</div><ul><li>10,000 PDFs / month</li><li>Unlimited templates</li><li>Webhooks & analytics</li></ul><span class="plan-cta">Choose Pro</span></div>
        <div class="plan"><div class="plan-name">Enterprise</div><div class="price">Custom</div><div class="plan-desc">For large organizations.</div><ul><li>Unlimited volume</li><li>SSO & audit logs</li><li>Priority support</li></ul><span class="plan-cta">Contact sales</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <div class="eyebrow">FAQ</div>
        <h2>Frequently asked questions</h2>
      </div>
      <div class="faq">
        <div class="faq-item"><h3>Which browsers and formats do you support?</h3><p>We render with a modern Chromium engine and support A4, Letter, Legal, and custom page sizes.</p></div>
        <div class="faq-item"><h3>Can I use custom fonts?</h3><p>Yes — link web fonts in your template and they are bundled into the PDF output automatically.</p></div>
        <div class="faq-item"><h3>Is my data secure?</h3><p>All documents are scoped to your account, encrypted in transit and at rest, with strict access controls.</p></div>
      </div>
    </div>

    <div class="cta-band">
      <h2>Ready to ship your first PDF?</h2>
      <p>Create a document from a template or start from a blank canvas — it takes less than a minute.</p>
      <span class="cta">Get started</span>
    </div>

    <div class="footer">
      <span>© 2026 Acme, Inc.</span>
      <div class="links"><span>Privacy</span><span>Terms</span><span>Status</span></div>
    </div>
  </div>
</body>
</html>`;

const EMAIL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome — Email Template</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { overflow: hidden; height: 100%; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f4f4f5; color: #27272a; line-height: 1.5; }
    .scroll-wrapper { height: 100%; overflow-y: auto; max-width: 794px; margin: 0 auto; padding: 2.5rem; scrollbar-width: thin; scrollbar-color: #d4d4d8 transparent; }
    .card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .email-top { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #e4e4e7; font-size: 0.75rem; color: #a1a1aa; }
    .email-top .brand { font-weight: 700; color: #27272a; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
    .email-top .brand .mark { width: 1.25rem; height: 1.25rem; border-radius: 5px; background: #22c55e; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; }
    .hero-banner { background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; padding: 2.5rem 2rem; text-align: center; }
    .hero-banner .eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.85; margin-bottom: 0.5rem; }
    .hero-banner h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
    .hero-banner p { font-size: 0.95rem; opacity: 0.9; }
    .content { padding: 2rem; }
    .content h2 { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem; }
    .content p { color: #52525b; font-size: 0.95rem; margin-bottom: 1rem; }
    .checks { list-style: none; margin: 0 0 1.5rem; }
    .checks li { display: flex; gap: 0.6rem; align-items: flex-start; margin-bottom: 0.6rem; font-size: 0.9rem; color: #3f3f46; }
    .checks li::before { content: "✓"; flex: 0 0 auto; width: 1.25rem; height: 1.25rem; border-radius: 9999px; background: #dcfce7; color: #16a34a; font-size: 0.7rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; margin-top: 0.1rem; }
    .btn { display: inline-block; background: #22c55e; color: #ffffff; font-weight: 600; font-size: 0.9rem; padding: 0.75rem 1.5rem; border-radius: 10px; text-align: center; }
    .btn-wrap { text-align: center; margin: 1.5rem 0; }
    .note { background: #f8fafc; border: 1px solid #e4e4e7; border-radius: 10px; padding: 1rem 1.25rem; font-size: 0.8rem; color: #71717a; margin-top: 1.5rem; }
    .divider { height: 1px; background: #e4e4e7; margin: 1.5rem 0; }
    .socials { display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1.25rem; }
    .socials span { width: 2rem; height: 2rem; border-radius: 9999px; border: 1px solid #e4e4e7; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; color: #52525b; }
    .footer { text-align: center; padding: 0 2rem 1.5rem; font-size: 0.75rem; color: #a1a1aa; }
    .footer .addr { margin-bottom: 0.5rem; }
    .footer .links { display: flex; justify-content: center; gap: 1.25rem; margin-bottom: 0.75rem; }
  </style>
</head>
<body>
  <div class="scroll-wrapper">
    <div class="card">
      <div class="email-top">
        <span class="brand"><span class="mark">A</span> Acme</span>
        <span>Having trouble? <strong style="color:#52525b;">View in browser</strong></span>
      </div>

      <div class="hero-banner">
        <div class="eyebrow">Welcome aboard</div>
        <h1>Thanks for signing up 🎉</h1>
        <p>Your Acme account is ready — here's how to get the most out of it.</p>
      </div>

      <div class="content">
        <h2>You're all set</h2>
        <p>Hi there, we're excited to have you on board. Confirm your email address to unlock everything below:</p>
        <ul class="checks">
          <li>Create unlimited PDF documents from HTML</li>
          <li>Edit templates visually in the Klone editor</li>
          <li>Export pixel-perfect PDFs with one click</li>
        </ul>

        <div class="btn-wrap">
          <span class="btn">Confirm my email</span>
        </div>

        <div class="note">
          <strong>Tip:</strong> start with the API Docs template to see what the editor can do — then make it your own.
        </div>
      </div>

      <div class="divider"></div>

      <div class="socials">
        <span>𝕏</span><span>in</span><span>▶</span><span>◎</span>
      </div>

      <div class="footer">
        <div class="addr">Acme, Inc. · 100 Market Street, Suite 400 · San Francisco, CA 94105</div>
        <div class="links"><span>Privacy Policy</span><span>Terms of Service</span><span>Unsubscribe</span></div>
        <div>You received this email because you signed up for an Acme account.</div>
        <div style="margin-top:0.5rem;">© 2026 Acme, Inc. · Generated with Klone</div>
      </div>
    </div>
  </div>
</body>
</html>`;

export interface Template {
  id: string;
  name: string;
  html: string;
}

/** Templates keyed by their route slug (used by LandingCards + preview/[id]). */
export const TEMPLATES: Record<string, Template> = {
  blank: { id: "blank", name: "Blank HTML", html: BLANK_HTML },
  "api-docs": { id: "api-docs", name: "API Docs", html: buildHtml(dark) },
  "landing-page": {
    id: "landing-page",
    name: "Landing Page",
    html: LANDING_HTML,
  },
  email: { id: "email", name: "Email Template", html: EMAIL_HTML },
};

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES[slug];
}

export function isTemplateSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(TEMPLATES, slug);
}
