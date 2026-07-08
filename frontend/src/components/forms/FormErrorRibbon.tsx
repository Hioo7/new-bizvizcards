import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface FormErrorRibbonProps {
  message: string | null;
}

export default function FormErrorRibbon({ message }: FormErrorRibbonProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          role="alert"
          className="flex items-center gap-2 rounded-field border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
