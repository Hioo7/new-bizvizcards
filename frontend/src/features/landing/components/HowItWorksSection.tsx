import { motion } from "framer-motion";
import { HOW_IT_WORKS_STEPS } from "@features/landing/config/content";

export default function HowItWorksSection() {
  return (
    <section id="features" className="bg-base-100 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-base-content">
            How It Works?
          </h2>
          <p className="text-base-content/60">From tap to pipeline in seconds</p>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              className="flex flex-col rounded-box border border-base-300 bg-base-100 p-6 shadow-sm"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {step.number}
              </div>
              <h3 className="mb-2 text-lg font-bold text-base-content">
                {step.title}
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-base-content/60">
                {step.description}
              </p>
              <div className="relative mt-auto h-44 w-full">
                <img
                  src={step.image}
                  alt={step.title}
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
