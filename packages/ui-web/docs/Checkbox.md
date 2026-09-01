---
category: Inputs
---

# Checkbox

A labelled checkbox with an optional `description`. Controlled — pass `checked`
and `onChange`. Use inside forms; for instant-effect settings use `Switch`.

```tsx
<Checkbox label="I agree to the terms" checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)} />
```
