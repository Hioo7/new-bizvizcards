---
category: Inputs
---

# RadioGroup

A single-select list of options, each with an optional `description`. Controlled
— pass `value` and `onChange(value)`; `options` is `{ label, value, description? }[]`.

```tsx
<RadioGroup label="Card theme" value={theme} onChange={setTheme}
  options={[{ label: "Legacy dark", value: "LEGACY" }, { label: "Light", value: "LIGHT" }]} />
```
