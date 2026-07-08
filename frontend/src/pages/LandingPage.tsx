import {
  Navbar,
  HeroSection,
  HowItWorksSection,
  WhoItsForSection,
  WhyUsSection,
  WhyPeopleLoveItSection,
  CtaBanner,
  TestimonialsSection,
  ContactSection,
  Footer,
} from "@features/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-base-100 font-sans text-base-content">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <WhoItsForSection />
      <WhyUsSection />
      <WhyPeopleLoveItSection />
      <CtaBanner />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
