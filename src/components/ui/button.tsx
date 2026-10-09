import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-teal-900 text-white hover:bg-teal-800",
        accent: "bg-champagne text-teal-950 hover:bg-[#d4bd8e]",
        outline: "border border-teal-900/25 text-teal-900 bg-white hover:border-teal-900 hover:bg-teal-50",
        light: "border border-white/40 text-white hover:bg-white/10 hover:border-white/70",
        ghost: "text-teal-900 hover:bg-teal-50",
        whatsapp: "bg-[#1f7a4d] text-white hover:bg-[#186540]",
        danger: "bg-danger text-white hover:bg-[#8a2c22]",
        link: "text-teal-700 underline underline-offset-4 decoration-teal-700/40 hover:decoration-teal-700 px-0",
      },
      size: {
        sm: "h-9 px-3.5 text-sm rounded-md",
        md: "h-11 px-5 text-[0.95rem] rounded-md",
        lg: "h-13 px-7 text-base rounded-md",
        icon: "size-10 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Variants = VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ComponentProps<"button"> & Variants) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function ButtonLink({
  className,
  variant,
  size,
  external,
  ...props
}: ComponentProps<typeof Link> & Variants & { external?: boolean }) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  );
}
