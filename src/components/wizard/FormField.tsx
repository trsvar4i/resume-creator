'use client';

import type { ReactNode } from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error, built from the library's Field primitives so every form looks the same. */
export function FormField({ label, htmlFor, required, error, hint, className, children }: FormFieldProps) {
  return (
    <Field className={cn('gap-1.5', className)} data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        <span>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </span>
      </FieldLabel>
      {children}
      {error ? (
        <FieldError className="text-xs">{error}</FieldError>
      ) : hint ? (
        <FieldDescription className="text-xs">{hint}</FieldDescription>
      ) : null}
    </Field>
  );
}
