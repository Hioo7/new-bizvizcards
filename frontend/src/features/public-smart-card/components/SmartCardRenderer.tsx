import { InteriorDesignTemplate } from "@features/public-smart-card/components/templates/interior-design-template/InteriorDesignTemplate";
import { InteriorDesignTemplate2 } from "@features/public-smart-card/components/templates/interior-design-template-2/InteriorDesignTemplate2";
import { InteriorDesignTemplate3 } from "@features/public-smart-card/components/templates/interior-design-template-3/InteriorDesignTemplate3";
import type { PublicSmartCard } from "@app-types/smartCard";

interface SmartCardRendererProps {
  card: PublicSmartCard;
}

export function SmartCardRenderer({ card }: SmartCardRendererProps) {
  if (card.templateKey === "INTERIOR_DESIGN_TEMPLATE_2") {
    return <InteriorDesignTemplate2 card={card} />;
  }
  if (card.templateKey === "INTERIOR_DESIGN_TEMPLATE_3") {
    return <InteriorDesignTemplate3 card={card} />;
  }
  return <InteriorDesignTemplate card={card} />;
}
