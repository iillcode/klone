"use client";

import { useEffect, useRef } from "react";

const AVATARS: Record<string, string> = {
  a1: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/105cd037b-0c82-437d-8d82-8aa8d5bd1f73.png",
  a2: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/1d94a9b80-6636-40c7-81f0-dabb4aa3dd11.png",
  a3: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/1857dbd61-334e-42fa-8041-8dfc817ceb09.png",
  a4: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/1d1d5ac8d-1d43-4c2b-a861-11011f188151.png",
  a5: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/13d228874-e064-4d04-b0c5-0ea3177d1b18.png",
  a6: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/1efa1d44f-8eed-433c-8e74-7d9d62045275.png",
  a7: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/170065310-0985-4f1a-b840-16df04c5517d.png",
  a8: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/1163e2cfc-3aa5-4e25-86a5-e9674609d2f0.png",
  a9: "https://image.qwenlm.ai/public_source/3c6f34cd-69d1-4889-94e4-d0b93af3a332/1bc077260-84fa-4a74-9f93-8115be006739.png",
};

/** [col, handle, avatar, text, featured?] */
type Review = [number, string, { img?: string; css?: string; e?: string; logo?: boolean }, string, 1?];

const REVIEWS: Review[] = [
  [
    0,
    "nerdburn",
    { img: AVATARS.a1 },
    "It's fun, feels lightweight, and really quick to spin up user auth and a few tables. Almost too easy! Highly recommend.",
  ],
  [
    0,
    "adeelibr",
    { img: AVATARS.a6 },
    "@supabase shout out, their MCP is awesome. It's helping me create better row securities and telling me best practises for setting up a supabase app",
  ],
  [
    0,
    "SteinlageScott",
    { img: AVATARS.a5 },
    "I love @supabase's built-in Advisors. The security and performance linters improve everything and boost my confidence in what I'm building.",
  ],
  [
    1,
    "patrickc",
    { img: AVATARS.a3 },
    'Very impressed by @supabase\'s growth. For new startups, they seem to have gone from "promising" to "standard" in remarkably short order.',
  ],
  [
    1,
    "TyronBache",
    { img: AVATARS.a9 },
    "Really impressed with @supabase's Assistant. It has helped me troubleshoot and solve complex CORS Configuration issues on Pinger.",
  ],
  [
    1,
    "BowTiedQilin",
    { css: "linear-gradient(135deg,#0f766e,#155e75)", e: "🐉" },
    "The DX is unreal. Shipped auth + database + storage before my coffee got cold. ☕",
  ],
  [2, "shadcn", { img: AVATARS.a7 }, "Supabase is really good. ⚡"],
  [
    2,
    "MinimEditor",
    { logo: true },
    'I\'ve always used Supabase just as a database. Yesterday, I helped debug a founder\'s vibe-coding project built with React + React Router — no backend server. The "backend" was entirely Supabase Edge Functions as the API. First time using Supabase this way. Impressive.',
    1,
  ],
  [
    2,
    "gokul_i",
    { img: AVATARS.a4 },
    "Edge functions + vector search in one place = my whole side-project stack now. Wild.",
  ],
  [
    0,
    "Aliahsan_sfv",
    { img: AVATARS.a2 },
    "Okay, I finally tried Supabase today and wow... why did I wait so long? 🤩 Went from 'how do I even start' to having auth + database + real-time updates working in like 20 minutes. Sometimes the hype is actually justified! #Supabase",
  ],
  [
    0,
    "orlandopedro_",
    { img: AVATARS.a3 },
    "Love @supabase custom domains — makes the auth so much better",
  ],
  [
    0,
    "soleilbr",
    { img: AVATARS.a8 },
    "Went from zero to a full auth + realtime app in one evening. The docs hold your hand the whole way. 💚",
  ],
  [
    1,
    "yatsiv_yuriy",
    { img: AVATARS.a1 },
    'Supabase is the best product experience I\'ve had in years. Not just tech - taste. From docs to latency to the URL structure that makes you think "oh, that\'s obvious". Feels like every other platform should study how they built it. @supabase I love you',
  ],
  [
    1,
    "sdusteric",
    { img: AVATARS.a6 },
    "Loving #Supabase MCP. Claude Code would not only plan what data we should save but also figure out migration script by checking what the schema looks like on Supabase via MCP.",
  ],
];

