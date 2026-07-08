import { motion } from "framer-motion";
import { WHY_US_FEATURES } from "@features/landing/config/content";

export default function WhyUsSection() {
  return (
    <section id="why-us" className="bg-base-100 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2 text-3xl font-bold text-base-content">Why Us?</h2>
          <p className="text-base-content/60">
            One card. Every kind of professional.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-5">
          {WHY_US_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col overflow-hidden rounded-box border border-base-300 bg-base-100"
            >
              <div className="p-5 pb-3">
                <h3 className="mb-1 text-base font-bold text-base-content">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-base-content/60">
                  {feature.description}
                </p>
              </div>
              <div className="relative min-h-[220px] w-full flex-1 px-4 pb-4">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="h-full w-full object-contain"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
