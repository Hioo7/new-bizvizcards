import { z } from 'zod';
import {
  ECARD_LOCATION_LATITUDE_MAX,
  ECARD_LOCATION_LATITUDE_MIN,
  ECARD_LOCATION_LONGITUDE_MAX,
  ECARD_LOCATION_LONGITUDE_MIN,
  ECARD_LOCATION_TILE_LABEL_MAX_LENGTH,
} from '../../ecards.constants';

// All three fields are required — the coordinates are captured only via the
// browser's Geolocation API in the builder (never typed manually), so there's
// no meaningful partial state, same "empty = meaningless" convention as
// ecardWhatsAppComponentSchema.
export const ecardLocationTileComponentSchema = z
  .object({
    type: z.literal('LOCATION_TILE'),
    label: z.string().trim().min(1).max(ECARD_LOCATION_TILE_LABEL_MAX_LENGTH),
    latitude: z
      .number()
      .min(ECARD_LOCATION_LATITUDE_MIN)
      .max(ECARD_LOCATION_LATITUDE_MAX),
    longitude: z
      .number()
      .min(ECARD_LOCATION_LONGITUDE_MIN)
      .max(ECARD_LOCATION_LONGITUDE_MAX),
  })
  .strict();

export type EcardLocationTileComponentDto = z.infer<
  typeof ecardLocationTileComponentSchema
>;
