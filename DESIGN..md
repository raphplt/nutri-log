# Nutrilog Design System

## 1. Visual Theme & Atmosphere

Nutrilog is a kitchen-counter companion — a mobile app that turns the daily ritual of eating into something calm, legible, and motivating. The design operates on a principle of **ingredient-first minimalism**: strip the UI back to near-black, bone-white, and warm greys so that the food itself — ingredient photography, macro rings, the day's progress — can carry the color. The result feels less like a tracker and more like a quiet editorial notebook: a place to log what you ate without being scolded by it.

The foundation is aggressively monochromatic, with a single signature accent — **Matcha** (`#3FA46A`), a muted leafy green that nods to freshness without falling into the "salad app" cliché. Matcha appears only in moments that deserve it: the active state of a day streak, a macro goal reached, the primary CTA. Everything else lives in a disciplined grey ramp. Food photography (meal thumbnails, barcode-scanned product shots) is the second color source — warm, saturated, unfiltered.

The typography system leans on **Inter** (system-available via Expo) for body and UI, with a tighter **Inter Display** cut for the hero numbers that dominate this kind of app: today's kcal count, current weight, macro totals. Numbers are the headlines here — not words — so the display layer is tuned for tabular figures with tight line-height (0.95) and a slight letter-spacing reduction so big numbers feel monumental rather than cartoonish. Under the display, body text uses generous 1.5 line-height for comfortable scanning of meal lists and ingredient labels.

**Key Characteristics:**
- Monochromatic dark canvas (`#0A0A0F` → `#1E1E2A`) with a single Matcha accent
- Oversized display numerics (kcal, weight, streak) as the primary hero element
- Full-bleed meal photography with gentle 12px radius — softer than Nike, warmer than clinical
- Pill-shaped primary buttons (28px radius) and rounded cards (16px radius)
- 4px spacing grid with mobile-native discipline
- Macro color-coding (protein/carbs/fat) used only in charts and rings, never in chrome
- Shadow-minimal elevation — surface differentiation through layered dark greys, not shadow

## 2. Color Palette & Roles

### Primary

- **Ink** (`#0A0A0F`): App canvas background — a near-black with a trace of cool blue, avoiding the flatness of pure `#000000`
- **Bone** (`#F1F5F9`): Primary text on dark, button text on accent, high-contrast surfaces

### Surface & Background (Dark-first)

- **Canvas** (`#0A0A0F`): Root app background
- **Surface** (`#16161F`): Cards, sheets, meal rows — one step lighter than canvas
- **Surface Raised** (`#1E1E2A`): Modals, active pressed states, elevated input backgrounds
- **Surface Hover** (`#252533`): Interactive hover/press state on dark surfaces
- **Divider** (`#2A2A3A`): Hairline dividers, card borders
- **Border Active** (`#3F3F52`): Focused input borders

### Neutrals & Text

- **Text Primary** (`#F1F5F9`): Headings, primary copy, numerics
- **Text Secondary** (`#94A3B8`): Metadata, timestamps, nutrient units (g, kcal)
- **Text Muted** (`#64748B`): Disabled, placeholder, tertiary labels
- **Text Inverse** (`#0A0A0F`): Text on Matcha or Bone surfaces

### Signature Accent

- **Matcha** (`#3FA46A`): Primary accent — CTAs, active states, goal-reached indicators, focused elements
- **Matcha Deep** (`#2F8553`): Pressed/hover state of Matcha
- **Matcha Glow** (`rgba(63, 164, 106, 0.16)`): Focus rings, subtle highlight backgrounds, active-day pill fill

### Macro Palette (charts & rings only — never UI chrome)

- **Protein** (`#EF4444`): Red-coral, assertive — the muscle macro
- **Carbs** (`#F59E0B`): Warm amber — the fuel macro
- **Fat** (`#8B5CF6`): Soft violet — the density macro
- **Fiber** (`#3FA46A`): Matcha — overlaps the accent intentionally

### Semantic

