import { RadioGroup } from "@bizvizcards/ui";

const noop = () => {};

export const CardTheme = () => (
  <div className="w-80">
    <RadioGroup
      label="Card theme"
      value="LIGHT"
      onChange={noop}
      options={[
        { label: "Legacy dark", value: "LEGACY" },
        { label: "Light", value: "LIGHT" },
        { label: "Navy teal", value: "NAVY_TEAL" },
      ]}
    />
  </div>
);

export const WithDescriptions = () => (
  <div className="w-80">
    <RadioGroup
      label="Who can see this card?"
      value="LINK"
      onChange={noop}
      options={[
        {
          label: "Anyone with the link",
          value: "LINK",
          description: "Not indexed by search engines",
        },
        {
          label: "Only my organisation",
          value: "ORG",
          description: "Requires a BizViz sign-in",
        },
        { label: "Private", value: "PRIVATE", description: "Only you", disabled: true },
      ]}
    />
  </div>
);
