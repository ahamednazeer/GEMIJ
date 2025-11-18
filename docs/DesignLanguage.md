# Academic Journal Design Language

Single source of truth for UI/UX, theming, and component behavior. Built for React + Tailwind with CSS variables.

## Visual Identity — Key Principles
- **Clear & trustworthy**
- **Author-first**
- **Minimal & legible**
- **Accessible (WCAG AA)**
- **Modular & reusable**

## Brand Voice
- **Tone**: professional, friendly, neutral.
- **Microcopy**: direct, helpful, action-oriented. Prefer "Submit manuscript" over "Upload now".
- **Errors**: concise + actionable (what happened + how to fix).
- **Notifications**: polite, timestamped, link to next action.

## Design Tokens
Defined in CSS variables (`src/index.css :root`) and mapped in Tailwind (`tailwind.config.js`).

- **Colors**
  - Semantic: `background`, `foreground`, `muted`, `muted-foreground`, `border`, `ring`, `link`.
  - Palettes: `primary`, `secondary`, `success`, `warning`, `error` (full scales 50–950).
  - Example usage:
    - Background: `bg-background`
    - Border: `border-border`
    - Muted surface: `bg-muted`
    - Link: `text-link`
- **Typography**
  - Display/Headings: `Merriweather, Georgia, serif`
  - Body: `Inter, system-ui, sans-serif`
  - Typography plugin presets tuned for readable prose.
- **Radii**: `--radius-sm`, `--radius-md`, `--radius-lg` → Tailwind `rounded` scale.
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg` → Tailwind `shadow` scale.
- **Spacing**: Defaults + extended (`18`, `88`, `128`).

## Accessibility (AA)
- **Focus**: visible rings (`ring-2 ring-primary-500 ring-offset-2`).
- **Tap targets**: min 36px (sm), 44px (md), 48px (lg). Buttons updated.
- **Keyboard**: all interactive elements keyboard reachable; `:focus-visible` styles applied.
- **ARIA**: components expose roles/labels where relevant (e.g., `Alert` uses `status/alert`).
- **Reduced motion**: honors `prefers-reduced-motion`.
- **High contrast**: improved text fallbacks for secondary tones.

## Global Patterns
- **Links**: underlined with offset, hover darkens.
- **Cards**: semantic tokens for surface/border. Classes: `.card`, `.card-header`, `.card-body`, `.card-footer`.
- **Forms**: Tailwind Forms plugin; `.form-*` utility classes for labels/inputs.
- **Skip link**: available in `index.html` (`#main-content`).

## Core Components
Located in `src/components/ui/`.

- **Button**
  - Variants: `primary | secondary | outline | ghost | danger`
  - Sizes: `sm (36px) | md (44px) | lg (48px)`
  - Supports `loading` state.
- **Input**
  - Props: `label`, `error`, `helperText`, standard input props.
- **Textarea**
  - Props mirror `Input`; row control.
- **Select**
  - Controlled/uncontrolled; `options` helper prop.
- **Alert**
  - Variants: `neutral | info | success | warning | error`
  - ARIA: `role=status/alert`.
- **Badge**
  - Variants: `neutral | info | success | warning | error`.
- **Pagination**
  - Accessible pagination with compressed ellipsis.

## Author-first UX Patterns
- **Primary CTAs**: clear verbs ("Submit manuscript", "Save draft").
- **Multi-step progress**: numeric steppers with current state highlight (see `SubmitPaper` stepper).
- **Large inputs & spacing**: reduce friction, especially on mobile.
- **Helpful inline guidance**: `helperText` and non-blocking alerts.

## Content Rules
- Titles: concise, front-load keywords.
- Buttons: imperative and specific ("Download PDF", "Assign reviewer").
- Empty states: explain what, why, and what to do next.
- Errors: include cause + resolution when possible.
- Timestamps: include timezone or relative time; provide link to details.

## Theming
- Tokens are CSS variables; can support themes by overriding `:root` or adding `[data-theme="dark"]` with alternate HSL values.
- Tailwind reads semantic tokens via `tailwind.config.js` `theme.extend.colors`.

## Examples
```
<!-- Link -->
<a class="text-link underline underline-offset-2 hover:text-primary-800">Read more</a>

<!-- Card -->
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body prose">Body copy with readable typography.</div>
  <div class="card-footer">Footer</div>
</div>

<!-- Form Group -->
<label class="form-label">Email</label>
<input class="form-input" type="email" placeholder="name@university.edu" />
```

## Developer Notes
- Tailwind plugins: `@tailwindcss/forms`, `@tailwindcss/typography`, `@tailwindcss/aspect-ratio`.
- PostCSS: `postcss.config.js` present.
- Path alias `@/*` configured in `client/tsconfig.json`.
- Style Guide route: `/style-guide` for quick QA.
