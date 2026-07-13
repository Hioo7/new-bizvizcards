export const LEAD_NAME_MAX_LENGTH = 150;
export const LEAD_EMAIL_MAX_LENGTH = 254;
export const LEAD_NOTE_MAX_LENGTH = 2000;
export const LEAD_COMPANY_MAX_LENGTH = 150;
export const LEAD_PROFESSION_MAX_LENGTH = 150;
export const LEAD_LOCATION_MAX_LENGTH = 300;

export const LEAD_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LEAD_PHONE_DIAL_CODE_MAX_LENGTH = 5;
export const LEAD_PHONE_NUMBER_MIN_DIGITS = 7;
export const LEAD_PHONE_NUMBER_MAX_DIGITS = 15;
export const LEAD_PHONE_NUMBER_DIGITS_REGEX = /^\d+$/;

export const LEAD_LOCATION_LATITUDE_MIN = -90;
export const LEAD_LOCATION_LATITUDE_MAX = 90;
export const LEAD_LOCATION_LONGITUDE_MIN = -180;
export const LEAD_LOCATION_LONGITUDE_MAX = 180;

export const LEAD_FOLDER_NAME_MAX_LENGTH = 100;

export const LEAD_FOLDER_DELETE_MODES = ['soft', 'hard'] as const;
export type LeadFolderDeleteMode = (typeof LEAD_FOLDER_DELETE_MODES)[number];
export const LEAD_FOLDER_DEFAULT_DELETE_MODE: LeadFolderDeleteMode = 'soft';

export const LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH = 2000;

export const LEAD_REMINDER_TITLE_MAX_LENGTH = 150;
export const LEAD_REMINDER_TEXT_MAX_LENGTH = 2000;

export const REMINDER_DUE_WINDOW_DEFAULT_MINUTES = 0;
export const REMINDER_DUE_WINDOW_MAX_MINUTES = 10080;
