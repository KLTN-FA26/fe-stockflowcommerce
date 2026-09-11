/**
 * MSW handlers — mock API endpoints.
 *
 * Uses mock-data.ts as the data source. These handlers are shared between
 * tests (via setupServer) and browser dev (via setupWorker).
 *
 * TODO: Add handlers as features are refactored.
 */

import { http, HttpResponse } from "msw";

export const handlers = [
  // Health check
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok", mock: true });
  }),

  // TODO: Add per-module handlers here as features are built
  // e.g. http.get("/api/purchase-orders", ...) → paginated response from mock-data
];
