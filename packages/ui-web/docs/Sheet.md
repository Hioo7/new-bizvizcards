---
category: Containers
---

# Sheet

A bottom sheet on mobile that becomes a centered modal from `sm` up
(`modal modal-bottom sm:modal-middle`). Controlled via `open`; `onClose` fires on
the ✕, the backdrop, and Esc-equivalent.

- The title always takes a `titleIcon`. Add `description` for a supporting line.
- `footer` is the pinned action row — usually a `Button` or two.
- Keep the sheet's own size fixed. If the body can be long, it scrolls inside the
  sheet — never let the sheet grow to fit its content.

```tsx
<Sheet open={open} onClose={close} title="Review scanned lead"
  titleIcon={<ScanLine className="h-5 w-5" />}
  footer={<Button block onClick={save}>Save lead</Button>}>…</Sheet>
```
