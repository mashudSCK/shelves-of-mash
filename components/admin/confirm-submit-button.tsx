'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string }) {
  return (
    <button
      {...props}
      type="submit"
      className={cn(className)}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
