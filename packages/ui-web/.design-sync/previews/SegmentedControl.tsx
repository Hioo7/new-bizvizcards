import { SegmentedControl } from "@bizvizcards/ui";

const noop = () => {};

export const DateRange = () => (
  <SegmentedControl
    aria-label="Date range"
    value="30"
    onChange={noop}
    options={[
      { label: "7 days", value: "7" },
      { label: "30 days", value: "30" },
      { label: "All time", value: "all" },
    ]}
  />
);

export const BlockWidth = () => (
  <div className="w-80">
    <SegmentedControl
      aria-label="Lead status"
      value="new"
      onChange={noop}
      block
      options={[
        { label: "New", value: "new" },
        { label: "Contacted", value: "contacted" },
        { label: "Won", value: "won" },
      ]}
    />
  </div>
);
