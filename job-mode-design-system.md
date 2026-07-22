# Job Mode — Design System & UX Fix Spec

Purpose of this document: a single reference an engineering/coding agent can implement against. It covers (1) the target color system with exact tokens, (2) component rules, (3) confirmed bugs to fix, and (4) a page-by-page task list. Treat section 1–2 as the source of truth; every other page should be refactored to use these tokens rather than one-off colors.

---

## 1. Design principles

1. **One brand color.** Navy is primary. The logo, the top-level accent, and the header should not compete with a second "primary-looking" color (currently orange logo text + purple CTA button send mixed signals about what the brand color is).
2. **Color = meaning, not decoration.** Every color in the product maps to exactly one semantic role (below). A color is never reused for an unrelated purpose on another screen.
3. **One component per pattern.** There should be exactly one visual pattern for "selectable pill/tab," one for "card," one for "button," reused everywhere — not three different selector styles across three pages.
4. **No dead states that look like disabled states.** Anything the user can click must look clickable (visible border/fill), not greyed out.
5. **Light theme only, applied consistently.** No page should switch to a dark surface unless the entire app does.

---

## 2. Color tokens

### 2.1 Core brand

| Token | Hex | Usage |
|---|---|---|
| `--color-navy-900` | `#1B2A4A` | Primary brand color: logo, primary buttons, active nav item, active tab, headings |
| `--color-navy-700` | `#2C3E63` | Hover state for navy elements |
| `--color-cream-bg` | `#F4EFE4` | Page background |
| `--color-surface` | `#FFFFFF` | Card/panel background |
| `--color-border` | `#E4DED0` | Default hairline border on cream/white |
| `--color-border-strong` | `#C9C2AF` | Border for unselected-but-clickable pills/tabs |
| `--color-text-primary` | `#1B2A4A` | Headings, primary text |
| `--color-text-secondary` | `#6B6B63` | Supporting/muted text, labels |
| `--color-text-muted` | `#9A968A` | Placeholder, timestamps, fine print |

**Retire:** the orange logo color and the purple "Generate report" button color. Pick one: either the logo becomes navy (recommended, matches everything else), or navy becomes the one exception and is used only for the wordmark — never for buttons or data.

### 2.2 Semantic roles

Each role has a **fill** (badge/tag background), a **text** (readable on that fill), and a **border** (for outlined variants). Use these — and only these — for their stated meaning everywhere in the app.

| Role | Meaning | Fill (bg) | Text | Border |
|---|---|---|---|---|
| `success` | Good score, placed, skill matched, on-track | `#EAF3DE` | `#27500A` | `#97C459` |
| `danger` | Poor score, missing skill, gap, failed check | `#FCEBEB` | `#791F1F` | `#F09595` |
| `warning` | Needs improvement, medium confidence, caution | `#FAEEDA` | `#854F0B` | `#EF9F27` |
| `accent` | Clickable / active / primary action / links | `#E6F1FB` | `#0C447C` | `#378ADD` |
| `neutral` | Informational, generic tag, no judgment implied | `#F1EFE8` | `#444441` | `#B4B2A9` |

**Rule of thumb when auditing an existing element:** ask "is this good, bad, cautionary, clickable, or neutral?" — that answer picks the role. Never pick a color because it "looks nice next to" a neighboring element.

### 2.3 Data visualization

Charts and progress bars should use **one ramp per metric type**, not a different color per bar in the same chart:

- Comparative metrics that are all the same *kind* of thing (e.g. Communication / Tech Depth / Clarity, or Algorithms / Systems / Databases) → all bars use `--color-navy-900` at full opacity, only the fill % differs. Do not assign purple to one, green to another, orange to a third.
- Only switch color when the *meaning* switches (e.g. a "gap" bar vs. a "have" bar) — then use `danger` vs `success` fills.
- **Minimum visible fill:** any progress bar representing a nonzero-but-low value (e.g. 13%, 0/20) must render with a minimum 4px visible fill in its role color, so a "poor" score is legible as a short red/amber bar, not an invisible line.

---

## 3. Component rules

### 3.1 Buttons
- One primary button per screen, `--color-navy-900` fill, white text. Reserve for the single most important action on that view (e.g. "Save profile," "New analysis").
- Secondary actions: white background, `--color-border-strong` border, `--color-text-primary` text.
- Never render an actionable button in a greyed/low-contrast state to indicate "available but not yet clicked" — that reads as disabled. If a button is genuinely disabled (e.g. requires an upload first), grey it out **and** show a tooltip or helper line explaining why.

### 3.2 Selectable pills / tabs / role selectors
Standardize on **one** pattern, used identically in Skill Gap role selection, Recommendations tabs, and anywhere else a "pick one of several" control appears:
- **Selected:** navy fill (`--color-navy-900`), white text, no border.
- **Unselected:** white fill, `--color-text-primary` text, `--color-border-strong` 1px border. Must look clickable, not disabled.
- Hover (unselected): `--color-cream-bg` fill.

### 3.3 Status badges (Poor / Fair / Good / Placed, etc.)
- Always use the semantic role fill/text/border from §2.2. "Poor" = danger, "Fair" = warning, "Good"/"Excellent" = success, "Placed" = success.

### 3.4 Cards
- White surface, `--color-border` 1px, 12px radius, consistent padding (16–20px).
- Card headers: 13px uppercase label in `--color-text-secondary`, not full-strength navy — reserve strong navy for the number/value itself so the eye lands on data, not labels.

### 3.5 Progress bars / gauges
- Track: `--color-border`.
- Fill: role color per §2.3, with the minimum-visible-fill rule applied.
- Always pair the bar with its numeric value — never bar-only.

---

## 4. Confirmed bugs (fix regardless of visual redesign)

