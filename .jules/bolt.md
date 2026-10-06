## 2024-05-24 - Prevent Re-render Cascades in App.tsx
**Learning:** App.tsx handles global UI state in this architecture, but passes down unmemoized handler functions (e.g. `navigateTo`, `handleAddToCart`) on every render. This creates severe re-render cascades in deeply nested leaf components since they constantly receive new function references.
**Action:** Always wrap handler functions passed from `App.tsx` (or any global state provider) in `useCallback` to ensure stable function references.
