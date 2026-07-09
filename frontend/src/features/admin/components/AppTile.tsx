import { motion, type Variants } from "framer-motion";
import type { AdminAppTile } from "@features/admin/config/appsConfig";

const TILE_COLOR_CLASSES: Record<AdminAppTile["color"], string> = {
  primary: "bg-primary text-primary-content",
  secondary: "bg-secondary text-secondary-content",
  accent: "bg-accent text-accent-content",
  neutral: "bg-neutral text-neutral-content",
};

const APP_TILE_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

interface AppTileProps {
  tile: AdminAppTile;
  onActivate: () => void;
}

export default function AppTile({ tile, onActivate }: AppTileProps) {
  const Icon = tile.icon;

  return (
    <motion.button
      type="button"
      variants={APP_TILE_ITEM_VARIANTS}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onActivate}
      className={`group relative flex aspect-square min-h-28 flex-col items-center justify-center gap-3 rounded-box shadow-sm outline-none transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${TILE_COLOR_CLASSES[tile.color]}`}
    >
      <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.75} />
      <span className="px-2 text-center text-xs font-bold uppercase tracking-wide sm:text-sm">
        {tile.label}
      </span>
      <span className="pointer-events-none absolute inset-x-4 bottom-3 h-0.5 origin-left scale-x-0 rounded-full bg-current opacity-70 transition-transform duration-300 group-hover:scale-x-100" />
    </motion.button>
  );
}
