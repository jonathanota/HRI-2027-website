# HRI 2027 Website — Design System & Implementation Guide

This document is the canonical reference for building new pages on the HRI 2027 conference website. It captures every design token, component pattern, layout rule, and behavioral detail from the current implementation. An agent or developer reading this document should be able to produce new pages that are visually indistinguishable from the existing site.

---

## 1. Design Philosophy

The site follows five core principles. Every design decision on new pages must pass through these:

1. **Content first, decoration second.** The terrain animation is ambient. If the canvas fails, the page still works as a clean text layout. Every visual element serves the content.

2. **Familiar structure, distinctive identity.** The layout follows established academic conference patterns. Researchers should feel immediately oriented. The gold accent and terrain are what make it HRI 2027.

3. **One accent, used with commitment.** The site uses a single `--accent` CSS variable that dynamically shifts color throughout the day based on Santa Clara local time — gold in the afternoon, aqua in the morning, warm reds at night. At any given moment there is only one accent color active. No secondary accent colors. It appears on theme titles, stats, date highlights, CTAs, and interactive elements.

4. **Typography does the work.** Headlines are large and confident. Body text is readable at generous line heights. Monospace is used for data (dates, labels, coordinates) to add technical flavor.

5. **Warmth within seriousness.** The gold accent and warm background evoke California's golden hills. This differentiates from cold blue/dark palettes of most tech conferences while maintaining academic credibility.

### Design Tenets (for ambiguous decisions)

- When in doubt, simplify. If a new element doesn't serve researchers finding information, it doesn't belong.
- Gold is earned, not sprinkled. The accent color (whatever its current time-of-day value) only appears on elements that deserve emphasis.
- The terrain is the brand. Rolling contour lines are the visual signature across all touchpoints.
- Academic audiences read. Long body text is fine. Tables are preferred over cards for data. Clear headings matter more than visual flair.
- Silicon Valley is felt, not shown. No stock photos of tech campuses. The gold palette and terrain reference the place abstractly.

---

## 2. Design Tokens (CSS Custom Properties)

All tokens are defined on `:root` and are the single source of truth. Night mode overrides these via JavaScript.

### Colors

```css
:root {
  --bg: #fafafa;                        /* Page background */
  --surface: #fff;                      /* Cards, elevated elements */
  --text: #1a1a1a;                      /* Primary text — headlines, body */
  --text-sec: #555;                     /* Secondary text — descriptions, metadata */
  --text-dim: #999;                     /* Tertiary text — labels, footnotes, captions */
  --accent: #B47A0F;                    /* Dynamic accent — set by JS based on Santa Clara time of day */
  --accent-dim: rgba(180,122,15,0.08);  /* Accent background tint */
  --border: rgba(0,0,0,0.08);           /* Section dividers, card borders */
}
```

**Night mode overrides** (applied via JS when Santa Clara local time is 21:00–05:00):
```css
--bg: #111111;
--text: #e8e8e8;
--text-sec: #999;
--text-dim: #666;
--border: rgba(255,255,255,0.08);
```

The `--accent` color is dynamically set by the terrain JS based on Santa Clara's time of day. It smoothly interpolates between these stops, meaning the entire site's accent — titles, countdown numbers, table highlights, terrain lines, CTA backgrounds — all shift color together:

| Hour | RGB | Hex | Description |
|------|-----|-----|-------------|
| 0:00 | `rgb(80, 20, 35)` | `#501423` | Midnight — dim red |
| 6:00 | `rgb(6, 153, 175)` | `#0699AF` | Morning — aqua |
| 10:00 | `rgb(6, 153, 175)` | `#0699AF` | Late morning — aqua |
| 14:00 | `rgb(180, 122, 15)` | `#B47A0F` | Afternoon — gold (the "default" brand color) |
| 18:00 | `rgb(180, 122, 15)` | `#B47A0F` | Early evening — gold |
| 20:00 | `rgb(232, 48, 78)` | `#E8304E` | Sunset — warm red |
| 22:00 | `rgb(100, 25, 40)` | `#641928` | Late night — dim red |

All elements using `var(--accent)` automatically receive the current time-appropriate color. No hardcoded color values should be used for accent elements — always reference the variable.

### Typography

Three font families loaded via Google Fonts:

