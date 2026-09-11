"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { APP_ROUTES } from "@/constants";

import { Button } from "@/components/ui/button";

import { HOME_COPY } from "../constants";

/** Stagger reveal lúc vào trang — 180ms mỗi bước, cách nhau 60ms (Mode A: 120–180ms). */
const CONTAINER_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} as const;

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
} as const;

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col justify-center"
      variants={CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
    >
      <motion.div
        variants={ITEM_VARIANTS}
        className="border-border-default bg-bg-subtle text-ink-secondary mb-5 flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
      >
        <ShieldCheck className="text-positive size-4" aria-hidden="true" />
        {HOME_COPY.eyebrow}
      </motion.div>

      <motion.h1
        variants={ITEM_VARIANTS}
        className="text-ink-primary max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight xl:text-5xl"
      >
        {HOME_COPY.title}
      </motion.h1>

      <motion.p
        variants={ITEM_VARIANTS}
        className="text-ink-secondary mt-5 max-w-[62ch] text-base leading-7"
      >
        {HOME_COPY.description}
      </motion.p>

      <motion.div variants={ITEM_VARIANTS} className="mt-7 flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className="group rounded-[var(--r-sm)] px-5">
          <Link href={APP_ROUTES.login}>
            {HOME_COPY.ctaLabel}
            <ArrowRight
              className="size-4 transition-transform duration-150 group-hover:translate-x-[3px]"
              aria-hidden="true"
            />
          </Link>
        </Button>
        <span className="text-ink-tertiary text-sm">{HOME_COPY.ctaHint}</span>
      </motion.div>
    </motion.div>
  );
}
