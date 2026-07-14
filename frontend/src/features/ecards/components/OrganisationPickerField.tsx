import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Check, ChevronRight, User } from "lucide-react";
import { useCustomerOrganisationMemberships } from "@features/ecards/hooks/useCustomerOrganisationMemberships";

interface OrganisationPickerFieldProps {
  customerId: string;
  value: string | null;
  onChange: (organisationId: string | null) => void;
}

export default function OrganisationPickerField({
  customerId,
  value,
  onChange,
}: OrganisationPickerFieldProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { memberships, isLoading, error } =
    useCustomerOrganisationMemberships(customerId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const selected = memberships.find((m) => m.organisationId === value);

  function select(organisationId: string | null) {
    onChange(organisationId);
    setIsOpen(false);
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-base-content/70">
        Organisation
      </p>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-11 w-full items-center gap-3 rounded-field border border-base-300 bg-base-200 px-3 py-2.5 text-left hover:bg-base-300/40"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-100">
          {selected?.organisationLogoUrl ? (
            <img
              src={selected.organisationLogoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-4 w-4 text-base-content/30" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-base-content">
            {selected ? selected.organisationName : "Personal card"}
          </p>
          <p className="truncate text-xs text-base-content/50">
            {selected?.spocEmail
              ? `SPOC: ${selected.spocEmail}`
              : "Not linked to an organisation"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-base-content/40" />
      </button>

      {createPortal(
        <dialog
          ref={dialogRef}
          className="modal modal-bottom sm:modal-middle"
          onClose={(event) => {
            // React's synthetic dialog `close`/`cancel` events bubble
            // through the React (fiber) tree, not the DOM tree — this
            // picker is nested inside another open dialog (the Hero
            // sheet), so without stopping propagation here, closing this
            // one would also trigger the outer dialog's onClose.
            event.stopPropagation();
            setIsOpen(false);
          }}
        >
        <div className="modal-box flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-md">
          <div className="flex shrink-0 items-center gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-base-content">
              Link an organisation
            </h3>
          </div>

          <div className="max-h-[60vh] flex-1 overflow-y-auto p-2 sm:p-3">
            {isLoading && (
              <p className="px-3 py-3 text-sm text-base-content/50">
                Loading…
              </p>
            )}
            {error && <p className="px-3 py-3 text-sm text-error">{error}</p>}

            {!isLoading && !error && (
              <>
                <button
                  type="button"
                  onClick={() => select(null)}
                  className="flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left hover:bg-base-200"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/60">
                    <User className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-base-content">
                      Personal card
                    </p>
                    <p className="truncate text-xs text-base-content/50">
                      Not linked to any organisation
                    </p>
                  </div>
                  {value === null && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>

                {memberships.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-base-content/50">
                    This customer doesn&rsquo;t belong to any organisation yet.
                  </p>
                )}

                {memberships.map((membership) => (
                  <button
                    key={membership.organisationId}
                    type="button"
                    onClick={() => select(membership.organisationId)}
                    className="flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left hover:bg-base-200"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-200">
                      {membership.organisationLogoUrl ? (
                        <img
                          src={membership.organisationLogoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-4 w-4 text-base-content/30" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-base-content">
                        {membership.organisationName}
                      </p>
                      {membership.spocEmail && (
                        <p className="truncate text-xs text-base-content/50">
                          SPOC: {membership.spocEmail}
                        </p>
                      )}
                    </div>
                    {value === membership.organisationId && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="modal-action m-0 shrink-0 border-t border-base-300 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
            >
              Close
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
        </dialog>,
        document.body,
      )}
    </div>
  );
}
