import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SectionCardProps {
  title: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
  actions?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Stitch uses headline-md on Dashboard cards and headline-sm on Appointment side cards. */
  size?: 'md' | 'sm';
}

/** White surface panel with a header row — the base container of every Stitch screen. */
export function SectionCard({ title, icon: Icon, badge, actions, subtitle, children, className, bodyClassName, size = 'md' }: SectionCardProps) {
  return (
    <section className={cn('card flex flex-col gap-space-md p-space-lg', size === 'sm' && 'rounded-2xl p-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={19} className="shrink-0 text-primary" aria-hidden />}
            <h2 className={cn('font-semibold tracking-tight text-on-surface', size === 'md' ? 'text-headline-md' : 'text-headline-sm font-bold')}>{title}</h2>
            {badge}
          </div>
          {subtitle && <span className="mt-0.5 text-caption text-on-surface-variant">{subtitle}</span>}
        </div>
        {actions}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description?: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant">
        <Icon size={20} aria-hidden />
      </div>
      <p className="text-headline-sm text-on-surface">{title}</p>
      {description && <p className="max-w-sm text-body-sm text-on-surface-variant">{description}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, tag, description, actions }: { eyebrow?: string; title: string; tag?: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-col">
        {eyebrow && <span className="font-mono text-data-code-label font-semibold uppercase tracking-wider text-primary">{eyebrow}</span>}
        <div className="flex flex-wrap items-center gap-space-sm">
          <h1 className="text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">{title}</h1>
          {tag && <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-data-code-label font-semibold text-on-surface-variant">{tag}</span>}
        </div>
        {description && <p className="mt-0.5 text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-space-sm">{actions}</div>}
    </div>
  );
}