```css
--font-display: 'DM Sans', sans-serif;   /* Headlines, titles, section headings */
--font-body: 'Inter', sans-serif;         /* Body text, paragraphs, descriptions */
--font-mono: 'JetBrains Mono', monospace; /* Dates, labels, nav links, metadata, CTAs */
```

Google Fonts import:
```
Inter: 400, 500, 600, 700
JetBrains Mono: 400, 700
DM Sans: 400, 700 (optical size 9–40, includes italic)
```

### Type Scale

| Element | Font | Size | Weight | Letter-spacing | Transform | Line-height |
|---------|------|------|--------|----------------|-----------|-------------|
| Hero title (line 1 & 2) | DM Sans | `clamp(3rem, 9vw, 6rem)` | 700 | -0.04em | — | 0.88 |
| Hero theme line | DM Sans | `clamp(2rem, 5vw, 3rem)` | 700 | — | — | — |
| Section title | DM Sans | 1.5rem | 700 | -0.02em | — | — |
| About lead | DM Sans | 1.15rem | 700 | — | — | 1.5 |
| Body text | Inter | 1rem | 400 | — | — | 1.8 |
| Hero edition | Inter | 1rem | 400 | — | — | 1.5 |
| Nav links | JetBrains Mono | 0.88rem | 400 | 0.08em | uppercase | — |
| Hero date | JetBrains Mono | 0.75rem | 700 | 0.04em | uppercase | — |
| Table headers | JetBrains Mono | 0.88rem | 400 | 0.06em | uppercase | — |
| Table dates | JetBrains Mono | 0.88rem | 400 | — | — | — |
| CTA button | JetBrains Mono | 0.88rem | 700 | 0.06em | uppercase | — |
| Countdown numbers | JetBrains Mono | 2.2rem (desktop) / 1.5rem (mobile) | 700 | -0.02em | — | 1 |
| Labels & captions | JetBrains Mono | 0.8rem | 400 | 0.06em | uppercase | — |
| Footer text | JetBrains Mono | 0.8rem | 400 | — | — | — |
| Footer links | JetBrains Mono | 0.8rem | 400 | 0.06em | uppercase | — |

### Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| Container max-width | 960px | All content sections |
| Container padding | 0 2rem (desktop), 0 1.5rem (mobile) | Horizontal gutters |
| Section padding | 4rem 0 | Vertical rhythm between sections |
| Section divider | 1px solid `var(--border)` | Bottom border on each section |
| Hero min-height | 85vh (desktop), 70vh (mobile) | Full-viewport hero |
| Hero bottom padding | 6rem (desktop), 4rem (mobile) | Space before next section |
| Border radius | 4px (buttons, cards), 8px (photo placeholders), 12px (mobile hero content) | Consistent rounding |

---

## 3. Layout System

### Container

All page content (except the hero and nav background) is wrapped in `.container`:

```css
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 2rem;
}
```

On mobile (≤768px): `padding: 0 1.5rem`.

The nav uses `.container` on its inner wrapper (`.container.nav-inner`). The hero content also uses `.container` to ensure left-alignment matches the nav logo exactly.

### Section Pattern

Every content section follows this structure:

```html
<section class="section-name" id="anchor-id">
  <div class="container">
    <h2 class="section-title">Section Title</h2>
    <!-- section content -->
  </div>
</section>
```

Sections have `padding: 4rem 0` and `border-bottom: 1px solid var(--border)`. The last section before the footer may omit the border.

### Grid

The site uses CSS Grid for sponsor logos:
```css
grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
gap: 1rem;
```

For other layouts, flexbox is preferred. No CSS framework is used.

---

## 4. Component Specifications

### 4.1 Navigation

```
┌─────────────────────────────────────────────────────┐
│  [HRI Logo] 2027          KEY DATES  OVERVIEW  ...  │
└─────────────────────────────────────────────────────┘
```

