import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

export const ScrollArea = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("overflow-y-auto", className)} {...props}>
    {children}
  </div>
));
ScrollArea.displayName = "ScrollArea";
