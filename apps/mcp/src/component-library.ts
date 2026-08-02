/**
 * Hardcoded component design library for the visual implementation MCP.
 *
 * Every entry is a self-contained HTML snippet (inline CSS) that a coding
 * agent can drop into a page and adapt. Later this can be swapped for the
 * `public.components` table in Supabase without changing the tool surface.
 */

export interface ComponentDesign {
  /** Stable slug id, e.g. "btn-basic" */
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  description: string;
  tags: string[];
  /** Self-contained HTML (inline <style> allowed). */
  code: string;
  /** Guidance for the agent on when/how to use and adapt this component. */
  prompt: string;
}

export interface ComponentCategory {
  name: string;
  slug: string;
  description: string;
  componentIds: string[];
}

const COMPONENTS: ComponentDesign[] = [
  {
    id: "btn-basic",
    name: "Button set (primary / secondary / outline / ghost)",
    category: "Buttons",
    description:
      "A consistent set of buttons: primary (solid), secondary (soft), outline and ghost variants, each in small, medium and large sizes.",
    tags: ["button", "cta", "action", "primary", "secondary", "outline"],
    prompt:
      "Use for any call-to-action, submit or interactive action. Pick the variant by emphasis: primary for the main action, outline for secondary actions, ghost for tertiary. Keep one primary action per view.",
    code: `<section style="font-family:ui-sans-serif,system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:24px;background:#fafafa;">
  <button style="background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;">Primary</button>
  <button style="background:#e0e7ff;color:#4338ca;border:none;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;">Secondary</button>
  <button style="background:transparent;color:#111827;border:1px solid #d1d5db;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;">Outline</button>
  <button style="background:transparent;color:#4b5563;border:none;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;">Ghost</button>
  <button style="background:#dc2626;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;">Danger sm</button>
  <button disabled style="background:#e5e7eb;color:#9ca3af;border:none;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;cursor:not-allowed;">Disabled</button>
</section>`,
  },
  {
    id: "card-basic",
    name: "Content card",
    category: "Cards",
    description:
      "A versatile card with optional image area, title, description and an action row. Good for features, articles and gallery items.",
    tags: ["card", "feature", "content", "article"],
    prompt:
      "Use to group related content. The image area can be swapped for a real image, icon or gradient. Keep the title short and the description 1-3 lines for visual balance.",
    code: `<article style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:340px;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.06);">
  <div style="height:160px;background:linear-gradient(135deg,#6366f1,#a855f7);"></div>
  <div style="padding:20px;">
    <h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">Card title</h3>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280;">A short description that explains what this card represents and why it matters to the reader.</p>
    <div style="display:flex;gap:8px;">
      <button style="background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;">Learn more</button>
      <button style="background:transparent;color:#4b5563;border:1px solid #d1d5db;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;">Bookmark</button>
    </div>
  </div>
</article>`,
  },
  {
    id: "badge-status",
    name: "Status badges (dot + pill)",
    category: "Badges",
    description:
      "Compact pill badges with a status dot: neutral, primary, success, warning and danger. Great for statuses, labels and tags.",
    tags: ["badge", "status", "label", "pill", "tag"],
    prompt:
      "Use for short labels or live status indicators. Combine a dot with a pill for status semantics (e.g. 'Active', 'Pending', 'Failed').",
    code: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:20px;background:#fafafa;">
  <span style="display:inline-flex;align-items:center;gap:6px;background:#f3f4f6;color:#374151;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;">
    <span style="width:6px;height:6px;border-radius:50%;background:#9ca3af;"></span>Neutral
  </span>
  <span style="display:inline-flex;align-items:center;gap:6px;background:#e0e7ff;color:#4338ca;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;">
    <span style="width:6px;height:6px;border-radius:50%;background:#4f46e5;"></span>Primary
  </span>
  <span style="display:inline-flex;align-items:center;gap:6px;background:#dcfce7;color:#15803d;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;">
    <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;"></span>Active
  </span>
  <span style="display:inline-flex;align-items:center;gap:6px;background:#fef9c3;color:#a16207;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;">
    <span style="width:6px;height:6px;border-radius:50%;background:#eab308;"></span>Pending
  </span>
  <span style="display:inline-flex;align-items:center;gap:6px;background:#fee2e2;color:#b91c1c;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;">
    <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;"></span>Failed
  </span>
</div>`,
  },
  {
    id: "navbar-simple",
    name: "Top navigation bar",
    category: "Navigation",
    description:
      "Sticky-style top navbar with logo, centered links and a call-to-action button. Collapses gracefully on small screens.",
    tags: ["navbar", "navigation", "header", "menu", "logo"],
    prompt:
      "Use as the page header. Replace the logo mark and link labels to match the product. Keep 3-6 links max; the CTA should be the most important destination.",
    code: `<nav style="font-family:ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 24px;height:64px;background:#fff;border-bottom:1px solid #e5e7eb;">
  <a href="#" style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:800;color:#111827;text-decoration:none;">
    <span style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#a855f7);"></span>Brand
  </a>
  <div style="display:flex;align-items:center;gap:24px;font-size:14px;font-weight:500;">
    <a href="#" style="color:#111827;text-decoration:none;">Home</a>
    <a href="#" style="color:#6b7280;text-decoration:none;">Features</a>
    <a href="#" style="color:#6b7280;text-decoration:none;">Pricing</a>
    <a href="#" style="color:#6b7280;text-decoration:none;">Docs</a>
  </div>
  <div style="display:flex;align-items:center;gap:8px;">
    <button style="background:transparent;color:#4b5563;border:none;border-radius:8px;padding:8px 14px;font-size:14px;font-weight:600;cursor:pointer;">Sign in</button>
    <button style="background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:14px;font-weight:600;cursor:pointer;">Get started</button>
  </div>
</nav>`,
  },
  {
    id: "hero-center",
    name: "Centered hero section",
    category: "Hero",
    description:
      "Full-width hero with eyebrow label, large headline, supporting copy, dual CTAs and a subtle trust line. The default opening section for a landing page.",
    tags: ["hero", "landing", "headline", "cta", "marketing"],
    prompt:
      "Use as the first section of a landing page. Keep the headline to one strong promise, the subcopy 1-2 sentences, and one primary CTA. The trust line can list logos or social proof.",
    code: `<section style="font-family:ui-sans-serif,system-ui,sans-serif;text-align:center;padding:88px 24px;background:linear-gradient(180deg,#eef2ff 0%,#ffffff 100%);">
  <span style="display:inline-block;background:#e0e7ff;color:#4338ca;border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;margin-bottom:20px;">New · v2.0 is here</span>
  <h1 style="max-width:680px;margin:0 auto 16px;font-size:44px;line-height:1.15;font-weight:800;color:#111827;letter-spacing:-0.02em;">
    Build the thing your users actually want
  </h1>
  <p style="max-width:520px;margin:0 auto 28px;font-size:17px;line-height:1.6;color:#6b7280;">
    Ship faster with a visual implementation that turns your task into a working, reviewable design in minutes.
  </p>
  <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
    <button style="background:#4f46e5;color:#fff;border:none;border-radius:10px;padding:12px 22px;font-size:15px;font-weight:600;cursor:pointer;">Start building</button>
    <button style="background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:10px;padding:12px 22px;font-size:15px;font-weight:600;cursor:pointer;">View demo</button>
  </div>
  <p style="margin-top:36px;font-size:13px;color:#9ca3af;">Trusted by 2,000+ teams · No credit card required</p>
</section>`,
  },
  {
    id: "form-contact",
    name: "Contact / login form",
    category: "Forms",
    description:
      "Clean vertical form with labeled inputs, inline validation hint, submit button and helper text. Works for login, signup and contact forms.",
    tags: ["form", "input", "login", "contact", "signup", "field"],
    prompt:
      "Use for any data-entry view. Keep labels visible, use helper text only where users need it, and always include a clear submit action. Adapt field list to the task.",
    code: `<form style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;display:flex;flex-direction:column;gap:16px;">
  <div>
    <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">Get in touch</h2>
    <p style="margin:0;font-size:14px;color:#6b7280;">We'll reply within one business day.</p>
  </div>
  <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#374151;">
    Name
    <input type="text" placeholder="Ada Lovelace" style="border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;font-size:14px;outline:none;" />
  </label>
  <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#374151;">
    Email
    <input type="email" placeholder="you@example.com" style="border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;font-size:14px;outline:none;" />
  </label>
  <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#374151;">
    Message
    <textarea rows="4" placeholder="Tell us about your project…" style="border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;font-size:14px;outline:none;resize:vertical;"></textarea>
  </label>
  <button type="submit" style="background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;">Send message</button>
  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">By submitting you agree to our terms.</p>
</form>`,
  },
  {
    id: "pricing-tiers",
    name: "Pricing tiers",
    category: "Pricing",
    description:
      "Three-column pricing table with a highlighted 'Popular' plan, feature lists and per-plan CTAs. Great for SaaS landing pages.",
    tags: ["pricing", "plans", "saas", "billing", "tiers"],
    prompt:
      "Use for pricing sections. Keep plans to 3, mark one as 'Popular' with the accent color, and list 3-6 features per plan. Prices are placeholders — adapt to the product.",
    code: `<section style="font-family:ui-sans-serif,system-ui,sans-serif;padding:48px 24px;background:#fafafa;display:flex;gap:20px;justify-content:center;flex-wrap:wrap;align-items:stretch;">
  <div style="flex:1;min-width:220px;max-width:300px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;">
    <h3 style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;">Starter</h3>
    <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">For individuals</p>
    <p style="margin:0 0 20px;font-size:32px;font-weight:800;color:#111827;">$0<span style="font-size:14px;font-weight:500;color:#9ca3af;">/mo</span></p>
    <ul style="margin:0 0 20px;padding:0;list-style:none;font-size:14px;color:#4b5563;display:flex;flex-direction:column;gap:8px;">
      <li>✓ 1 project</li><li>✓ Community support</li><li>✓ 100 renders/mo</li>
    </ul>
    <button style="width:100%;background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;">Get started</button>
  </div>
  <div style="flex:1;min-width:220px;max-width:300px;background:#4f46e5;border-radius:16px;padding:24px;color:#fff;box-shadow:0 12px 32px rgba(79,70,229,.35);">
    <h3 style="margin:0 0 4px;font-size:16px;font-weight:700;">Pro <span style="background:#fff;color:#4f46e5;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700;vertical-align:middle;">Popular</span></h3>
    <p style="margin:0 0 16px;font-size:13px;opacity:.8;">For growing teams</p>
    <p style="margin:0 0 20px;font-size:32px;font-weight:800;">$29<span style="font-size:14px;font-weight:500;opacity:.7;">/mo</span></p>
    <ul style="margin:0 0 20px;padding:0;list-style:none;font-size:14px;display:flex;flex-direction:column;gap:8px;opacity:.95;">
      <li>✓ 10 projects</li><li>✓ Priority support</li><li>✓ Unlimited renders</li><li>✓ Custom domains</li>
    </ul>
    <button style="width:100%;background:#fff;color:#4f46e5;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:700;cursor:pointer;">Start 14-day trial</button>
  </div>
  <div style="flex:1;min-width:220px;max-width:300px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;">
    <h3 style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;">Enterprise</h3>
    <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">For large orgs</p>
    <p style="margin:0 0 20px;font-size:32px;font-weight:800;color:#111827;">Custom</p>
    <ul style="margin:0 0 20px;padding:0;list-style:none;font-size:14px;color:#4b5563;display:flex;flex-direction:column;gap:8px;">
      <li>✓ Unlimited projects</li><li>✓ SSO / SAML</li><li>✓ Dedicated success manager</li>
    </ul>
    <button style="width:100%;background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;">Contact sales</button>
  </div>
</section>`,
  },
  {
    id: "testimonial-card",
    name: "Testimonial card",
    category: "Testimonials",
    description:
      "Quote card with star rating, avatar, name and role. Use in a social-proof band or testimonial grid.",
    tags: ["testimonial", "quote", "social proof", "review", "avatar"],
    prompt:
      "Use to build trust with customer quotes. Keep quotes short and specific. Swap the initials avatar for a real photo when available.",
    code: `<figure style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:380px;margin:0;padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;">
  <div style="color:#f59e0b;font-size:16px;margin-bottom:12px;">★★★★★</div>
  <blockquote style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#374151;">
    "This tool turned our messy task list into a visual implementation our whole team could review in minutes. Game changer."
  </blockquote>
  <figcaption style="display:flex;align-items:center;gap:12px;">
    <span style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">AK</span>
    <div>
      <div style="font-size:14px;font-weight:700;color:#111827;">Amara Khan</div>
      <div style="font-size:13px;color:#6b7280;">Head of Product, Northwind</div>
    </div>
  </figcaption>
</figure>`,
  },
  {
    id: "stats-band",
    name: "Stats band",
    category: "Stats",
    description:
      "Four-column metrics row (big number + label). Ideal for 'by the numbers' sections on landing pages.",
    tags: ["stats", "metrics", "numbers", "analytics"],
    prompt:
      "Use for quantitative proof. Numbers should be real if possible; labels should be one or two words. Four columns reads best.",
    code: `<section style="font-family:ui-sans-serif,system-ui,sans-serif;display:flex;justify-content:space-around;flex-wrap:wrap;gap:24px;padding:48px 24px;background:#111827;color:#fff;text-align:center;">
  <div>
    <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:-0.02em;">99.9%</p>
    <p style="margin:4px 0 0;font-size:14px;color:#9ca3af;">Uptime SLA</p>
  </div>
  <div>
    <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:-0.02em;">2M+</p>
    <p style="margin:4px 0 0;font-size:14px;color:#9ca3af;">Renders served</p>
  </div>
  <div>
    <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:-0.02em;">120</p>
    <p style="margin:4px 0 0;font-size:14px;color:#9ca3af;">Integrations</p>
  </div>
  <div>
    <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:-0.02em;">4.9/5</p>
    <p style="margin:4px 0 0;font-size:14px;color:#9ca3af;">Customer rating</p>
  </div>
</section>`,
  },
  {
    id: "footer-simple",
    name: "Simple footer",
    category: "Footer",
    description:
      "Multi-column footer with brand blurb, link columns, social icons and a bottom legal bar.",
    tags: ["footer", "links", "legal", "social"],
    prompt:
      "Use as the closing section of a page. Keep link columns aligned to real product areas and duplicate nothing from the nav.",
    code: `<footer style="font-family:ui-sans-serif,system-ui,sans-serif;background:#fafafa;border-top:1px solid #e5e7eb;padding:48px 24px 24px;">
  <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:32px;max-width:960px;margin:0 auto;">
    <div style="max-width:260px;">
      <a href="#" style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:800;color:#111827;text-decoration:none;margin-bottom:12px;">
        <span style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#4f46e5,#a855f7);"></span>Brand
      </a>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">A short line about what your product does and who it's for.</p>
    </div>
    <div style="font-size:14px;">
      <p style="margin:0 0 10px;font-weight:700;color:#111827;">Product</p>
      <a href="#" style="display:block;color:#6b7280;text-decoration:none;margin-bottom:8px;">Features</a>
      <a href="#" style="display:block;color:#6b7280;text-decoration:none;margin-bottom:8px;">Pricing</a>
      <a href="#" style="display:block;color:#6b7280;text-decoration:none;">Changelog</a>
    </div>
    <div style="font-size:14px;">
      <p style="margin:0 0 10px;font-weight:700;color:#111827;">Company</p>
      <a href="#" style="display:block;color:#6b7280;text-decoration:none;margin-bottom:8px;">About</a>
      <a href="#" style="display:block;color:#6b7280;text-decoration:none;margin-bottom:8px;">Blog</a>
      <a href="#" style="display:block;color:#6b7280;text-decoration:none;">Contact</a>
    </div>
  </div>
  <div style="max-width:960px;margin:32px auto 0;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:13px;color:#9ca3af;">
    <span>© 2026 Brand, Inc. All rights reserved.</span>
    <div style="display:flex;gap:16px;">
      <a href="#" style="color:#9ca3af;text-decoration:none;">Privacy</a>
      <a href="#" style="color:#9ca3af;text-decoration:none;">Terms</a>
    </div>
  </div>
</footer>`,
  },
];

const CATEGORIES: ComponentCategory[] = [
  {
    name: "Buttons",
    slug: "buttons",
    description: "Call-to-action and interactive action styles.",
    componentIds: ["btn-basic"],
  },
  {
    name: "Cards",
    slug: "cards",
    description: "Containers for grouped content and features.",
    componentIds: ["card-basic"],
  },
  {
    name: "Badges",
    slug: "badges",
    description: "Compact status and label indicators.",
    componentIds: ["badge-status"],
  },
  {
    name: "Navigation",
    slug: "navigation",
    description: "Headers, navbars and menus.",
    componentIds: ["navbar-simple"],
  },
  {
    name: "Hero",
    slug: "hero",
    description: "Opening sections for landing pages.",
    componentIds: ["hero-center"],
  },
  {
    name: "Forms",
    slug: "forms",
    description: "Inputs, labels and submission flows.",
    componentIds: ["form-contact"],
  },
  {
    name: "Pricing",
    slug: "pricing",
    description: "Plan and pricing layouts.",
    componentIds: ["pricing-tiers"],
  },
  {
    name: "Testimonials",
    slug: "testimonials",
    description: "Quotes and social proof.",
    componentIds: ["testimonial-card"],
  },
  {
    name: "Stats",
    slug: "stats",
    description: "Metric and number displays.",
    componentIds: ["stats-band"],
  },
  {
    name: "Footer",
    slug: "footer",
    description: "Closing sections with links and legal.",
    componentIds: ["footer-simple"],
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function listCategories(): ComponentCategory[] {
  return CATEGORIES.map((c) => ({
    ...c,
    componentIds: c.componentIds.filter((id) => getComponentById(id) != null),
  })).filter((c) => c.componentIds.length > 0);
}

export function getComponentById(id: string): ComponentDesign | undefined {
  return COMPONENTS.find((c) => c.id === id);
}

export function listComponents(opts?: {
  category?: string;
  query?: string;
  limit?: number;
}): ComponentDesign[] {
  const { category, query, limit = 50 } = opts ?? {};
  let result = COMPONENTS;

  if (category) {
    const cat = category.toLowerCase();
    result = result.filter(
      (c) =>
        c.category.toLowerCase() === cat ||
        c.category.toLowerCase().includes(cat) ||
        c.subCategory?.toLowerCase().includes(cat),
    );
  }

  if (query) {
    const q = query.toLowerCase();
    result = result.filter((c) => {
      const haystack = [
        c.name,
        c.category,
        c.subCategory ?? "",
        c.description,
        c.tags.join(" "),
        c.prompt,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return result.slice(0, limit);
}

/**
 * Score components against a free-text purpose so an agent can ask for
 * "a landing page hero with pricing" and get the most relevant designs.
 */
function scoreComponent(component: ComponentDesign, tokens: string[]): number {
  const haystacks = [
    {
      text: [component.name, component.category, component.subCategory ?? ""]
        .join(" ")
        .toLowerCase(),
      weight: 3,
    },
    { text: component.tags.join(" ").toLowerCase(), weight: 2 },
    { text: component.description.toLowerCase(), weight: 1.5 },
    { text: component.prompt.toLowerCase(), weight: 1 },
  ];
  let score = 0;
  for (const token of tokens) {
    for (const { text, weight } of haystacks) {
      if (text.includes(token)) score += weight;
    }
  }
  return score;
}

export function searchComponents(purpose: string, max = 4): ComponentDesign[] {
  const tokens = purpose
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .filter(
      (t) =>
        ![
          "the",
          "and",
          "for",
          "with",
          "that",
          "this",
          "from",
          "using",
          "your",
        ].includes(t),
    );

  const scored = COMPONENTS.map((c) => ({
    c,
    score: scoreComponent(c, tokens),
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.c);

  // If nothing matched, fall back to the general-purpose set.
  if (scored.length === 0) {
    return ["navbar-simple", "hero-center", "card-basic", "form-contact"]
      .map((id) => getComponentById(id))
      .filter((c): c is ComponentDesign => c != null);
  }

  return scored;
}

export function toSummary(c: ComponentDesign) {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    subCategory: c.subCategory ?? null,
    description: c.description,
    tags: c.tags,
  };
}
