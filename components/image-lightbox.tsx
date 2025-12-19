"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface ImageLightboxProps {
  images: string[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Soporte para teclas flecha izquierda/derecha y ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prevImage()
      if (e.key === "ArrowRight") nextImage()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm">
      {/* Botón Cerrar */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 sm:p-2 transition-all duration-300 z-50 active:scale-95"
      >
        <X className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* Navegación Izquierda */}
      {images.length > 1 && (
        <button
          onClick={prevImage}
          className="absolute left-2 sm:left-4 text-white bg-black/50 hover:bg-black/70 transition-all p-3 sm:p-4 rounded-full z-50 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 sm:w-10 sm:h-10" />
        </button>
      )}

      {/* Imagen Central */}
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] p-4">
        <Image
          src={images[currentIndex] || "/placeholder.svg"}
          alt={`Imagen ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {/* Navegación Derecha */}
      {images.length > 1 && (
        <button
          onClick={nextImage}
          className="absolute right-2 sm:right-4 text-white bg-black/50 hover:bg-black/70 transition-all p-3 sm:p-4 rounded-full z-50 active:scale-95"
        >
          <ChevronRight className="w-6 h-6 sm:w-10 sm:h-10" />
        </button>
      )}

      {/* Indicador de contador */}
      {images.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white font-medium bg-black/70 px-4 py-2 rounded-full text-sm sm:text-base">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
