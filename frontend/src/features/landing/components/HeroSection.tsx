import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroImage from "@assets/landing/heropage.png";
import { ROUTES } from "@config/routes";
import { HERO_HEADLINE } from "@features/landing/config/content";

export default function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="grid items-center gap-10 md:grid-cols-[3fr_2fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-base-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-base-content/70"
          >
            ⚡ A Smarter Business Card
          </motion.span>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight text-base-content md:text-5xl">
            {HERO_HEADLINE.split(" ").map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                className="mr-[0.25em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.95 }}
            className="mb-8 text-lg leading-relaxed text-base-content/60"
          >
            Nearly 9 in 10 paper business cards are thrown away within a
            week. Go digital — one tap, saved forever.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.05 }}
            className="flex flex-wrap gap-4"
          >
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={ROUTES.signup}
                className="inline-block rounded-md bg-primary px-7 py-3.5 text-sm font-semibold text-primary-content transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)]"
              >
                Get Your Card
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              {/* TODO: point at /eshop once the team-ordering flow is migrated — routes to Contact for now */}
              <a
                href="#contact"
                className="inline-block rounded-md border border-base-content/30 px-7 py-3.5 text-sm font-semibold text-base-content transition-all duration-200 hover:bg-base-200 hover:shadow-md"
              >
                Order For My Team
              </a>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-box shadow-lg"
        >
          <img
            src={heroImage}
            alt="BizVizCards"
            className="h-full w-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
