import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline"; size?: "sm" | "md" | "icon" }>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none select-none",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.97]",
        variant === "ghost" && "text-foreground hover:bg-muted",
        variant === "outline" && "border border-border hover:bg-muted",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-9 w-9 rounded-lg",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
