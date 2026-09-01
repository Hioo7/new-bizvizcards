---
category: Navigation
---

# Tabs

Underlined section navigation within a screen. `items` is `{ key, label, icon? }[]`;
controlled via `activeKey` + `onSelect`. `block` stretches tabs to fill the row.
For a compact filter toggle use `SegmentedControl`.

```tsx
<Tabs activeKey={tab} onSelect={setTab} block
  items={[{ key: "overview", label: "Overview" }, { key: "activity", label: "Activity" }]} />
```
