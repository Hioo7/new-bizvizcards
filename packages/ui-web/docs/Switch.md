---
category: Inputs
---

# Switch

A labelled on/off toggle in a full-width row (label + optional `description` on
the left, the toggle on the right). Controlled — pass `checked` and `onChange`.
Use for instant-effect settings; use `Checkbox` inside forms that submit.

```tsx
<Switch label="Public profile" description="Anyone with the link can view your card"
  checked={isPublic} onChange={(e) => setPublic(e.target.checked)} />
```
