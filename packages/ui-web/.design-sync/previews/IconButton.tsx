import { IconButton } from "@bizvizcards/ui";
import { ScanLine, Plus, Trash2, Filter, X } from "lucide-react";

export const Fab = () => (
  <IconButton
    label="Scan a card"
    variant="primary"
    icon={<ScanLine className="h-5 w-5" />}
  />
);

export const Variants = () => (
  <div className="flex items-center gap-3">
    <IconButton label="Add" variant="primary" icon={<Plus className="h-5 w-5" />} />
    <IconButton label="Filter" variant="ghost" icon={<Filter className="h-5 w-5" />} />
    <IconButton label="Dismiss" variant="outline" icon={<X className="h-5 w-5" />} />
    <IconButton label="Delete" variant="error" icon={<Trash2 className="h-5 w-5" />} />
  </div>
);

export const Sizes = () => (
  <div className="flex items-center gap-3">
    <IconButton label="Add" size="sm" variant="outline" icon={<Plus className="h-4 w-4" />} />
    <IconButton label="Add" size="md" variant="outline" icon={<Plus className="h-5 w-5" />} />
    <IconButton label="Add" size="lg" variant="outline" icon={<Plus className="h-6 w-6" />} />
  </div>
);

export const SquareAndLoading = () => (
  <div className="flex items-center gap-3">
    <IconButton
      label="Filter"
      shape="square"
      variant="outline"
      icon={<Filter className="h-5 w-5" />}
    />
    <IconButton label="Saving" variant="primary" loading icon={<Plus className="h-5 w-5" />} />
  </div>
);