- Sticky, `top: 0`, `z-index: 100`
- Background: `rgba(250,250,250,0.9)` with `backdrop-filter: blur(12px)`
- Bottom border: `1px solid var(--border)`
- Inner padding: `0.6rem` top/bottom (desktop), `0.5rem` (mobile)
- Logo: HRI mark image (34px height desktop, 27px mobile) + "2027" in DM Sans at 60% of logo height, gold accent color
- Night mode swaps logo image (black → white variant)
- Links: JetBrains Mono 0.88rem, uppercase, `letter-spacing: 0.08em`, `color: var(--text-sec)`, hover → `var(--text)`
- Mobile (≤768px): hamburger toggle (3 spans, 22px wide, 2px thick), links become full-width dropdown below nav
- All transitions: `background 2s ease, border-color 2s ease` (for day/night mode)

### 4.2 Hero Section

```
┌─────────────────────────────────────────────────────┐
│  [Terrain canvas - full viewport background]        │
│                                                     │
│  MARCH 16–19, 2027 · SANTA CLARA, CA               │
│  HRI 2027                                           │
│  Silicon Valley          (gold accent)              │
│  Innovative HRI          (secondary text)           │
│  The 22nd ACM/IEEE International Conference...      │
│  ACM SIGCHI · ACM SIGAI · IEEE RAS                  │
│  [REGISTER NOW →]                                   │
│                                                     │
│  374  07  11  45                                    │
│  DAYS HOURS MINUTES SECONDS                         │
│  until HRI 2027                                     │
│                                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  (bottom fade gradient into page background)        │
└─────────────────────────────────────────────────────┘
```

- Full-width section, `min-height: 85vh` (70vh mobile)
- `display: flex; align-items: center`
- Canvas is `position: absolute; inset: 0` with CSS mask fading bottom 40%
- `::after` pseudo-element creates a 120px gradient fade at the bottom
- Hero content uses `.container` class for alignment with nav
- `.hero-content-wrap` must have `width: 100%` (flex child of the hero)
- Title uses two `<span>` blocks: line 1 in `var(--text)`, line 2 in `var(--accent)`
- CTA: dark background (`var(--text)`), light text (`var(--bg)`), 4px radius, `0.7rem 1.5rem` padding
- Mobile: hero content gets `border-radius: 12px`, `padding: 1.5rem`, `backdrop-filter: blur(0.75px)`, terrain canvas at `opacity: 0.6`

### 4.3 Dates Table

```
┌──────────────────────────────────────────────────┐
│  SUBMISSION TYPE          DEADLINE    NOTIFICATION│
│  ─────────────────────────────────────────────── │
│  Full Papers — Abstract   Sep 22...   —          │
│  Full Papers — Submission Sep 30...   Dec 1...   │
│  ...                                             │
│  ═══════════════════════════════════════════════  │
│  Conference               March 16–19, 2027...   │
└──────────────────────────────────────────────────┘
```

- Full-width table within container, `border-collapse: collapse`
- Header: JetBrains Mono 0.88rem uppercase, `color: var(--text-dim)`, `border-bottom: 2px solid var(--text)`
- Cells: 1rem body font, `border-bottom: 1px solid var(--border)`, `color: var(--text-sec)`
- First column: `color: var(--text)`, `font-weight: 600`
- Dates use `<time>` elements styled in JetBrains Mono 0.88rem
- Row hover: `background: rgba(180,122,15,0.03)`
- Footer row: `font-weight: 700`, `color: var(--accent)`, `border-top: 2px solid var(--accent)`
- Note below table: JetBrains Mono 0.8rem, `color: var(--text-dim)`
- Horizontally scrollable wrapper on mobile

### 4.4 About / Text Section

- Lead paragraph: DM Sans 1.15rem bold, `line-height: 1.5`
- Body: Inter 1rem, `line-height: 1.8`, `color: var(--text-sec)`, `max-width: 700px`
- Emphasized terms (e.g., conference theme): `color: var(--accent)`, `font-weight: 600`, `font-style: normal` (override `<em>`)

### 4.5 Photo Section

- Placeholder: `width: 100%`, `height: 300px`, `background: rgba(0,0,0,0.03)`, `border: 1px dashed rgba(0,0,0,0.12)`, `border-radius: 8px`
- Label: JetBrains Mono 0.8rem uppercase, centered, `color: var(--text-dim)`

### 4.6 Sponsors Grid

- CSS Grid: `repeat(auto-fill, minmax(140px, 1fr))`, `gap: 1rem`
- Each slot: `height: 50px`, `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 4px`
- Hover: `border-color: rgba(180,122,15,0.2)`

### 4.7 Footer

