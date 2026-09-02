## 2024-05-24 - Unnecessary Re-evaluations in React Component Body

**Learning:** Computations like filtering or reducing over arrays inside a React component's body will recalculate on every render (e.g. state updates like form inputs typing), which can degrade performance in larger apps.

**Action:** Identify computationally expensive or array iterations (like `reduce`, `some`, `filter`) and wrap them in `useMemo` hooks, keyed by the state they depend on (e.g. `cartItems`). This ensures the calculations are only re-evaluated when the dependencies change, saving redundant execution during re-renders.