- **Danger** (`#EF4444`): Errors, destructive actions, over-goal warnings
- **Warning** (`#F59E0B`): Approaching limits, unverified barcode results
- **Success** (`#3FA46A`): Goal met, save confirmations — reuses Matcha
- **Info** (`#60A5FA`): Informational banners, tooltips

### Gradient System

Nutrilog avoids chrome gradients. Two exceptions:
- **Scrim gradients**: linear `rgba(10,10,15,0) → rgba(10,10,15,0.9)` over meal photography for text legibility
- **Ring progress**: conic-style gradients inside macro rings only (protein/carbs/fat arcs)

The base UI stays flat — depth comes from layered surface greys.

## 3. Typography Rules

### Font Family

**Display:** Inter Display (or SF Pro Display on iOS via system fallback)
- Weights loaded: 600, 700
- Used for hero numerics: kcal today, current weight, streak count
- Tabular figures enabled (`fontVariant: ['tabular-nums']`) for stable-width digits

**UI / Body:** Inter
- Weights loaded: 400, 500, 600
- Fallbacks: System, -apple-system, Roboto
- Handles everything from nav labels to meal descriptions

**Monospace (optional):** SF Mono / Menlo — used only for barcode values in debug/detail views

### Hierarchy

| Role | Size | Weight | Line Height | Notes |
|------|------|--------|-------------|-------|
| Hero Numeric | 48px | 700 | 0.95 | Inter Display, tabular-nums, today's kcal / current weight |
| Display | 32px | 600 | 1.05 | Section hero values (weekly avg, streak) |
| Title | 22px | 600 | 1.2 | Screen titles |
| Heading | 18px | 600 | 1.3 | Card titles, section labels |
| Body Strong | 15px | 600 | 1.4 | Meal names, food labels |
| Body | 15px | 400 | 1.5 | Descriptions, ingredient lists |
| Label | 13px | 500 | 1.4 | Input labels, tab labels |
| Caption | 13px | 400 | 1.4 | Metadata, timestamps, units |
| Micro | 11px | 500 | 1.3 | Badges, macro unit pills |

### Principles

Nutrilog's typography is built around **numbers as headlines**. A nutrition log lives or dies by how quickly the user can read their remaining kcal, their macro split, or their weight trend. The hero numeric (48px/700, tight 0.95 line-height, tabular figures) is the single most important element on the dashboard — every other type role supports it. Body text uses weight 400 with 1.5 line-height for relaxed scanning of meal lists; interactive text (tabs, buttons, pressable rows) steps up to weight 500 or 600 to signal "you can touch this." Never use weight below 400, and never use italic — Inter's variable cut makes weight alone expressive enough.

## 4. Component Stylings

### Buttons

**Primary (Matcha)**
- Background: Matcha (`#3FA46A`)
- Text: Ink (`#0A0A0F`), 15px/600
- Border: none
- Border radius: 28px (full pill)
- Padding: 14px 24px (min height 48px for touch)
- Pressed: background → Matcha Deep (`#2F8553`), scale 0.98
- Disabled: background `#1E1E2A`, text `#64748B`
- Haptic: `Haptics.impactAsync(Light)` on press

**Secondary (Outlined)**
- Background: transparent
- Text: Bone (`#F1F5F9`), 15px/600
- Border: 1.5px solid `#2A2A3A`
- Border radius: 28px
- Pressed: border → `#3F3F52`, background → `#16161F`

**Ghost / Text**
- Background: transparent
- Text: Matcha (`#3FA46A`), 15px/500
- No border, no background — inline links in lists

**FAB (Floating Action Button)**
- Background: Matcha (`#3FA46A`)
- Size: 56x56px, circular (radius 50%)
- Icon: Ink color, 24px
- Shadow: `0 4px 16px rgba(63, 164, 106, 0.35)` — the *only* place shadow is used meaningfully
- Position: bottom-right, 24px from safe-area edges

**Stepper Buttons** (NumericInput +/−)
- Background: Surface Raised (`#1E1E2A`)
- Size: 40x40px, radius 12px
- Icon color: Text Primary
- Pressed: background → `#252533`

