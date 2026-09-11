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
      className="grid gap-3 sm:grid-cols-3"
      variants={STRIP_VARIANTS}
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
    >
      {HOME_FEATURES.map(({ title, description, icon: Icon }) => (
        <motion.li
          key={title}
          variants={CARD_VARIANTS}
          className="border-border-default bg-bg-surface hover:border-border-strong group rounded-[var(--r-sm)] border p-4 transition-colors duration-150"
        >
          <div className="bg-bg-subtle text-accent flex size-9 items-center justify-center rounded-[var(--r-sm)] transition-transform duration-150 group-hover:-translate-y-[2px]">
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <h2 className="mt-3 text-sm font-semibold">{title}</h2>
          <p className="text-ink-secondary mt-1 text-xs leading-5">{description}</p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
