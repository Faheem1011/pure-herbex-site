## 2024-03-20 - Global State Re-render Cascades
**Learning:** The architecture relies heavily on `App.tsx` for global UI states. Because of this top-down prop passing, recreating handler functions on every render causes severe re-render cascades in leaf components.
**Action:** Wrap handler functions passed down from `App.tsx` in `useCallback` to maintain referential equality across renders, preventing unnecessary child component re-renders.
