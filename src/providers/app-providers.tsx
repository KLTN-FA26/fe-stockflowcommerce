/**
 * App providers — wraps all client-side context providers.
 *
 * Composed in root layout so every page has access to:
 *  - TanStack Query (server state)
 *  - nuqs (URL search params)
 *  - Toast
 *  - Auth session (added in Phase 0b)
 */

"use client";

import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { makeQueryClient } from "@/lib/api/query-client";
import { activateMockAdapter } from "@/lib/api/mock-adapter";

// Activate mock adapter on client if env flag is set
if (typeof window !== "undefined") {
  activateMockAdapter();
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
