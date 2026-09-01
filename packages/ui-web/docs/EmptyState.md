---
category: Feedback
---

# EmptyState

The zero-data state for a list or section: a muted `icon`, a `title`, an optional
`description`, and a single primary `action`.

```tsx
<EmptyState icon={<Inbox className="h-6 w-6" />} title="No leads yet"
  description="Scan a business card or add one by hand to get started."
  action={<Button leadingIcon={<Plus className="h-4 w-4" />}>Add lead</Button>} />
```
