/** Values the card scanner can pre-fill into the New Lead form. Keys match
 *  the modal's form fields; every one is optional. */
export interface LeadFormPrefill {
  name?: string;
  email?: string;
  countryDialCode?: string;
  phoneNumber?: string;
  company?: string;
  profession?: string;
  note?: string;
}

export interface ExchangeContactSubmission {
  name: string;
  countryDialCode: string;
  phoneNumber: string;
  email?: string;
  note?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  // Attribution carried over from the landing URL's `?src=&sref=` params.
  trafficSource?: string;
  trafficSourceRefId?: string;
}
