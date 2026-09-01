---
category: Actions
---

# IconButton

An icon-only action — a round (or square) 44px+ tap target. Prefer this over a
text button whenever the icon is unambiguous (close, scan, delete, filter).

- `label` is **required** — it is the accessible name and the tooltip.
- `variant="primary"` for a floating action button; `"ghost"` inside toolbars
  and headers; `"error"` for a destructive icon action.
- `loading` shows a spinner in place of the icon.

```tsx
<IconButton label="Scan a card" icon={<ScanLine className="h-5 w-5" />} variant="primary" />
```
