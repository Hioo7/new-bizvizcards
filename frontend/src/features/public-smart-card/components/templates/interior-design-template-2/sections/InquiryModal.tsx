import { useState } from "react";
import { MessageCircle } from "lucide-react";

function extractWAPhone(value: string): string {
  const waMe = value.match(/wa\.me\/(\d+)/);
  if (waMe) return waMe[1];
  const apiWA = value.match(/[?&]phone=(\d+)/);
  if (apiWA) return apiWA[1];
  return value.replace(/\D/g, "");
}

interface InquiryModalProps {
  whatsapp?: string | null;
}

export function InquiryModal({ whatsapp }: InquiryModalProps) {
  const [showInquiry, setShowInquiry] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (whatsapp) {
      const phone = extractWAPhone(whatsapp);
      const message = `Hello, I would like to make an inquiry:\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || "N/A"}\nMessage: ${formData.message}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      alert("Thank you for your inquiry! We'll get back to you soon.");
    }
    setFormData({ name: "", email: "", phone: "", message: "" });
    setShowInquiry(false);
  }

  return (
    <div className="px-6 py-4 bg-white border-b">
      <button
        onClick={() => setShowInquiry(true)}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Inquires
      </button>

      {showInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Send an Inquiry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 text-gray-800 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 text-gray-800 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="Enter Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 text-gray-800 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-md transition-colors"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => setShowInquiry(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
