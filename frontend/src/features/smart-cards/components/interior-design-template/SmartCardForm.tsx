import { useRef, useState } from "react";
import { IdCard } from "lucide-react";
import FormStepShell from "@components/forms/FormStepShell";
import ProfileStep from "@features/smart-cards/components/steps/ProfileStep";
import ContactStep from "@features/smart-cards/components/steps/ContactStep";
import SocialStep from "@features/smart-cards/components/steps/SocialStep";
import FounderStep from "@features/smart-cards/components/steps/FounderStep";
import ServicesStep from "@features/smart-cards/components/steps/ServicesStep";
import TestimonialsStep from "@features/smart-cards/components/steps/TestimonialsStep";
import GalleryStep from "@features/smart-cards/components/steps/GalleryStep";
import type {
  ContactStepValues,
  FounderStepValues,
  GalleryStepValues,
  ProfileStepValues,
  ServicesStepValues,
  SmartCardFormValues,
  SmartCardStepHandle,
  SocialStepValues,
  TestimonialsStepValues,
} from "@features/smart-cards/types/smartCardForm.types";

const STEPS = [
  { id: "profile", label: "Profile" },
  { id: "contact", label: "Contact" },
  { id: "social", label: "Social" },
  { id: "founder", label: "Founder" },
  { id: "services", label: "Services" },
  { id: "testimonials", label: "Testimonials" },
  { id: "gallery", label: "Gallery" },
];

interface SmartCardFormProps {
  initialValues: SmartCardFormValues;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: SmartCardFormValues) => void;
  onCancel: () => void;
}

export default function SmartCardForm({
  initialValues,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: SmartCardFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const profileRef = useRef<SmartCardStepHandle<ProfileStepValues>>(null);
  const contactRef = useRef<SmartCardStepHandle<ContactStepValues>>(null);
  const socialRef = useRef<SmartCardStepHandle<SocialStepValues>>(null);
  const founderRef = useRef<SmartCardStepHandle<FounderStepValues>>(null);
  const servicesRef = useRef<SmartCardStepHandle<ServicesStepValues>>(null);
  const testimonialsRef =
    useRef<SmartCardStepHandle<TestimonialsStepValues>>(null);
  const galleryRef = useRef<SmartCardStepHandle<GalleryStepValues>>(null);

  const stepRefs = [
    profileRef,
    contactRef,
    socialRef,
    founderRef,
    servicesRef,
    testimonialsRef,
    galleryRef,
  ];

  async function handleNext() {
    const currentRef = stepRefs[currentIndex];
    const result = await currentRef.current?.validate();
    if (!result) return;

    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    onSubmit({
      customer: { customerId: "" },
      profile: profileRef.current!.getDraft(),
      contact: contactRef.current!.getDraft(),
      social: socialRef.current!.getDraft(),
      founder: founderRef.current!.getDraft(),
      services: servicesRef.current!.getDraft(),
      testimonials: testimonialsRef.current!.getDraft(),
      gallery: galleryRef.current!.getDraft(),
    });
  }

  return (
    <FormStepShell
      icon={IdCard}
      title="Interior Design Smart Card"
      accentColor="primary"
      steps={STEPS}
      currentIndex={currentIndex}
      isSubmitting={isSubmitting}
      error={error}
      onBack={() => setCurrentIndex((index) => Math.max(0, index - 1))}
      onNext={() => void handleNext()}
      onCancel={onCancel}
    >
      <div className={currentIndex === 0 ? "" : "hidden"}>
        <ProfileStep ref={profileRef} defaultValues={initialValues.profile} />
      </div>
      <div className={currentIndex === 1 ? "" : "hidden"}>
        <ContactStep ref={contactRef} defaultValues={initialValues.contact} />
      </div>
      <div className={currentIndex === 2 ? "" : "hidden"}>
        <SocialStep ref={socialRef} defaultValues={initialValues.social} />
      </div>
      <div className={currentIndex === 3 ? "" : "hidden"}>
        <FounderStep ref={founderRef} defaultValues={initialValues.founder} />
      </div>
      <div className={currentIndex === 4 ? "" : "hidden"}>
        <ServicesStep ref={servicesRef} defaultValues={initialValues.services} />
      </div>
      <div className={currentIndex === 5 ? "" : "hidden"}>
        <TestimonialsStep
          ref={testimonialsRef}
          defaultValues={initialValues.testimonials}
        />
      </div>
      <div className={currentIndex === 6 ? "" : "hidden"}>
        <GalleryStep ref={galleryRef} defaultValues={initialValues.gallery} />
      </div>
    </FormStepShell>
  );
}
