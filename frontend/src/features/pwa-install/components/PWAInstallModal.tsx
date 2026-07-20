import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, WifiOff, Zap } from "lucide-react";
import {
  PWA_INSTALL_FEATURE_PILLS,
  PWA_INSTALL_ICON_PATH,
  PWA_INSTALL_MODAL_DESCRIPTION,
  PWA_INSTALL_MODAL_TITLE,
} from "@features/pwa-install/config/pwaInstall.config";

const PILL_ICONS = [WifiOff, Zap, Download];

interface PWAInstallModalProps {
  open: boolean;
  onClose: () => void;
  onInstall: () => Promise<void>;
}

export default function PWAInstallModal({ open, onClose, onInstall }: PWAInstallModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  return createPortal(
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <div className="flex justify-center">
          <img
            src={PWA_INSTALL_ICON_PATH}
            alt="BizVizCards"
            className="h-16 w-16 rounded-2xl shadow-md"
          />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Download className="h-5 w-5 shrink-0 text-primary" />
          <h3 className="text-lg font-bold text-base-content">{PWA_INSTALL_MODAL_TITLE}</h3>
        </div>
        <p className="mt-2 text-center text-sm text-base-content/60">
          {PWA_INSTALL_MODAL_DESCRIPTION}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {PWA_INSTALL_FEATURE_PILLS.map((pill, index) => {
            const PillIcon = PILL_ICONS[index];
            return (
              <span
                key={pill}
                className="flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1.5 text-xs font-medium text-base-content/70"
              >
                <PillIcon className="h-3.5 w-3.5" />
                {pill}
              </span>
            );
          })}
        </div>
        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => void onInstall()}
            className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Install
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>,
    document.body,
  );
}
