import InteriorDesignListItem from "@features/smart-cards/components/interior-design-template/SmartCardListItem";
import InteriorDesignTemplate2ListItem from "@features/smart-cards/components/interior-design-template-2/SmartCardListItem";
import type { SmartCardTemplateKey } from "@app-types/smartCard";

// Each template owns its own list-item component (differing content per
// template) — this registry is the Strategy seam, mirroring the backend's
// per-template schema registry. Form components are NOT registered here:
// their prop shapes genuinely diverge (template 2 needs a linked-customer
// concept template 1 doesn't), so SmartCardFormView renders them directly.
export const SMART_CARD_LIST_ITEM_REGISTRY: Record<
  SmartCardTemplateKey,
  typeof InteriorDesignListItem
> = {
  INTERIOR_DESIGN_TEMPLATE: InteriorDesignListItem,
  INTERIOR_DESIGN_TEMPLATE_2: InteriorDesignTemplate2ListItem,
};
