import { Chip } from "@bizvizcards/ui";
import { Check } from "lucide-react";

const noop = () => {};

export const FilterRow = () => (
  <div className="flex flex-wrap gap-2">
    <Chip label="All" selected onClick={noop} />
    <Chip label="New" onClick={noop} />
    <Chip label="Contacted" onClick={noop} />
    <Chip label="Trade show" onClick={noop} />
    <Chip label="Website" onClick={noop} />
  </div>
);

export const WithIcon = () => (
  <div className="flex gap-2">
    <Chip label="Verified only" selected icon={<Check className="h-3.5 w-3.5" />} onClick={noop} />
    <Chip label="Has phone" onClick={noop} />
  </div>
);

export const Removable = () => (
  <div className="flex gap-2">
    <Chip label="Trade show 2026" selected onRemove={noop} />
    <Chip label="Bengaluru" selected onRemove={noop} />
  </div>
);
