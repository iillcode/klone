-- PDF templates schema: reusable document blueprints served to AI agents via the MCP server.
-- Each template is an "outline": a structured blueprint (page constraints + sections + guidance)
-- that an agent follows to author a full self-contained HTML document, which is then saved to
-- public.visual_implementations (the user documents table) via create_document.
--
-- Pushed via: supabase db push --db-url "$DATABASE_URL"  (or paste into Supabase SQL Editor)

create table if not exists public.pdf_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text,
  blueprint jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pdf_templates_category_idx
  on public.pdf_templates (category);
create index if not exists pdf_templates_is_active_idx
  on public.pdf_templates (is_active);

-- Row Level Security: authenticated users (agents + admin app) get full access,
-- matching the existing content tables in 0001_init.sql.
alter table public.pdf_templates enable row level security;

drop policy if exists "authenticated full access pdf_templates" on public.pdf_templates;
create policy "authenticated full access pdf_templates"
  on public.pdf_templates for all to authenticated
  using (true) with check (true);

-- Provenance for user documents: which template produced each document.
-- Nullable so existing rows and web-app inserts (which don't set these) keep working.
alter table public.visual_implementations
  add column if not exists template_id uuid references public.pdf_templates (id) on delete set null,
  add column if not exists template_slug text;

-- ---------------------------------------------------------------------------
-- Starter templates
--
-- Blueprint shape (see apps/mcp/src/types.ts):
-- {
--   "version": 1,
--   "page": { "format", "content_width", "margin", "body_background" },
--   "sections": [ { "key", "name", "description", "guidance", "required" } ],
--   "requirements": [ ... ]
-- }
-- ---------------------------------------------------------------------------

insert into public.pdf_templates (slug, name, description, category, tags, blueprint) values
('blank', 'Blank document', 'A minimal A4 document shell. Use when the agent should structure the document entirely from scratch.', 'General', '{blank,general,starter}', $${"version":1,"page":{"format":"A4","content_width":"794px","margin":"2.5rem","body_background":"#ffffff"},"sections":[{"key":"title","name":"Document title","description":"Top-of-page heading with the document name.","guidance":"Use a large <h1> at the top of the page. Keep it to one line when possible.","required":true},{"key":"body","name":"Body content","description":"The main content of the document.","guidance":"Use <h2>/<h3> for sections, <p> for paragraphs, and <ul>/<ol> for lists. Keep line-height around 1.6 and text color dark on white."}],"requirements":["Self-contained HTML document with embedded <style>","Target content width 794px (A4), renders standalone in an iframe","No external fonts, scripts or network dependencies","Use the system font stack: ui-sans-serif, system-ui, sans-serif"]}$$),
('business-report', 'Business report', 'Structured report with cover, executive summary, key findings, data table and recommendations.', 'Reports', '{report,business,executive summary,analytics}', $${"version":1,"page":{"format":"A4","content_width":"794px","margin":"2.5rem","body_background":"#ffffff"},"sections":[{"key":"cover","name":"Cover page","description":"Full-page title block with report title, subtitle, author and date.","guidance":"Use a full-height section with a large <h1> title, a subtitle <p>, and author/date on separate lines. Optionally add a subtle accent bar or brand color.","required":true},{"key":"executive-summary","name":"Executive summary","description":"A short overview of the report, its purpose and the key takeaway.","guidance":"Write 3-6 sentences. Use a highlighted callout box with a light background to draw attention."},{"key":"key-findings","name":"Key findings","description":"The main findings of the report as a bulleted list.","guidance":"Use <ul> with <strong> lead-ins per bullet. Keep each finding to one or two lines.","required":true},{"key":"data-table","name":"Data table","description":"A structured table of figures or metrics referenced by the report.","guidance":"Use <table> with a header row, zebra striping, and right-aligned numeric columns. Keep 3-8 columns."},{"key":"recommendations","name":"Recommendations","description":"Actionable next steps based on the findings.","guidance":"Use an ordered <ol> with one action per item. Be specific and measurable where possible."}],"requirements":["Self-contained HTML document with embedded <style>","Target content width 794px (A4), renders standalone in an iframe","No external fonts, scripts or network dependencies","Use the system font stack: ui-sans-serif, system-ui, sans-serif","Break long reports at logical points with page-break-before on major sections"]}$$),
('invoice', 'Invoice', 'Invoice layout with sender/receiver blocks, line-item table, totals and payment terms.', 'Business', '{invoice,billing,finance,payment}', $${"version":1,"page":{"format":"A4","content_width":"794px","margin":"2.5rem","body_background":"#ffffff"},"sections":[{"key":"header","name":"Invoice header","description":"INVOICE title, invoice number, issue date and due date.","guidance":"Show a large INVOICE heading, then an invoice number and dates in a compact right-aligned block.","required":true},{"key":"parties","name":"From / To blocks","description":"Biller and client contact blocks side by side.","guidance":"Two columns: From (biller name, address, email) and To (client name, address, email). Use a muted label above each block."},{"key":"line-items","name":"Line items table","description":"Table of items with description, quantity, unit price and amount.","guidance":"Use <table> with columns Description / Qty / Unit price / Amount. Right-align numeric columns. Zebra stripe rows."},{"key":"totals","name":"Totals","description":"Subtotal, taxes and grand total.","guidance":"Right-aligned block under the table. Bold the grand total and give it a subtle background.","required":true},{"key":"payment-terms","name":"Payment terms","description":"Due date reminder, payment methods and notes.","guidance":"Short paragraph under the totals. Keep to 2-3 lines."}],"requirements":["Self-contained HTML document with embedded <style>","Target content width 794px (A4), renders standalone in an iframe","No external fonts, scripts or network dependencies","Use the system font stack: ui-sans-serif, system-ui, sans-serif","Use placeholder values for the actual amount and contact details"]}$$),
('api-docs', 'API documentation', 'Technical reference with overview, endpoints table, request example and error codes.', 'Technical', '{api,docs,reference,developer}', $${"version":1,"page":{"format":"A4","content_width":"794px","margin":"2.5rem","body_background":"#ffffff"},"sections":[{"key":"title","name":"Title and intro","description":"API name, version and a one-paragraph overview.","guidance":"Large <h1> for the API name, a version badge next to it, then a short intro <p>.","required":true},{"key":"authentication","name":"Authentication","description":"How to authenticate requests.","guidance":"Explain the auth mechanism (API key, bearer token) with a short code snippet in a code block."},{"key":"endpoints","name":"Endpoints table","description":"Table of endpoints with method, path and description.","guidance":"Use <table> with columns Method / Endpoint / Description. Color-code the HTTP method badges (GET, POST, PUT, DELETE).","required":true},{"key":"request-example","name":"Request example","description":"A sample request and response for the primary endpoint.","guidance":"Use two code blocks: Request (method + URL + headers) and Response (JSON body). Use a monospace font and dark background for code."},{"key":"error-codes","name":"Error codes","description":"Common error codes and their meaning.","guidance":"Compact table or definition list of error codes with short descriptions."}],"requirements":["Self-contained HTML document with embedded <style>","Target content width 794px (A4), renders standalone in an iframe","No external fonts, scripts or network dependencies","Use the system font stack: ui-sans-serif, system-ui, sans-serif","Code blocks must use a monospace font stack: ui-monospace, SFMono-Regular, Menlo, monospace"]}$$),
('letter', 'Formal letter', 'Business letter with sender block, date, recipient, salutation, body and signature.', 'Business', '{letter,correspondence,formal}', $${"version":1,"page":{"format":"A4","content_width":"794px","margin":"2.5rem","body_background":"#ffffff"},"sections":[{"key":"sender","name":"Sender block","description":"Sender name, address, email and phone at the top.","guidance":"Compact block, optionally right-aligned. One line per detail."},{"key":"date","name":"Date","description":"The letter date.","guidance":"Full date on its own line below the sender block.","required":true},{"key":"recipient","name":"Recipient block","description":"Recipient name, title and address.","guidance":"Left-aligned block below the date.","required":true},{"key":"salutation","name":"Salutation","description":"Opening greeting such as Dear Mr. Smith.","guidance":"Keep it formal and match the recipient block.","required":true},{"key":"body","name":"Body","description":"The main paragraphs of the letter.","guidance":"3-6 short paragraphs separated by spacing. Use <p> with generous line-height.","required":true},{"key":"closing","name":"Closing and signature","description":"Sign-off, signature line and printed name.","guidance":"Sincerely, followed by space for a signature and the printed name.","required":true}],"requirements":["Self-contained HTML document with embedded <style>","Target content width 794px (A4), renders standalone in an iframe","No external fonts, scripts or network dependencies","Use the system font stack: ui-sans-serif, system-ui, sans-serif"]}$$)
on conflict (slug) do nothing;
