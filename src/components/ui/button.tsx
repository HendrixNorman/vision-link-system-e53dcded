import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-spring active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_hsl(var(--primary)/0.55),inset_0_1px_0_hsl(0_0%_100%/0.28)] hover:bg-primary/92 hover:shadow-[0_10px_26px_-8px_hsl(var(--primary)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.3)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_6px_18px_-6px_hsl(var(--destructive)/0.5),inset_0_1px_0_hsl(0_0%_100%/0.25)] hover:bg-destructive/92",
        outline:
          "border border-border/70 bg-background/60 backdrop-blur-xl hover:bg-accent/70 hover:text-accent-foreground",
        secondary: "bg-secondary/80 backdrop-blur-xl text-secondary-foreground hover:bg-secondary",
        ghost: "hover:bg-accent/70 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline rounded-md",
        glass:
          "glass text-foreground hover:brightness-[1.06] shadow-[0_8px_24px_-10px_hsl(var(--foreground)/0.25),inset_0_1px_0_hsl(var(--glass-highlight))]",
        hero:
          "text-primary-foreground gradient-hero shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.3)] hover:shadow-glow",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-8 text-base",
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
