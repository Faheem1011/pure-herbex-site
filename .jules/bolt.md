## 2026-09-19 - Global State Handlers Re-render Cascades
**Learning:** The architecture relies heavily on `App.tsx` for global UI states and passes handler functions down to many leaf components. This can cause severe re-render cascades if handler references aren't stable.
**Action:** Always wrap handler functions passed down from `App.tsx` in `useCallback` rather than using custom comparators in `React.memo` to effectively prevent these re-render cascades.
