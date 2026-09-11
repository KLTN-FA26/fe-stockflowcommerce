/**
 * Test render helper — wraps components in all required providers.
 */

import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/api/query-client";

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = makeQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
