/**
 * Lightweight template metadata for client-side UI (sidebar, cards).
 *
 * Deliberately separate from `lib/data/templates.ts`, which contains the full
 * self-contained HTML documents (tens of KB each). Importing that module into
 * a client component would bloat the browser bundle — this file only carries
 * the small bits the UI needs (id, name, description).
 */
export interface TemplateMeta {
  id: string;
  name: string;
  desc: string;
}

export const TEMPLATE_META: TemplateMeta[] = [
  {
    id: "blank",
    name: "Blank HTML",
    desc: "Start from a clean A4 canvas",
  },
  {
    id: "api-docs",
    name: "API Docs",
    desc: "Technical API reference layout",
  },
  {
    id: "landing-page",
    name: "Landing Page",
    desc: "Marketing page with hero and pricing",
  },
  {
    id: "email",
    name: "Email Template",
    desc: "Welcome email with hero banner",
  },
];
