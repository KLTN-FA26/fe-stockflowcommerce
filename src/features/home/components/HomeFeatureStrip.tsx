"use client";

import { motion, useReducedMotion } from "framer-motion";

import { HOME_FEATURES } from "../constants";

const STRIP_VARIANTS = {
  hidden: {},
  visible: { transition: { delayChildren: 0.24, staggerChildren: 0.06 } },
} as const;

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
} as const;

export function HomeFeatureStrip() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.ul
      className="grid max-w-6xl gap-3 sm:grid-cols-3 lg:gap-4"
      variants={STRIP_VARIANTS}
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
    >
      {HOME_FEATURES.map(({ title, description, icon: Icon }) => (
        <motion.li
          key={title}
          variants={CARD_VARIANTS}
          className="border-border-default bg-bg-surface/70 hover:border-border-strong hover:bg-bg-surface group rounded-2xl border p-5 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1"
        >
          <div className="border-border-default bg-bg-muted text-ink-primary flex size-10 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <h2 className="text-ink-primary mt-4 text-sm font-semibold sm:text-base">{title}</h2>
          <p className="text-ink-secondary mt-2 text-xs leading-5 sm:text-sm sm:leading-6">
            {description}
          </p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
