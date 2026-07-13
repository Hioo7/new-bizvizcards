import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
} from "@components/icons/BrandIcons";
import type { EcardSocialLinksComponent } from "@app-types/ecard";

interface SocialLinksSectionProps {
  component: EcardSocialLinksComponent;
}

const FIELDS: { key: keyof EcardSocialLinksComponent; icon: ReactNode }[] = [
  { key: "instagram", icon: <InstagramIcon className="w-4 h-4 text-pink-500" /> },
  { key: "facebook", icon: <FacebookIcon className="w-4 h-4 text-blue-600" /> },
  { key: "linkedIn", icon: <LinkedInIcon className="w-4 h-4 text-blue-700" /> },
  { key: "twitter", icon: <TwitterIcon className="w-4 h-4 text-sky-500" /> },
  { key: "website", icon: <Globe className="w-4 h-4 text-gray-800" /> },
];

export function SocialLinksSection({ component }: SocialLinksSectionProps) {
  const visibleLinks = FIELDS.filter(({ key }) => {
    const value = component[key];
    return typeof value === "string" && value.trim() !== "";
  });

  if (visibleLinks.length === 0) return null;

  return (
    <div className="px-6 py-4 bg-white border-b">
      <div className="flex flex-wrap justify-center gap-3">
        {visibleLinks.map(({ key, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => window.open(component[key] as string, "_blank")}
            className="p-3 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 flex items-center justify-center"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
