# Breakpoints — Placement Portal

> CSS variables cannot be used inside @media queries (spec limitation).
> Use these raw values directly in your media queries. They are the project standard.

## Standard Breakpoints

| Name    | Value  | Usage                          |
|---------|--------|--------------------------------|
| Mobile  | 768px  | Phones and small tablets       |
| Tablet  | 1024px | Tablets and small laptops      |
| Desktop | 1280px | Standard desktops              |

## Correct Usage

`css
/* ✅ Correct */
@media (max-width: 768px) { ... }

/* ❌ Wrong — CSS variables don't work in media queries */
@media (max-width: var(--bp-mobile)) { ... }
`

## Common Patterns in This Project

`css
/* Mobile: single column, sidebar collapses */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0 !important;
    width: 100% !important;
  }
}

/* Tablet: tighter spacing, 2-column cards */
@media (max-width: 1024px) { ... }

/* Large desktop: wider filters, 4-column grids */
@media (min-width: 1280px) { ... }
`

## Rule

Never introduce a new breakpoint value without adding it to this file first.
If you need a new value, document it here before using it in any CSS Module.
