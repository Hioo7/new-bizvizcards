import { Lock } from "lucide-react";
import type { UserAppTile } from "@features/user-dashboard/config/appsConfig";

interface AppTileProps {
  tile: UserAppTile;
  isLocked: boolean;
  onActivate: () => void;
}

export default function AppTile({ tile, isLocked, onActivate }: AppTileProps) {
  const Icon = tile.icon;

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={onActivate}
      className="relative flex flex-col items-center justify-center gap-1.5 rounded-box border border-base-300 bg-base-100 px-2 py-3 text-center shadow-sm transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isLocked
            ? "bg-base-300 text-base-content/40"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="text-[11px] font-semibold leading-tight text-base-content">
        {tile.label}
      </span>
      {isLocked && (
        <>
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral text-neutral-content">
            <Lock className="h-2.5 w-2.5" />
          </span>
          <span className="text-[9px] leading-tight text-base-content/50">
            Not included in your plan
          </span>
        </>
      )}
    </button>
  );
}
