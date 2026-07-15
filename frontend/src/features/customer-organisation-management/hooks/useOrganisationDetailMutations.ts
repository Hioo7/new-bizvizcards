import { useMemo } from "react";
import {
  addOrganisationMembers,
  deleteOrganisation,
  linkMemberEcard,
  removeOrganisationLogo,
  removeOrganisationMember,
  updateOrganisation,
  updateOrganisationLogo,
  updateOrganisationMember,
} from "@services/organisationService";
import type {
  AddOrganisationMemberPayload,
  UpdateOrganisationMemberPayload,
  UpdateOrganisationPayload,
} from "@app-types/organisation";

export interface UseOrganisationDetailMutationsResult {
  updateOrganisation: (
    id: string,
    payload: UpdateOrganisationPayload,
  ) => Promise<void>;
  updateOrganisationLogo: (id: string, file: File) => Promise<string>;
  removeOrganisationLogo: (id: string) => Promise<void>;
  deleteOrganisation: (id: string) => Promise<void>;
  addOrganisationMembers: (
    organisationId: string,
    payload: AddOrganisationMemberPayload,
  ) => Promise<void>;
  updateOrganisationMember: (
    memberId: string,
    payload: UpdateOrganisationMemberPayload,
  ) => Promise<void>;
  removeOrganisationMember: (memberId: string) => Promise<void>;
  linkMemberEcard: (
    organisationId: string,
    memberId: string,
    ecardId: string,
  ) => Promise<void>;
}

export function useOrganisationDetailMutations(
  refetch: () => void,
): UseOrganisationDetailMutationsResult {
  return useMemo(
    () => ({
      updateOrganisation: async (id, payload) => {
        await updateOrganisation(id, payload);
        refetch();
      },
      updateOrganisationLogo: async (id, file) => {
        const result = await updateOrganisationLogo(id, file);
        refetch();
        return result.logoUrl;
      },
      removeOrganisationLogo: async (id) => {
        await removeOrganisationLogo(id);
        refetch();
      },
      deleteOrganisation: async (id) => {
        await deleteOrganisation(id);
      },
      addOrganisationMembers: async (organisationId, payload) => {
        await addOrganisationMembers(organisationId, payload);
        refetch();
      },
      updateOrganisationMember: async (memberId, payload) => {
        await updateOrganisationMember(memberId, payload);
        refetch();
      },
      removeOrganisationMember: async (memberId) => {
        await removeOrganisationMember(memberId);
        refetch();
      },
      linkMemberEcard: async (organisationId, memberId, ecardId) => {
        await linkMemberEcard(organisationId, memberId, ecardId);
        refetch();
      },
    }),
    [refetch],
  );
}
