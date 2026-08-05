import { useMyEffectivePolicy } from "@hooks/useMyEffectivePolicy";
import AppsGrid from "@features/user-dashboard/components/apps/AppsGrid";

export default function AppsSection() {
  const { policy, isLoading, error } = useMyEffectivePolicy();

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky blue header */}
      <div
        className="sticky top-0 z-10 px-4 pb-5 pt-10"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <h1 className="text-2xl font-bold text-white">Apps</h1>
        <p className="text-sm text-white/70 mt-0.5">
          Extend your BizVizCards experience
        </p>
      </div>

      <div className="pt-6">
        {isLoading && (
          <p className="px-4 text-center text-sm text-base-content/50">
            Loading…
          </p>
        )}
        {error && (
          <p className="px-4 text-center text-sm text-error">{error}</p>
        )}
        {policy && <AppsGrid policy={policy} />}
      </div>
    </div>
  );
}
