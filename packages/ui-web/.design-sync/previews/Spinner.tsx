import { Spinner } from "@bizvizcards/ui";

export const Sizes = () => (
  <div className="flex items-center gap-6">
    <Spinner size="sm" />
    <Spinner size="md" />
    <Spinner size="lg" />
  </div>
);

export const WithLabel = () => <Spinner size="lg" label="Reading card…" showLabel />;

export const InAPanel = () => (
  <div className="flex h-40 w-72 items-center justify-center rounded-box border border-base-300 bg-base-100">
    <Spinner label="Loading leads…" showLabel />
  </div>
);
