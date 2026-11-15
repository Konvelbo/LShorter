import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { cn } from "@/lib/utils";

const glowVariants = cva("absolute w-full pointer-events-none", {
  variants: {
    variant: {
      top: "top-0",
      above: "-top-[128px]",
      bottom: "bottom-0",
      below: "-bottom-[128px]",
      center: "top-[50%]",
    },
  },
  defaultVariants: {
    variant: "top",
  },
});

export interface GlowProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof glowVariants> {}

export function Glow({
  className,
  variant,
  ...props
}: GlowProps) {
  return (
    <div
      data-slot="glow"
      className={cn(glowVariants({ variant }), className)}
      {...props}
    >
      {/* Outer ambient glow halo in LShorter blue */}
      <div
        className={cn(
          "from-[#0066FF]/40 to-transparent absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60% opacity-30 sm:h-[512px] dark:opacity-85 pointer-events-none blur-3xl",
          variant === "center" && "-translate-y-1/2",
        )}
      />
      {/* Inner focused core glow in electric cyan/blue */}
      <div
        className={cn(
          "from-[#5294FF]/50 to-transparent absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-radial from-10% to-60% opacity-40 sm:h-[256px] dark:opacity-95 pointer-events-none blur-2xl",
          variant === "center" && "-translate-y-1/2",
        )}
      />
    </div>
  );
}

export default Glow;
