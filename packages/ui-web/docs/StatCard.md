---
category: Data display
---

# StatCard

A single metric tile for the analytics grid: an `icon` chip, a big `value`, a
`label`, and an optional directional `trend` pill (`up` | `down` | `neutral`) with
`trendLabel` text.

```tsx
<StatCard label="Card views" value={1284} icon={<Eye className="h-5 w-5" />}
  trend="up" trendLabel="+12%" />
```
