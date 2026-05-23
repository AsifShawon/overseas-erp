# 12 — UI Theme & Design System

This document explains the light/dark theme system, CSS variables, design tokens, utility classes, and rules for future UI development.

---

## Design Philosophy

VisaTek ERP uses a **light-mode-first design** with an optional manual dark mode toggle. The system does NOT use OS preference (`prefers-color-scheme`) automatically. The user must explicitly switch to dark mode using the theme toggle button in the Topbar.

This approach was chosen to:
- Ensure consistent, predictable rendering across all devices and operating systems
- Give business users (who may use shared office computers) control over the display mode
- Avoid unexpected theme switches on screens with dynamic brightness settings

---

## Theme Architecture

### How Themes Work

1. The `ThemeProvider` (in `src/context/ThemeContext.tsx`) manages the active theme as React state
2. When the theme changes, it sets or removes the `data-theme="dark"` attribute on the `<html>` element
3. CSS reads the `data-theme` attribute and switches all CSS custom properties accordingly
4. The user's choice is saved to `localStorage` under the key `erp-theme`
5. On page load, the stored preference is read and applied before the first render (preventing flash)

### The Three CSS Layers

```
Layer 1: :root { ... }
  Default (light) values for all CSS custom properties.
  Applied to all elements unless overridden.

Layer 2: [data-theme="dark"] { ... }
  Dark mode values that override the :root defaults.
  Applied when data-theme="dark" is on the <html> element.

Layer 3: @theme { ... }
  Maps CSS custom properties into Tailwind v4 color tokens.
  Allows using bg-surface, text-text-muted, etc. in JSX.
```

### Tailwind Dark Variant Binding

```css
/* In globals.css */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

This binds the `dark:` Tailwind utility prefix to elements within `[data-theme="dark"]`, not to `@media (prefers-color-scheme: dark)`. This is the Tailwind v4 way to do manual dark mode.

---

## CSS Design Tokens (Custom Properties)

All design tokens are defined in `src/app/globals.css`.

### Light Mode (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#f8fafc` | Page background |
| `--bg-muted` | `#f1f5f9` | Subtle background sections |
| `--surface` | `#ffffff` | Card and panel backgrounds |
| `--surface-elevated` | `#ffffff` | Modals, dropdowns |
| `--surface-soft` | `#f8fafc` | Sidebar, secondary surfaces |
| `--border` | `#e2e8f0` | Default borders |
| `--border-strong` | `#cbd5e1` | Emphasized borders, table headers |
| `--text` | `#0f172a` | Primary text color |
| `--text-muted` | `#475569` | Secondary/muted text |
| `--text-soft` | `#64748b` | Placeholder and supporting text |
| `--primary` | `#4f46e5` | Brand color (indigo) |
| `--primary-hover` | `#4338ca` | Button hover state |
| `--primary-soft` | `#eef2ff` | Soft background for primary accents |
| `--success` | `#059669` | Green for verified, paid, deployed |
| `--success-soft` | `#ecfdf5` | Light green background |
| `--warning` | `#d97706` | Amber for pending, partial |
| `--warning-soft` | `#fffbeb` | Light amber background |
| `--danger` | `#dc2626` | Red for rejected, overdue, error |
| `--danger-soft` | `#fef2f2` | Light red background |
| `--info` | `#0284c7` | Blue for informational states |
| `--info-soft` | `#eff6ff` | Light blue background |
| `--input-bg` | `#ffffff` | Input field background |
| `--input-text` | `#0f172a` | Input text color |
| `--input-placeholder` | `#94a3b8` | Placeholder text |
| `--input-border` | `#cbd5e1` | Input border |

### Dark Mode (`[data-theme="dark"]`)

