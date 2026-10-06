## 2024-10-06 - Prevent Severe Re-render Cascades in App.tsx
**Learning:** Functions passed down from `App.tsx` (like `navigateTo`, `handleAddToCart`, `handleRemoveItem`, etc.) to leaf components can cause unnecessary and severe re-render cascades when global state changes.
**Action:** Always wrap handler functions passed down from `App.tsx` with `useCallback` and ensure dynamic state variables are included in the dependency array to avoid stale closure bugs.
