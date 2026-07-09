import type { SmartCardProfile } from "@app-types/smartCard";

interface AboutSectionProps {
  profile: SmartCardProfile | null;
}

export function AboutSection({ profile }: AboutSectionProps) {
  if (!profile?.aboutText) return null;

  return (
    <div className="px-6 py-6 bg-white border-b">
      <h3 className="font-semibold text-gray-800 mb-4 text-xl">About Us</h3>
      <p className="text-sm text-gray-600 leading-relaxed mb-4 italic whitespace-pre-wrap break-words">
        {profile.aboutText}
      </p>

      <div className="relative bg-gradient-to-r from-sky-400 via-black to-red-600 p-8 text-white text-center rounded-lg">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden border-2 border-white/30 shadow-lg">
            {profile.logoUrl && (
              <img
                src={profile.logoUrl}
                alt={`${profile.companyName ?? ""} Logo`}
                className="absolute inset-0 h-full w-full object-cover rounded-full transform hover:scale-110 transition-transform duration-300"
              />
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2 font-sans">
            <span className="text-white">{profile.companyName}</span>
          </h1>
          <p className="text-blue-100 text-sm font-light tracking-wider mb-1">{profile.tagline}</p>
          <p className="text-blue-100 text-xs font-medium opacity-90">{profile.subTagline}</p>
        </div>
      </div>
    </div>
  );
}
