import { useCallback, useEffect, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

interface UseTableOptions<T, K extends string> {
  rows: T[];
  pageSize: number;
  getId: (row: T) => string;
  sorters?: Record<K, (a: T, b: T) => number>;
  initialSort?: SortState<K>;
  /** Changing any of these resets the table to page 1. */
  resetKeys?: unknown[];
}

/**
 * Client-side sorting, pagination and row selection for the registry tables.
 * Filtering stays in the caller so each screen can compose its own filters.
 */
export function useTable<T, K extends string = string>({ rows, pageSize, getId, sorters, initialSort, resetKeys = [] }: UseTableOptions<T, K>) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState<K> | undefined>(initialSort);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    if (!sort || !sorters) return rows;
    const cmp = sorters[sort.key];
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => cmp(a, b) * dir);
  }, [rows, sort, sorters]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [pageSize, ...resetKeys]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageRows = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  const toggleSort = useCallback((key: K) => {
    setSort((prev) => (prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));
  }, []);

  const pageIds = pageRows.map(getId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  const toggleRow = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (allOnPageSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  return {
    page,
    setPage,
    pageCount,
    pageRows,
    total: sorted.length,
    rangeStart: sorted.length === 0 ? 0 : (page - 1) * pageSize + 1,
    rangeEnd: Math.min(page * pageSize, sorted.length),
    sort,
    toggleSort,
    selected,
    toggleRow,
    togglePage,
    allOnPageSelected,
    someOnPageSelected,
    clearSelection,
  };
}
