import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";

import { BRAND } from "@/constants";

import { ToastProvider } from "@/components/shared/Toast";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/providers/app-providers";

import type { Metadata } from "next";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — Back-office`,
    template: `%s — ${BRAND.name}`,
  },
  description: "UI/UX demo — Kho vận & Sàn TMĐT",
  applicationName: BRAND.name,
  icons: {
    icon: [{ url: BRAND.iconSrc, type: "image/svg+xml" }],
    shortcut: [{ url: BRAND.iconSrc, type: "image/svg+xml" }],
    apple: [{ url: BRAND.iconSrc, type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
