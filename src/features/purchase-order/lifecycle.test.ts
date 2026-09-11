import { describe, expect, it } from "vitest";

import { allowedPoActions, nextPoStatuses } from "./lifecycle";

import type { PoStatus } from "./types";

describe("purchase-order lifecycle", () => {
  it("allows transitions from Draft per docs §5", () => {
    expect(nextPoStatuses("Draft")).toEqual([
      "Pending Approval",
      "Approved",
      "Cancelled",
    ] satisfies PoStatus[]);
  });

  it("does not allow terminal statuses to transition", () => {
    expect(nextPoStatuses("Closed")).toEqual([]);
    expect(nextPoStatuses("Cancelled")).toEqual([]);
  });

  it("gates Draft actions by Procurement Staff role", () => {
    expect(allowedPoActions("Draft", "Procurement Staff").map((action) => action.code)).toEqual([
      "edit",
      "submit",
      "submit-auto-approve",
      "cancel",
    ]);
  });

  it("gates Pending Approval actions by Warehouse Manager role", () => {
    expect(
      allowedPoActions("Pending Approval", "Warehouse Manager").map((action) => action.code),
    ).toEqual(["approve", "reject"]);
  });
});
