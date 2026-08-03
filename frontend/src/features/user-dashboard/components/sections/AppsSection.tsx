export default function AppsSection() {
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

      <div className="flex flex-col items-center justify-center px-4 pt-16 text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-base-content/30" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-base-content/60">Apps coming soon</p>
          <p className="mt-1 text-sm text-base-content/40">
            We're working on integrations you'll be able to add here
          </p>
        </div>
      </div>
    </div>
  );
}
