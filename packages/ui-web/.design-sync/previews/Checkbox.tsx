import { Checkbox } from "@bizvizcards/ui";

export const Checked = () => (
  <div className="w-80">
    <Checkbox label="I agree to the terms of service" checked readOnly />
  </div>
);

export const Unchecked = () => (
  <div className="w-80">
    <Checkbox
      label="Send me product updates"
      description="Occasional emails, no more than once a month"
      checked={false}
      readOnly
    />
  </div>
);

export const Group = () => (
  <div className="flex w-80 flex-col gap-1">
    <Checkbox label="Name" checked readOnly />
    <Checkbox label="Email address" checked readOnly />
    <Checkbox label="Phone number" checked={false} readOnly />
    <Checkbox label="Company" checked={false} readOnly />
  </div>
);
