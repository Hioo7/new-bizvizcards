---
category: Containers
---

# ListRow

One row in a list — `leading` visual (icon / `Avatar` / thumbnail), `title` +
optional `subtitle`, and `trailing` content (a value, `Badge`, `IconButton`).
Tappable when `onClick` is set; `showChevron` adds a navigation affordance.

```tsx
<ListRow leading={<Avatar name="Chitra Narayan" />} title="Chitra Narayan"
  subtitle="chitra@example.com" showChevron onClick={() => openLead(id)} />
```
