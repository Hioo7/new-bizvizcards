import { Switch } from "@bizvizcards/ui";

export const On = () => (
  <div className="w-80">
    <Switch
      label="Public profile"
      description="Anyone with the link can view your card"
      checked
      readOnly
    />
  </div>
);

export const Off = () => (
  <div className="w-80">
    <Switch label="Email me new leads" checked={false} readOnly />
  </div>
);

export const List = () => (
  <div className="w-80 divide-y divide-base-300">
    <Switch label="Show my phone number" checked readOnly />
    <Switch label="Show my email" checked readOnly />
    <Switch
      label="Allow contact download"
      description="Visitors can save your details as a vCard"
      checked={false}
      readOnly
    />
  </div>
);
