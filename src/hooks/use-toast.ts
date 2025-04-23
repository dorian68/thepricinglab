
// Adapted from shadcn-ui toast implementation
import { useState, useEffect, useCallback } from "react"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// Simplified version of the toast hook
export function useToast() {
  const toast = useCallback(({ title, description, variant = "default" }: ToastProps) => {
    sonnerToast(title, {
      description,
      className: variant === "destructive" ? "bg-destructive" : undefined
    })
  }, [])

  return { toast }
}

// Re-export the sonner toast for direct usage
export { sonnerToast as toast }
