import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import {
  contactSchema,
  type ContactFormValues,
} from "@features/landing/schemas/contactSchema";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
  });

  const onSubmit = () => {
    // No backend endpoint exists for contact submissions yet — this is a
    // UI-only stub that just shows a local success state.
    setSubmitted(true);
    reset();
  };

  return (
    <section id="contact" className="bg-base-200 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold text-base-content">
            Contact Us
          </h2>
          <p className="text-base-content/60">
            Join professionals who have already made the switch to the
            architectural authority of digital identities.
          </p>
        </div>

        <div className="mx-auto max-w-3xl rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
          {submitted && (
            <div className="mb-6 flex items-center gap-2 rounded-field border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Thanks! Your message has been received — we&apos;ll get back to
              you soon.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1.5 block text-xs font-medium text-base-content/70"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="e.g. Mayank Sharma"
                  {...register("name")}
                  className={`w-full rounded-md border px-3 py-2.5 text-sm text-base-content placeholder-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.name ? "border-error" : "border-base-300"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-error">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1.5 block text-xs font-medium text-base-content/70"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="example@gmail.com"
                  {...register("email")}
                  className={`w-full rounded-md border px-3 py-2.5 text-sm text-base-content placeholder-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.email ? "border-error" : "border-base-300"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="contact-phone"
                  className="mb-1.5 block text-xs font-medium text-base-content/70"
                >
                  Contact No.
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  placeholder="+91 8807232627"
                  {...register("contact")}
                  className={`w-full rounded-md border px-3 py-2.5 text-sm text-base-content placeholder-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    errors.contact ? "border-error" : "border-base-300"
                  }`}
                />
                {errors.contact && (
                  <p className="mt-1 text-xs text-error">
                    {errors.contact.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="contact-message"
                className="mb-1.5 block text-xs font-medium text-base-content/70"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                placeholder="Ask anything"
                rows={4}
                {...register("message")}
                className={`w-full resize-none rounded-md border px-3 py-2.5 text-sm text-base-content placeholder-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  errors.message ? "border-error" : "border-base-300"
                }`}
              />
              {errors.message && (
                <p className="mt-1 text-xs text-error">
                  {errors.message.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-content transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
