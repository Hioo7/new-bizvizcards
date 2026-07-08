import {
  RefreshCw,
  Wifi,
  Smartphone,
  Users,
  Download,
  Map,
  Palette,
  QrCode,
  BarChart3,
  Building2,
} from "lucide-react";
import stepTap from "@assets/landing/step-tap.png";
import stepExchange from "@assets/landing/step-exchange.png";
import stepSync from "@assets/landing/step-sync.png";
import personaFounders from "@assets/landing/persona-founders.png";
import personaExecutives from "@assets/landing/persona-executives.png";
import personaConsultants from "@assets/landing/persona-consultants.png";
import personaSales from "@assets/landing/persona-sales.png";
import featureDashboard from "@assets/landing/feature-dashboard.png";
import featureQr from "@assets/landing/feature-qr.png";
import featureLiveProfiles from "@assets/landing/feature-live-profiles.png";
import featureAutoUpdates from "@assets/landing/feature-auto-updates.png";

export const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Services", href: "#why-us" },
  { label: "Contact Us", href: "#contact" },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    number: "1",
    title: "Tap",
    description: "Hold the card to any smartphone. No app. No friction.",
    icon: Smartphone,
    image: stepTap,
  },
  {
    number: "2",
    title: "Exchange",
    description:
      "Your profile appears instantly. One tap back, and the connection is saved.",
    icon: RefreshCw,
    image: stepExchange,
  },
  {
    number: "3",
    title: "Sync",
    description:
      "Every contact flows into your dashboard tagged, mapped, ready for follow-up.",
    icon: Wifi,
    image: stepSync,
  },
];

export const WHO_ITS_FOR = [
  {
    title: "Founders",
    description:
      "Walk into every room already looking like the company you're building toward.",
    image: personaFounders,
  },
  {
    title: "Executives",
    description:
      "Hand over something people actually keep. Something that says serious before you do.",
    image: personaExecutives,
  },
  {
    title: "Consultants & Freelancers",
    description: "Your network is your livelihood. Treat it like it.",
    image: personaConsultants,
  },
  {
    title: "Sales Teams",
    description: "Stop wondering what happened at the event. Start seeing it.",
    image: personaSales,
  },
];

export const WHY_US_FEATURES = [
  {
    title: "Advanced Dashboard",
    description:
      "A central command center for all your networking activities and analytics.",
    image: featureDashboard,
  },
  {
    title: "Universal QR",
    description:
      "For devices without NFC, a sleek QR code ensures no one is left out.",
    image: featureQr,
  },
  {
    title: "Live Profiles",
    description: "Update your info anytime without reprinting cards.",
    image: featureLiveProfiles,
  },
  {
    title: "Auto-Updates",
    description:
      "Changed your number? Your contacts' address books update automatically.",
    image: featureAutoUpdates,
  },
];

export const LOVE_IT_FEATURES = [
  {
    icon: RefreshCw,
    title: "Two-way exchange",
    description:
      "Get their contact directly back to your dashboard with one click.",
  },
  {
    icon: Users,
    title: "Organized contacts",
    description:
      "Auto-tag and categorize new contacts based on the event or job role.",
  },
  {
    icon: Download,
    title: "Export capability",
    description: "One-click export to Salesforce, HubSpot, and 1500+ platforms.",
  },
  {
    icon: Map,
    title: "Network map",
    description:
      "Visualize where your network is growing globally with our heat map platform.",
  },
  {
    icon: Palette,
    title: "Logo customization",
    description:
      "Give cards a premium look with high definition company logo definition.",
  },
  {
    icon: QrCode,
    title: "Universal QR",
    description: "Fully responsive and clear, works on every smartphone ever made.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track views, taps, and conversion rates for every team member in real time.",
  },
  {
    icon: Building2,
    title: "Team dashboard",
    description:
      "Admin controls to manage branding and permissions for the entire company.",
  },
];

export const TESTIMONIALS = [
  {
    text: '"This is the first time networking actually felt modern. I\'ve closed more deals because clients are genuinely impressed the moment I tap their phone. It\'s an instant conversation starter."',
    name: "Dorthy Sharma",
    role: "Senior Design Director",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    text: '"Our sales team\'s close rate improved by 40% after switching to digital cards. The analytics alone are worth it — we finally know which events actually convert."',
    name: "Marcus Chen",
    role: "VP of Sales, TechFlow",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    text: '"I used to hand out 200 cards at every conference and follow up with maybe 10 people. Now every tap is tracked and I never lose a lead again."',
    name: "Priya Kapoor",
    role: "Founder, Elevate Studio",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    rating: 5,
  },
];

export const FOOTER_LINK_COLUMNS = [
  { heading: "Why Us", items: ["Features", "Dashboard", "Analytics", "Security"] },
  {
    heading: "Services",
    items: ["NFC Cards", "QR Cards", "Team Plans", "Enterprise"],
  },
  {
    heading: "Resources",
    items: ["Blog", "Privacy Policy", "Terms of Service", "FAQs"],
  },
] as const;

export const CONTACT_EMAIL = "business@blueticksinnovations.com";
export const CONTACT_PHONE_DISPLAY = "+91 63637 97685";
export const CONTACT_PHONE_HREF = "+916363797685";

export const TESTIMONIAL_ROTATE_INTERVAL_MS = 5000;
export const HERO_HEADLINE = "Still using paper cards? Most of them end up in the bin.";
