## 2024-10-24 - Wrapped App.tsx handlers in useCallback
**Learning:** Found that leaf components in this architecture experience severe re-render cascades because handler functions passed down from App.tsx were not memoized.
**Action:** When working on top-level state components, always ensure that functions passed as props to child components are wrapped in `useCallback` to prevent unnecessary re-renders in the child components, thus improving frontend performance and lowering CPU usage.
