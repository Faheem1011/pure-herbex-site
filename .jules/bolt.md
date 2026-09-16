## 2024-11-20 - [App.tsx handler prop re-render cascades]
**Learning:** [The architecture relies heavily on App.tsx for global UI states, which causes handler functions passed as props to be recreated often. Since leaf components receive these handlers, passing recreated handler functions causes severe re-render cascades.]
**Action:** [Ensure handler functions passed down from App.tsx (like handleAddToCart, navigateTo, etc) are wrapped in useCallback to stabilize function references instead of just using custom comparators in React.memo on leaf components.]
