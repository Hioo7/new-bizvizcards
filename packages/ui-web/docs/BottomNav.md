---
category: Navigation
---

# BottomNav

The app-shell tab bar. Render it once at the root of the authenticated shell.
`items` is `{ key, label, icon }[]`; `activeKey` + `onSelect` are controlled. The
consumer pins it (`fixed bottom-0`, safe-area padding) and offsets page content.

```tsx
<BottomNav activeKey={section} onSelect={setSection} items={[
  { key: "home", label: "Home", icon: <House className="h-6 w-6" /> },
  { key: "leads", label: "Leads", icon: <Contact className="h-6 w-6" /> },
]} />
```
