import { Phone, Mail, MapPin, Globe, Download } from "lucide-react";
import { smartCardVCardUrl } from "@services/publicSmartCardService";
import type { SmartCardContact, SmartCardSocialMedia } from "@app-types/smartCard";

interface ContactFooterSectionProps {
  companyName: string | null;
  endpoint: string;
  contact: SmartCardContact | null;
  socialMedia: SmartCardSocialMedia | null;
  showActionSection?: boolean;
  showDetailsSection?: boolean;
}

export function ContactFooterSection({
  companyName,
  endpoint,
  contact,
  socialMedia,
  showActionSection = true,
  showDetailsSection = true,
}: ContactFooterSectionProps) {
  const contactNumber = contact?.contactNumber;
  const website = socialMedia?.website;

  const hasContactInfo = Boolean(
    contactNumber || contact?.email || contact?.address || website,
  );

  return (
    <>
      {showActionSection && (contactNumber || companyName) && (
        <div className="px-6 py-4 bg-white border-b">
          <div className="grid grid-cols-2 gap-3">
            {contactNumber && (
              <a
                href={`tel:${contactNumber}`}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 px-4 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Office
              </a>
            )}
            <a
              href={smartCardVCardUrl(endpoint)}
              className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50 rounded-xl py-3 px-4 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Contact
            </a>
          </div>
        </div>
      )}

      {showDetailsSection && hasContactInfo && (
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="space-y-2 text-sm text-gray-600">
            {contactNumber && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{contactNumber}</span>
              </div>
            )}
            {contact?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${contact.email}`} className="hover:underline text-blue-600">
                  {contact.email}
                </a>
              </div>
            )}
            {contact?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{contact.address}</span>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <a href={website} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                  {website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
