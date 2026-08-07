# Placement Portal — Design System Rules

> These rules are enforced by `npm run lint:css-leaks` and must not be bypassed.
> Any PR that violates them will fail the build.

---

## The Frozen Token Set

After Phase 2 completion, **no new design values may be introduced in page CSS Modules**.
All values must exist in `src/styles/tokens/` first.

### Colors
- Edit: `src/styles/tokens/colors.css`
- Never hardcode hex values in `.module.css` files
- Use `var(--color-admin)`, `var(--primary)`, `var(--color-success)` etc.

### Spacing
- Edit: `src/styles/tokens/spacing.css`
- Scale: `--space-xs` (4px) through `--space-5xl` (64px)
- Never use arbitrary px values for margin/padding/gap

### Border Radius
- Edit: `src/styles/tokens/radius.css`
- Scale: `--radius-xs` (4px) through `--radius-full` (50%)

### Shadows
- Edit: `src/styles/tokens/shadows.css`
- Scale: `--shadow-xs` through `--shadow-2xl`

### Animations
- Edit: `src/styles/animations.css`
- Never write `@keyframes` inside a `.module.css` file
- Use `animation-name` referencing a shared keyframe

### Z-Index
- Edit: `src/styles/tokens/zindex.css`
- Never use bare numbers like `z-index: 999`

---

## Global CSS Rules (Enforced by CI)

```
FORBIDDEN in any .module.css file:

  body { ... }           — global leak
  html { ... }           — global leak
  * { ... }              — universal selector
  [class*="..."]         — cross-module selector
  @import from another page's .module.css
```

Run check manually: `npm run lint:css-leaks`

---

## Component System

```
components/
  layout/     — PageLayout, PageHeader, PageContent
  table/      — DataTable, Pagination
  filter/     — FilterPanel, SearchBox, DateRangePicker
  dialog/     — SuccessPopup, ConfirmDialog, ErrorDialog
  card/       — SummaryCard, ActionCard
  button/     — ExportButton, PrintButton, PrimaryButton, SecondaryButton
  form/       — shared form inputs
  feedback/   — Toast, Banner, Notification (non-blocking alerts)
  common/     — misc shared utilities
```

**Rule:** Shared components use `var(--primary)` for all role-specific colors.
Pages never hardcode role colors.

---

## Two Alert Systems

| System | Location | Behavior | Examples |
|--------|----------|----------|---------|
| **Dialogs** | `components/dialog/` | Blocks interaction (modal) | SuccessPopup, ConfirmDialog, DeleteDialog |
| **Feedback** | `components/feedback/` | Non-blocking (toast/banner) | Toast, Banner, Notification |

**Rule:** Never mix these two systems. A dialog is never a toast. A toast is never a dialog.

---

## Breakpoints

CSS variables **cannot** be used in media queries. Use raw values:

| Breakpoint | Value |
|-----------|-------|
| Mobile    | 768px |
| Tablet    | 1024px |
| Desktop   | 1280px |

See `src/styles/BREAKPOINTS.md` for full documentation.

---

## Page Migration Checklist

Before a page is considered "migrated":
- [ ] No local `table-container` reimplementation — uses `<DataTable />`
- [ ] No local `filter-section` reimplementation — uses `<FilterPanel />`
- [ ] No local `print-btn` / `export-menu` — uses `<ExportButton />` / `<PrintButton />`
- [ ] No local `popupContainer` reimplementation — uses `<SuccessPopup />` or `<ConfirmDialog />`
- [ ] No hardcoded hex colors
- [ ] No `body {}` or `html {}` in the module CSS
- [ ] No `[class*=]` selectors in the module CSS
- [ ] `npm run lint:css-leaks` passes

---

## Adding a New Shared Component

1. Create under the appropriate sub-folder: `components/table/`, `components/dialog/`, etc.
2. Use CSS Modules (`.module.css`) — never global CSS
3. Use `var(--primary)` for role-adaptive colors
4. Add to `ComponentPlayground` at `/dev/components`
5. Document props with JSDoc comments
6. Export from the folder's `index.js`