/** The X (Twitter) logo badge. */
const XSVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.5 22H3.4l7.3-8.3L1 2h6.4l4.4 5.9zm-1.1 18h1.7L7.6 3.9H5.8z" />
  </svg>
);

/** The mini Klone K logo mark used by the "MinimEditor" logo avatar. */
const MiniK = (
  <svg width="20" height="14" viewBox="0 0 40 28" aria-hidden="true">
    <path fill="#2dd4bf" d="M2 26V2h9l7 10 7-10h9v24h-8V13l-6 8h-4l-6-8v13z" />
  </svg>
);

function AvatarMark({ avatar }: { avatar: NonNullable<Review[2]> }) {
  if (avatar.logo) {
    return (
      <span className="cssav" style={{ background: "#fff" }}>
        {MiniK}
      </span>
    );
  }
  if (avatar.img) {
    return <img src={avatar.img} alt="" loading="lazy" />;
  }
  return (
    <span className="cssav" style={{ background: avatar.css }}>
      {avatar.e}
    </span>
  );
}

function ReviewCard({ review, delay }: { review: Review; delay: number }) {
  const [, handle, avatar, text, featured] = review;
  return (
    <article className={`tcard${featured ? " feat" : ""}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="avwrap">
        <span className="xb">{XSVG}</span>
        <AvatarMark avatar={avatar} />
      </div>
      <div className="tbody">
        <div className="thead">
          <b>@{handle}</b>
        </div>
        <p>{text}</p>
      </div>
    </article>
  );
}

/** Column durations (matches reference --dur values). */
const COLS_DURATION = [72, 84, 64];

/**
 * Animated, draggable marquee wall of reviews (left side of the auth page).
 * Ports the reference implementation (pointer drag + idle drift + hint).
 */
export function ReviewWall() {
  const stageRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, sx: 0, sy: 0, bx: 0, by: 0, tx: 0, ty: 0, cx: 0, cy: 0, lastAct: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    const wall = wallRef.current;
    const hint = hintRef.current;
    if (!stage || !wall || !hint) return;

    const d = drag.current;
    const clX = (v: number) =>
      Math.max(-stage.offsetWidth * 0.16, Math.min(stage.offsetWidth * 0.55, v));
    const clY = (v: number) => {
      const m = stage.offsetHeight * 0.12;
      return Math.max(-m, Math.min(m, v));
    };

    const onDown = (e: PointerEvent) => {
      d.active = true;
      d.sx = e.clientX;
      d.sy = e.clientY;
      d.bx = d.tx;
      d.by = d.ty;
      d.lastAct = Date.now();
      stage.classList.add("grabbing");
      hint.classList.add("off");
      stage.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!d.active) return;
      d.tx = clX(d.bx + (e.clientX - d.sx));
      d.ty = clY(d.by + (e.clientY - d.sy));
      d.lastAct = Date.now();
    };
    const onUp = () => {
      d.active = false;
      stage.classList.remove("grabbing");
    };

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    stage.addEventListener("pointerleave", onUp);

    let raf = 0;
    const loop = (t: number) => {
      const idle = d.active
        ? 0
        : Math.min(1, Math.max(0, (Date.now() - d.lastAct - 1200) / 2500));
      const dx = Math.sin(t / 2600) * 16 * idle;
      const dy = Math.cos(t / 3400) * 10 * idle;
      d.cx += (d.tx + dx - d.cx) * 0.07;
      d.cy += (d.ty + dy - d.cy) * 0.07;
      wall.style.transform = `translate(${d.cx.toFixed(2)}px, ${d.cy.toFixed(2)}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("pointerleave", onUp);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Triple each column for a seamless marquee loop.
  const cols: { items: Review[] }[] = [0, 1, 2].map((col) => ({ items: REVIEWS.filter((r) => r[0] === col) }));
  const tripled = (col: number) => [...cols[col].items, ...cols[col].items, ...cols[col].items];

  return (
    <div className="stage" ref={stageRef} id="stage">
      <div className="wall" ref={wallRef} id="wall">
        <div className="wcols">
          {[0, 1, 2].map((col) => (
            <div
              key={col}
              className={`wcol${col === 1 ? " rev" : ""}`}
              style={{ ["--dur" as string]: `${COLS_DURATION[col]}s` }}
            >
              {tripled(col).map((r, i) => (
                <ReviewCard key={i} review={r} delay={i * 80} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="hint" ref={hintRef} id="hint">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" />
        </svg>
        Drag to explore · live reviews
      </div>
    </div>
  );
}