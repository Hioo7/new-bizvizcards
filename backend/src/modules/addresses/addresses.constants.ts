export const ADDRESS_LABEL_MAX_LENGTH = 50;
export const ADDRESS_CONTACT_NAME_MAX_LENGTH = 150;
export const ADDRESS_LINE_MAX_LENGTH = 200;
export const ADDRESS_CITY_MAX_LENGTH = 100;
export const ADDRESS_STATE_MAX_LENGTH = 100;
export const ADDRESS_COUNTRY_MAX_LENGTH = 100;
export const ADDRESS_PINCODE_MAX_LENGTH = 20;

export const ADDRESS_PHONE_DIAL_CODE_MAX_LENGTH = 5;
export const ADDRESS_PHONE_NUMBER_MIN_DIGITS = 7;
export const ADDRESS_PHONE_NUMBER_MAX_DIGITS = 15;
export const ADDRESS_PHONE_NUMBER_DIGITS_REGEX = /^\d+$/;

export const ADDRESS_LATITUDE_MIN = -90;
export const ADDRESS_LATITUDE_MAX = 90;
export const ADDRESS_LONGITUDE_MIN = -180;
export const ADDRESS_LONGITUDE_MAX = 180;

// A sanity guardrail against unbounded creation, not a product-mandated
// limit — comfortably covers a customer's real set of shipping addresses.
export const ADDRESS_MAX_PER_CUSTOMER = 20;
