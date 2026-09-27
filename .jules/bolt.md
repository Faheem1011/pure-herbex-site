## 2024-05-24 - Severe Re-render Cascades in App.tsx
**Learning:** The architecture relies heavily on `App.tsx` for global UI states, which can cause severe re-render cascades in leaf components if handler functions passed down from `App.tsx` are not memoized.
**Action:** Always wrap handler functions passed down from `App.tsx` (like `navigateTo`, `handleAddToCart`, etc.) in `useCallback` to prevent unnecessary re-renders in child components.
