interface ExportSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClear: () => void;
}

export default function ExportSelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
}: ExportSelectionToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 py-2">
      <span className="text-xs font-medium text-base-content/50">
        {selectedCount} of {totalCount} selected
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={selectedCount === totalCount}
          className="text-xs font-semibold text-primary disabled:text-base-content/30"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={selectedCount === 0}
          className="text-xs font-semibold text-primary disabled:text-base-content/30"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
