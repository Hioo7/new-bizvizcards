# BizViz UI — how to build with it

`@bizvizcards/ui` is a small set of **mobile-first** React primitives for the
BizVizCards apps. Design screens as a phone-width column first; widen as a
responsive adaptation, never the reverse. Every tap target is ≥ 44px.

## Setup

No provider is required. The `bizviz` daisyUI theme is emitted at `:root` by
`styles.css`, so components are themed as soon as the stylesheet loads:

```tsx
import "@bizvizcards/ui/styles.css";
import { Button, ListRow, BottomNav } from "@bizvizcards/ui";
```

Wrap a subtree in `<ThemeRoot>` **only** when it sits inside a surface that
already carries a different `data-theme`.

## Styling idiom — Tailwind v4 + daisyUI v5, semantic tokens only

Style your own layout glue with Tailwind utilities bound to the theme's
**semantic color tokens**. Never write a raw hex/rgb/oklch value and never use a
Tailwind palette color (`blue-500`, `slate-200`, …) — only these:

| Role | Classes |
|---|---|
| Surfaces | `bg-base-100` (cards/sheets), `bg-base-200` (inset fields, pressed), `bg-base-300` (dividers) |
| Text | `text-base-content`, muted `text-base-content/60`, faint `text-base-content/40` |
| Brand action | `bg-primary` / `text-primary-content` / `border-primary` / `text-primary` |
| Accent / status | `secondary`, `accent`, `info`, `success`, `warning`, `error` (each with a `-content` pair) |
| Hairlines | `border-base-300` |
| Radii | `rounded-field` (inputs, chips-as-rects), `rounded-box` (cards, sheets), `rounded-full` (chips, avatars, FABs) |

daisyUI component classes in use inside the library: `btn` (+ `btn-primary`,
`btn-ghost`, `btn-outline`, `btn-error`, `btn-circle`, `btn-block`, `btn-sm`/`btn-lg`),
`badge` (+ tone/size/`badge-outline`), `toggle`, `checkbox`, `radio`, `avatar`,
`alert` (+ `alert-info`/`success`/`warning`/`error`), `loading loading-spinner`,
`modal modal-bottom sm:modal-middle`, `toast toast-top toast-center`.

## Patterns

- **Icons are injected.** Components never bundle an icon set — pass
  `lucide-react` nodes to `icon` / `leadingIcon` / `titleIcon` props, sized
  `className="h-4 w-4"` (in-field / badge) or `h-5 w-5` / `h-6 w-6` (buttons, nav).
- **Dialogs are bottom sheets.** Use `Sheet` for every modal/menu/confirm — it is
  a bottom sheet on mobile, a centered modal from `sm` up. Its title always takes
  a `titleIcon`. Keep the sheet a fixed size; scroll its body, don't grow it.
- **Prefer icon-only actions** (`IconButton`, always with `label`) when the icon
  is unambiguous; `Button` carries a text label.
- **Plan every state.** For any data-backed view, design the loading (`Spinner`),
  empty (`EmptyState`), and error states alongside the populated one.
- **One `variant="primary"` action per screen.** Mobile CTAs are usually `block`.

## Where the truth lives

- `styles.css` (and the `_ds_bundle.css` it imports) — the compiled theme + every
  utility the components use. Read it before inventing a class.
- `components/<Group>/<Name>/<Name>.prompt.md` — per-component API + usage.

## One idiomatic screen

```tsx
<div className="flex min-h-full flex-col bg-base-200">
  <main className="flex-1 space-y-3 p-4">
    <SegmentedControl aria-label="Status" value={status} onChange={setStatus}
      block options={[{ label: "New", value: "new" }, { label: "Won", value: "won" }]} />
    {leads.length === 0 ? (
      <EmptyState icon={<Inbox className="h-6 w-6" />} title="No leads yet"
        action={<Button block leadingIcon={<Plus className="h-4 w-4" />}>Add lead</Button>} />
    ) : (
      <Card flush>
        <div className="divide-y divide-base-300 px-3">
          {leads.map((l) => (
            <ListRow key={l.id} leading={<Avatar name={l.name} />} title={l.name}
              subtitle={l.company} showChevron onClick={() => open(l.id)} />
          ))}
        </div>
      </Card>
    )}
  </main>
  <BottomNav activeKey="leads" onSelect={go} items={NAV_ITEMS} />
</div>
```
