import { Button } from "@bizvizcards/ui";
import { Plus, ScanLine, Trash2 } from "lucide-react";

export const Primary = () => (
  <Button variant="primary" leadingIcon={<Plus className="h-4 w-4" />}>
    Add lead
  </Button>
);

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="primary">Save</Button>
    <Button variant="secondary">Preview</Button>
    <Button variant="outline">Edit</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="error" leadingIcon={<Trash2 className="h-4 w-4" />}>
      Delete
    </Button>
  </div>
);

export const Sizes = () => (
  <div className="flex items-center gap-2">
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const BlockCta = () => (
  <div className="w-72">
    <Button variant="primary" block leadingIcon={<ScanLine className="h-4 w-4" />}>
      Scan a business card
    </Button>
  </div>
);

export const Loading = () => (
  <div className="flex gap-2">
    <Button variant="primary" loading>
      Saving
    </Button>
    <Button variant="outline" disabled>
      Disabled
    </Button>
  </div>
);