### Cards & Containers

- Background: Surface (`#16161F`)
- Border radius: 16px (meal cards, summary cards), 20px (sheets/modals)
- Border: 1px solid `#2A2A3A` on cards that need definition; none on flat list rows
- Padding: 16px standard, 20px for summary cards
- No drop shadow — layered surface greys provide depth
- Meal Card: 64x64px food thumbnail (radius 12px) left, two-line text center, kcal right
- Macro Ring Card: centered ring (SVG), 3 macro labels below in protein/carbs/fat colors
- Weight Sparkline Card: 56px-tall chart + current weight numeric overlay

### Inputs & Forms

- Background: Surface (`#16161F`)
- Border: 1px solid `#2A2A3A`
- Border radius: 12px (standard), 28px (search/filter pills)
- Font: Inter 16px/400, text color Bone
- Placeholder: Text Muted (`#64748B`)
- Focus: border → Matcha (`#3FA46A`), ring `0 0 0 3px rgba(63, 164, 106, 0.16)`
- Error: border → Danger (`#EF4444`), error text below in 13px/500
- Min height: 48px (touch target)
- NumericInput: integrates stepper buttons inline, tabular figures for display

### Navigation

- **Bottom Tab Bar**: Surface (`#16161F`) background, top border 1px `#2A2A3A`, safe-area padded
- Active tab: Matcha icon + label (13px/600)
- Inactive tab: Text Muted (`#64748B`) icon + label (13px/500)
- 4–5 tabs max (Today, Meals, Add FAB, Weight, Profile)
- **Header**: transparent or Canvas background, title 18px/600 centered, back chevron left, optional action right
- **Day Navigator**: horizontal segmented row, today highlighted with Matcha Glow background + Matcha text

### Image Treatment

- Meal thumbnails: 12px radius, 1:1 square, placeholder Surface (`#16161F`) with utensil icon centered
- Hero product images (barcode scan result): full-width, 16:9, 16px radius, dark gradient scrim bottom for text
- Avatar/profile: circular (50%), 48px default
- Lazy loading: solid Surface background during fetch, fade-in 200ms

### Progress Indicators

- **Macro Ring**: SVG, 120px diameter default, 12px stroke, rounded caps, protein/carbs/fat arcs, Ink inner hole with centered kcal numeric
- **Progress Bar**: 6px height, radius full, track `#1E1E2A`, fill Matcha (or macro color when labeling a specific macro)
- **Streak Indicator**: pill-shaped, Matcha Glow background, Matcha text, flame icon leading

### Banners & Notifications

- **Recalcul Banner**: Surface Raised (`#1E1E2A`), 16px radius, 1.5px left border in Warning, 12px padding, dismissible
- **Goal-reached toast**: Matcha background, Ink text, auto-dismiss 3s, slide-up from bottom

## 5. Layout Principles

### Spacing System

Base unit: 4px

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Icon-to-label gap, tag internal padding |
| sm | 8px | Inline element gap, compact list rows |
| md | 12px | Card internal gap, between stacked fields |
| lg | 16px | Standard screen horizontal padding, card padding |
| xl | 24px | Section breaks, FAB edge offset |
| xxl | 32px | Major section separators, empty-state vertical padding |
| hero | 48px | Hero numeric top margin, onboarding vertical rhythm |

### Grid & Container

- Mobile-first: single column, 16px horizontal screen padding
- Card stacks: vertical 12px gap between cards
- Meal timeline: vertical list, 1px `#2A2A3A` dividers between rows (no card containers — lighter feel)
- Safe-area aware: all root screens use `SafeAreaView` / `useSafeAreaInsets`
- Tablet breakpoint: two-column card layout at ≥768px for dashboard summary

### Whitespace Philosophy

Nutrilog's whitespace is **calm, not luxurious**. A logging app is used 5–10 times a day in 15-second bursts — it must feel frictionless, not meditative. That means tight vertical rhythm inside cards (8–12px between meal thumbnail and text) but generous breathing room between sections (24–32px). The hero numeric gets the most space of anything on screen: at least 32px above and below to feel monumental. Lists use 1px dividers instead of card boundaries to keep density high without visual noise.

