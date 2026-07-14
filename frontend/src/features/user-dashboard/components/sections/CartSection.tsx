export default function CartSection() {
  return (
    <section className="min-h-[60vh] pb-24">
      <header
        className="sticky top-0 z-10 px-4 pt-10 pb-5"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <h1 className="text-2xl font-bold text-white">Cart</h1>
        <p className="text-sm text-white/70 mt-0.5">Shop our products</p>
      </header>
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 px-4 pt-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10 text-primary"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
            />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-base-content">Shop Coming Soon</h3>
          <p className="text-sm text-base-content/60 mt-1">
            Our product catalog will be available shortly.
          </p>
        </div>
      </div>
    </section>
  );
}
