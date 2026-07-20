import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { ROUTES } from "@config/routes";
import { ADMIN_APP_TILES } from "@features/admin/config/appsConfig";
import AppTile from "@features/admin/components/AppTile";
import LogoutConfirmModal from "@features/admin/components/LogoutConfirmModal";

const GRID_CONTAINER_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function AppsGrid() {
  const navigate = useNavigate();
  const { staffUser, signOut } = useStaffAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate(ROUTES.adminLogin);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6">
      <p className="mb-1 text-sm text-base-content/60">Welcome back,</p>
      <h1 className="mb-8 text-2xl font-extrabold text-base-content sm:text-3xl">
        {staffUser?.name}
      </h1>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={GRID_CONTAINER_VARIANTS}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5"
      >
        {ADMIN_APP_TILES.filter(
          (tile) => !tile.requiredRole || tile.requiredRole === staffUser?.role,
        ).map((tile) => (
          <AppTile
            key={tile.id}
            tile={tile}
            onActivate={() =>
              tile.action === "logout"
                ? setIsLogoutModalOpen(true)
                : tile.route && navigate(tile.route)
            }
          />
        ))}
      </motion.div>

      <LogoutConfirmModal
        open={isLogoutModalOpen}
        isLoggingOut={isLoggingOut}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
