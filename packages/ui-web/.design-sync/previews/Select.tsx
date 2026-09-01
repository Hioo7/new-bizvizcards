import { Select } from "@bizvizcards/ui";
import { FolderOpen } from "lucide-react";

const FOLDERS = [
  { label: "All leads", value: "all" },
  { label: "Trade show 2026", value: "ts26" },
  { label: "Website enquiries", value: "web" },
  { label: "Archived", value: "archived", disabled: true },
];

export const WithValue = () => (
  <div className="w-80">
    <Select
      label="Folder"
      icon={<FolderOpen className="h-3.5 w-3.5" />}
      options={FOLDERS}
      defaultValue="ts26"
    />
  </div>
);

export const WithPlaceholder = () => (
  <div className="w-80">
    <Select
      label="Move to folder"
      options={FOLDERS}
      placeholder="Choose a folder"
      defaultValue=""
    />
  </div>
);

export const WithError = () => (
  <div className="w-80">
    <Select
      label="Folder"
      options={FOLDERS}
      defaultValue=""
      placeholder="Choose a folder"
      error="Pick a folder to continue"
    />
  </div>
);
