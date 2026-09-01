---
category: Inputs
---

# TextareaField

Multi-line text input with a static label above the field. Controlled.

- Use for notes, messages, and addresses. Set `rows` for the initial height.
- Same `error` / `hint` model as `TextField`.

```tsx
<TextareaField label="Notes" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
```
