// Attribution query params a virtual background's QR code appends to the
// public e-card URL (`?src=<token>&sref=<id>`). Kept in sync with the
// backend's ecard-analytics constants.
export const ECARD_TRAFFIC_SOURCE_PARAM = "src";
export const ECARD_TRAFFIC_SOURCE_REF_PARAM = "sref";

export interface EcardTrafficAttribution {
  trafficSource?: string;
  trafficSourceRefId?: string;
}
