import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import ConfirmActionModal from "@components/ConfirmActionModal";
import {
  createVirtualBackgroundTemplate,
  deleteVirtualBackgroundTemplate,
} from "@services/virtualBackgroundTemplateService";
import { useVirtualBackgroundTemplates } from "@features/plans/hooks/useVirtualBackgroundTemplates";
import {
  VIRTUAL_BACKGROUND_HEIGHT_PX,
  VIRTUAL_BACKGROUND_TEMPLATE_NAME_MAX_LENGTH,
  VIRTUAL_BACKGROUND_WIDTH_PX,
} from "@features/virtual-backgrounds/config";
import { readImageDimensions } from "@utils/readImageDimensions";
import type { VirtualBackgroundTemplateSummary } from "@app-types/virtualBackground";

interface VirtualBackgroundTemplateManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VirtualBackgroundTemplateManagerModal({
  open,
  onClose,
}: VirtualBackgroundTemplateManagerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { templates, isLoading, error, refetch } = useVirtualBackgroundTemplates();

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const uploadAction = useAsyncAction();

  const [deleteTarget, setDeleteTarget] =
    useState<VirtualBackgroundTemplateSummary | null>(null);
  const deleteAction = useAsyncAction();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName("");
      setFile(null);
      setValidationError(null);
      uploadAction.reset();
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleFileSelected(selected: File | undefined) {
    setValidationError(null);
    if (!selected) return;
    try {
      const { width, height } = await readImageDimensions(selected);
      if (width < VIRTUAL_BACKGROUND_WIDTH_PX || height < VIRTUAL_BACKGROUND_HEIGHT_PX) {
        setValidationError(
          `Image must be at least ${VIRTUAL_BACKGROUND_WIDTH_PX}x${VIRTUAL_BACKGROUND_HEIGHT_PX}px (this image is ${width}x${height}px).`,
        );
        setFile(null);
        return;
      }
      setFile(selected);
    } catch {
      setValidationError("Could not read image file.");
    }
  }

  function handleUpload() {
    if (!file || !name.trim()) return;
    void uploadAction.run(
      async () => {
        await createVirtualBackgroundTemplate(name.trim(), file);
        refetch();
      },
      () => {
        setName("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    void deleteAction.run(
      async () => {
        await deleteVirtualBackgroundTemplate(deleteTarget.id);
        refetch();
      },
      () => setDeleteTarget(null),
    );
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className="modal modal-bottom sm:modal-middle"
        onClose={onClose}
      >
        <div className="modal-box flex h-[85vh] w-full flex-col gap-4 sm:max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImagePlus className="h-5 w-5" />
            </div>
            <h2 className="flex-1 text-lg font-bold text-base-content">
              Virtual background templates
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base-content/60 hover:bg-base-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-box border border-base-300 p-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={VIRTUAL_BACKGROUND_TEMPLATE_NAME_MAX_LENGTH}
                placeholder="Template name"
                aria-label="Template name"
                className="min-h-11 flex-1 rounded-field border border-base-300 bg-base-200 px-3 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-11 items-center justify-center gap-2 rounded-field border border-dashed border-base-300 px-3 text-sm text-base-content hover:bg-base-200"
              >
                <Upload className="h-4 w-4" />
                {file ? file.name : `Choose image (${VIRTUAL_BACKGROUND_WIDTH_PX}x${VIRTUAL_BACKGROUND_HEIGHT_PX}px+)`}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) =>
                  void handleFileSelected(event.target.files?.[0])
                }
              />
            </div>
            {validationError && (
              <p className="text-xs text-error">{validationError}</p>
            )}
            {uploadAction.error && (
              <p className="text-xs text-error">{uploadAction.error}</p>
            )}
            <button
              type="button"
              disabled={!file || !name.trim() || uploadAction.isSubmitting}
              onClick={handleUpload}
              className="btn min-h-11 self-end btn-primary disabled:opacity-50"
            >
              {uploadAction.isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Upload template"
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner loading-sm text-primary" />
              </div>
            )}
            {error && <p className="text-sm text-error">{error}</p>}
            {!isLoading && templates.length === 0 && (
              <p className="py-6 text-center text-sm text-base-content/60">
                No templates uploaded yet.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="relative flex flex-col overflow-hidden rounded-field border border-base-300"
                >
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="aspect-video w-full object-cover"
                  />
                  <span className="truncate px-2 py-1 text-xs font-medium text-base-content">
                    {template.name}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${template.name}`}
                    onClick={() => {
                      deleteAction.reset();
                      setDeleteTarget(template);
                    }}
                    className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-error text-error-content hover:bg-error/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>

      <ConfirmActionModal
        open={deleteTarget !== null}
        icon={Trash2}
        title="Delete template"
        description={`Delete "${deleteTarget?.name}"? Any plan whitelisting it will lose access to it. This cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        isSubmitting={deleteAction.isSubmitting}
        error={deleteAction.error}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
