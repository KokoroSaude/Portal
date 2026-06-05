import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-primary-glow hover:brightness-[0.96] hover:shadow-[0_2px_4px_oklch(0.68_0.19_25/0.15),0_8px_24px_-4px_oklch(0.68_0.19_25/0.4)]",
        destructive:
          "bg-destructive text-white shadow-soft hover:brightness-[0.95]",
        outline:
          "border-2 border-border bg-card text-foreground shadow-soft hover:border-primary/30 hover:bg-accent",
        secondary:
          "border border-border/60 bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-accent",
        link: "text-primary font-medium underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 rounded-lg px-3.5 text-xs font-semibold",
        lg: "h-11 rounded-lg px-7 text-[0.9375rem]",
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

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