### Border Radius Scale

| Value | Context |
|-------|---------|
| 0px | Top of bottom-sheet handles, section dividers |
| 8px | Micro pills, macro unit badges, small tags |
| 12px | Food thumbnails, inputs, stepper buttons |
| 16px | Cards, banners, list containers |
| 20px | Bottom sheets, modals, onboarding cards |
| 28px | Primary/secondary buttons, search pills, chips |
| 50% (9999) | FAB, avatars, streak indicators, circular icon buttons |

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow, no border | Default for list rows, tabs |
| Hairline | 1px `#2A2A3A` border or divider | Card edges, input borders, row separators |
| Lifted | Surface Raised (`#1E1E2A`) background, no shadow | Modals, pressed states |
| Focus | `0 0 0 3px rgba(63, 164, 106, 0.16)` ring | Focused inputs, keyboard-navigated elements |
| Float | `0 4px 16px rgba(63, 164, 106, 0.35)` | FAB only — the single shadowed element |

Nutrilog's elevation model is **flat-with-one-exception**. There are no card shadows, no hover lifts on list rows, no floating panels. Depth is communicated through layered surface greys (`#0A0A0F` → `#16161F` → `#1E1E2A` → `#252533`), which reads cleanly on OLED mobile screens and conserves battery. The only element that floats is the FAB — and its Matcha-tinted shadow is what tells the user "this is the action, start here."

### Decorative Depth

- **Meal photo scrims**: `rgba(10,10,15,0) → rgba(10,10,15,0.9)` bottom gradient over hero food imagery
- **Active-day pill**: Matcha Glow background — no shadow, just a color wash
- **Macro ring hole**: slightly darker inner circle (`#0A0A0F`) to recede behind the numeric

## 7. Do's and Don'ts

### Do

- Use Ink (`#0A0A0F`) for the app canvas — never pure `#000000`
- Reserve Matcha (`#3FA46A`) for single-purpose moments: primary CTA, goal-reached, active state, focus
- Use tabular figures (`fontVariant: ['tabular-nums']`) for every numeric — kcal, weight, macro grams
- Keep the hero numeric at 48px/700 with 0.95 line-height — it anchors every dashboard
- Use layered surface greys for elevation, not shadows (FAB is the only exception)
- Let food photography and macro-ring colors carry vibrancy — keep chrome monochromatic
- Use weight 500 or 600 for anything tappable, 400 for pure reading
- Macro colors (protein/carbs/fat) appear only in charts, rings, and tiny unit badges — never in backgrounds, borders, or nav
- Use Matcha Glow (`rgba(63, 164, 106, 0.16)`) for focus rings and active-day highlights
- Maintain 48px minimum touch target on every interactive element

### Don't

- Don't introduce a second accent color — one accent (Matcha) is the whole system
- Don't use macro colors in UI chrome (tabs, headers, buttons) — they are strictly chart/ring tokens
- Don't add card shadows — the FAB is the one exception, and it's Matcha-tinted, not neutral
- Don't use italics — Inter's weight axis is the only emphasis tool
- Don't use border radius below 8px on interactive elements — it reads as "web form"
- Don't use weight 400 for buttons, tabs, or labels — always 500+
- Don't stack more than two cards deep — if a screen needs more, it needs sections
- Don't use pure white (`#FFFFFF`) anywhere — Bone (`#F1F5F9`) is softer on OLED
- Don't apply Matcha to destructive or neutral actions — it means "progress, go, confirm" and nothing else
- Don't auto-capitalize meal names or food labels — preserve what the user typed

## 8. Responsive Behavior

### Breakpoints (mobile-native)

