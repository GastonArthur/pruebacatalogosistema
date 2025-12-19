"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import type { Product } from "@/lib/google-sheets"
import { useCart } from "@/context/cart-context"
import { ShoppingCart, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { ImageLightbox } from "./image-lightbox"

interface ProductCardProps {
  product: Product
  images?: string[]
  showOutOfStock?: boolean // Esto es un prop para controlar la UI, no el filtrado.
  // ✅ Nuevo: permite que las primeras cards carguen más rápido (no cambia la UI)
  priorityImage?: boolean
}

const formatPriceFromString = (priceStr: string): string => {
  if (!priceStr) return "$0"
  if (priceStr.startsWith("$")) return priceStr
  return `$${priceStr}`
}

// ✅ Hook: carga real de imagen SOLO cuando el card está cerca del viewport (mejor UX, menos fallos)
function useNearScreen<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setIsNear(true)
          obs.disconnect()
        }
      },
      options ?? { root: null, rootMargin: "600px 0px", threshold: 0.01 }, // empieza a cargar ANTES de verse
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [options])

  return { ref, isNear }
}

export function ProductCard({ product, images = [], showOutOfStock, priorityImage = false }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0) // Control del slider
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const { addToCart } = useCart()

  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // ✅ Para que no “queden en blanco” si una URL falla (pasa mucho con hosts externos)
  const [brokenIndexes, setBrokenIndexes] = useState<Record<number, boolean>>({})

  // ✅ Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // ✅ “safeImages” estable y con placeholder garantizado
  const safeImages = useMemo(() => {
    const list = images && images.length > 0 ? images : []
    return list.length > 0 ? list : ["/placeholder.svg"]
  }, [images])

  // ✅ “near screen”: cargamos imagen real solo cuando hace falta
  const { ref: cardRef, isNear } = useNearScreen<HTMLDivElement>()

  const handleAddToCart = () => {
    if (product.stock > 0) {
      // Si hay stock, se puede agregar
      addToCart(product, quantity)
      setQuantity(1)
    }
  }

  const openLightbox = () => {
    setLightboxOpen(true)
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % safeImages.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && safeImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % safeImages.length)
    }
    if (isRightSwipe && safeImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const isOutOfStock = product.stock === 0 // Determina si está sin stock

  // ✅ src efectivo (si está roto => placeholder)
  const effectiveSrc =
    brokenIndexes[currentImageIndex] || !safeImages[currentImageIndex] ? "/placeholder.svg" : safeImages[currentImageIndex]

  // ✅ Regla: las primeras cards (priorityImage) o las cercanas al viewport cargan la imagen real
  // Las demás muestran placeholder (misma UI) y se reemplaza cuando te acercás con scroll.
  const shouldLoadRealImage = priorityImage || isNear

  return (
    <>
      <div
        ref={cardRef}
        className={`group bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:border-red-200 ${
          isOutOfStock ? "opacity-50" : ""
        }`}
      >
        <div
          ref={imageContainerRef}
          className="relative h-48 sm:h-64 lg:h-80 bg-white overflow-hidden flex-shrink-0 group/image"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={shouldLoadRealImage ? (effectiveSrc || "/placeholder.svg") : "/placeholder.svg"}
            alt={`${product.nombre} - vista ${currentImageIndex + 1}`}
            fill
            className="object-contain p-2 transition-transform duration-300"
            // ✅ Para que el “primer pantallazo” cargue sólido:
            priority={priorityImage}
            loading={priorityImage ? "eager" : "lazy"}
            // ✅ Reduce peso sin tocar el diseño (solo calidad de compresión)
            quality={70}
            // ✅ Esto ayuda a Next a elegir tamaños correctos
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            // ✅ Si falla una URL, no queda vacío
            onError={() => {
              setBrokenIndexes((prev) => ({ ...prev, [currentImageIndex]: true }))
            }}
          />

          <button
            onClick={openLightbox}
            className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-all duration-300 flex items-center justify-center group-hover/image:opacity-100"
          ></button>
          <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          </div>

          {safeImages.length > 1 && (
            <>
              {!isMobile && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {safeImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? "bg-red-600" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            </>
          )}

          {!isOutOfStock && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-green-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-md z-10">
              Stock: {product.stock}
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-20">
              <span className="text-white font-bold text-base sm:text-lg">Sin Stock</span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-2 leading-tight">
            {product.nombre}
          </h3>
          <p className="text-gray-500 text-[10px] sm:text-xs mb-2 sm:mb-3 font-medium">SKU: {product.sku}</p>

          <div className="h-10 sm:h-12 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-100">
            {(product.año || product.nivelDeJuego) && (
              <div className="text-[10px] sm:text-xs space-y-1 sm:space-y-1.5">
                {product.año && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Año:</span>
                    <span className="font-semibold text-gray-900">{product.año}</span>
                  </div>
                )}
                {product.nivelDeJuego && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Nivel:</span>
                    <span className="font-semibold text-gray-900">{product.nivelDeJuego}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-300 border-2 border-amber-500 rounded-lg p-2.5 sm:p-4 mb-3 sm:mb-4 shadow-md min-h-[140px] sm:min-h-[180px] flex flex-col">
            <p className="text-gray-800 mb-2 sm:mb-3 font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center">
              Precios por cantidad
            </p>
            <div className="space-y-1.5 sm:space-y-2.5 flex-1">
              <div className="flex justify-between items-center bg-white/90 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm hover:bg-white transition">
                <span className="text-gray-700 text-[10px] sm:text-xs font-bold">{product.precio1Label}</span>
                <span className="font-bold text-red-600 text-xs sm:text-sm">
                  {formatPriceFromString(product.precio1)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-white/90 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm hover:bg-white transition">
                <span className="text-gray-700 text-[10px] sm:text-xs font-bold">{product.precio2Label}</span>
                <span className="font-bold text-red-600 text-xs sm:text-sm">
                  {formatPriceFromString(product.precio2)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-white/90 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm hover:bg-white transition">
                <span className="text-gray-700 text-[10px] sm:text-xs font-bold">{product.precio3Label}</span>
                <span className="font-bold text-red-600 text-xs sm:text-sm">
                  {formatPriceFromString(product.precio3)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-2.5 mt-auto">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-gray-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
              placeholder="Cantidad"
            />
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-2 sm:py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-all duration-300 ${
                isOutOfStock
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-green-600 active:scale-95 shadow-md hover:shadow-lg"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isOutOfStock ? "Sin stock" : "Agregar"}
            </button>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox images={safeImages} initialIndex={currentImageIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  )
}
