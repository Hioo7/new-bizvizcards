import type { SmartCardProfile } from "@app-types/smartCard";

interface HeroSectionProps {
  profile: SmartCardProfile | null;
}

export function HeroSection({ profile }: HeroSectionProps) {
  return (
    <div className="relative bg-gradient-to-r from-sky-400 via-black to-red-600 p-8 text-white text-center rounded-lg">
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative z-10">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden border-2 border-white/30 shadow-lg">
            {profile?.logoUrl && (
              <img
                src={profile.logoUrl}
                alt={`${profile.companyName ?? ""} Logo`}
                className="absolute inset-0 h-full w-full object-cover rounded-full transform hover:scale-110 transition-transform duration-300"
              />
            )}
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2 font-sans">
          <span className="text-white">{profile?.companyName}</span>
        </h1>

        <div className="mb-1">
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm font-medium tracking-wider uppercase backdrop-blur-sm border border-white/20">
            {profile?.tagline}
          </span>
        </div>

        <p className="text-blue-100 text-xs font-medium mt-2 opacity-90">{profile?.subTagline}</p>
      </div>
    </div>
  );
}
