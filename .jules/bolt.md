## 2024-09-22 - Global State Handler Optimization
**Learning:** The architecture heavily relies on `App.tsx` for global UI state, passing handlers down to leaf components. If these handlers are not wrapped in `useCallback`, it causes severe re-render cascades in leaf components, even if they use `React.memo`, since inline/newly created functions fail equality checks.
**Action:** Always wrap handler functions passed down from `App.tsx` (like `handleAddToCart`, `navigateTo`, etc.) in `useCallback` to prevent these performance bottlenecks.
