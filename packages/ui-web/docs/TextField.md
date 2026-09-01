---
category: Inputs
---

# TextField

Single-line text input with a floating label (the label doubles as the
placeholder). Controlled — pass `value` and `onChange`.

- Always pass `label`. Add `icon` when a glyph makes the field's purpose obvious
  (envelope for email, etc.).
- Validate inline: set `error` as the user types, not only on submit. `error`
  also switches the field to its error style; `hint` shows neutral helper text.
- `trailingSlot` holds an in-field control such as a generate/clear IconButton.

```tsx
<TextField label="Work email" icon={<Mail className="h-4 w-4" />}
  value={email} onChange={(e) => setEmail(e.target.value)}
  error={emailError} />
```
