"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { APP_ROUTES, BRAND, BRAND_WORDMARK_GRADIENT } from "@/constants";

import { Logo } from "@/components/shared/Logo";
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
      className="flex max-w-xl flex-col justify-center"
      variants={CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
    >
      <motion.div variants={ITEM_VARIANTS} className="mb-8 flex w-full items-center">
        <Link
          href={APP_ROUTES.home}
          aria-label="StockFlowCommerce — trang chủ"
          className="focus-visible:ring-border-strong flex items-center gap-3 rounded-[var(--r-sm)] focus-visible:ring-2"
        >
          <Logo variant="mark" height={64} decorative />
          <span>
            <span className="block font-[family-name:var(--font-display)] text-2xl leading-none font-bold tracking-tight">
              {BRAND.wordmark.primary}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: BRAND_WORDMARK_GRADIENT }}
              >
                {BRAND.wordmark.accent}
              </span>
            </span>
            <span className="text-ink-tertiary mt-1.5 block text-[9px] leading-none font-semibold tracking-[0.28em] uppercase">
              {BRAND.wordmark.suffix}
            </span>
          </span>
        </Link>
      </motion.div>

      <motion.div
        variants={ITEM_VARIANTS}
        className="border-home-accent/35 bg-bg-surface/70 text-home-accent mb-5 flex w-fit items-center gap-2 rounded-[var(--r-sm)] border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase backdrop-blur-md"
      >
        <ShieldCheck className="size-4" aria-hidden="true" />
        {HOME_COPY.eyebrow}
      </motion.div>

      <motion.h1
        variants={ITEM_VARIANTS}
        className="text-ink-primary max-w-xl font-[family-name:var(--font-display)] text-3xl leading-[1.08] font-bold tracking-tight text-balance sm:text-4xl"
      >
        {HOME_COPY.titleLead} <span className="text-home-accent">{HOME_COPY.titleAccent}</span>
      </motion.h1>

      <motion.p
        variants={ITEM_VARIANTS}
        className="text-ink-secondary mt-5 max-w-[48ch] text-sm leading-6 sm:text-base sm:leading-7"
      >
        {HOME_COPY.description}
      </motion.p>

      <motion.div variants={ITEM_VARIANTS} className="mt-7 flex flex-wrap items-center gap-4">
        <Button
          asChild
          size="lg"
          className="bg-home-accent group h-10 rounded-[var(--r-sm)] px-4 text-sm font-semibold text-white shadow-xl hover:opacity-90"
        >
          <Link href={APP_ROUTES.login}>
            {HOME_COPY.ctaLabel}
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Button>
        <span className="text-ink-secondary flex items-center gap-2 text-xs sm:text-sm">
          <span className="bg-home-accent size-1.5 rounded-full" aria-hidden="true" />
          {HOME_COPY.ctaHint}
        </span>
      </motion.div>
    </motion.div>
  );
}
