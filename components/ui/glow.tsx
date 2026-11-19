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
      {/* Outer ambient glow halo in LShorter blue — pure soft radial gradient without heavy GPU filter:blur */}
      <div
        className={cn(
          "from-[#0066FF]/30 via-[#0066FF]/10 to-transparent absolute left-1/2 h-[256px] w-[75%] -translate-x-1/2 scale-[1.8] rounded-[50%] bg-radial from-0% via-35% to-70% opacity-45 sm:h-[480px] dark:opacity-80 pointer-events-none",
          variant === "center" && "-translate-y-1/2",
        )}
      />
      {/* Inner focused core glow in electric cyan/blue */}
      <div
        className={cn(
          "from-[#5294FF]/35 via-[#5294FF]/10 to-transparent absolute left-1/2 h-[140px] w-[50%] -translate-x-1/2 scale-150 rounded-[50%] bg-radial from-0% via-35% to-70% opacity-50 sm:h-[260px] dark:opacity-90 pointer-events-none",
          variant === "center" && "-translate-y-1/2",
        )}
      />
    </div>
  );
}

export default Glow;
