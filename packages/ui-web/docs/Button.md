---
category: Actions
---

# Button

The primary tap target for an action with a text label. Use `IconButton` when the
icon alone is unambiguous.

- One `variant="primary"` action per screen — it is the highest-emphasis control.
- `variant="secondary"` / `"outline"` / `"ghost"` for supporting actions; `"error"`
  for destructive confirmations.
- Mobile CTAs are usually `block` (full width). Keep `size="md"` or larger for
  primary actions so the tap target stays comfortable.
- `loading` swaps the label for a spinner and disables the button.
- Pass `leadingIcon` / `trailingIcon` as `lucide-react` nodes.

```tsx
<Button variant="primary" block leadingIcon={<Plus className="h-4 w-4" />}>
  Add lead
</Button>
```