| Name | Width | Devices | Key Changes |
|------|-------|---------|-------------|
| Compact | <360px | SE, small Androids | Hero numeric scales to 40px, horizontal padding 12px |
| Regular | 360–430px | iPhone 14/15, Pixel | Default layout, 16px padding |
| Large | 430–600px | Pro Max, foldable front | Slightly larger hero (52px), 20px padding |
| Tablet | ≥768px | iPad, tablets | Two-column dashboard, max content width 560px centered |

### Touch Targets

- Minimum: 48x48px (Material AAA, slightly above WCAG 44px)
- Meal rows: full-row tappable, min height 64px
- FAB: 56x56px with 24px edge offset from safe area
- Stepper +/−: 40x40px each, spaced 8px apart
- Tab bar items: min 48x48px, full-height tappable column

### Collapsing Strategy

- **Hero numeric**: 48px → 40px on Compact; stays 48px elsewhere
- **Macro rings**: 120px diameter → 96px on Compact
- **Meal timeline**: 64px thumbnail → 56px on Compact
- **Bottom sheet**: full-screen on Compact, 90% height elsewhere
- **Day navigator**: shows 5 days → 3 days on Compact, centered on today

### Image Behavior

- Meal thumbnails: lazy-loaded, Surface placeholder during fetch, fade-in 200ms
- Product hero (barcode result): aspect 16:9, cover fit, scrim applied
- Avatars: instant render at two resolutions (@2x, @3x) — no lazy load

## 9. Agent Prompt Guide

### Quick Token Reference

- Canvas: `#0A0A0F`
- Surface: `#16161F`
- Surface Raised: `#1E1E2A`
- Divider: `#2A2A3A`
- Text Primary: `#F1F5F9`
- Text Secondary: `#94A3B8`
- Text Muted: `#64748B`
- Matcha (accent): `#3FA46A`
- Matcha Deep: `#2F8553`
- Matcha Glow: `rgba(63, 164, 106, 0.16)`
- Protein: `#EF4444` / Carbs: `#F59E0B` / Fat: `#8B5CF6`
- Danger: `#EF4444` / Warning: `#F59E0B` / Info: `#60A5FA`

### Example Component Prompts

- "Build a daily summary card: Surface background, 16px radius, 20px padding. Centered macro ring (120px, 12px stroke, protein/carbs/fat arcs). Hero kcal numeric in the ring hole at 48px/700 tabular. Under the ring, three macro pills (protein red, carbs amber, fat violet) each showing `{grams}g` in 13px/500."
- "Build a meal timeline row: horizontal flex, 16px padding, 1px `#2A2A3A` bottom divider. Left: 56x56px food thumbnail with 12px radius. Center: meal name 15px/600 Bone + portion 13px/400 Text Secondary. Right: kcal in 15px/600 tabular-nums, `kcal` label 11px/500 Text Muted below."
- "Build a Matcha FAB at bottom-right: 56x56px circular, Matcha background, Ink plus icon 24px, shadow `0 4px 16px rgba(63,164,106,0.35)`, 24px offset from safe-area bottom and right. On press: scale 0.96 + Haptics Light."
- "Build a day navigator: horizontal row, 5 day pills evenly spaced. Each pill 40x56px, 12px radius. Today: Matcha Glow background + Matcha text. Other days: transparent + Text Secondary. Weekday letter 11px/500 above day number 17px/600."
- "Build a weight sparkline card: Surface background, 16px radius, 20px padding. Top row: 'Weight' label 13px/500 Text Secondary + current weight 32px/600 tabular with 'kg' 15px/400 Text Secondary. Below: 56px-tall line chart, Matcha stroke, no fill, rounded caps, 7-day window."

### Iteration Guide

1. Focus on ONE component at a time, reference tokens by name + hex
2. Matcha is sacred — if a surface uses it and isn't a primary action/active state/goal-met, remove it
3. Food photography and macro colors are the only chroma sources — all chrome stays grey
4. Numbers are headlines: tabular-nums always, generous size, tight line-height
5. Depth = surface greys, not shadows (FAB is the only exception)
6. Every interactive element ≥48px touch target — non-negotiable
7. Test every screen against Compact (<360px) — if the hero numeric wraps, the layout is wrong
