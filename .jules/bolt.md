## 2024-10-07 - Prevent cascading re-renders in App global state
**Learning:** In a single-page app utilizing a large component tree where global routing and state logic reside in the root `App.tsx`, failing to memoize critical handler functions passed as props directly causes severe re-render cascades in deeply nested or leaf components.
**Action:** When implementing shared header/footer properties or standard global navigation components, ensure `useCallback` is wrapped on inline callbacks and core root state handlers to prevent unnecessary memory burn and excessive rendering paths.
