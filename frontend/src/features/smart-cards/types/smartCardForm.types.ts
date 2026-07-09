export interface ImageFieldValue {
  file: File | null;
  existingMediaId?: string;
  existingUrl?: string;
}

export function emptyImageField(): ImageFieldValue {
  return { file: null };
}

export interface CustomerStepValues {
  customerId: string;
}

export interface ProfileStepValues {
  endpoint: string;
  companyName: string;
  tagline: string;
  subTagline: string;
  aboutText: string;
  logo: ImageFieldValue;
}

export interface ContactStepValues {
  contactNumber: string;
  email: string;
  address: string;
}

export interface SocialStepValues {
  whatsapp: string;
  instagram: string;
  facebook: string;
  linkedIn: string;
  twitter: string;
  youtube: string;
  googleMap: string;
  website: string;
  other: string;
}

export interface FounderStepValues {
  name: string;
  title: string;
  experience: string;
  projects: string;
  satisfaction: string;
  introText: string;
  philosophyText: string;
  quote: string;
  image: ImageFieldValue;
}

export interface ServiceItemValues {
  title: string;
  description: string;
  image: ImageFieldValue;
}

export interface ServicesStepValues {
  services: ServiceItemValues[];
}

export interface TestimonialItemValues {
  name: string;
  initials: string;
  text: string;
}

export interface TestimonialsStepValues {
  testimonials: TestimonialItemValues[];
}

export interface GalleryItemValues {
  title: string;
  images: ImageFieldValue[];
}

export interface GalleryStepValues {
  galleries: GalleryItemValues[];
}

export interface SmartCardFormValues {
  customer: CustomerStepValues;
  profile: ProfileStepValues;
  contact: ContactStepValues;
  social: SocialStepValues;
  founder: FounderStepValues;
  services: ServicesStepValues;
  testimonials: TestimonialsStepValues;
  gallery: GalleryStepValues;
}

export function emptySmartCardFormValues(): SmartCardFormValues {
  return {
    customer: { customerId: "" },
    profile: {
      endpoint: "",
      companyName: "",
      tagline: "",
      subTagline: "",
      aboutText: "",
      logo: emptyImageField(),
    },
    contact: { contactNumber: "", email: "", address: "" },
    social: {
      whatsapp: "",
      instagram: "",
      facebook: "",
      linkedIn: "",
      twitter: "",
      youtube: "",
      googleMap: "",
      website: "",
      other: "",
    },
    founder: {
      name: "",
      title: "",
      experience: "",
      projects: "",
      satisfaction: "",
      introText: "",
      philosophyText: "",
      quote: "",
      image: emptyImageField(),
    },
    services: { services: [] },
    testimonials: { testimonials: [] },
    gallery: { galleries: [] },
  };
}

export interface SmartCardStepHandle<TValues> {
  validate: () => Promise<TValues | null>;
  getDraft: () => TValues;
}
