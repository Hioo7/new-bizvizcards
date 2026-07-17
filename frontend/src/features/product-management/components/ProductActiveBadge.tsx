interface ProductActiveBadgeProps {
  isActive: boolean;
}

export default function ProductActiveBadge({ isActive }: ProductActiveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-field px-2.5 py-1 text-xs font-semibold ${
        isActive ? "bg-success/10 text-success" : "bg-base-200 text-base-content/50"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-success" : "bg-base-content/30"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
