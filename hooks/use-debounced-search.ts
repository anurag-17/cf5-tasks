"use client";

import { useEffect, useState } from "react";

/** Debounced search value with automatic cleanup on unmount. */
export function useDebouncedSearch(delayMs = 300) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), delayMs);
    return () => clearTimeout(timer);
  }, [search, delayMs]);

  return { search, setSearch, debouncedSearch };
}
