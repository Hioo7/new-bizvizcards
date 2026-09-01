---
category: Inputs
---

# PasswordField

Password input with a built-in show/hide toggle. Controlled. The reveal state is
internal; pass `revealIcon` / `hideIcon` (lucide `Eye` / `EyeOff`) or let it fall
back to a small "Show" / "Hide" text button.

```tsx
<PasswordField label="Password" icon={<Lock className="h-4 w-4" />}
  revealIcon={<Eye className="h-4 w-4" />} hideIcon={<EyeOff className="h-4 w-4" />}
  value={pw} onChange={(e) => setPw(e.target.value)} />
```
