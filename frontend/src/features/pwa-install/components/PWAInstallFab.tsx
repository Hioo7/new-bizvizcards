import { Download } from "lucide-react";

interface PWAInstallFabProps {
  onClick: () => void;
}

export default function PWAInstallFab({ onClick }: PWAInstallFabProps) {
  return (
    <div className="fixed inset-x-0 bottom-24 z-30 flex justify-end pr-4 sm:hidden pointer-events-none">
      <button
        type="button"
        onClick={onClick}
        aria-label="Install app"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-lg transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50"
      >
        <Download className="h-6 w-6" />
      </button>
    </div>
  );
}