```
┌─────────────────────────────────────────────────────┐
│  © 2027 ACM/IEEE...              Contact  Past  CoC │
└─────────────────────────────────────────────────────┘
```

- Padding: `2.5rem 0`
- Flex row: `justify-content: space-between; align-items: center`
- Copyright: JetBrains Mono 0.8rem, `color: var(--text-dim)`, `max-width: 500px`
- Links: JetBrains Mono 0.8rem uppercase, `letter-spacing: 0.06em`, `color: var(--text-dim)`, hover → `var(--text)`
- Mobile: stacks vertically, centered text

### 4.8 CTA Button

```css
display: inline-block;
font-family: var(--font-mono);
font-size: 0.88rem;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.06em;
background: var(--text);
color: var(--bg);
padding: 0.7rem 1.5rem;
border-radius: 4px;
```
Hover: `opacity: 0.8`. Transition: `opacity 0.2s`.

### 4.9 Countdown

- Positioned below CTA in hero, `margin-top: 2.5rem`
- Numbers row: flex, `gap: 2rem` (1.5rem mobile)
- Each unit: number + label stacked vertically
- Numbers: JetBrains Mono 2.2rem bold (1.5rem mobile), `color: var(--accent)`
- Labels: JetBrains Mono 0.8rem uppercase, `color: var(--text-dim)`
- Caption: JetBrains Mono 0.8rem, `color: var(--text-dim)`, `margin-top: 0.75rem`

---

## 5. Terrain Animation

The terrain is the site's visual signature. It renders on a `<canvas>` element in the hero section.

### Behavior
- 18 contour lines with 100 sample points each
- Lines start at 15% from top, spaced 4.5% apart vertically
- Three overlapping sine waves create organic hill shapes
- Mouse proximity creates a ripple effect (15% radius, 0.05 strength)
- Scroll creates parallax shift (20% of scroll distance)
- Animation speed and amplitude are driven by real-time Santa Clara temperature via Open-Meteo API
- Respects `prefers-reduced-motion: reduce` — animation does not start

### Mode System
The terrain cycles through four visual modes with smooth morphing transitions:
1. **Hills** (default) — organic rolling contours
2. **Signal/PWM** — binary pulse-width modulation encoding messages ("HRI 2027", "INNOVATIVE", "HELLO WORLD")
3. **Circuit** — quantized grid-snapped traces with via dots
4. **Sine** — frequency-modulated waves encoding the word "HUMAN"

Cycle: hills → circuit → hills → signal → hills → sine (configurable via `MODE_ORDER`)
Hold times: 8s for hills, 10s for effects. Transitions: 3.5s smooth morph.

### Line Appearance
- Opacity: 0.10 (first line) → 0.35 (last line)
- Stroke width: 0.8px (first) → 2.0px (last)
- Fill: linear gradient from line color at 0.06–0.21 opacity, fading to transparent over 25% of canvas height
- Color: `currentColor` from the time-of-day accent (same RGB as `--accent`)

### Canvas CSS
```css
position: absolute; inset: 0;
width: 100%; height: 100%;
pointer-events: none;
mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
-webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
```

Mobile: `opacity: 0.6`.

---

## 6. Day/Night Mode

The site automatically switches between day and night mode based on Santa Clara, CA local time.

- Night: 21:00–05:00 Pacific
- Day: 05:00–21:00 Pacific
- Checked every 60 seconds
- All color transitions use `transition: 2s ease` for smooth crossfade
- Night mode swaps the nav logo image (`.nav-logo-day` hidden, `.nav-logo-night` shown)
- The `--accent` color changes continuously based on time-of-day color stops

---

## 7. Responsive Behavior

Single breakpoint at `768px`.

### Desktop (>768px)
- Container: 960px max, 2rem horizontal padding
- Nav: horizontal links, no hamburger
- Hero: 85vh min-height, 6rem bottom padding
- Logo: 34px height
- Footer: horizontal row

### Mobile (≤768px)
- Container: 1.5rem horizontal padding
- Nav: hamburger toggle, vertical dropdown links
- Hero: 70vh min-height, 4rem bottom padding
- Hero content: 12px border-radius, 1.5rem padding, 0.75px backdrop blur
- Logo: 27px height
- Terrain canvas: 0.6 opacity
- Countdown numbers: 1.5rem, gap 1.5rem
- Table cells: 0.88rem font, tighter padding
- Footer: stacked vertically, centered

