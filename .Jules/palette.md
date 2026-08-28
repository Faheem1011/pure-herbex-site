## 2024-08-28 - Dynamic ARIA Labels in Iterative Lists
**Learning:** Hard-coded `aria-label`s on repeated elements (like list items in a cart) often leave screen reader users confused about which specific item they are interacting with.
**Action:** Use dynamic attributes (e.g., `` aria-label={`Remove ${item.product.name}`} ``) inside map loops to tie the specific action to the correct context.
