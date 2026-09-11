/**
 * URL-based list filters — nuqs wrapper.
 *
 * Replaces `useState` filter/sort/page with URL search params.
 * Benefits: shareable links, F5 preserves state, back/forward works.
 */

"use client";

import {
  useQueryState,
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs";
import { useDebouncedValue } from "./use-debounced-value";

/**
 * Generic list filters hook.
 *
 * @param statusEnum — readonly array of allowed status values (e.g. PO_STATUSES)
 */
export function useUrlFilters<S extends string>(statusEnum: readonly S[]) {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsArrayOf(parseAsStringLiteral(statusEnum)).withDefault([]),
  );

  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault(""));

  const debouncedQ = useDebouncedValue(q, 300);

  const setStatusAndResetPage = (s: S[]) => {
    setStatus(s);
    setPage(1);
  };

  const setQAndResetPage = (v: string) => {
    setQ(v);
    setPage(1);
  };

  const reset = () => {
    setStatus([]);
    setQ("");
    setPage(1);
    setSort("");
  };

  return {
    status,
    setStatus: setStatusAndResetPage,
    q,
    setQ: setQAndResetPage,
    debouncedQ,
    page,
    setPage,
    sort,
    setSort,
    reset,
  };
}
