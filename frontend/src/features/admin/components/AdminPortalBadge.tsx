import { motion } from "framer-motion";

export default function AdminPortalBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="mb-6 flex justify-end"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-base-content/60">
        🔐 Admin Portal
      </span>
    </motion.div>
  );
}
