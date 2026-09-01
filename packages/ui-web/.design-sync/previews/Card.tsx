import { Card, Badge, Avatar } from "@bizvizcards/ui";

const noop = () => {};

export const Basic = () => (
  <div className="w-80">
    <Card>
      <p className="text-sm font-semibold text-base-content">Team plan</p>
      <p className="mt-1 text-sm text-base-content/60">
        Unlimited cards, shared lead folders, and analytics for up to 10 seats.
      </p>
    </Card>
  </div>
);

export const Tappable = () => (
  <div className="w-80">
    <Card onClick={noop}>
      <div className="flex items-center gap-3">
        <Avatar name="Chitra Narayan" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-base-content">
            Chitra Narayan
          </p>
          <p className="truncate text-xs text-base-content/60">Narayan &amp; Co.</p>
        </div>
        <Badge tone="success" size="sm">
          New
        </Badge>
      </div>
    </Card>
  </div>
);

export const Flush = () => (
  <div className="w-80">
    <Card flush>
      <div className="flex aspect-video w-full items-center justify-center rounded-t-box bg-gradient-to-br from-primary to-secondary text-primary-content">
        <span className="text-sm font-semibold">BizViz</span>
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-base-content">Virtual background</p>
        <p className="mt-1 text-xs text-base-content/60">Tap to edit</p>
      </div>
    </Card>
  </div>
);
