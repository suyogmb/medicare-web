import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** "text" = Previous/Next buttons (dashboard); "icon" = chevrons (registry tables). */
  variant?: 'icon' | 'text';
}

function pageWindow(page: number, pageCount: number): Array<number | 'gap'> {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 'gap', pageCount];
  if (page >= pageCount - 2) return [1, 'gap', pageCount - 2, pageCount - 1, pageCount];
  return [1, 'gap', page, 'gap', pageCount];
}

export function Pagination({ page, pageCount, onPageChange, variant = 'icon' }: PaginationProps) {
  const pages = pageWindow(page, Math.max(pageCount, 1));
  const navClass =
    'rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        type="button"
        className={cn(navClass, variant === 'text' ? 'bg-surface-container-lowest px-3 py-1.5 text-body-sm font-semibold text-on-surface shadow-sm' : 'p-1.5')}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        {variant === 'text' ? 'Previous' : <ChevronLeft size={18} />}
      </button>
      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="w-6 text-center text-caption text-on-surface-variant">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-body-sm font-medium transition-colors',
              p === page ? 'bg-primary-container font-semibold text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className={cn(navClass, variant === 'text' ? 'bg-surface-container-lowest px-3 py-1.5 text-body-sm font-semibold text-on-surface shadow-sm' : 'p-1.5')}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        {variant === 'text' ? 'Next' : <ChevronRight size={18} />}
      </button>
    </nav>
  );
}
