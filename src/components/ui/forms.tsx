import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

const CONTROL =
  'rounded-control border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-3 transition-colors focus-visible:outline-2 disabled:opacity-60';

/** Pleine largeur par défaut ; une classe `w-…` passée par l'appelant la remplace. */
const widthOf = (className?: string): string | false => !/(^|\s)w-/.test(className ?? '') && 'w-full';

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  /** Reçoit l'identifiant à poser sur le champ pour relier libellé, aide et erreur. */
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children({ id, ...(note ? { 'aria-describedby': noteId } : {}), ...(error ? { 'aria-invalid': true } : {}) })}
      {note && (
        <p id={noteId} className={cx('mt-1.5 text-xs', error ? 'font-semibold text-danger' : 'text-ink-3')}>
          {note}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(CONTROL, widthOf(className), 'h-11 border-line-strong aria-[invalid=true]:border-danger-solid', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx(CONTROL, widthOf(className), 'h-11 border-line-strong', className)} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} rows={3} className={cx(CONTROL, widthOf(className), 'resize-y border-line-strong py-2.5', className)} {...rest} />;
});

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-control py-1 text-left disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-xs text-ink-3">{description}</span>}
      </span>
      <span className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-line-strong')} aria-hidden="true">
        <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  );
}
