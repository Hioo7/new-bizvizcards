import { useCallback, useEffect, useState } from "react";
import type { EcardComponent } from "@app-types/ecard";
import type { OrgEcard, UpdateOrgEcardPayload } from "@features/user-dashboard/types";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import { ecardToBuilderState } from "@features/ecards/utils/ecardFormMapping";
import { emptyHeroDraft } from "@features/ecards/types/ecardBuilder.types";
import type { ComponentDraft, EcardBuilderState } from "@features/ecards/types/ecardBuilder.types";

function orgEcardToBuilderState(orgEcard: OrgEcard): EcardBuilderState {
  return ecardToBuilderState({
    id: orgEcard.id,
    endpoint: orgEcard.endpoint,
    customerId: orgEcard.customerId,
    organisationId: orgEcard.organisationId,
    createdByEmployeeId: null,
    createdAt: "",
    updatedAt: "",
    hero: {
      name: orgEcard.hero.name,
      email: orgEcard.hero.email,
      companyName: orgEcard.hero.companyName,
      profilePhotoMediaId: null,
      profilePhotoUrl: orgEcard.hero.profilePhotoUrl,
      phoneCountryDialCode: orgEcard.hero.phoneCountryDialCode,
      phoneNumber: orgEcard.hero.phoneNumber,
      isExchangeContactEnabled: orgEcard.hero.isExchangeContactEnabled,
      autoDownloadContact: orgEcard.hero.autoDownloadContact,
      // This SPOC-facing member-ecard editor doesn't expose layout editing —
      // it only edits identity/component fields (see draftToOrgComponent
      // below); layout is left at its always-free default here.
      layout: "DEFAULT",
      bannerMediaId: null,
      bannerUrl: null,
      bannerFallbackColor: null,
      badgeFallbackColor: null,
      // This SPOC-facing member-ecard editor doesn't expose style editing
      // either — same reasoning as layout above, left at their always-free
      // defaults.
      theme: "DEFAULT_DARK",
      primaryAccentColor: null,
      secondaryAccentColor: null,
      iconShape: "CIRCLE",
      organisationLogoUrl: null,
    },
    components: orgEcard.components as EcardComponent[],
  });
}

function draftToOrgComponent(
  draft: ComponentDraft,
): UpdateOrgEcardPayload["components"][number] {
  switch (draft.type) {
    case "ABOUT":
      return {
        type: "ABOUT",
        ...(draft.profession.trim() && { profession: draft.profession.trim() }),
        ...(draft.shortNote.trim() && { shortNote: draft.shortNote.trim() }),
        ...(draft.description.trim() && { description: draft.description.trim() }),
        ...(draft.aboutMe.trim() && { aboutMe: draft.aboutMe.trim() }),
      };
    case "WHATSAPP":
      return {
        type: "WHATSAPP",
        phoneCountryDialCode: draft.phoneCountryDialCode.trim(),
        phoneNumber: draft.phoneNumber.trim(),
      };
    case "SOCIAL_LINKS":
      return {
        type: "SOCIAL_LINKS",
        website: draft.website.trim() || undefined,
        instagram: draft.instagram.trim() || undefined,
        facebook: draft.facebook.trim() || undefined,
        twitter: draft.twitter.trim() || undefined,
        linkedIn: draft.linkedIn.trim() || undefined,
      };
    case "VIDEO":
      return {
        type: "VIDEO",
        title: draft.title.trim() || undefined,
        videoUrl: draft.videoUrl.trim(),
      };
    case "TEAM":
      return {
        type: "TEAM",
        title: draft.title.trim() || undefined,
        members: draft.memberIds.map((organisationMemberId) => ({
          organisationMemberId,
        })),
      };
    case "GALLERY":
    case "BROCHURE":
    case "VIDEO_GALLERY":
      // Gallery/Brochure require file uploads not supported through this
      // flow; Video Gallery's multi-row editing isn't supported here either.
      return { type: draft.type };
    case "LOCATION_TILE":
      if (draft.latitude === null || draft.longitude === null) {
        return { type: draft.type };
      }
      return {
        type: "LOCATION_TILE",
        label: draft.label.trim(),
        latitude: draft.latitude,
        longitude: draft.longitude,
      };
    case "REVIEW_LINK":
      return { type: "REVIEW_LINK", url: draft.url.trim() };
    case "TESTIMONIALS":
      return {
        type: "TESTIMONIALS",
        entries: draft.entries
          .filter((entry) => entry.name.trim() && entry.text.trim())
          .map((entry) => ({
            name: entry.name.trim(),
            rating: entry.rating,
            text: entry.text.trim(),
          })),
      };
  }
}

export interface UseOrgEcardBuilderResult {
  state: EcardBuilderState;
  setState: (updater: (state: EcardBuilderState) => EcardBuilderState) => void;
  loading: boolean;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
  save: () => Promise<boolean>;
}

export function useOrgEcardBuilder(
  organisationId: string,
  ecardId: string,
  open: boolean,
): UseOrgEcardBuilderResult {
  const [state, setStateInternal] = useState<EcardBuilderState>({
    hero: emptyHeroDraft(),
    components: [],
  });
  const [orgEcard, setOrgEcard] = useState<OrgEcard | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadEcard() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await userDashboardService.getOrgEcard(organisationId, ecardId);
        if (cancelled) return;
        setOrgEcard(data);
        setStateInternal(orgEcardToBuilderState(data));
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load e-card");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEcard();
    return () => {
      cancelled = true;
    };
  }, [open, organisationId, ecardId]);

  const setState = useCallback(
    (updater: (state: EcardBuilderState) => EcardBuilderState) => {
      setStateInternal(updater);
    },
    [],
  );

  const save = useCallback(async (): Promise<boolean> => {
    if (!orgEcard) return false;
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload: UpdateOrgEcardPayload = {
        endpoint: orgEcard.endpoint,
        heroName: state.hero.name.trim() || orgEcard.hero.name,
        heroEmail: orgEcard.hero.email,
        ...(orgEcard.hero.companyName
          ? { heroCompanyName: orgEcard.hero.companyName }
          : {}),
        isExchangeContactEnabled: state.hero.isExchangeContactEnabled,
        autoDownloadContact: state.hero.autoDownloadContact,
        components: state.components.map((c) => draftToOrgComponent(c.draft)),
      };
      const updated = await userDashboardService.updateOrgEcard(
        organisationId,
        ecardId,
        payload,
      );
      setOrgEcard(updated);
      setStateInternal(orgEcardToBuilderState(updated));
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save e-card");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [orgEcard, organisationId, ecardId, state]);

  return { state, setState, loading, loadError, isSaving, saveError, save };
}
