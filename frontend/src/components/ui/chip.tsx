"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
    "inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
                outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-accent",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
                success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500",
                info: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
                warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500",
            },
            size: {
                default: "h-8 text-xs",
                sm: "h-6 text-xs",
                lg: "h-10 text-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ChipProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
    onClick?: () => void;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
    ({ className, variant, size, onClick, ...props }, ref) => {
        return (
            <button
                className={cn(chipVariants({ variant, size, className }))}
                ref={ref}
                onClick={onClick}
                type="button"
                {...props}
            />
        );
    }
);
Chip.displayName = "Chip";

export { Chip, chipVariants }; 