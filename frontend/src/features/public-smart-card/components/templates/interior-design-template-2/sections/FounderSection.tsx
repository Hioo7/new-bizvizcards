import type { SmartCardFounder } from "@app-types/smartCard";

interface FounderSectionProps {
  founder: SmartCardFounder | null;
}

export function FounderSection({ founder }: FounderSectionProps) {
  if (!founder?.name) return null;

  return (
    <div className="px-6 py-8 bg-white border-b">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-serif font-bold text-gray-800 relative inline-block">
          About Me
          <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-amber-600 rounded-full" />
        </h3>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
        {founder.imageUrl && (
          <div className="relative w-32 h-32 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full transform rotate-6" />
            <div className="relative w-full h-full overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img src={founder.imageUrl} alt="Founder" className="h-full w-full object-cover" />
            </div>
          </div>
        )}
        <div className="text-center md:text-left">
          <h4 className="text-2xl font-bold text-gray-800 mb-1">{founder.name}</h4>
          {founder.title && <p className="text-amber-600 font-medium mb-3">{founder.title}</p>}
          <div className="flex justify-center md:justify-start space-x-2 mb-4">
            <div className="w-8 h-1 bg-amber-400 rounded-full" />
            <div className="w-4 h-1 bg-amber-400 rounded-full" />
            <div className="w-1 h-1 bg-amber-400 rounded-full" />
          </div>
        </div>
      </div>

      <div className="space-y-4 text-gray-600">
        {founder.introText && <p className="leading-relaxed text-justify">{founder.introText}</p>}
        {founder.philosophyText && <p className="leading-relaxed text-justify">{founder.philosophyText}</p>}
        {founder.quote && (
          <div className="relative bg-amber-50 rounded-lg p-4 border-l-4 border-amber-400 my-4">
            <div className="absolute top-0 left-0 transform -translate-y-2 text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <p className="italic text-gray-700 pl-6">{founder.quote}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        {founder.experience !== null && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200 text-center">
            <div className="text-2xl font-bold text-amber-600">{founder.experience}+</div>
            <div className="text-xs font-medium text-amber-800">Years Experience</div>
          </div>
        )}
        {founder.projects !== null && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200 text-center">
            <div className="text-2xl font-bold text-amber-600">{founder.projects}+</div>
            <div className="text-xs font-medium text-amber-800">Projects Completed</div>
          </div>
        )}
        {founder.satisfaction !== null && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200 text-center">
            <div className="text-2xl font-bold text-amber-600">{founder.satisfaction}%</div>
            <div className="text-xs font-medium text-amber-800">Client Satisfaction</div>
          </div>
        )}
      </div>
    </div>
  );
}