| Token | Value |
|-------|-------|
| `--bg` | `#0f172a` |
| `--bg-muted` | `#111827` |
| `--surface` | `#111827` |
| `--surface-elevated` | `#1e293b` |
| `--surface-soft` | `#020617` |
| `--border` | `#334155` |
| `--border-strong` | `#475569` |
| `--text` | `#f8fafc` |
| `--text-muted` | `#cbd5e1` |
| `--text-soft` | `#94a3b8` |
| `--primary` | `#6366f1` |
| `--primary-soft` | `rgba(99, 102, 241, 0.18)` |
| `--input-bg` | `#020617` |
| `--input-text` | `#f8fafc` |
| `--input-border` | `#475569` |

---

## Tailwind Token Mapping

In `globals.css` the `@theme` block maps CSS variables to Tailwind color names:

```css
@theme {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-text-theme: var(--text);
  --color-text-muted: var(--text-muted);
  --color-primary-theme: var(--primary);
  --color-border-theme: var(--border);
  /* ... and so on */
}
```

This allows writing:
```tsx
<div className="bg-surface text-text-theme border border-border-theme">
```
instead of:
```tsx
<div style={{ background: 'var(--surface)', color: 'var(--text)' }}>
```

---

## Global Utility Classes

These classes are defined in `globals.css` and should be used for consistency.

| Class | Purpose |
|-------|---------|
| `.app-shell` | Root app shell: full-height flex column, `--bg` background |
| `.app-surface` | Card with `--surface` bg and `--border` border |
| `.app-card` | Rounded card with subtle shadow |
| `.app-panel` | Elevated panel with stronger border |
| `.app-input` | Form input styling with focus ring |
| `.app-select` | Select element styling matching app-input |
| `.app-button-primary` | Primary action button (indigo) |
| `.app-button-secondary` | Secondary action button (muted bg) |
| `.app-button-danger` | Danger action button (red) |
| `.app-table` | Full-width table with hover rows |
| `.app-muted` | Muted text color |
| `.app-heading` | Bold heading text |
| `.app-subtext` | Soft supporting text |

---

## Form / Input / Select Styling

All `<input>`, `<select>`, and `<textarea>` elements are globally styled in `globals.css`:

```css
input, select, textarea {
  background-color: var(--input-bg);
  color: var(--input-text);
  border: 1px solid var(--input-border);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

input:focus, select:focus, textarea:focus {
  outline: 2px solid var(--primary);
  border-color: var(--primary);
}

input:disabled, select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--bg-muted) !important;
}

select option, select optgroup {
  background-color: var(--input-bg);
  color: var(--input-text);
}
```

**Important:** The `select option` styling ensures dropdown options also use the correct dark mode colors. This is a commonly missed detail.

---

## Where Colors Should Come From

**Always use CSS variables or Tailwind tokens:**
```tsx
// ✅ Correct
<div className="bg-surface text-text-theme border-border-theme">
<div className="text-success-theme bg-success-soft">
<button className="app-button-primary">

// ❌ Wrong (hardcoded colors bypass theme)
<div className="bg-white text-gray-900">
<div className="bg-slate-900 text-white">
<button className="bg-indigo-600 text-white">
```

**For semantic colors, use the semantic tokens:**
- Status: VERIFIED → `text-success-theme bg-success-soft`
- Status: REJECTED → `text-danger-theme bg-danger-soft`
- Status: PENDING → `text-warning-theme bg-warning-soft`
- Info states → `text-info-theme bg-info-soft`

---

## How to Avoid Hardcoded Dark-Only Classes

A common mistake is using `dark:bg-slate-900` directly instead of using `bg-surface`. This breaks the design system because:

1. The dark variant is bound to `[data-theme="dark"]`, not `@media (prefers-color-scheme: dark)`
2. Hardcoded dark classes may conflict with the CSS variable values
3. Future theme token changes won't propagate to hardcoded classes

**Rule:** If you find yourself writing `dark:`, ask yourself if a design token already exists for that visual state. Use the token instead.

The only acceptable uses of `dark:` utilities are:
- When there is genuinely no existing token for the property
- For animation or transition states that differ between modes
- For temporary debugging (always clean up before committing)

---

## ThemeContext API

```ts
// src/context/ThemeContext.tsx

interface ThemeContextType {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

// In any component:
const { theme, toggleTheme } = useTheme();
```

---

