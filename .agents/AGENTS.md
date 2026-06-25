# CSS Refactoring and Page Isolation Rules

Before modifying any CSS:
* Build the project.
* Take screenshots of the affected page (desktop, tablet, mobile).
* Apply changes only to the target page.
* Rebuild.
* Compare before/after.
* Verify no unrelated pages changed.
* If any unrelated page changes, stop and revert before continuing.

## Page Isolation Standards
* Each page must use **only its own `.module.css`**.
* No page should import another page's CSS.
* No global CSS selector leakages like `[class*="..."]` unless explicitly part of the root layout system.
* No `body`, `html`, or `*` element selectors inside CSS modules.
* Shared styling must come only from dedicated shared components (e.g. Table, Button, Modal), with each shared component having its own isolated stylesheet.
