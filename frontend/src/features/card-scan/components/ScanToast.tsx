import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert } from "lucide-react";
import { SCAN_TOAST_DURATION_MS } from "@features/card-scan/config";

interface ScanToastProps {
  message: string | null;
  onDismiss: () => void;
}

/** Top-anchored error toast that fades/slides in and auto-dismisses. */
export default function ScanToast({ message, onDismiss }: ScanToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, SCAN_TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="toast toast-top toast-center z-50 w-full max-w-md px-4"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
        >
          <div className="alert alert-error shadow-lg">
            <CircleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
