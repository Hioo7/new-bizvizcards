import { ThemeRoot, Card, Button, Badge } from "@bizvizcards/ui";

const noop = () => {};

export const ScopedSurface = () => (
  <div className="w-80">
    <ThemeRoot>
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-base-content">Team plan</p>
          <Badge tone="primary" size="sm">
            Active
          </Badge>
        </div>
        <p className="mt-1 text-sm text-base-content/60">
          Everything inside a ThemeRoot uses the bizviz palette, even on a host
          page with a different theme.
        </p>
        <div className="mt-3">
          <Button size="sm" onClick={noop}>
            Manage plan
          </Button>
        </div>
      </Card>
    </ThemeRoot>
  </div>
);
