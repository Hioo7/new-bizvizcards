---
category: Inputs
---

# SegmentedControl

A compact pill toggle for switching between a small set of mutually exclusive
views — e.g. a lead-list filter. Controlled. Use `Tabs` for section navigation
instead. `block` stretches segments to equal width.

```tsx
<SegmentedControl value={range} onChange={setRange} block
  options={[{ label: "7d", value: "7" }, { label: "30d", value: "30" }, { label: "All", value: "all" }]} />
```
