import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, type LucideIcon } from 'lucide-react';
import { IconButton } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  /** Stitch "Schedule New Appointment" variant: gradient accent rail + white header. */
  accent?: boolean;
  headerAside?: ReactNode;
  titleBadge?: ReactNode;
}

/** Stitch "Patient Intake Registration" dialog shell. */
export function Modal({ open, onClose, title, subtitle, icon: Icon, children, footer, maxWidth = 'max-w-2xl', accent, headerAside, titleBadge }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea');
    first?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#181c22]/40 p-0 backdrop-blur-sm sm:items-center sm:p-space-md"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-2xl bg-surface-container-lowest shadow-modal sm:rounded-2xl`}
      >
        {accent && <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary-container via-primary to-surface-tint" />}
        <div className={`flex items-start justify-between gap-space-sm px-space-lg py-space-lg sm:px-space-xl ${accent ? 'bg-surface-container-lowest' : 'items-center bg-surface-container-low'}`}>
          <div className="flex min-w-0 items-center gap-space-sm">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent ? 'bg-primary-container/10 text-primary-container' : 'bg-primary-container text-on-primary'}`}>
              <Icon size={20} aria-hidden />
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-space-sm">
                <h2 id="modal-title" className="text-headline-md font-bold text-on-surface">
                  {title}
                </h2>
                {titleBadge}
              </div>
              {subtitle && <span className={accent ? 'text-body-sm text-on-surface-variant' : 'text-caption text-on-surface-variant'}>{subtitle}</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-space-sm">
            {headerAside}
            <IconButton icon={X} label="Close dialog" size={20} onClick={onClose} />
          </div>
        </div>
        <div className="flex flex-col gap-space-md overflow-y-auto p-space-lg sm:p-space-xl">{children}</div>
        {footer && <div className="flex items-center justify-end gap-space-sm border-t border-surface-container px-space-lg py-space-md sm:px-space-xl">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
