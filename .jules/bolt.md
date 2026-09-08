## 2024-03-08 - Preventing re-render cascades in leaf components
**Learning:** This codebase relies heavily on App.tsx for global UI states. Without stable references, every global state update in App.tsx causes severe re-render cascades across all leaf components (like ProductCard, CartDrawer) because their props change on every render.
**Action:** Ensure handler functions passed down from App.tsx (like handleAddToCart, handleRemoveItem, navigateTo) are wrapped in useCallback instead of relying on custom comparators in React.memo.
