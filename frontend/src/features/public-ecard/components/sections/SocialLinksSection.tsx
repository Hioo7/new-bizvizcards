import type { ComponentType } from "react";
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

const FIELDS: { key: keyof EcardSocialLinksComponent; Icon: ComponentType<{ className?: string }> }[] = [
  { key: "website", Icon: Globe },
  { key: "instagram", Icon: InstagramIcon },
  { key: "facebook", Icon: FacebookIcon },
  { key: "twitter", Icon: TwitterIcon },
  { key: "linkedIn", Icon: LinkedInIcon },
];

export function SocialLinksSection({ component }: SocialLinksSectionProps) {
  const visibleLinks = FIELDS.filter(({ key }) => {
    const value = component[key];
    return typeof value === "string" && value.trim() !== "";
  });

  if (visibleLinks.length === 0) return null;

  return (
    <div className="flex h-26 w-full items-center justify-center gap-5 rounded-2xl border border-base-300 bg-base-200 shadow-xl">
      {visibleLinks.map(({ key, Icon }) => (
        <a
          key={key}
          href={component[key] as string}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon className="h-6 w-6" />
        </a>
      ))}
    </div>
  );
}
