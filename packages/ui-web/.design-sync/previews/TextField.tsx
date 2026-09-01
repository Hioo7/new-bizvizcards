import { TextField, IconButton } from "@bizvizcards/ui";
import { Mail, User, Sparkles, Building2 } from "lucide-react";

export const WithValue = () => (
  <div className="w-80">
    <TextField
      label="Work email"
      icon={<Mail className="h-4 w-4" />}
      defaultValue="chitra@narayan.co"
    />
  </div>
);

export const Empty = () => (
  <div className="w-80">
    <TextField label="Full name" icon={<User className="h-4 w-4" />} />
  </div>
);

export const WithError = () => (
  <div className="w-80">
    <TextField
      label="Work email"
      icon={<Mail className="h-4 w-4" />}
      defaultValue="chitra@narayan"
      error="Enter a valid email address"
    />
  </div>
);

export const WithHint = () => (
  <div className="w-80">
    <TextField
      label="Company"
      icon={<Building2 className="h-4 w-4" />}
      defaultValue="Narayan & Co."
      hint="Shown on your digital card"
    />
  </div>
);

export const WithTrailingAction = () => (
  <div className="w-80">
    <TextField
      label="Card handle"
      defaultValue="chitra-narayan"
      trailingSlot={
        <IconButton
          label="Suggest a handle"
          size="sm"
          variant="ghost"
          icon={<Sparkles className="h-4 w-4" />}
        />
      }
    />
  </div>
);
