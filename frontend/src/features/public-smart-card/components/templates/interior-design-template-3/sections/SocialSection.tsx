import type { ReactNode } from "react";
import { MapPinIcon, Globe, BookHeart } from "lucide-react";
import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from "@components/icons/BrandIcons";
import type { SmartCardSocialMedia } from "@app-types/smartCard";

interface SocialSectionProps {
  socialMedia: SmartCardSocialMedia | null;
}

const socialFields: {
  key: keyof SmartCardSocialMedia;
  icon: ReactNode;
}[] = [
  { key: "whatsapp", icon: <WhatsAppIcon className="w-4 h-4 text-green-600" /> },
  { key: "instagram", icon: <InstagramIcon className="w-4 h-4 text-pink-500" /> },
  { key: "facebook", icon: <FacebookIcon className="w-4 h-4 text-blue-600" /> },
  { key: "linkedIn", icon: <LinkedInIcon className="w-4 h-4 text-blue-700" /> },
  { key: "twitter", icon: <TwitterIcon className="w-4 h-4 text-sky-500" /> },
  { key: "youtube", icon: <YouTubeIcon className="w-4 h-4 text-red-600" /> },
  { key: "googleMap", icon: <MapPinIcon className="w-4 h-4 text-rose-600" /> },
  { key: "website", icon: <Globe className="w-4 h-4 text-gray-800" /> },
  { key: "other", icon: <BookHeart className="w-4 h-4 text-purple-600" /> },
];

export function SocialSection({ socialMedia }: SocialSectionProps) {
  if (!socialMedia) return null;

  const visibleLinks = socialFields.filter(({ key }) => {
    const value = socialMedia[key];
    return value && value.trim() !== "";
  });

  if (visibleLinks.length === 0) return null;

  return (
    <div className="px-6 py-4 bg-white border-b">
      <div className="flex flex-wrap justify-center gap-3">
        {visibleLinks.map(({ key, icon }) => (
          <button
            key={key}
            className="p-3 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 flex items-center justify-center"
            onClick={() => window.open(socialMedia[key] ?? undefined, "_blank")}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
