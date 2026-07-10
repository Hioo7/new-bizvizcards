export interface ExchangeContactSubmission {
  name: string;
  countryDialCode: string;
  phoneNumber: string;
  email?: string;
  note?: string;
  locationLatitude?: number;
  locationLongitude?: number;
}
