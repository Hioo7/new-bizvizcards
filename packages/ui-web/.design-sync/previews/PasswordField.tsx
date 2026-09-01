import { PasswordField } from "@bizvizcards/ui";
import { Lock, Eye, EyeOff } from "lucide-react";

export const Default = () => (
  <div className="w-80">
    <PasswordField
      label="Password"
      icon={<Lock className="h-4 w-4" />}
      revealIcon={<Eye className="h-4 w-4" />}
      hideIcon={<EyeOff className="h-4 w-4" />}
      defaultValue="sathvik@123"
    />
  </div>
);

export const Empty = () => (
  <div className="w-80">
    <PasswordField label="New password" icon={<Lock className="h-4 w-4" />} />
  </div>
);

export const WithError = () => (
  <div className="w-80">
    <PasswordField
      label="Password"
      icon={<Lock className="h-4 w-4" />}
      revealIcon={<Eye className="h-4 w-4" />}
      hideIcon={<EyeOff className="h-4 w-4" />}
      defaultValue="short"
      error="Use at least 8 characters"
    />
  </div>
);

export const TextFallbackToggle = () => (
  <div className="w-80">
    <PasswordField label="Password" defaultValue="sathvik@123" />
  </div>
);
