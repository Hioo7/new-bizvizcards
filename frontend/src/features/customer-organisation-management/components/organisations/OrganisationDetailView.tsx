import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  IdCard,
  Mail,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { useAsyncAction } from "@hooks/useAsyncAction";
import ConfirmActionModal from "@components/ConfirmActionModal";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import {
  adminCustomerEcardsPath,
  adminOrganisationEcardTemplatePath,
  ROUTES,
} from "@config/routes";
import type { OrganisationMemberSummary } from "@app-types/ecard";
import type { OrganisationInviteAdminItem } from "@app-types/organisation";
import { useOrganisationDetail } from "@features/customer-organisation-management/hooks/useOrganisationDetail";
import { useOrganisationDetailMutations } from "@features/customer-organisation-management/hooks/useOrganisationDetailMutations";
import { useOrganisationInvites } from "@features/customer-organisation-management/hooks/useOrganisationInvites";
import { isAdminTier } from "@utils/isAdminTier";
import { memberToCustomerShim } from "@features/customer-organisation-management/utils/memberToCustomerShim";
import OrganisationLogoField from "@features/customer-organisation-management/components/organisations/OrganisationLogoField";
import EditOrganisationNameModal from "@features/customer-organisation-management/components/organisations/EditOrganisationNameModal";
import AddOrganisationMemberModal from "@features/customer-organisation-management/components/organisations/AddOrganisationMemberModal";
import OrganisationMemberRow from "@features/customer-organisation-management/components/organisations/OrganisationMemberRow";
import OrganisationMemberCard from "@features/customer-organisation-management/components/organisations/OrganisationMemberCard";
import LinkMemberEcardModal from "@features/customer-organisation-management/components/organisations/LinkMemberEcardModal";
import LinkExistingInviteMemberModal from "@features/customer-organisation-management/components/organisations/LinkExistingInviteMemberModal";
import CreateAndLinkInviteMemberModal from "@features/customer-organisation-management/components/organisations/CreateAndLinkInviteMemberModal";
import OrganisationInviteRow from "@features/customer-organisation-management/components/organisations/OrganisationInviteRow";
import OrganisationInviteCard from "@features/customer-organisation-management/components/organisations/OrganisationInviteCard";
import type { EditOrganisationNameValues } from "@features/customer-organisation-management/schemas/editOrganisationNameSchema";
import type { AddOrganisationMemberValues } from "@features/customer-organisation-management/schemas/addOrganisationMemberSchema";
import type { CreateCustomerValues } from "@features/customer-organisation-management/schemas/createCustomerSchema";

type ConfirmAction =
  | {
      type: "promote" | "demote" | "suspend" | "reactivate" | "removeMember";
      member: OrganisationMemberSummary;
    }
  | { type: "deleteOrganisation" }
  | { type: "revokeInvite"; invite: OrganisationInviteAdminItem };

