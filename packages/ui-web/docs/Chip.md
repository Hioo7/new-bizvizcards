---
category: Data display
---

# Chip

A filter / choice chip for a horizontally scrolling row. `selected` fills it with
the primary color; `onClick` makes it a toggle; `onRemove` renders a trailing ×
for an applied-filter chip.

```tsx
<Chip label="Trade show" selected={active} onClick={toggle} />
```
