import type { SmartCardServiceItem } from "@app-types/smartCard";

interface ServicesSectionProps {
  services: SmartCardServiceItem[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  if (services.length === 0) return null;

  return (
    <div className="px-6 py-4 bg-white border-b">
      <h3 className="font-semibold text-gray-700 mb-4 text-lg">In Our Services</h3>
      <div className="grid grid-cols-1 gap-3">
        {services.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="flex">
              <div className="relative w-20 flex-shrink-0 self-stretch overflow-hidden">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title ?? ""} className="absolute inset-0 h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3 flex-1">
                <h4 className="font-medium text-sm text-gray-800">{item.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
