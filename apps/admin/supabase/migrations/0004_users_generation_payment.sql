-- Core data tables for the Klone MCP server data model:
--   templates  -> public.pdf_templates          (recreated here with category)
--   documents  -> public.visual_implementations (recreated here — MCP + web app)
--   users      -> public.users                  (profile per auth user)
--   generation -> public.generation             (generated PDFs)
--   payment    -> public.payment                (payments / credits)
--
-- SELF-CONTAINED: the previous "drop_klone_tables" migration removed the
-- original 0001/0002/0003 tables, so everything the MCP server reads/writes
-- is (re)created here with create-table-if-not-exists safety.
--
-- Pushed via: supabase db push --db-url "$DATABASE_URL"  (or paste into Supabase SQL Editor)

-- ===========================================================================
-- 1. TEMPLATES (public.pdf_templates) — with HARDCODED categories
-- ===========================================================================
-- Categories are hardcoded for now (no categories table). To add a category,
-- update the CHECK constraint below (and keep apps/mcp + apps/web in sync).
-- Allowed: General | Reports | Business | Technical | Education | Legal | Personal

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

alter table public.pdf_templates
  drop constraint if exists pdf_templates_category_check;

alter table public.pdf_templates
  add constraint pdf_templates_category_check
  check (
    category is null or
    category in ('General', 'Reports', 'Business', 'Technical', 'Education', 'Legal', 'Personal')
  );

comment on column public.pdf_templates.category is
  'Hardcoded template category (General | Reports | Business | Technical | Education | Legal | Personal). Add new values to the pdf_templates_category_check constraint.';

create index if not exists pdf_templates_category_idx
  on public.pdf_templates (category);
create index if not exists pdf_templates_is_active_idx
  on public.pdf_templates (is_active);

-- Row Level Security: authenticated users (agents + admin app) get full access.
alter table public.pdf_templates enable row level security;

drop policy if exists "authenticated full access pdf_templates" on public.pdf_templates;
create policy "authenticated full access pdf_templates"
  on public.pdf_templates for all to authenticated
  using (true) with check (true);

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

-- ===========================================================================
-- 1b. DOCUMENTS (public.visual_implementations) — user's saved documents
-- ===========================================================================
-- The MCP server's create_document/list_documents/etc. write here, and the
-- web app's editor reads/writes the same table. Recreated because the
-- previous drop migration removed it. template_id/slug give provenance.

create table if not exists public.visual_implementations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  html_code text not null,
  css_code text,
  source_component_ids text[] default '{}',
  template_id uuid references public.pdf_templates (id) on delete set null,
  template_slug text,
  prompt_used text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visual_implementations_user_id_idx
  on public.visual_implementations (user_id);

-- Row Level Security: each user can only manage their own documents.
alter table public.visual_implementations enable row level security;

drop policy if exists "users manage own visual implementations" on public.visual_implementations;
create policy "users manage own visual implementations"
  on public.visual_implementations for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ===========================================================================
-- 3. USERS — profile table, one row per auth.users entry
-- ===========================================================================

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  credits_balance integer not null default 0 check (credits_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is
  'User profile (extends auth.users). Plan + credits drive generation/payment limits.';

-- Shared trigger: keep updated_at fresh on any update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

drop policy if exists "users select own" on public.users;
create policy "users select own"
  on public.users for select to authenticated
  using (id = auth.uid());

drop policy if exists "users insert own" on public.users;
create policy "users insert own"
  on public.users for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "users update own" on public.users;
create policy "users update own"
  on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ===========================================================================
-- 4. GENERATION — records of generated PDFs
-- ===========================================================================

create table if not exists public.generation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  document_id uuid references public.visual_implementations (id) on delete set null,
  template_id uuid references public.pdf_templates (id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'succeeded', 'failed')),
  pdf_path text,
  file_name text,
  file_size bigint,
  page_count integer,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.generation is
  'One row per PDF export job. Links the source document/template to the generated file (pdf_path in the storage bucket "pdfs").';

create index if not exists generation_user_created_idx
  on public.generation (user_id, created_at desc);
create index if not exists generation_status_idx
  on public.generation (status);

alter table public.generation enable row level security;

drop policy if exists "generation select own" on public.generation;
create policy "generation select own"
  on public.generation for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "generation insert own" on public.generation;
create policy "generation insert own"
  on public.generation for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "generation update own" on public.generation;
create policy "generation update own"
  on public.generation for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "generation delete own" on public.generation;
create policy "generation delete own"
  on public.generation for delete to authenticated
  using (user_id = auth.uid());

-- ===========================================================================
-- 5. PAYMENT — payments / credit purchases
-- ===========================================================================

create table if not exists public.payment (
  user_id uuid not null references public.users (id) on delete cascade,
  generation_id uuid references public.generation (id) on delete set null,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  provider text,
  provider_reference text,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  description text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.payment is
  'Payment/credit transactions. generation_id links a payment to the PDF export it paid for (nullable for subscription/top-up payments).';

create index if not exists payment_user_created_idx
  on public.payment (user_id, created_at desc);
create index if not exists payment_status_idx
  on public.payment (status);

drop trigger if exists payment_set_updated_at on public.payment;
create trigger payment_set_updated_at
  before update on public.payment
  for each row execute function public.set_updated_at();

alter table public.payment enable row level security;

drop policy if exists "payment select own" on public.payment;
create policy "payment select own"
  on public.payment for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "payment insert own" on public.payment;
create policy "payment insert own"
  on public.payment for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "payment update own" on public.payment;
create policy "payment update own"
  on public.payment for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "payment delete own" on public.payment;
create policy "payment delete own"
  on public.payment for delete to authenticated
  using (user_id = auth.uid());

-- ===========================================================================
-- 6. STORAGE — private bucket for generated PDFs
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

-- Users only touch their own files, laid out as: pdfs/<user_id>/<file>.pdf
drop policy if exists "pdfs select own" on storage.objects;
create policy "pdfs select own"
  on storage.objects for select to authenticated
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "pdfs insert own" on storage.objects;
create policy "pdfs insert own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "pdfs update own" on storage.objects;
create policy "pdfs update own"
  on storage.objects for update to authenticated
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "pdfs delete own" on storage.objects;
create policy "pdfs delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