---

## 8. Interaction Patterns

### Hover States
- Nav links: `color` transition 0.2s to `var(--text)`
- Table rows: subtle gold background tint `rgba(180,122,15,0.03)`
- Sponsor slots: border color shifts to `rgba(180,122,15,0.2)`
- CTA button: opacity drops to 0.8
- Footer links: color transition to `var(--text)`

### Scroll
- Nav is sticky (`position: sticky; top: 0`)
- Terrain parallax shifts 20% of scroll distance
- Smooth scroll enabled via `html { scroll-behavior: smooth }`

### Selection
- Text selection color: `rgba(180,122,15,0.2)` — gold tint

---

## 9. Accessibility

- Terrain canvas has `aria-hidden="true"` — decorative only
- Animation respects `prefers-reduced-motion: reduce`
- Hamburger button has `aria-label="Toggle navigation"`
- All text meets contrast requirements on `#fafafa` background
- Semantic HTML: `<nav>`, `<section>`, `<footer>`, `<table>`, `<time>`
- Dates use `<time>` elements for machine readability

---

## 10. File Structure

```
/                           Root (development)
├── index.html              Main page markup
├── style-b.css             All styles
├── terrain-b.js            Canvas terrain animation + day/night mode
├── logo/
│   ├── HRI Logo Black.png  Day mode logo
│   └── HRI Logo White.png  Night mode logo
│
/deploy/                    Production (GitHub Pages)
├── index.html              Production markup (keep in sync)
├── style-b.css             Production styles (keep in sync)
├── terrain-b.js            Production terrain JS (keep in sync)
├── logo/                   Production logos
└── Group 11.png            Additional asset
```

Both root and deploy must be kept in sync. The deploy folder is a git submodule pointing to the GitHub Pages repo.

---

## 11. Building New Pages

When creating a new page (e.g., speakers, program, registration):

1. **Copy the HTML skeleton** from `index.html` — keep the `<head>` (fonts, CSS link, inline styles), `<nav>`, and `<footer>` exactly as-is.

2. **Use the same CSS file** (`style-b.css`). Add page-specific styles in a `<style>` block in the `<head>` or append to the CSS file under a clear comment header.

3. **Follow the section pattern:**
   ```html
   <section class="your-section" id="anchor">
     <div class="container">
       <h2 class="section-title">Section Title</h2>
       <!-- content -->
     </div>
   </section>
   ```

4. **Use existing type classes** wherever possible: `.section-title`, `.hero-edition` (for body-sized descriptions), `.hero-orgs` (for monospace metadata).

5. **Tables** should follow the `.dates-table` pattern: monospace headers, body font cells, first-column bold, hover tint, accent footer row.

6. **Cards or grid items** should use `var(--surface)` background, `var(--border)` border, 4px radius, and gold hover border.

7. **The hero section with terrain** should only appear on the homepage. Subpages should use a simpler hero with the same typography but a solid `var(--bg)` background.

8. **Include `terrain-b.js`** only on the homepage. Other pages don't need the canvas.

9. **Keep the nav links updated** across all pages. Add new pages to the `<ul class="nav-links">` on every page.

10. **Test in both day and night mode.** The easiest way is to set `FORCE_DAY: true` or manually override `--bg` and `--text` in dev tools. Ensure all text remains readable and borders remain visible in both modes.

11. **Sync to deploy/** after changes. Commit and push the deploy submodule separately.

---

## 12. Don'ts

- Don't introduce a second accent color. The site uses one dynamic `var(--accent)` that shifts with time of day — always use the variable, never hardcode a color for accent elements.
- Don't use rounded corners larger than 12px.
- Don't add drop shadows. The design is flat with subtle borders.
- Don't use images as section backgrounds. Solid `var(--bg)` or `var(--surface)` only.
- Don't center body text. All text is left-aligned (except footer on mobile and placeholder labels).
- Don't use font sizes outside the established type scale without strong justification.
- Don't add CSS animations beyond hover transitions (0.2s) and the day/night crossfade (2s). The terrain canvas handles all ambient motion.
- Don't use stock photography of robots or tech campuses. The terrain is the visual identity.
