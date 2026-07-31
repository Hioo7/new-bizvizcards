import { useState } from "react";
import type { SmartCardTestimonial } from "@app-types/smartCard";

function StarRating() {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

interface TestimonialsSectionProps {
  testimonials: SmartCardTestimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  if (testimonials.length === 0) return null;

  return (
    <div className="px-6 py-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-center text-gray-800 mb-8 relative pb-2">
          WHAT PEOPLE SAY
          <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" />
        </h2>
        <div className="space-y-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                  {testimonial.initials}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{testimonial.name}</h3>
                  <StarRating />
                </div>
              </div>
              <div className="relative">
                <p className={`text-gray-600 italic transition-all duration-300 ${!expanded[index] ? "line-clamp-3" : ""}`}>
                  &quot;{testimonial.text}&quot;
                </p>
                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))}
                  className="text-purple-600 font-medium text-sm mt-2 hover:text-purple-800 focus:outline-none"
                >
                  {expanded[index] ? "Read Less" : "Read More"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
