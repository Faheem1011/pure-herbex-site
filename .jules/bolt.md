## 2024-05-18 - App.tsx Handler Re-Render Cascades
**Learning:** Because the architecture relies heavily on `App.tsx` for global UI states, passing down un-memoized handler functions (like `handleAddToCart` or `handleUpdateQuantity`) causes severe re-render cascades in leaf components, even if those components try to use `React.memo` with custom comparators.
**Action:** Always wrap handler functions passed down from `App.tsx` in `useCallback` to prevent unnecessary React reconciliations and ensure child component memoization works correctly.
