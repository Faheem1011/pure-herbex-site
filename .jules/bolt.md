## 2024-10-04 - App.tsx Re-render Cascades
**Learning:** The architecture relies heavily on `App.tsx` for global UI states. Because it passes down many event handlers to child components, passing un-memoized handlers causes severe re-render cascades in leaf components.
**Action:** Ensure handler functions passed down from `App.tsx` are wrapped in `useCallback` rather than relying on custom comparators in `React.memo` to prevent child component re-renders.
