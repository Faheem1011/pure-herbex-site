## 2024-09-14 - Use useCallback for global UI state handlers in App.tsx
**Learning:** The architecture heavily relies on App.tsx for global UI states, which can cause severe re-render cascades in leaf components. Passing down custom comparators in React.memo is less effective for this specific pattern.
**Action:** Always wrap handler functions passed down from App.tsx in `useCallback` to prevent these cascading re-renders in leaf components.
