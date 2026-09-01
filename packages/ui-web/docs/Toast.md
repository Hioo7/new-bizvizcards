---
category: Feedback
---

# Toast

A single transient status message — always an `icon` paired with the label
(`alert alert-{tone}`). Position it with a `toast toast-top toast-center` wrapper
at the app root and animate it in/out there. `onDismiss` adds a close button.

```tsx
<Toast tone="error" icon={<CircleAlert className="h-5 w-5" />}>
  Couldn't read that card — try a clearer photo
</Toast>
```
