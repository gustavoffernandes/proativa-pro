import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Sync a set of string filters with URL query params.
 * Keys in `defaults` define which params are managed.
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = { ...defaults } as T;
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const v = searchParams.get(key as string);
      if (v !== null) (result as any)[key] = v;
    }
    return result;
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (key: keyof T, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === "" || value === (defaults as any)[key]) {
            next.delete(key as string);
          } else {
            next.set(key as string, value);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, defaults]
  );

  const resetFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const key of Object.keys(defaults)) {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams, defaults]);

  return { filters, setFilter, resetFilters };
}
