import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES } from "@config/routes";

export default function CtaBanner() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-box bg-primary px-8 py-14 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-3xl font-bold text-primary-content md:text-4xl"
        >
          Start making connections that last.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 text-lg text-primary-content/80"
        >
          Join thousands of professionals — from solo founders to growing
          sales teams — who never lose a contact again.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link
              to={ROUTES.signup}
              className="inline-block rounded-md bg-base-100 px-7 py-3 text-sm font-semibold text-primary transition-all duration-200 hover:bg-base-200 hover:shadow-lg"
            >
              Get Your Card
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <a
              href="#contact"
              className="inline-block rounded-md border border-primary-content px-7 py-3 text-sm font-semibold text-primary-content transition-all duration-200 hover:bg-primary/90"
            >
              Talk To Our Team
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
