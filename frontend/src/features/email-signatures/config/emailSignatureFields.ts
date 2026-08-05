// Mirrors backend/src/modules/email-signatures/email-signatures.constants.ts
// exactly — these are the multipart field names the backend's
// AnyFilesInterceptor expects each uploaded image under.
export const EMAIL_SIGNATURE_MULTIPART_DATA_FIELD = "data";
export const EMAIL_SIGNATURE_PROFILE_IMAGE_FIELD = "profileImage";
export const EMAIL_SIGNATURE_COMPANY_LOGO_FIELD = "companyLogo";
export const EMAIL_SIGNATURE_BANNER_IMAGE_FIELD = "bannerImage";
