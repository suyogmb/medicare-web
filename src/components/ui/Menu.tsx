import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreVertical, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface RowMenuProps {
  label: string;
  items: MenuItem[];
}

/** Row "more" menu — floating overlay surface per DESIGN.md elevation tier 4. */
export function RowMenu({ label, items }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-surface-container bg-surface-container-lowest py-1 shadow-overlay">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm transition-colors hover:bg-surface-container-low disabled:pointer-events-none disabled:opacity-40',
                item.danger ? 'text-danger' : 'text-on-surface',
              )}
            >
              {item.icon && <item.icon size={15} className="opacity-80" aria-hidden />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Generic popover panel anchored under a trigger. */
export function Popover({ trigger, children, align = 'right' }: { trigger: (toggle: () => void, open: boolean) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger(() => setOpen((v) => !v), open)}
      {open && (
        <div className={cn('absolute z-30 mt-2 w-72 rounded-xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-overlay', align === 'right' ? 'right-0' : 'left-0')}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
