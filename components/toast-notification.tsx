"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"

interface ToastProps {
  message: string
  type: "success" | "error"
  duration?: number
}

export function Toast({ message, type, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!isVisible) return null

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 ${
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      <Check className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </div>
  )
}
