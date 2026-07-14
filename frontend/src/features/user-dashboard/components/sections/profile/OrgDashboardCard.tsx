export default function OrgDashboardCard() {
  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4">
      <h2 className="text-base font-bold text-base-content mb-1">
        Organizational Dashboard
      </h2>
      <p className="text-sm text-base-content/60 mb-4">
        View all the data of your team on a single dashboard.
      </p>
      <button
        type="button"
        className="btn btn-primary w-full min-h-[44px]"
      >
        Open Dashboard
      </button>
    </div>
  );
}