export default function OrganisationDetailView() {
  const { organisationId } = useParams<{ organisationId: string }>();
  const navigate = useNavigate();
  const { staffUser } = useStaffAuth();
  const detail = useOrganisationDetail(organisationId ?? "");
  const mutations = useOrganisationDetailMutations(detail.refetch);
  const invitesState = useOrganisationInvites(
    organisationId ?? "",
    detail.refetch,
  );

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [linkingMember, setLinkingMember] =
    useState<OrganisationMemberSummary | null>(null);
  const [linkingInvite, setLinkingInvite] =
    useState<OrganisationInviteAdminItem | null>(null);
  const [creatingForInvite, setCreatingForInvite] =
    useState<OrganisationInviteAdminItem | null>(null);

  const editNameAction = useAsyncAction();
  const addMemberAction = useAsyncAction();
  const confirmActionState = useAsyncAction();
  const linkEcardAction = useAsyncAction();
  const linkExistingInviteAction = useAsyncAction();
  const createAndLinkInviteAction = useAsyncAction();

  if (!staffUser || !organisationId) return null;

  const canDelete = isAdminTier(staffUser.role);

  const handleEditNameSubmit = (values: EditOrganisationNameValues) => {
    void editNameAction.run(
      () => mutations.updateOrganisation(organisationId, values),
      () => setIsEditNameOpen(false),
    );
  };

  const handleAddMemberSubmit = (values: AddOrganisationMemberValues) => {
    void addMemberAction.run(
      () => mutations.addOrganisationMembers(organisationId, values),
      () => setIsAddMemberOpen(false),
    );
  };

  const handleLinkEcard = (ecardId: string) => {
    if (!linkingMember) return;
    void linkEcardAction.run(
      () =>
        mutations.linkMemberEcard(organisationId, linkingMember.id, ecardId),
      () => setLinkingMember(null),
    );
  };

  const handleLinkExistingInvite = (customerId: string) => {
    if (!linkingInvite) return;
    void linkExistingInviteAction.run(
      () => invitesState.linkExisting(linkingInvite.id, customerId),
      () => setLinkingInvite(null),
    );
  };

  const handleCreateAndLinkInvite = (values: CreateCustomerValues) => {
    if (!creatingForInvite) return;
    void createAndLinkInviteAction.run(
      () => invitesState.createAndLink(creatingForInvite.id, values),
      () => setCreatingForInvite(null),
    );
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    void confirmActionState.run(
      async () => {
        switch (confirmAction.type) {
          case "promote":
            await mutations.updateOrganisationMember(
              confirmAction.member.id,
              { role: "SPOC" },
            );
            return;
          case "demote":
            await mutations.updateOrganisationMember(
              confirmAction.member.id,
              { role: "MEMBER" },
            );
            return;
          case "suspend":
            await mutations.updateOrganisationMember(
              confirmAction.member.id,
              { status: "SUSPENDED" },
            );
            return;
          case "reactivate":
            await mutations.updateOrganisationMember(
              confirmAction.member.id,
              { status: "ACTIVE" },
            );
            return;
          case "removeMember":
            await mutations.removeOrganisationMember(confirmAction.member.id);
            return;
          case "deleteOrganisation":
            await mutations.deleteOrganisation(organisationId);
            navigate(ROUTES.adminCustomerOrganisations);
            return;
          case "revokeInvite":
            await invitesState.revoke(confirmAction.invite.id);
            return;
        }
      },
      () => setConfirmAction(null),
    );
  };

  if (detail.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (detail.error || !detail.organisation) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.adminCustomerOrganisations)}
          className="flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <FormErrorRibbon
          message={detail.error ?? "Organisation not found."}
        />
      </div>
    );
  }

  const { organisation, members } = detail;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(ROUTES.adminCustomerOrganisations)}
        className="flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to organisations
      </button>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-300 text-base-content/60">
            {organisation.logoUrl ? (
              <img
                src={organisation.logoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </span>
          <h1 className="text-2xl font-extrabold text-base-content">
            {organisation.name}
          </h1>
          <button
            type="button"
            aria-label="Rename organisation"
            onClick={() => {
              editNameAction.reset();
              setIsEditNameOpen(true);
            }}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {canDelete && (
          <button
            type="button"
            aria-label="Delete organisation"
            onClick={() => {
              confirmActionState.reset();
              setConfirmAction({ type: "deleteOrganisation" });
            }}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-4">
        <OrganisationLogoField
          organisationId={organisationId}
          logoUrl={organisation.logoUrl}
          onUpload={(file) =>
            mutations.updateOrganisationLogo(organisationId, file)
          }
          onRemove={() => mutations.removeOrganisationLogo(organisationId)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IdCard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-base-content">
              E-card policy
            </p>
            <p className="text-xs text-base-content/60">
              Branding &amp; components applied to every linked member e-card
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            navigate(adminOrganisationEcardTemplatePath(organisationId))
          }
          className="flex items-center gap-1.5 rounded-field border border-base-300 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <Pencil className="h-4 w-4" />
          Manage
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-content/70">
          Members ({members.length})
        </h2>
        <button
          type="button"
          onClick={() => {
            addMemberAction.reset();
            setIsAddMemberOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-field border border-base-300 px-3 py-2 text-xs font-semibold text-base-content/70 hover:bg-base-200"
        >
          <UserPlus className="h-4 w-4" />
          Add member
        </button>
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-8 w-8 text-base-content/30" />
            <p className="text-sm text-base-content/60">No members yet.</p>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
                  <th className="py-2 pl-4 pr-3 font-semibold">Member</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="py-2 pl-3 pr-4 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <OrganisationMemberRow
                    key={member.id}
                    member={member}
                    onToggleRole={() => {
                      confirmActionState.reset();
                      setConfirmAction({
                        type: member.role === "SPOC" ? "demote" : "promote",
                        member,
                      });
                    }}
                    onToggleStatus={() => {
                      confirmActionState.reset();
                      setConfirmAction({
                        type:
                          member.status === "SUSPENDED"
                            ? "reactivate"
                            : "suspend",
                        member,
                      });
                    }}
                    onRemove={() => {
                      confirmActionState.reset();
                      setConfirmAction({ type: "removeMember", member });
                    }}
                    onManageEcards={() =>
                      navigate(adminCustomerEcardsPath(member.customerId), {
                        state: { customer: memberToCustomerShim(member) },
                      })
                    }
                    onLinkEcard={() => {
                      linkEcardAction.reset();
                      setLinkingMember(member);
                    }}
                  />
                ))}
              </tbody>
            </table>

            <div className="flex flex-col gap-3 md:hidden">
              {members.map((member) => (
                <OrganisationMemberCard
                  key={member.id}
                  member={member}
                  onToggleRole={() => {
                    confirmActionState.reset();
                    setConfirmAction({
                      type: member.role === "SPOC" ? "demote" : "promote",
                      member,
                    });
                  }}
                  onToggleStatus={() => {
                    confirmActionState.reset();
                    setConfirmAction({
                      type:
                        member.status === "SUSPENDED"
                          ? "reactivate"
                          : "suspend",
                      member,
                    });
                  }}
                  onRemove={() => {
                    confirmActionState.reset();
                    setConfirmAction({ type: "removeMember", member });
                  }}
                  onManageEcards={() =>
                    navigate(adminCustomerEcardsPath(member.customerId), {
                      state: { customer: memberToCustomerShim(member) },
                    })
                  }
                  onLinkEcard={() => {
                    linkEcardAction.reset();
                    setLinkingMember(member);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <h2 className="text-sm font-semibold text-base-content/70">
        Invites (
        {invitesState.invites.filter((invite) => invite.status === "PENDING").length}
        )
      </h2>

      <div className="rounded-box border border-base-300 bg-base-100 p-2 sm:p-4">
        {invitesState.isLoading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner text-primary" />
          </div>
        ) : invitesState.invites.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Mail className="h-8 w-8 text-base-content/30" />
            <p className="text-sm text-base-content/60">No invites yet.</p>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-base-300 text-xs uppercase tracking-wide text-base-content/50">
                  <th className="py-2 pl-4 pr-3 font-semibold">Invite</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="py-2 pl-3 pr-4 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invitesState.invites.map((invite) => (
                  <OrganisationInviteRow
                    key={invite.id}
                    invite={invite}
                    onLinkExisting={() => {
                      linkExistingInviteAction.reset();
                      setLinkingInvite(invite);
                    }}
                    onCreateAndLink={() => {
                      createAndLinkInviteAction.reset();
                      setCreatingForInvite(invite);
                    }}
                    onRevoke={() => {
                      confirmActionState.reset();
                      setConfirmAction({ type: "revokeInvite", invite });
                    }}
                  />
                ))}
              </tbody>
            </table>

            <div className="flex flex-col gap-3 md:hidden">
              {invitesState.invites.map((invite) => (
                <OrganisationInviteCard
                  key={invite.id}
                  invite={invite}
                  onLinkExisting={() => {
                    linkExistingInviteAction.reset();
                    setLinkingInvite(invite);
                  }}
                  onCreateAndLink={() => {
                    createAndLinkInviteAction.reset();
                    setCreatingForInvite(invite);
                  }}
                  onRevoke={() => {
                    confirmActionState.reset();
                    setConfirmAction({ type: "revokeInvite", invite });
                  }}
                />
              ))}
            </div>
          </>
        )}
        {invitesState.error && (
          <p className="mt-2 text-sm text-error">{invitesState.error}</p>
        )}
      </div>

      <EditOrganisationNameModal
        open={isEditNameOpen}
        currentName={organisation.name}
        isSubmitting={editNameAction.isSubmitting}
        error={editNameAction.error}
        onCancel={() => setIsEditNameOpen(false)}
        onSubmit={handleEditNameSubmit}
      />

      <AddOrganisationMemberModal
        open={isAddMemberOpen}
        excludeCustomerIds={members.map((member) => member.customerId)}
        isSubmitting={addMemberAction.isSubmitting}
        error={addMemberAction.error}
        onCancel={() => setIsAddMemberOpen(false)}
        onSubmit={handleAddMemberSubmit}
      />

      <LinkMemberEcardModal
        open={linkingMember !== null}
        member={linkingMember}
        organisationId={organisationId}
        isSubmitting={linkEcardAction.isSubmitting}
        error={linkEcardAction.error}
        onCancel={() => setLinkingMember(null)}
        onLink={handleLinkEcard}
      />

      <LinkExistingInviteMemberModal
        open={linkingInvite !== null}
        inviteEmail={linkingInvite?.email ?? ""}
        isSubmitting={linkExistingInviteAction.isSubmitting}
        error={linkExistingInviteAction.error}
        onCancel={() => setLinkingInvite(null)}
        onSubmit={handleLinkExistingInvite}
      />

      <CreateAndLinkInviteMemberModal
        open={creatingForInvite !== null}
        inviteEmail={creatingForInvite?.email ?? ""}
        isSubmitting={createAndLinkInviteAction.isSubmitting}
        error={createAndLinkInviteAction.error}
        onCancel={() => setCreatingForInvite(null)}
        onSubmit={handleCreateAndLinkInvite}
      />

      <ConfirmActionModal
        open={confirmAction !== null}
        icon={
          confirmAction?.type === "deleteOrganisation" ||
          confirmAction?.type === "removeMember" ||
          confirmAction?.type === "revokeInvite"
            ? Trash2
            : Pencil
        }
        title={confirmActionTitle(confirmAction)}
        description={confirmActionDescription(confirmAction)}
        confirmLabel={confirmActionLabel(confirmAction)}
        isDestructive={
          confirmAction?.type === "deleteOrganisation" ||
          confirmAction?.type === "removeMember" ||
          confirmAction?.type === "revokeInvite"
        }
        isSubmitting={confirmActionState.isSubmitting}
        error={confirmActionState.error}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function confirmActionTitle(action: ConfirmAction | null): string {
  if (!action) return "";
  switch (action.type) {
    case "promote":
      return `Promote ${action.member.name} to SPOC?`;
    case "demote":
      return `Demote ${action.member.name} to member?`;
    case "suspend":
      return `Suspend ${action.member.name}?`;
    case "reactivate":
      return `Reactivate ${action.member.name}?`;
    case "removeMember":
      return `Remove ${action.member.name}?`;
    case "deleteOrganisation":
      return "Delete this organisation?";
    case "revokeInvite":
      return `Revoke the invite for ${action.invite.email}?`;
  }
}

function confirmActionDescription(action: ConfirmAction | null): string {
  if (!action) return "";
  switch (action.type) {
    case "promote":
      return "They'll be able to manage this organisation's members and settings.";
    case "demote":
      return "They'll lose SPOC access to this organisation.";
    case "suspend":
      return "Their membership is paused until reactivated.";
    case "reactivate":
      return "Their membership becomes active again.";
    case "removeMember":
      return "This removes their membership and unlinks their e-card from this organisation. This can't be undone.";
    case "deleteOrganisation":
      return "This permanently removes the organisation and its membership records. This can't be undone.";
    case "revokeInvite":
      return "This invite link will no longer work. This can't be undone.";
  }
}

function confirmActionLabel(action: ConfirmAction | null): string {
  if (!action) return "Confirm";
  switch (action.type) {
    case "promote":
      return "Promote";
    case "demote":
      return "Demote";
    case "suspend":
      return "Suspend";
    case "reactivate":
      return "Reactivate";
    case "removeMember":
      return "Remove";
    case "deleteOrganisation":
      return "Delete";
    case "revokeInvite":
      return "Revoke";
  }
}
