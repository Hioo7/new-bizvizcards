import type { ZodType } from "zod";
import AboutEditSheet from "@features/ecards/components/AboutEditSheet";
import SocialLinksEditSheet from "@features/ecards/components/SocialLinksEditSheet";
import VideoEditSheet from "@features/ecards/components/VideoEditSheet";
import GalleryEditSheet from "@features/ecards/components/GalleryEditSheet";
import VideoGalleryEditSheet from "@features/ecards/components/VideoGalleryEditSheet";
import TeamEditSheet from "@features/ecards/components/TeamEditSheet";
import WhatsAppEditSheet from "@features/ecards/components/WhatsAppEditSheet";
import BrochureEditSheet from "@features/ecards/components/BrochureEditSheet";
import LocationTileEditSheet from "@features/ecards/components/LocationTileEditSheet";
import ReviewLinkEditSheet from "@features/ecards/components/ReviewLinkEditSheet";
import TestimonialsEditSheet from "@features/ecards/components/TestimonialsEditSheet";
import type { OrganisationMembersScope } from "@features/ecards/hooks/useOrganisationMembers";
import type {
  BuilderComponent,
  ComponentDraft,
  EcardHeroDraft,
} from "@features/ecards/types/ecardBuilder.types";
import type {
  WhatsAppSheetValues,
  VideoSheetValues,
  ReviewLinkSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";

/**
 * Single shared "which edit sheet is open" switch, consumed by every ecard
 * builder container (admin, customer self-serve, org member, org template)
 * — previously copy-pasted once per container, one block per component type.
 */
interface ComponentEditSheetRouterProps {
  editingComponent: BuilderComponent | undefined;
  organisationId: string | null;
  teamScope: OrganisationMembersScope;
  heroPhone: Pick<EcardHeroDraft, "phoneCountryDialCode" | "phoneNumber">;
  onClose: () => void;
  onSave: (draft: ComponentDraft) => void;
  /** Relaxed schema overrides — only the organisation template builder passes these. */
  videoSchema?: ZodType<VideoSheetValues, VideoSheetValues>;
  whatsappSchema?: ZodType<WhatsAppSheetValues, WhatsAppSheetValues>;
  reviewLinkSchema?: ZodType<ReviewLinkSheetValues, ReviewLinkSheetValues>;
  /** Only the organisation template builder passes false — a template
   * location tile may defer coordinates to the member's own card. */
  requireCapturedLocation?: boolean;
}

export default function ComponentEditSheetRouter({
  editingComponent,
  organisationId,
  teamScope,
  heroPhone,
  onClose,
  onSave,
  videoSchema,
  whatsappSchema,
  reviewLinkSchema,
  requireCapturedLocation,
}: ComponentEditSheetRouterProps) {
  const draft = editingComponent?.draft;
  if (!draft) return null;

  switch (draft.type) {
    case "ABOUT":
      return (
        <AboutEditSheet
          open
          draft={draft}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "SOCIAL_LINKS":
      return (
        <SocialLinksEditSheet
          open
          draft={draft}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "VIDEO":
      return (
        <VideoEditSheet
          open
          draft={draft}
          schema={videoSchema}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "GALLERY":
      return (
        <GalleryEditSheet
          open
          draft={draft}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "VIDEO_GALLERY":
      return (
        <VideoGalleryEditSheet
          open
          draft={draft}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "TEAM":
      return (
        <TeamEditSheet
          open
          organisationId={organisationId}
          scope={teamScope}
          draft={draft}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "WHATSAPP":
      return (
        <WhatsAppEditSheet
          open
          draft={draft}
          heroPhone={heroPhone}
          schema={whatsappSchema}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "BROCHURE":
      return (
        <BrochureEditSheet
          open
          draft={draft}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "LOCATION_TILE":
      return (
        <LocationTileEditSheet
          open
          draft={draft}
          requireCapturedLocation={requireCapturedLocation}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "REVIEW_LINK":
      return (
        <ReviewLinkEditSheet
          open
          draft={draft}
          schema={reviewLinkSchema}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
    case "TESTIMONIALS":
      return (
        <TestimonialsEditSheet
          open
          draft={draft}
          isSubmitting={false}
          error={null}
          onClose={onClose}
          onSave={onSave}
        />
      );
  }
}
