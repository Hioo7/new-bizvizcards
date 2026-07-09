import { SmartCardTemplateKey } from '../../../generated/prisma/client';
import { createSmartCardSchema } from '../dto/create-smart-card.dto';
import { updateSmartCardSchema } from '../dto/update-smart-card.dto';

// All 3 current templates share an identical content shape, so they all point
// at the same schema instance today. A future template with a genuinely
// different shape gets its own schema and its own registry entry — nothing
// else in the controller/service changes.
export const smartCardCreateSchemaRegistry: Record<
  SmartCardTemplateKey,
  typeof createSmartCardSchema
> = {
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE]: createSmartCardSchema,
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2]: createSmartCardSchema,
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_3]: createSmartCardSchema,
};

export const smartCardUpdateSchemaRegistry: Record<
  SmartCardTemplateKey,
  typeof updateSmartCardSchema
> = {
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE]: updateSmartCardSchema,
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2]: updateSmartCardSchema,
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_3]: updateSmartCardSchema,
};