1. **Ghost/bleeding text — Resume Analysis page.** Faint text reading "Role Alignment," "Flaws (7)," "JD Matcher" is visible behind/through the ATS Score card. Almost certainly a stacking/opacity (z-index or `opacity`) issue on an element that should be fully hidden or fully shown. Fix and verify at 100% opacity in both states.
2. **Blank/empty stat box — Landing page hero mockup.** Third metric box next to "Readiness score 94%" and "Growth insights 2.4k" renders empty. Either populate it with a real third metric or remove the box entirely.
3. **Clipped elements (overflow, not scroll):**
   - "Initiate extraction" button on Features/Pipeline page clips at the viewport edge.
   - "For Universities" card on Contact page clips at the bottom.
   - Chart legend on Tracking Engine clips at the bottom (values "75%… 50%" cut off).
   - "Career matches found" floating badge on the landing page overlaps/clips at its container edge.
   - Fix: audit fixed-height containers that hold dynamically-sized content; switch to `min-height` + padding, or contain the element fully within its parent's bounding box.
4. **Duplicate data blocks — Dashboard Overview.** "Top Roles" and "Role Match Scores" cards render the identical 5 roles with identical percentages in two different chart styles. Remove one (keep the bar-chart version; it's more scannable).
5. **Placeholder copy shipped as real content — Placement Engine.** Every "Active Placement Drive" card uses the literal string `"Great opportunity at Google"` (also for Microsoft, Amazon — text unchanged), and all three cards share the identical deadline `7/29/2026`. Replace with real per-role descriptions and distinct deadlines, or clearly mark the section as sample/demo data if it's meant to stay generic.
6. **Casing/typo pass.** "Sql" should render as "SQL." Run a pass across all skill/tag strings for correct capitalization (SQL, Power BI, Excel, etc. — not sentence-cased abbreviations).

---

## 5. Page-by-page task list

### Dashboard Hub / Overview
- [ ] Remove duplicate "Top Roles" list card; keep "Role Match Scores" bar chart only.
- [ ] Restyle "Generate report" as a real enabled/disabled button per §3.1 (currently ambiguous grey-with-purple-text state).
- [ ] Fix "Sql" → "SQL"; audit all tags.
- [ ] Increase "Confidence 50% | Uncertainty Medium" to 13px min, apply `warning` role color to "Medium," not decorative orange.
- [ ] Apply consistent card header styling (§3.4).

### Skill Gap
- [ ] Restyle role pills per §3.2 (selected = navy fill, unselected = white + border, not greyed).
- [ ] Add a one-line tooltip/subtext explaining what the % next to each role means (e.g. "match confidence based on your resume").

### Resume Analysis
- [ ] Fix ghost text bug (§4.1).
- [ ] Apply minimum-visible-fill rule to all progress bars (§2.3), especially Skill Density (0/20) and Project Quality (1/15).
- [ ] Rebuild "ATS Score" as a proper tab bar alongside the other three visible-but-inactive labels (Role Alignment, Flaws, JD Matcher) using the §3.2 pattern.

### Placement Score
- [ ] Apply single-ramp rule to Communication/Tech Depth/Clarity and Algorithms/Systems/Databases bars — one navy ramp, not purple/green/orange per bar.
- [ ] Apply minimum-visible-fill rule (Skills Breadth 13% is currently invisible).

### Career Recommendations
- [ ] Replace the green/white tab pattern with the standard §3.2 pill pattern (currently a third, different selector style vs. Skill Gap's pills and the top nav's underline).
- [ ] Visually separate "skills you have" tags from "resume-writing tips" tags — they are different content types currently rendered identically.

### Landing / Home
- [ ] Fill or remove the blank third stat box in the hero mockup (§4.2).
- [ ] Reposition "Career matches found" badge so it doesn't clip its container.
- [ ] Fill the large empty whitespace in the upper-right of the hero, or reduce hero height to match content.

### Features / Pipeline
- [ ] Give inactive pipeline nodes a light navy fill (10% tint) instead of pure white outline, so they read as "part of the flow," not unavailable.
- [ ] Fix "Initiate extraction" button clipping at viewport edge (§4.3).

### Contact
- [ ] Rebuild the dark terminal-style form widget in the light theme (white surface, navy text, standard input styling) to match the rest of the app.
- [ ] Fix "For Universities" card clipping at the bottom.

### My Profile
- [ ] Rebuild all form inputs from black background to standard light input style: white/cream fill, `--color-border` outline, `--color-text-primary` text, `--color-text-muted` placeholder.

### Placement Engine
- [ ] Replace placeholder card copy (§4.5) with real, distinct descriptions and deadlines per role.
- [ ] Confirm "Placed" badge uses `success` role styling (already correct — keep as reference example).

### Tracking Engine
- [ ] Fix clipped chart legend at the bottom (§4.3).
- [ ] Confirm whether the downward-trending "score evolution" line is intentional; if it represents volatility rather than decline, consider relabeling or adding one line of context text so a downward line doesn't read as bad news by default.

### Practice Engine
- [ ] No changes needed — the "Arena Not Loaded" empty state (clear message + clear next step) is the best-executed screen in the current build. Use its copy pattern ("Do X first. Y will appear here.") as the template for other empty states across the app.

---

## 6. Suggested implementation order

1. Fix the confirmed bugs in §4 — no design decisions required, immediate quality lift.
2. Implement the color tokens in §2 as CSS custom properties (or your framework's theme config) so every component pulls from one source instead of hardcoded hex values.
3. Build the three standardized components in §3 (button, pill/tab, badge) and swap every existing instance to use them.
4. Rebuild Contact and My Profile in the light theme.
5. Work through §5 page-by-page, top to bottom.
6. Final pass: search the codebase for hardcoded hex colors outside the token file and replace them.
