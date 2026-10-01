## 2024-05-14 - Preventing Re-render Cascades in App.tsx
**Learning:** Due to the architecture relying heavily on `App.tsx` for global UI states, leaf components can suffer from severe re-render cascades if handlers passed to them are recreated on every render.
**Action:** Always wrap handler functions (like `navigateTo`, `handleAddToCart`, etc.) passed down from `App.tsx` in `useCallback` to maintain referential equality and prevent unnecessary downstream re-renders. Avoid relying solely on `React.memo` with custom comparators, as stable references naturally optimize standard memoization.
