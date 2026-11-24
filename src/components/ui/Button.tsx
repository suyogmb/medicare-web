import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'tonal' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  // Stitch: bg-primary-container hover:bg-primary text-on-primary font-semibold shadow-sm
  primary: 'bg-primary-container text-on-primary hover:bg-primary font-semibold shadow-sm',
  // Stitch "Export CSV": white surface button
  secondary: 'bg-surface-container-lowest text-on-surface hover:bg-surface-container font-semibold shadow-sm',
  // Stitch "Filter View" / date picker: inset tray button
  tonal: 'bg-surface-container-low text-on-surface hover:bg-surface-container font-medium shadow-sm',
  ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium',
  danger: 'bg-surface-container-lowest text-danger hover:bg-danger-container font-semibold shadow-sm',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1 gap-1 text-body-sm',
  md: 'px-3.5 py-2 gap-space-xs text-body-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, trailingIcon: Trailing, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg transition-all active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2} className={variant === 'primary' ? '' : 'text-current opacity-80'} aria-hidden />}
      {children}
      {Trailing && <Trailing size={15} className="opacity-70" aria-hidden />}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  size?: number;
  tone?: 'plain' | 'tray';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, size = 18, tone = 'plain', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:pointer-events-none disabled:opacity-40',
        tone === 'tray' && 'bg-surface-container-low',
        className,
      )}
      {...rest}
    >
      <Icon size={size} aria-hidden />
    </button>
  );
});
