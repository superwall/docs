import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'fumadocs-ui/utils/cn';

type ButtonElement = HTMLButtonElement;

type ButtonProps = React.ButtonHTMLAttributes<ButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: false;
  };

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:ring-fd-primary',
        secondary: 'bg-fd-accent text-fd-accent-foreground hover:bg-fd-accent/80 focus-visible:ring-fd-accent',
        outline: 'border border-fd-border bg-transparent hover:bg-fd-accent/40 focus-visible:ring-fd-border',
        ghost: 'hover:bg-fd-accent/40 text-fd-muted-foreground',
        destructive: 'bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-600',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef<ButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
