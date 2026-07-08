import { motion } from "framer-motion";
import { WHO_ITS_FOR } from "@features/landing/config/content";

export default function WhoItsForSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2 text-3xl font-bold text-base-content">
            Who It&apos;s For?
          </h2>
          <p className="text-base-content/60">
            One card. Every kind of professional.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-5">
          {WHO_ITS_FOR.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="overflow-hidden rounded-box border border-base-300 bg-base-100"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-primary/5">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="mb-1 text-base font-bold text-base-content">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-base-content/60">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
