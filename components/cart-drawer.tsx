"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/context/cart-context"
import { X, Trash2, Copy, Check, ChevronUp, ChevronDown } from "lucide-react"
import Image from "next/image"

interface CartDrawerProps {
  images?: Record<string, string[]>
}

export function CartDrawer({ images }: CartDrawerProps) {
  const [showDesktopToast, setShowDesktopToast] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const {
    items,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getPricePerUnit,
    getTotalItems,
    showAccessoryWarning,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useCart()

  const WHOLESALE_MIN_QUANTITY = 20

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleCopyToWhatsApp = () => {
    let text = "Pedido Maycam Games:\n================================\n"

    items.forEach((item) => {
      const pricePerUnit = getPricePerUnit(item.product)
      const subtotal = pricePerUnit * item.quantity
      text += `\n📦 ${item.product.nombre}\n`
      text += `SKU: ${item.product.sku}\n`
      text += `Cantidad: ${item.quantity} unidades\n`
      text += `Precio unitario: $${pricePerUnit.toLocaleString("es-AR")}\n`
      text += `Subtotal: ${subtotal.toLocaleString("es-AR")}\n`
    })

    text += `\n================================\n`
    text += `💰 Total: $${getTotalPrice().toLocaleString("es-AR")}\n`
    text += `📊 Total unidades: ${getTotalItems()}\n`
    text += `================================`

    navigator.clipboard.writeText(text)

    if (isMobile) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } else {
      setShowDesktopToast(true)
      setTimeout(() => setShowDesktopToast(false), 3000)
    }
  }

  return (
    <>
      {!isMobile && showDesktopToast && (
        <div className="fixed top-4 right-4 z-[60] bg-green-500 text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">✓ Pedido copiado al portapapeles</span>
        </div>
      )}

      {isDrawerOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsDrawerOpen(false)} />}

      <div
        className={`fixed right-0 top-0 h-full w-full sm:max-w-md bg-card shadow-lg transform transition z-50 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
          <h2 className="text-base sm:text-lg font-bold text-foreground">Mi Carrito</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-foreground hover:bg-secondary p-1 rounded transition"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ height: "calc(100% - 200px)" }}>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm sm:text-base">El carrito está vacío</p>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {showAccessoryWarning && (
                <div
                  className="bg-red-100 border border-red-500 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded relative mb-3 sm:mb-4 text-xs sm:text-sm"
                  role="alert"
                >
                  <strong className="font-bold">¡IMPORTANTE!</strong>
                  <span className="block sm:inline">
                    Para obtener precio mayorista en los accesorios (Grips, muñequeras, gorras, viseras, etc.), debes
                    agregar un mínimo de {WHOLESALE_MIN_QUANTITY} unidades. En el resto de los productos, el precio
                    mayorista se aplica automáticamente.
                  </span>
                </div>
              )}

              {items.map((item) => {
                const pricePerUnit = getPricePerUnit(item.product)
                const subtotal = pricePerUnit * item.quantity
                const imageArray = images?.[item.product.sku]
                const image = imageArray && imageArray.length > 0 ? imageArray[0] : undefined

                return (
                  <div
                    key={item.product.id}
                    className="border border-border rounded-lg p-2.5 sm:p-3 flex gap-2 sm:gap-3"
                  >
                    {image && (
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded">
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={item.product.nombre}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-2">
                          {item.product.nombre}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-accent hover:bg-red-50 p-1 rounded flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <p className="text-muted-foreground text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                        SKU: {item.product.sku}
                      </p>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-1 border border-border rounded bg-background">
                            <button
                              onClick={() => {
                                const newQuantity = item.quantity - 1
                                if (newQuantity >= 1) {
                                  updateQuantity(item.product.id, newQuantity)
                                }
                              }}
                              className="p-1 hover:bg-secondary rounded-l transition"
                            >
                              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === "" || value === "0") {
                                  updateQuantity(item.product.id, 0)
                                } else {
                                  const num = Number.parseInt(value)
                                  if (!isNaN(num) && num > 0) {
                                    updateQuantity(item.product.id, num)
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value
                                if (value === "" || value === "0") {
                                  updateQuantity(item.product.id, 1)
                                }
                              }}
                              className="w-10 sm:w-12 px-1 py-0.5 sm:py-1 text-center text-foreground text-xs sm:text-sm bg-background border-x border-border"
                            />
                            <button
                              onClick={() => {
                                updateQuantity(item.product.id, item.quantity + 1)
                              }}
                              className="p-1 hover:bg-secondary rounded-r transition"
                            >
                              <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                          <span className="text-muted-foreground text-[10px] sm:text-xs">
                            × ${pricePerUnit.toLocaleString("es-AR")}
                          </span>
                        </div>
                        {item.quantity === 0 && (
                          <p className="text-red-600 text-[10px] sm:text-xs font-medium">⚠ Debe ser 1 o más</p>
                        )}
                      </div>
                      <p className="text-foreground font-semibold text-xs sm:text-sm mt-1">
                        Subtotal: ${subtotal.toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-secondary relative">
          {isMobile && copied && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-green-500 border-2 border-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300 whitespace-nowrap z-10">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">¡Copiado al portapapeles!</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="font-bold text-foreground text-sm sm:text-base">Total:</span>
            <span className="text-xl sm:text-2xl font-black text-accent">
              ${getTotalPrice().toLocaleString("es-AR")}
            </span>
          </div>
          <p className="text-muted-foreground text-[10px] sm:text-xs text-center">
            Total de unidades: {getTotalItems()}
          </p>

          <button
            onClick={handleCopyToWhatsApp}
            disabled={items.length === 0}
            className="w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Copiar para WhatsApp
          </button>
        </div>
      </div>

      {!isDrawerOpen && getTotalItems() > 0 && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 bg-accent text-accent-foreground rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-red-700 transition shadow-lg"
        >
          Ver carrito ({getTotalItems()})
        </button>
      )}
    </>
  )
}
