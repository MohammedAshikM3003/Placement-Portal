## Goals
- Show the inline table loader on browser refresh in `achievements.js`.
- Reduce excess spacing between “Competition Name” and “Date” and align all table columns.
- Add “Previewing…” and “Uploading…” popups to `resume.js` (matching existing “Downloading…” style), followed by the existing “Resume Uploaded” success popup.

## Achievements Loader
- Enforce loader on hard refresh: keep `isInitialLoading` true on mount until either data arrives or a minimum duration elapses (2–3s). Only then flip `isInitialLoading` to false.
- Always set `isLoading=true` before any refresh (`refreshAchievements`, `quickBackgroundRefresh`) and keep loader visible for at least the minimum duration.
- Ensure the loader container is vertically centered inside the table section so it appears exactly where the table renders.

## Column Alignment
- Switch table to `table-layout: fixed` to stabilize column widths.
- Define a `colgroup` (or nth-child CSS) to control widths:
  - `Select` 64px, `S.No` 64px, `Year` 72px, `Semester` 88px, `Competition Name` 38–42%, `Date` 136px, `Prize` 120px, `Status` 128px, `View` 84px, `Download` 104px.
- Reduce horizontal padding in `th, td` to `8px 12px`, and set `white-space: nowrap` for `Date/Prize/Status` to avoid stretching.
- Verify header/body alignment by matching width rules across `th` and `td`.

## Resume Popups
- Add `uploadPopupState` (`none | progress | success | failed`) and `uploadProgress` to `resume.js`.
- Upload flow:
  - On upload click/submit: set `uploadPopupState='progress'`, animate progress to ~85%, perform upload, then complete to 100%.
  - On success: close progress, show existing `SuccessPopup` (“Resume Uploaded!”). On failure: show `failed` popup using the same alert style.
- Preview flow:
  - Reuse existing `previewPopupState` but ensure it triggers before opening the new window, and auto-closes after preview starts.
- Visual consistency: use the same alert overlay/container styles already used for Downloading to keep theme consistent.

## Verification
- Manual: hard refresh `/achievements` and confirm the centered loader displays first, then table rows.
- Table: check column widths appear balanced and the gap between “Competition Name” and “Date” is reduced.
- Resume: click Preview → see “Previewing…” popup; upload → see “Uploading…” then “Resume Uploaded ✓”; download remains unchanged.

## Deployment
- Lint passes (no unused vars). Push changes to `main`. Vercel auto-build should succeed.

## Next Steps
- Proceed to implement the changes in `achievements.js` (loader behavior and column widths) and `resume.js` (popups).