## Rules for Future UI Components

When building new UI components:

1. **Use CSS variable tokens.** Never hardcode hex colors.
2. **Use `app-card`, `app-surface`, `app-panel`, `app-input` classes** for consistent container styling.
3. **Use `app-button-primary`, `app-button-secondary`, `app-button-danger`** for action buttons.
4. **Use `app-table`** for all data tables.
5. **Use semantic color tokens** for status badges: `success`, `warning`, `danger`, `info`.
6. **Test in both light and dark mode** before considering a component complete.
7. **Do not use `dark:` utilities unless absolutely necessary.** Prefer design tokens.
8. **Inputs and selects are globally styled** — do not add conflicting border/background styles on top.
9. **Focus rings** are handled globally with `--primary` color — do not override unless there is a good reason.
10. **Disabled states** are handled globally (opacity 0.6, `cursor-not-allowed`) — do not duplicate.

---

## Theme Toggle Component

The theme toggle button lives in the Topbar component:

```tsx
// src/components/theme/ (ThemeToggleButton or similar)
const { theme, toggleTheme } = useTheme();
// Renders a Sun or Moon icon based on current theme
// Calls toggleTheme() on click
```

The Topbar is part of the `AppShell` layout that wraps all authenticated pages.

---

## Bangla Spacing and Layout Guidelines

Because VisaTek ERP is **Bangla-first**, layouts must dynamically adapt to the physical height and structure of the Bangla script (which uses *matras*, vowel signs, and complex conjunct characters). Follow these rules during development:

### 1. Vertically Accommodative Spacing
- **Rule**: Bangla characters are physically taller than Latin equivalents. If vertical space is too tight, characters may clip or appear illegible.
- **Implementation**:
  - Use generous line-heights. Prefer `leading-relaxed` (or `line-height: 1.625`) for descriptive paragraphs.
  - Set adequate vertical padding on button and badge containers. Prefer `py-2` or `py-2.5` over extremely tight `py-1` elements to ensure the characters breathe.
  - Keep modal header heights slightly larger to prevent clipping of titles containing top/bottom modifiers (e.g., `ন`, `ী`, `ু` markers).

### 2. Flexible Widths & Word Wrapping
- **Rule**: Bangla words are often longer in length than their English counterparts, which can trigger horizontal overflows on cards, badges, and sidebars.
- **Implementation**:
  - Keep button and status badge text as short as possible. Use brief terms (e.g. `খুলুন` instead of `বিস্তারিত দেখুন`).
  - Use `whitespace-nowrap` only on elements with guaranteed small sizes, or apply `break-words` and `hyphens-auto` for block text.
  - Ensure table columns containing names or descriptions have fluid width allocations (`flex-1` or percentage-based) rather than fixed pixel widths.
  - Avoid hardcoded horizontal margins or widths on cards and forms; let elements wrap using flexbox or responsive grids.

### 3. Clear Label and Helper Separation
- **Rule**: Fitting long descriptions or instructions into a `<label>` element makes form fields look cluttered and hard to read.
- **Implementation**:
  - Keep the `<label>` short and clear (e.g. `জাতীয় পরিচয়পত্র (NID)`).
  - Place explanatory text in a secondary helper paragraph below the input:
    ```tsx
    <label className="block text-xs font-medium text-text-theme mb-1">
      {t("form.nid")}
    </label>
    <input className="app-input w-full" ... />
    <p className="text-[10px] text-text-soft mt-1">
      {t("form.nid_helper")}
    </p>
    ```

### 4. Non-translation of Key Internal Strings
- **Rule**: Passport numbers, phone numbers, transaction IDs, invoice numbers, currency units (SAR, USD, BDT), and codes must remain in standard Latin numerals (e.g. `123456`) to maintain systemic query consistency.
- **Implementation**:
  - Never parse numeric fields containing unique business keys into Bangla numerals (`১২৩৪৫৬`).
  - Keep dashboard monetary figures formatted correctly utilizing locales (e.g. `BDT 50,000` or `SAR 5,000` via format helpers).
