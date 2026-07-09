import { ChevronLeft, ChevronRight } from "lucide-react";

interface StaffPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function StaffPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: StaffPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-base-300 px-4 py-3 sm:px-0">
      <p className="text-xs text-base-content/60">
        Page {page} of {pageCount}
      </p>
      <div className="join">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="join-item btn btn-sm min-h-11 min-w-11 rounded-field border border-base-300 bg-base-100 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="join-item btn btn-sm min-h-11 min-w-11 rounded-field border border-base-300 bg-base-100 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
