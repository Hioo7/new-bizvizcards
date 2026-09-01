---
category: Inputs
---

# Select

Native `<select>` styled to match the text fields. Controlled — pass `value`,
`onChange`, and an `options` array of `{ label, value }`.

- `placeholder` renders a disabled first row for the empty state.
- Static label above the field, with an optional `icon`.

```tsx
<Select label="Folder" options={folders} value={folderId}
  onChange={(e) => setFolderId(e.target.value)} placeholder="Choose a folder" />
```
