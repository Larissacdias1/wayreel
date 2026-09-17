# Wayreel — Visual References

Cinematic direction documented from reference sites, following the format defined in the project's audit process (not to copy the site, but to use as intent). Complements `WAYREEL.md` Section 11 (Cinematic) and Section 7 (Experience State Machine).

> **Update (2026-08-30):** the initial analysis was done by extracting text/structure from the page, without visual inspection. Palette and typography were confirmed on 2026-08-30 via direct inspection (Playwright MCP: desktop/mobile screenshot + computed CSS) — see the "Confirmed data" subsection in each reference below. The original conceptual analysis (Purpose/Observed/Reproduce conceptually/Do not copy) remains valid and was not changed.

---

## Reference 1 — Produx (produx.design)

**URL:** https://www.produx.design/

**Purpose:** motion direction and reveal pacing — not a reference for travel content layout.

**Observed:**

- Full-bleed video hero with overlaid text, entrance with subtle text duplication/glitch ("You feel the brand before it speaks" appears with a slight offset, like a visual echo) — suggests a layered reveal technique, not static text.
- Project cards in a grid with hover that exposes tags (creative direction / motion / web design) before the title — layered information hierarchy (category → name → context).
- "Trusted by" section with logos in a continuous horizontal carousel.
- Copy runs alongside indexed numbers ("01", "02", "03"...) as a narrative structure device.
- Testimonials with a round photo + short quote — humanizes without breaking the studio tone.

**Reproduce conceptually:**

- The layered text reveal (subtle echo/duplication) is an interesting device for the moment the agent announces the recommended destination on the REVEAL screen (`WAYREEL.md` Section 7) — giving weight to the destination name without needing another new graphic element.
- Indexed numbering for the experience phases (THINKING → FLYTHROUGH → REVEAL → OPTIONS) as a user orientation device, in the same logic as Produx's "01/02/03".

**Do not copy:**

