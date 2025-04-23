
// Adapted from shadcn-ui toast implementation
import { useState, useEffect, useCallback } from "react"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  id?: string
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback(({ title, description, variant = "default" }: ToastProps) => {
    const id = Date.now().toString()
    const newToast = { id, title, description, variant }
    
    sonnerToast(title, {
      description,
      className: variant === "destructive" ? "bg-destructive" : undefined
    })

    setToasts(prevToasts => [...prevToasts, newToast])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  return { toasts, toast, dismissToast }
}

// Re-export the sonner toast for direct usage
export { sonnerToast as toast }
