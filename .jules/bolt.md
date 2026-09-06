## 2024-05-24 - Handler Functions in Global UI Architecture
**Learning:** The architecture relies heavily on App.tsx for global UI states, which causes severe re-render cascades in leaf components when parent states change.
**Action:** Ensure handler functions passed down from App.tsx (like handleAddToCart, navigateTo, etc) are wrapped in useCallback rather than using custom comparators in React.memo. This provides referential equality to prevent unnecessary cascading re-renders when global states update.