- It is a branding agency's portfolio site — the palette, institutional tone, and "Work/Studio/Journal/Contact" structure do not apply to a consumer product like Wayreel.
- Do not reproduce client logos or the testimonials structure (not Wayreel's genre).

**Confirmed data** (direct inspection via Playwright MCP, 2026-08-30, desktop viewport 1440×900 and mobile 390×844):

- Palette: primary background `#0e0e0e`; primary text `#f2f2f2`; secondary text `#a9a9a9`; accent/CTA `#2cc9ff` (sparing use, ~20 occurrences in the DOM, link/hover color).
- Typography: heading in `"At Aero"` (weight 400), body/CTA in `"DM Mono"` (weight 400) — mono used for both supporting text and buttons, reinforcing the technical/editorial tone. Main heading: **63.9px / line-height 70.3px** on desktop, **46.4px / line-height 51.1px** on mobile.
- Spacing: 9 sections detected via `section`/`main > div`; layout uses overlap/scroll-jacking between sections (measured negative gap — not a simple block stack), consistent with the layered reveal effect observed visually.
- Screenshots: `docs/visual-references/produx/desktop.png`, `docs/visual-references/produx/mobile.png`.
- Animation timing: it was not possible to confirm the exact duration/easing of the "text echo" effect from computed CSS alone (it's orchestrated via JS/scroll, not a static CSS `transition`) — if adopted, the timing needs to be calibrated by video/DevTools Performance observation, not by this pass.

**Motion behavior — confirmed via live inspection** (Playwright/Chromium MCP, 2026-09-14, `document.getAnimations()`, `getComputedStyle`, stylesheet `cssRules` inspection, and DOM diffing across the first ~3s after navigation):

- **Hero background is HLS video, not canvas/CSS**: `<video>` element pointing at `https://www.produx.design/videos/HeroHLS/showreel.m3u8` (adaptive HLS stream, 1456×816 native, `loop`), inside the sticky hero. A second `<video>` (`PageTransitionLogo.webm`, 1080×1080, `loop`) is used for the route/page-transition logo, not the hero itself.
- **Text reveal is a JS-driven "curtain mask" (SplitText-style), not CSS `@keyframes`/`transition`**: each hero heading word is individually wrapped `span.relative.overflow-hidden > span.absolute.inset-0 > span.heroSection-splitWord` (word split at build time). The `overflow-hidden` wrapper masks the word while the inner `.heroSection-splitWord` span is transform-animated. Confirmed classes present mid-reveal: `translate-y-full opacity-10` (Tailwind utility names baked into the class string, i.e. the _rest_ state is `translateY(100%)` / `opacity:.1`), and the live `transform` observed was a small residual `matrix(1,0,0,1,0,Npx)` per word (values captured across six consecutive words: 3.68px, 4.80px, 6.15px, 7.79px, 9.76px, 12.16px, 15.13px) — i.e. each word is still settling toward `translateY(0)` at a **different residual offset**, which is the signature of a **per-word staggered tween**, not a single simultaneous transition.
  - Checked `document.getAnimations()` on these spans: **empty** (`playState`/`keyframes` not exposed via the Web Animations API), and no matching `@keyframes` exist in `document.styleSheets` for `.heroSection-splitWord`. This means the tween is driven imperatively by JS on `requestAnimationFrame` (GSAP-style engine, e.g. GSAP `SplitText`/custom timeline, or Framer Motion's manual `animate()` — not resolvable further without source maps), writing the `matrix()` transform directly to the element each frame rather than via CSS transition/animation or WAAPI. **Exact duration/easing/stagger-delta could not be extracted this way** — only the mechanism (masked span + imperative per-word transform tween) and the observed near-end residual offsets above are confirmed.
- **Reveal trigger is scroll-linked pin ("scrollytelling"), not a fixed autoplay timer**: `.heroSection-Sticky-wrapper` (the hero's outer container) measures **4680px tall**, while its child `section.hero-section` is `position: sticky; top: 0` (802.9px tall). This is the classic scroll-driven pin pattern — the hero stays visually fixed on screen while the user scrolls through ~4680px of document height, and the JS timeline (word reveal, parallax layers below) is almost certainly scrubbed against that scroll progress rather than fired once on load.
- **Smooth/virtualized scroll**: `<html class="lenis lenis-smooth">` present (Studio Freight **Lenis**) — real scroll events are intercepted and eased; during the hero-pin/intro the class briefly includes `lenis-stopped` (scroll locked while the intro plays out).
- **Parallax layers exist and are canvas-based, not plain `<img>`**: 14 `<canvas>` elements were found, several nested in `div.absolute.inset-0.w-full.will-change-transform` wrappers — i.e. each parallax image layer is drawn to its own canvas (likely for masked/distorted image reveal or WebGL image-plane effects) inside an absolutely-positioned, `will-change: transform`-hinted wrapper, which is the standard setup for scroll-scrubbed layer-speed parallax (each wrapper's `transform: translateY()` driven at a different rate/factor as Lenis scroll progresses). The exact per-layer speed factor could not be captured (site returned intermittent client-side error pages under repeated automated navigation, limiting how many live scroll samples could be taken) — treat "layered canvas image parallax, scroll-scrubbed" as confirmed mechanism, and the speed multiplier as **not measured**.
- **Reliability caveat**: this site's client bundle errored out (showed the Next.js "This page couldn't load" fallback) on roughly half of repeated automated loads during this session, which limited how much continuous frame-by-frame sampling could be done. Findings above come from the loads that succeeded; treat them as confirmed for mechanism/technique, but not exhaustive for every numeric parameter (durations, easings, per-layer parallax factors).

---

## Reference 2 — DeSo (deso.com)

**URL:** https://www.deso.com/

**Purpose:** the most directly structural reference for Wayreel — a single-scroll "chapters" architecture, built by Studio Freight (a reference studio in scroll storytelling).

**Observed:**

- The entire site is structured into **numbered chapters** (`Chapter 01: Welcome` through `Chapter 07: About`), each as a scroll "scene" with a single purpose — extremely close to Wayreel's own State Machine (CHATTING → THINKING → FLYTHROUGH → REVEAL → OPTIONS → CTA, `WAYREEL.md` Section 7).
- The side navigation/menu shows all chapters with a thumbnail preview — gives the user a sense of progress within the experience.
- Each chapter has a duplicated-effect title (text repetition, a recurring technique at this studio) to give typographic weight without relying only on font size.
- Raw data comparisons (cost per blockchain) presented as small cards with logo + number — direct layout, no ornamentation.
- Background with layered clouds and parallax (repeated `clouds-bg`) giving depth without real 3D.

**Reproduce conceptually:**

- The idea of "a chapter with a single purpose and visible progress navigation" is directly applicable to the flythrough's HUD Overlay (`WAYREEL.md` Section 11.4) — showing which waypoint of the experience the user is at, in the same logic as DeSo's chapter indicator.
- Direct comparison cards (e.g., economy vs. mid-tier vs. premium price on the OPTIONS screen) can follow this "logo/icon + number, no ornamentation" logic instead of a decorated card.
- Layered background parallax (clouds) is a computationally cheap technique that can inspire the background transition between THINKING and FLYTHROUGH.

**Do not copy:**

- The institutional Web3/blockchain tone (phase roadmap, team, press) has no equivalent in Wayreel — do not replicate these sections.
- Content density per chapter is high (multiple technical paragraphs); Wayreel must keep the "max 3 paragraphs" standard already defined in the agent prompt (`docs/PROMPTS.md`).

**Confirmed data** (direct inspection via Playwright MCP, 2026-08-30, desktop viewport 1440×900 and mobile 390×844):

- Palette: primary background `#000818`; primary text `#fffdf5`; secondary/neutral text `#cdd6df` to `#687178` (blue-gray gradation used in supporting text); accent/CTA `#ffda59` (main button, button text in `#000818` over the yellow background); secondary accents observed `#db4718` (orange, sparing use) and `#2e9dff` (blue, sparing use).
- Typography: heading in `"Victor Narrow"` (weight 600), body in `"GT Planar"`. Main heading: **136px / line-height 119.7px** on desktop, **49.9px / line-height 45.9px** on mobile — a large proportional drop (~63%) between breakpoints.
- Spacing: it was not possible to reliably measure the gap between sections — the site uses canvas/WebGL and virtualized scroll (a scroll-jacking library, likely Studio Freight Lenis/Hamo), so `getBoundingClientRect` on section elements does not reflect real spacing in the document flow.
- Screenshots: `docs/visual-references/deso/desktop.png`, `docs/visual-references/deso/mobile.png`.
- Technical note: the page emitted ~150+ console warnings (normal behavior for a heavy WebGL app) — not a sign of a functional error, but it confirms this is a technically complex site; not recommended to copy the stack, only the structural intent.

**Motion behavior — confirmed via live inspection** (Playwright/Chromium MCP, 2026-09-14, `window.__THREE__` devtools hook, `getComputedStyle`, DOM/class diffing across load and scroll):

- **Full-viewport WebGL canvas (Three.js), not CSS/DOM for the visual background/scene**: exactly one `<canvas>` element, sized to the full viewport (2560×1440 at capture time), sitting inside `div.webgl_canvas__k_ws3`; a valid `WebGLRenderingContext`/`WebGL2RenderingContext` is attached. `window.__THREE__` (the Three.js devtools registration global) is present, confirming **Three.js** as the rendering engine for the background/clouds/3D chapter-icon layer — this is the "clouds-bg parallax" and the small rotating isometric "chapter" icon near the progress indicator, not a stack of CSS-animated `<img>`s.
- **Foreground content (headings, body copy, buttons, chapter nav) is real DOM**, laid out via Next.js + CSS Modules (hashed classnames, e.g. `chapters-hero_scene__jKRMt`, `navigation_chapters__59ED5`) — it sits visually on top of/alongside the WebGL canvas, not rendered _by_ it. Confirms: this is a hybrid "DOM foreground + WebGL background" architecture, not a fully-WebGL/canvas-text site as initially assumed.
- **Scroll is fully virtualized/"scroll-jacked"**: `document.documentElement.scrollHeight` measures only **~187px** regardless of how many "chapters" exist — i.e. the real document is nearly zero-height and all forward progress through the 7 chapters is driven by JS reading wheel/touch input and feeding it to Lenis + the Three.js scene/camera, not by native document scroll. This is the concrete number behind the existing note ("`getBoundingClientRect` on section elements does not reflect real spacing").
- **Lenis smooth-scroll with an explicit intro-lock state**: `<html>` carries `lenis lenis-smooth` normally, and on fresh load additionally `intro lenis-stopped` — i.e. scroll input is **hard-locked** (`lenis-stopped`) while an `intro` sequence plays, and only unlocked (classes drop to plain `lenis lenis-smooth`) once that intro finishes. Observed intro content: a first, dim/low-opacity tagline screen ("It's Time to Reimagine the World of Social") that **fades out**, before the main Chapter 01 hero ("The Social Layer of Crypto Has Arrived" + chapter progress indicator + CTAs) **fades/settles in** — confirming a two-stage, timer-gated intro sequence that blocks scroll until it completes, rather than a reveal that responds to scroll from frame one.
- **Reveal trigger for the intro is autoplay/timer-gated, not scroll**: since scroll is physically locked (`lenis-stopped`) during the intro, the tagline→hero transition cannot be scroll-driven — it must run on an internal timer/JS sequence that itself unlocks scroll on completion. Chapter-to-chapter transitions _after_ the intro, by contrast, are scroll-driven (each chapter is a distinct scroll-scrubbed scene, per the "Observed" section above).
- **Exact durations/easing not extractable**: because the scene is Three.js-rendered (shader/uniform-driven, not CSS transition/animation) and `document.getAnimations()` / stylesheet inspection are blind to canvas-internal motion, no cubic-bezier/duration values could be pulled for the intro fade or the parallax cloud layers — only the mechanism (Three.js scene + Lenis-gated intro lock) is confirmed. WebGL uniform-level introspection (hooking `getUniformLocation` to find scroll-linked uniform names) was attempted but required hooking before the page's own scripts first compile their shader programs, which this session's tooling could not do reliably (hook only takes effect after reload, by which point programs are already linked) — flagged as a gap if precise parallax-speed parameters are ever needed.

---

## Reference 3 — LGM Aviation (lgmaviation.com)

**URL:** https://lgmaviation.com/

**Purpose:** a tone reference for presenting flight options — trust, visual cleanliness, aviation language without being a "generic travel agency site".

**Observed:**

- Hero with a plane-in-flight video (`hero-plane.mov`) + a direct, short headline ("Materials Management Simplified").
- Layered repeated cloud background (`clouds-bg`) — the same light-depth technique as DeSo, here applied to a real aviation context.
- Services structured in simple blocks (short title + 1 sentence + CTA), without excess text.
- Company division logos presented as trust badges, not as customer social proof.

**Reproduce conceptually:**

- The "sober trust" tone (short headline, no exaggerated adjectives, sky/cloud background) is a direct reference for the moment Wayreel presents a flight price (OPTIONS screen) — the legal disclaimer already required (`docs/SECURITY.md` Section 5, "Indicative prices...") matches this sober tone rather than an aggressive sales tone.
- The layered cloud background is reusable as a visual transition between FLYTHROUGH (terrain/city) and OPTIONS (sky/flight) — it reinforces the context shift (arriving at the destination → traveling to it).

**Do not copy:**

- It is a B2B aircraft parts site — do not replicate the "three company divisions" structure or the industrial sales corporate tone.

**Confirmed data** (direct inspection via Playwright MCP, 2026-08-30, desktop viewport 1440×900 and mobile 390×844):

- Palette: primary background `#f5f5f7` (very light gray, not pure white); primary/secondary text unified in `#000000` (the site does not use gray gradation for text hierarchy — hierarchy comes only from size/weight); accent/CTA `#0d98d1` (blue, button with white text `#ffffff`).
- Typography: heading and body use the same family, `"DM Sans"` — heading weight 700, body weight 500/700 depending on the block. Main heading: **56px / line-height 56px** on desktop, **32px / line-height 32px** on mobile.
- Spacing: not measured precisely (layout without clear semantic `<section>` elements) — visually the service blocks have generous breathing room, consistent with the "clean" tone observed.
- Screenshots: `docs/visual-references/lgmaviation/desktop.png`, `docs/visual-references/lgmaviation/mobile.png`.

---

## Reference 4 — Lando Norris, Calendar (landonorris.com/calendar)

**URL:** https://landonorris.com/calendar

**Purpose:** the technically closest reference to Wayreel's HUD Overlay (`WAYREEL.md` Section 11.4) — a real-data panel updating per "waypoint" (in this case, a race).

**Observed:**

- Each race on the calendar has "Track Stats" with technical data shown in a compact grid (Name, Circuit ID, Laps, Distance, Length) — exactly the HUD logic Wayreel has already specified (`COORD`, `ALT ZOOM/PITCH/BRG`, `DEST`).
- There is a "track visualiser" (circuit map/outline in SVG) next to the data — a combination of spatial visual + raw technical data side by side.
- A countdown ("next race begins in... D/h/m/s") for the next event — a sober anticipation/urgency device, without being aggressive.
- The country flag as a quick identification icon per race — instant visual recognition without needing to read the name.

**Reproduce conceptually:**

- This is the closest pattern to what Section 11.4 already calls for: real technical data (coordinate, zoom, pitch, bearing) in a monospaced font, updating per waypoint — Lando Norris's "Track Stats" confirms that this pattern (raw data + spatial visual side by side) is legible and already tested in production.
- The country flag per destination (already exists in the schema as `country`, `WAYREEL.md` Section 6.1) can appear in the HUD or on the REVEAL screen as quick visual recognition, in the same logic as the calendar's flags.
- The "next event" countdown has no obvious use in the current MVP (Wayreel has no event schedule), but it can inspire the THINKING state's timer (`WAYREEL.md` Section 7, 3s timeout) as a visual progress indicator, not just a generic spinner.

**Do not copy:**

- Do not replicate the density of sports data (historical results, positions, lap times) — that is F1-fan context, not traveler context.
- Do not use F1 team colors (McLaren orange) as a palette — unrelated to Wayreel's identity.

**Confirmed data** (direct inspection via Playwright MCP, 2026-08-30, desktop viewport 1440×900 and mobile 390×844):

- Palette: primary background `#282c20` (dark olive green, not pure black); primary text `#f4f4ed`; secondary text `#b4b8a5` to `#b9bbad`; accent/CTA `#d2ff00` (vibrant lime green, button text in `#282c20` over the lime background — a contrast inversion matching DeSo's CTA pattern); secondary accent `#b2c73a` (lighter olive green, used on data/HUD elements).
- Typography: heading and UI in `"Mona Sans Variable"` (weight 700 for headings, 400 for body/labels); a second family, `"Brier"`, appears in specific numeric data blocks (appears to be an editorial/display font for highlighted numbers, e.g. lap or position numbers) with weight 700 and near-black color `#111112` over a light background (local contrast within cards). Main heading: **105.8px / line-height 95.3px** on desktop, **37.9px / line-height 34.1px** on mobile.
- Spacing: not measured precisely, due to the same non-semantic layout limitation as the other JS-heavy references; the inspection at least confirms the expected use of a monospaced HUD/label — but the font used is not mono (it's `Mona Sans`), so the "monospaced" reading from the original conceptual analysis is a design intent to apply to Wayreel, not a literal copy of the site's CSS.
- Screenshots: `docs/visual-references/landonorris-calendar/desktop.png`, `docs/visual-references/landonorris-calendar/mobile.png`.

---

## Synthesis — what the 4 references confirm together

1. **A chapter/scene structure with a single purpose** (DeSo) is the right pattern for Wayreel's State Machine — this was already the decision made; this reference merely confirms it is a tested pattern, well-regarded in the cinematic sites market.
2. **A HUD with real technical data, monospaced font, next to a spatial element** (Lando Norris) confirms the approach already frozen in Section 11.4 — nothing needs to change, it just validates the decision.
3. **A layered background with light parallax** (DeSo + LGM Aviation) is a computationally cheap technique reusable in the THINKING→FLYTHROUGH and FLYTHROUGH→OPTIONS transitions.
4. **A sober tone in price presentation** (LGM Aviation) reinforces the legal disclaimer already required — there's no need to "sell" the flight, it needs to be presented with confidence.

> Palette and typography confirmed on 2026-08-30 via direct inspection (Playwright MCP) — see "Confirmed data" in each reference above. No final Wayreel palette has been _chosen_ from these references yet (that is a separate design system decision, not a data gap); the values above are only the real data from the 4 sites to inform that choice.
