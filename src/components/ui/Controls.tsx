import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown, Search, X, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

/* ---------------------------------- Search --------------------------------- */

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  shortcut?: string;
  wrapperClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, shortcut, wrapperClassName, className, ...rest },
  ref,
) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          'w-full rounded-lg bg-surface-container-low py-2 pl-9 pr-14 text-body-sm text-on-surface transition-all placeholder:text-on-surface-variant/70 hover:bg-surface-container focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container/40 [&::-webkit-search-cancel-button]:hidden',
          className,
        )}
        {...rest}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onValueChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        >
          <X size={14} />
        </button>
      ) : (
        shortcut && (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded bg-surface-container-highest px-1.5 py-0.5 font-mono text-data-code-label text-on-surface-variant shadow-sm sm:block">
            {shortcut}
          </kbd>
        )
      )}
    </div>
  );
});

/* ---------------------------------- Select --------------------------------- */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export function Select({ wrapperClassName, className, children, ...rest }: SelectProps) {
  return (
    <div className={cn('relative inline-block', wrapperClassName)}>
      <select
        className={cn(
          'w-full cursor-pointer appearance-none rounded-lg bg-surface-container-low py-2 pl-3 pr-8 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary-container/40',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
    </div>
  );
}

/* ----------------------------- Segmented control ---------------------------- */

interface SegmentedProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  renderLabel?: (option: T) => ReactNode;
}

/** Stitch 1D/1W/1M/1Y and Day/Week/Month toggles. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, className, renderLabel }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex items-center rounded-lg bg-surface-container-low p-1', className)}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={cn(
              'rounded px-2.5 py-1 text-body-sm transition-colors',
              active ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface',
            )}
          >
            {renderLabel ? renderLabel(option) : option}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- Filter tabs ------------------------------- */

export interface FilterTabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
  dotClassName?: string;
  countClassName?: string;
}

interface FilterTabsProps<T extends string> {
  items: FilterTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Status chips inside an inset tray (Stitch Patients "All / Active / Critical / Discharged"). */
export function FilterTabs<T extends string>({ items, value, onChange, label, className }: FilterTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex flex-wrap items-center gap-1.5 rounded-lg bg-surface-container-low p-1', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-sm font-medium transition-all',
              active ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {item.dotClassName && <span className={cn('h-2 w-2 rounded-full', item.dotClassName)} />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className={cn('rounded-full px-1.5 font-mono text-data-code-label font-semibold', item.countClassName ?? 'bg-surface-container text-on-surface-variant')}>
                {item.count.toLocaleString('en-US')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Chips ---------------------------------- */

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}

/** Department chip (Stitch Appointments "Depts:" row). */
export function Chip({ active, onClick, children, count }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-caption shadow-sm transition-colors',
        active ? 'bg-primary font-semibold text-on-primary' : 'bg-surface-container-lowest font-medium text-on-surface hover:bg-surface-container',
      )}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span className={cn('rounded-full px-1.5 text-[10px]', active ? 'bg-primary-container' : 'bg-surface-container text-on-surface-variant')}>{count}</span>
      )}
    </button>
  );
}

/* --------------------------------- Checkbox -------------------------------- */

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox({ className, ...rest }, ref) {
  return <input ref={ref} type="checkbox" className={cn('h-4 w-4 cursor-pointer rounded accent-primary-container', className)} {...rest} />;
});

/* ---------------------------------- Toggle --------------------------------- */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-primary-container' : 'bg-surface-container-highest')}
    >
      <span className={cn('inline-block h-4 w-4 rounded-full bg-surface-container-lowest shadow-sm transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  );
}

/* -------------------------------- Pill tabs -------------------------------- */

interface PillTabsProps<T extends string> {
  items: { value: T; label: string; count?: number; icon?: LucideIcon }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Pill tab strip (Stitch Patient Details "Overview / Medical History / …", Help FAQ categories). */
export function PillTabs<T extends string>({ items, value, onChange, label, className }: PillTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('no-scrollbar flex items-center gap-1 overflow-x-auto', className)}>
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-body-sm transition-colors',
              active ? 'bg-surface-container-low font-semibold text-primary' : 'font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
            )}
          >
            {Icon && <Icon size={16} aria-hidden />}
            {item.label}
            {item.count !== undefined && (
              <span className={cn('rounded px-1.5 font-mono text-[10px] font-semibold', active ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container text-on-surface-variant')}>{item.count}</span>
            )}
            {active && item.count === undefined && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}
