import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';
import { hashString } from '../../lib/random';

/** Initials palettes observed in the Stitch patient table (EV / AP / LG / BH …). */
const TONES = [
  'bg-surface-container-low text-primary',
  'bg-surface-container text-on-surface-variant',
  'bg-surface-container-low text-tertiary',
  'bg-primary-fixed/60 text-primary',
  'bg-secondary-container text-on-secondary-fixed-variant',
  'bg-tertiary-fixed/60 text-on-tertiary-fixed-variant',
];

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-body-sm',
  md: 'h-9 w-9 text-headline-sm',
  lg: 'h-10 w-10 text-headline-sm',
  xl: 'h-16 w-16 text-headline-lg',
};

const STATUS_DOT = {
  success: 'bg-success',
  primary: 'bg-primary',
  warning: 'bg-warning',
  danger: 'bg-danger',
  muted: 'bg-outline',
};

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  critical?: boolean;
  status?: keyof typeof STATUS_DOT;
  className?: string;
}

export function Avatar({ name, size = 'md', critical, status, className }: AvatarProps) {
  const tone = critical ? 'bg-error-container text-on-error-container' : TONES[hashString(name) % TONES.length];
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold', SIZES[size], tone, className)}>
      {initials(name)}
      {critical && (
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-error ring-2 ring-surface-container-lowest" title="High-risk vitals" />
      )}
      {status && !critical && (
        <span className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface-container-lowest', STATUS_DOT[status])} />
      )}
    </span>
  );
}
