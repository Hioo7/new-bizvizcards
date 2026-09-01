import { Badge } from "@bizvizcards/ui";
import { Check, Clock, Ban } from "lucide-react";

export const Tones = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge tone="neutral">Draft</Badge>
    <Badge tone="primary">Team plan</Badge>
    <Badge tone="info">New</Badge>
    <Badge tone="success">Published</Badge>
    <Badge tone="warning">Payment due</Badge>
    <Badge tone="error">Suspended</Badge>
  </div>
);

export const WithIcons = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge tone="success" icon={<Check className="h-3 w-3" />}>
      Verified
    </Badge>
    <Badge tone="warning" icon={<Clock className="h-3 w-3" />}>
      Pending
    </Badge>
    <Badge tone="error" icon={<Ban className="h-3 w-3" />}>
      Banned
    </Badge>
  </div>
);

export const Sizes = () => (
  <div className="flex items-center gap-2">
    <Badge tone="primary" size="sm">
      Small
    </Badge>
    <Badge tone="primary" size="md">
      Medium
    </Badge>
    <Badge tone="primary" size="lg">
      Large
    </Badge>
  </div>
);

export const Outline = () => (
  <div className="flex items-center gap-2">
    <Badge tone="success" outline>
      Card Scanner
    </Badge>
    <Badge tone="info" outline>
      Website
    </Badge>
    <Badge tone="neutral" outline>
      Manual entry
    </Badge>
  </div>
);
