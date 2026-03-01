import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "sm" | "default" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center font-display uppercase tracking-wider font-bold transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-primary text-primary-foreground hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:scale-[1.02] active:scale-95": variant === "default",
            "border-2 border-primary text-primary hover:bg-primary/10": variant === "outline",
            "hover:bg-white/5 text-foreground": variant === "ghost",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "danger",
            "h-9 px-4 text-xs": size === "sm",
            "h-11 px-8 text-sm": size === "default",
            "h-14 px-10 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const Card = ({ className, children, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("glass-panel rounded-xl p-6", className)}
    {...props}
  >
    {children}
  </motion.div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-12 w-full rounded-md border border-white/10 bg-black/40 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium leading-none text-muted-foreground uppercase tracking-wider font-display mb-2 block", className)} {...props} />
  )
);
Label.displayName = "Label";

export const Badge = ({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "success" | "warning", className?: string }) => (
  <span className={cn(
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider font-display",
    variant === "default" && "bg-white/10 text-white",
    variant === "success" && "bg-primary/20 text-primary border border-primary/30",
    variant === "warning" && "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30",
    className
  )}>
    {children}
  </span>
);
