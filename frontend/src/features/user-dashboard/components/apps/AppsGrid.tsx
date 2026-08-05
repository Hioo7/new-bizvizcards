import { useNavigate } from "react-router-dom";
import type { EffectivePolicy } from "@app-types/plan";
import { USER_APP_TILES } from "@features/user-dashboard/config/appsConfig";
import AppTile from "@features/user-dashboard/components/apps/AppTile";

interface AppsGridProps {
  policy: EffectivePolicy;
}

export default function AppsGrid({ policy }: AppsGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3 px-4 sm:grid-cols-4 sm:gap-4">
      {USER_APP_TILES.map((tile) => {
        const isLocked = tile.isLocked(policy);
        return (
          <AppTile
            key={tile.id}
            tile={tile}
            isLocked={isLocked}
            onActivate={() => {
              if (isLocked) return;
              navigate(tile.route);
            }}
          />
        );
      })}
    </div>
  );
}
