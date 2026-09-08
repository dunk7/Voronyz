"use client";
import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<Variant, string> = {
      primary: "bg-black text-white hover:bg-neutral-800",
      secondary: "ring-1 ring-black/10 text-black hover:bg-black/5",
      ghost: "text-black hover:bg-black/5",
    };
    const sizes: Record<Size, string> = {
      sm: "text-xs px-3 py-2",
      md: "text-sm px-5 py-3",
      lg: "text-base px-6 py-3.5",
    };
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
    );
  }
);
Button.displayName = "Button";


