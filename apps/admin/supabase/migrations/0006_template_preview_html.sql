-- Add a `preview_html` column to public.pdf_templates.
--
-- This stores a self-contained sample/detailed HTML document that demonstrates
-- the template: a concrete "rendered" example assembled from the template's
-- component blocks (the same HTML + CSS design language used in the blueprint).
-- It is shown in the admin template builder as a live preview and exposed to the
-- MCP server so agents (and the UI) can show users what a template looks like
-- before they generate a document from it.
--
-- Pushed via: supabase db push --db-url "$DATABASE_URL"  (or paste into Supabase SQL Editor)

alter table public.pdf_templates
  add column if not exists preview_html text;

comment on column public.pdf_templates.preview_html is
  'Self-contained sample HTML document demonstrating the template, assembled from its component blocks. Used for live previews in the admin builder and the MCP server.';

create index if not exists pdf_templates_preview_html_idx
  on public.pdf_templates (id)
  where preview_html is not null;

-- ---------------------------------------------------------------------------
-- Backfill each starter template with a representative preview document built
-- from its component design language. These are illustrative samples (they use
-- placeholder content that matches each template's sections).
-- ---------------------------------------------------------------------------

update public.pdf_templates
set preview_html = $$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blank document — sample</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.6; background: #ffffff; }
  .kl-body { max-width: 794px; margin: 0 auto; padding: 2.5rem; }
  h1 { font-size: 2rem; line-height: 1.15; font-weight: 800; letter-spacing: -0.02em; color: #111827; margin: 0 0 1.25rem; }
  h2 { font-size: 1.5rem; line-height: 1.2; font-weight: 700; color: #111827; margin: 2rem 0 0.75rem; }
  p { margin: 0 0 1rem; }
  ul, ol { margin: 0 0 1rem; padding-left: 1.4rem; }
</style>
</head>
<body>
<main class="kl-body">
  <h1>Document title</h1>
  <h2>Section heading</h2>
  <p>This is a sample paragraph rendered with the Blank document template. Replace it with your own content — the shell provides a clean A4 page with the system font stack and a 794px content column.</p>
  <ul>
    <li><strong>First point</strong> — a short supporting detail.</li>
    <li><strong>Second point</strong> — another supporting detail.</li>
  </ul>
  <ol>
    <li>First ordered step.</li>
    <li>Second ordered step.</li>
  </ol>
</main>
</body>
</html>$$
where slug = 'blank';

update public.pdf_templates
set preview_html = $$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Business report — sample</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.6; background: #ffffff; }
  .kl-body { max-width: 794px; margin: 0 auto; padding: 2.5rem; }
  .cover { border-left: 4px solid #4f46e5; padding-left: 1rem; margin-bottom: 2rem; }
  h1 { font-size: 2.25rem; line-height: 1.1; font-weight: 800; color: #111827; margin: 0 0 0.5rem; }
  .subtitle { color: #6b7280; font-size: 1.1rem; margin: 0 0 0.25rem; }
  .meta { color: #9ca3af; font-size: 0.9rem; }
  h2 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 2rem 0 0.75rem; }
  .callout { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 0.5rem; padding: 1rem 1.25rem; margin: 1rem 0; }
  ul { padding-left: 1.4rem; } li { margin-bottom: 0.35rem; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.95rem; }
  th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
  thead th { background: #f9fafb; font-weight: 600; }
  tbody tr:nth-child(even) { background: #fafafa; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  ol { padding-left: 1.4rem; }
</style>
</head>
<body>
<main class="kl-body">
  <section class="cover">
    <h1>Q3 Performance Report</h1>
    <p class="subtitle">A structured overview of quarterly results and recommendations</p>
    <p class="meta">Acme Corp · Prepared by J. Rivera · August 2026</p>
  </section>
  <div class="callout">
    <strong>Executive summary.</strong> Revenue grew 12% quarter-over-quarter while operating costs held flat. We recommend doubling down on the enterprise segment to sustain momentum into Q4.
  </div>
  <h2>Key findings</h2>
  <ul>
    <li><strong>Enterprise revenue</strong> up 18% vs. last quarter.</li>
    <li><strong>Churn</strong> fell to 2.1% from 3.4%.</li>
    <li><strong>Gross margin</strong> improved to 71%.</li>
  </ul>
  <h2>Results by segment</h2>
  <table>
    <thead><tr><th>Segment</th><th class="num">Revenue</th><th class="num">Growth</th></tr></thead>
    <tbody>
      <tr><td>Enterprise</td><td class="num">$2.4M</td><td class="num">+18%</td></tr>
      <tr><td>SMB</td><td class="num">$1.1M</td><td class="num">+6%</td></tr>
      <tr><td>Self-serve</td><td class="num">$0.5M</td><td class="num">+9%</td></tr>
    </tbody>
  </table>
  <h2>Recommendations</h2>
  <ol>
    <li>Expand the enterprise sales motion with two additional AE hires.</li>
    <li>Launch a churn-reduction playbook for at-risk SMB accounts.</li>
    <li>Raise self-serve onboarding investment to capture inbound demand.</li>
  </ol>
</main>
</body>
</html>$$
where slug = 'business-report';

update public.pdf_templates
set preview_html = $$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice — sample</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.6; background: #ffffff; }
  .kl-body { max-width: 794px; margin: 0 auto; padding: 2.5rem; }
  h1 { font-size: 2rem; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.02em; }
  .invoice-meta { display: flex; justify-content: space-between; align-items: flex-start; margin: 1.5rem 0; }
  .invoice-meta .right { text-align: right; color: #4b5563; font-size: 0.95rem; }
  .parties { display: flex; gap: 2rem; margin: 1.5rem 0; }
  .parties .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 0.25rem; }
  .parties div { font-size: 0.95rem; }
  table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
  th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
  thead th { background: #f9fafb; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-left: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 0.4rem 0; }
  .totals .grand { font-weight: 700; background: #f3f4f6; padding: 0.6rem 0.75rem; border-radius: 0.4rem; }
  .terms { color: #6b7280; font-size: 0.9rem; margin-top: 1.5rem; }
</style>
</head>
<body>
<main class="kl-body">
  <h1>INVOICE</h1>
  <div class="invoice-meta">
    <div><strong>Invoice #</strong> INV-2026-0142</div>
    <div class="right">Issued: Aug 1, 2026<br />Due: Aug 15, 2026</div>
  </div>
  <div class="parties">
    <div><div class="label">From</div>Acme Studio LLC<br />120 Market St<br />hello@acme.studio</div>
    <div><div class="label">To</div>Globex Inc.<br />88 Pine Ave<br />accounts@globex.com</div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead>
    <tbody>
      <tr><td>Design retainer</td><td class="num">1</td><td class="num">$3,000</td><td class="num">$3,000</td></tr>
      <tr><td>Extra revisions</td><td class="num">4</td><td class="num">$150</td><td class="num">$600</td></tr>
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>$3,600</span></div>
    <div class="row"><span>Tax (0%)</span><span>$0</span></div>
    <div class="row grand"><span>Total due</span><span>$3,600</span></div>
  </div>
  <p class="terms">Payment due within 14 days via bank transfer. Please reference INV-2026-0142 on remittance.</p>
</main>
</body>
</html>$$
where slug = 'invoice';

update public.pdf_templates
set preview_html = $$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>API documentation — sample</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.6; background: #ffffff; }
  .kl-body { max-width: 794px; margin: 0 auto; padding: 2.5rem; }
  h1 { font-size: 2rem; font-weight: 800; color: #111827; margin: 0 0 0.5rem; }
  .badge { display: inline-block; background: #eef2ff; color: #4f46e5; font-size: 0.8rem; font-weight: 600; padding: 0.15rem 0.55rem; border-radius: 999px; margin-left: 0.5rem; }
  h2 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 2rem 0 0.75rem; }
  p { margin: 0 0 1rem; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 0.3rem; font-size: 0.9em; }
  pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.85rem; }
  pre code { background: transparent; padding: 0; color: inherit; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { text-align: left; padding: 0.55rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
  thead th { background: #f9fafb; font-weight: 600; }
  .method { font-family: ui-monospace, monospace; font-weight: 700; }
  .get { color: #16a34a; } .post { color: #2563eb; } .del { color: #dc2626; }
</style>
</head>
<body>
<main class="kl-body">
  <h1>Klone Documents API<span class="badge">v1</span></h1>
  <p>Create, read and export self-contained HTML documents. All requests are authenticated with a bearer token.</p>
  <h2>Authentication</h2>
  <p>Send your API key in the <code>Authorization</code> header:</p>
  <pre><code>Authorization: Bearer kl_live_xxx</code></pre>
  <h2>Endpoints</h2>
  <table>
    <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td class="method get">GET</td><td><code>/documents</code></td><td>List documents for the authenticated user</td></tr>
      <tr><td class="method post">POST</td><td><code>/documents</code></td><td>Create a new document from a template</td></tr>
      <tr><td class="method del">DELETE</td><td><code>/documents/:id</code></td><td>Delete a document</td></tr>
    </tbody>
  </table>
  <h2>Request example</h2>
  <pre><code>POST /documents
Authorization: Bearer kl_live_xxx
Content-Type: application/json

{
  "template_slug": "invoice",
  "name": "August invoice"
}</code></pre>
  <h2>Error codes</h2>
  <table>
    <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
    <tbody>
      <tr><td><code>401</code></td><td>Missing or invalid API key</td></tr>
      <tr><td><code>404</code></td><td>Document not found</td></tr>
      <tr><td><code>429</code></td><td>Rate limit exceeded</td></tr>
    </tbody>
  </table>
</main>
</body>
</html>$$
where slug = 'api-docs';

update public.pdf_templates
set preview_html = $$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Formal letter — sample</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.6; background: #ffffff; }
  .kl-body { max-width: 794px; margin: 0 auto; padding: 2.5rem; }
  .sender { text-align: right; font-size: 0.95rem; color: #374151; }
  .date { margin: 1.5rem 0 1rem; }
  .recipient { margin-bottom: 1.5rem; }
  h1 { font-size: 1.4rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
  p { margin: 0 0 1rem; }
  .closing { margin-top: 1.5rem; }
  .sig { margin-top: 2rem; }
</style>
</head>
<body>
<main class="kl-body">
  <div class="sender">
    Jordan Rivera<br />
    120 Market St, Springfield<br />
    jordan@acme.studio · (555) 010-2030
  </div>
  <p class="date">August 12, 2026</p>
  <div class="recipient">
    <strong>Mr. Samuel Greene</strong><br />
    Vice President, Globex Inc.<br />
    88 Pine Ave, Metropolis
  </div>
  <p>Dear Mr. Greene,</p>
  <p>Thank you for the productive meeting last week. I am writing to confirm the scope of the design engagement we discussed and to outline the next steps for moving forward.</p>
  <p>Per our conversation, we will deliver the brand system, template library and a documented component guide by the end of Q3. A detailed timeline will follow once the kickoff call is scheduled.</p>
  <p>Please let me know if the proposed approach works for your team, and I will prepare the formal agreement.</p>
  <div class="closing">Sincerely,</div>
  <div class="sig">
    Jordan Rivera<br />
    Creative Director, Acme Studio
  </div>
</main>
</body>
</html>$$
where slug = 'letter';
