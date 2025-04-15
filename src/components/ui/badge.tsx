
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        achievement: 
          "border-transparent bg-finance-burgundy/20 text-finance-accent hover:bg-finance-burgundy/30",
        level: 
          "border-transparent bg-finance-steel/20 text-finance-lightgray hover:bg-finance-steel/30",
        success: 
          "border-transparent bg-green-900/20 text-green-400 hover:bg-green-900/30",
        warning: 
          "border-transparent bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30",
        error: 
          "border-transparent bg-red-900/20 text-red-400 hover:bg-red-900/30",
        premium:
          "border-transparent bg-purple-900/20 text-purple-400 hover:bg-purple-900/30",
        event:
          "border-transparent bg-blue-900/20 text-blue-400 hover:bg-blue-900/30",
        community:
          "border-transparent bg-teal-900/20 text-teal-400 hover:bg-teal-900/30",
        challenge:
          "border-transparent bg-orange-900/20 text-orange-400 hover:bg-orange-900/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
