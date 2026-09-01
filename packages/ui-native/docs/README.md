# @bizvizcards/ui-native — component reference

All components must be rendered inside `<ThemeRoot>` (once, at the app root).
Icons are `ReactNode` props — pass `lucide-react-native` nodes; nothing is bundled.

## Actions

### Button
`variant?: "primary" | "secondary" | "outline" | "ghost" | "error"` (default `primary`) ·
`size?: "sm" | "md" | "lg"` · `block?` · `isLoading?` · `isDisabled?` ·
`leadingIcon?` · `trailingIcon?` · `onPress?` · `children`.
One `variant="primary"` per screen. Mobile CTAs are usually `block`.
```tsx
<Button block leadingIcon={<Plus size={16} color="#fff" />}>Add lead</Button>
```

### IconButton
`label: string` (required — accessible name) · `icon` · `variant?: "primary" | "ghost" | "outline" | "error"` ·
`size?` · `shape?: "circle" | "square"` · `isLoading?` · `isDisabled?` · `onPress?`.
```tsx
<IconButton label="Scan a card" variant="primary" icon={<ScanLine size={20} color="#fff" />} />
```

## Inputs

All field components: `label` above the field, `errorText` / `helperText`,
`isInvalid` (auto-set when `errorText` present), `isDisabled`. Controlled.

### TextField
+ `value` · `onChangeText` · `placeholder` · `leadingIcon?` · `trailingSlot?` ·
`keyboardType?` · `autoCapitalize?` · `autoComplete?`.

### TextareaField
+ `value` · `onChangeText` · `placeholder` · `numberOfLines?` (default 4).

### PasswordField
+ `value` · `onChangeText` · `leadingIcon?` · `revealIcon?` / `hideIcon?`
(fallback: "Show" / "Hide" text). Built-in `secureTextEntry` toggle.

### Select
+ `options: { label; value; isDisabled? }[]` · `selectedValue` · `onValueChange` ·
`placeholder`. Opens a native actionsheet picker.

### Switch
`label` · `description?` · `value` · `onValueChange` · `isDisabled?`. Full-width row.
Track colour = bizviz primary.

### Checkbox
`label` · `description?` · `value: string` · `isChecked` · `onChange` · `isDisabled?`.

### RadioGroup
`label` (group heading) · `options: { label; value; description?; isDisabled? }[]` ·
`value` · `onChange(value)`.

### SegmentedControl
`options: { label; value }[]` · `value` · `onChange(value)` · `block?` ·
`accessibilityLabel?`. Compact pill toggle for a small set of views.

## Containers

### Card
`children` · `onPress?` (makes the whole card pressable) · `flush?` (no inner padding).

### ListRow
`title` · `subtitle?` · `leading?` · `trailing?` · `onPress?` · `showChevron?`.

### Sheet
`isOpen` · `onClose` · `title` · `titleIcon?` · `description?` · `children` · `footer?`.
Bottom sheet (gluestack Actionsheet) — native drag-to-dismiss. Keep it a fixed
size; scroll the body.
```tsx
<Sheet isOpen={open} onClose={close} title="Review scanned lead"
  titleIcon={<ScanLine size={20} color="#2D2DE0" />}
  footer={<><Button variant="ghost" onPress={close}>Discard</Button>
          <Button onPress={save}>Save lead</Button></>}>
  {/* fields */}
</Sheet>
```

## Navigation

### BottomNav
`items: { key; label; icon }[]` · `activeKey` · `onSelect(key)`. Render once at the
app-shell root; the consumer pins it + adds safe-area padding.

### Tabs
`items: { key; label; icon? }[]` · `activeKey` · `onSelect(key)` · `block?`.
Underlined section nav within a screen.

## Feedback

### Badge
`children` · `tone?: "neutral" | "primary" | "info" | "success" | "warning" | "error"` ·
`size?: "sm" | "md" | "lg"` · `outline?` · `icon?`.

### Toast
`children` · `action?: "info" | "success" | "warning" | "error"` · `icon?` · `onDismiss?`.
Prefer the **`useToast()`** hook for real use:
```tsx
const toast = useToast();
toast.show({ action: "success", message: "Lead saved", icon: <CircleCheck size={18} color="#fff" /> });
```

### Spinner
`size?: "sm" | "md" | "lg"` · `label?` · `showLabel?`.

### EmptyState
`icon?` · `title` · `description?` · `action?` (usually a `Button`).

## Data display

### Avatar
`name` (for alt + initials) · `src?` · `size?: "sm" | "md" | "lg"`.

### StatCard
`label` · `value: string | number` · `icon` · `trend?: "up" | "down" | "neutral"` ·
`trendLabel?` (e.g. "+12%").

### Chip
`label` · `selected?` · `onPress?` (toggle) · `icon?` · `onRemove?` (trailing ×).

## Utilities

### ThemeRoot
`children`. Wraps `GluestackUIProvider mode="light"`. Also required around any
isolated subtree (tests, Storybook stories).
