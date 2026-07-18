import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-[180ms] ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:shadow-none disabled:border-none disabled:opacity-100 disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer rounded-[10px]",
  {
    variants: {
      variant: {
        default: "btn-gradient text-primary-foreground hover:btn-gradient-hover hover:shadow-[0_6px_16px_rgba(109,94,248,0.25)] hover:-translate-y-px active:btn-gradient-active active:translate-y-0 active:shadow-none",
        destructive: "bg-destructive text-destructive-foreground hover:bg-[#DC2626] hover:shadow-md hover:-translate-y-px active:translate-y-0",
        outline: "border border-border bg-transparent text-foreground hover:bg-[hsl(230,33%,97%)] hover:border-[#D0D5E3] hover:-translate-y-px",
        secondary: "border border-border bg-transparent text-foreground hover:bg-[hsl(230,33%,97%)] hover:border-[#D0D5E3] hover:-translate-y-px",
        ghost: "bg-transparent hover:bg-[rgba(109,94,248,0.08)] rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
