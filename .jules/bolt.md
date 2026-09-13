
## 2024-05-18 - [Memoizing Core State Handlers in App.tsx]
**Learning:** The architecture of this application relies heavily on `App.tsx` for global UI states and cart management. The core cart handler functions (`handleAddToCart`, `handleRemoveItem`, etc.) were being passed down to numerous child and leaf components like `ProductGrid` and `CartDrawer`. Because they were re-created on every render of `App.tsx`, it caused severe re-render cascades throughout the component tree.
**Action:** When working on this specific architecture, ensure that handler functions passed down from `App.tsx` are wrapped in `useCallback` to maintain referential equality across renders. This prevents unnecessary re-renders in leaf components that receive these props.
