## 2026-10-02 - Prevent re-render cascades in leaf components
**Learning:** The architecture relies heavily on `App.tsx` for global UI states, which causes handler functions passed as props to be recreated on every render if not memoized, leading to severe re-render cascades in leaf components.
**Action:** Ensure handler functions passed down from `App.tsx` (like `handleAddToCart`, `navigateTo`, etc.) are wrapped in `useCallback` rather than relying on custom comparators in `React.memo`.
