## 2024-05-15 - React Component Re-renders in App.tsx
**Learning:** The App.tsx file contains multiple handler functions (handleAddToCart, navigateTo, etc) that are passed down to many child components. Without useCallback, these functions are recreated on every render, causing all child components to re-render needlessly when state changes (like adding to cart).
**Action:** Always wrap handler functions passed to child components in `useCallback` when working in root-level or heavily-used parent components.
