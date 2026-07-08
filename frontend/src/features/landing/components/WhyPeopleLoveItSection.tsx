import { motion } from "framer-motion";
import { LOVE_IT_FEATURES } from "@features/landing/config/content";

export default function WhyPeopleLoveItSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-base-content">
            Why People Love It?
          </h2>
          <p className="text-base-content/60">
            This is what it feels like to never lose a contact again.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {LOVE_IT_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="rounded-field border border-base-300 bg-base-100 p-4"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-base-content">
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
