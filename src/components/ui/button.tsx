import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]',
        secondary:
          'bg-[var(--color-surface-3)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]',
        ghost: 'hover:bg-[var(--color-surface-2)] text-[var(--color-fg)]',
        danger: 'bg-[var(--color-danger)] text-black hover:bg-red-400',
        outline:
          'border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] text-[var(--color-fg)]',
        link: 'text-[var(--color-accent)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3 py-2',
        sm: 'h-7 px-2 text-xs',
        lg: 'h-10 px-4',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
