## 2024-05-24 - React global state re-render cascades
**Learning:** This codebase's architecture relies heavily on `App.tsx` for global UI states and passes handler functions down to many leaf components. This can cause severe re-render cascades if handlers are re-created on every render.
**Action:** Always wrap handler functions passed down from `App.tsx` (or other top-level state holders) in `useCallback` rather than relying on custom comparators in `React.memo` to prevent unnecessary re-renders in leaf components.
