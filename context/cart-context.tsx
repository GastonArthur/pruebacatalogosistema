"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Product } from "@/lib/google-sheets"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getPricePerUnit: (product: Product) => number
  getMinQuantityAccessoryTotal: () => number
  showAccessoryWarning: boolean
  isMinQuantityAccessory: (product: Product) => boolean
  isDrawerOpen: boolean
  setIsDrawerOpen: (isOpen: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [showAccessoryWarning, setShowAccessoryWarning] = useState<boolean>(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // FUNCIÓN MODIFICADA: Ahora excluye zapatillas y productos con "red mini"
  const isMinQuantityAccessory = (product: Product): boolean => {
    const isAccessoryCategory = product.categoria === "Accesorios y zapatillas"
    const nombreLower = product.nombre.toLowerCase()
    
    const esZapatilla = nombreLower.includes("zapatilla")
    const esRedMini = nombreLower.includes("red mini")

    // Solo es accesorio sujeto a recargo si es de la categoría 
    // Y NO es zapatilla Y NO es red mini
    return isAccessoryCategory && !esZapatilla && !esRedMini
  }

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getNonMinQuantityAccessoryTotal = () => {
    return items.reduce((sum, item) => {
      return !isMinQuantityAccessory(item.product) ? sum + item.quantity : sum
    }, 0)
  }

  const getMinQuantityAccessoryTotal = () => {
    return items.reduce((sum, item) => {
      return isMinQuantityAccessory(item.product) ? sum + item.quantity : sum
    }, 0)
  }

  const parsePriceString = (priceStr: string | number): number => {
    if (typeof priceStr === "number") return priceStr
    if (!priceStr) return 0
    const cleaned = String(priceStr).replace(/\$/g, "").replace(/\./g, "").trim()
    const parsed = Number.parseInt(cleaned, 10)
    return isNaN(parsed) ? 0 : parsed
  }

  const getPricePerUnit = (product: Product): number => {
    const requiresMinQuantity = isMinQuantityAccessory(product)
    let totalQtyForPricing: number

    if (requiresMinQuantity) {
      totalQtyForPricing = getMinQuantityAccessoryTotal()
    } else {
      totalQtyForPricing = getNonMinQuantityAccessoryTotal()
    }

    let primaryPrice: string | undefined

    if (requiresMinQuantity) {
      if (totalQtyForPricing >= 60) {
        primaryPrice = product.precio1
      } else if (totalQtyForPricing >= 41) {
        primaryPrice = product.precio2
      } else if (totalQtyForPricing >= 20) {
        primaryPrice = product.precio3
      } else {
        const basePrice = parsePriceString(product.precio3)
        return basePrice * 1.55 // Recargo del 55% para accesorios < 20
      }
    } else {
      // Lógica para zapatillas y Red Mini (Escala normal)
      if (totalQtyForPricing >= 20) {
        primaryPrice = product.precio1
      } else if (totalQtyForPricing >= 10) {
        primaryPrice = product.precio2
      } else {
        primaryPrice = product.precio3
      }
    }

    let price = parsePriceString(primaryPrice || "0")

    if (price === 0) {
      const prices = [
        parsePriceString(product.precio1),
        parsePriceString(product.precio2),
        parsePriceString(product.precio3),
      ]
      price = prices.find((p) => p > 0) || 0
    }

    return price
  }

  const updateAccessoryWarning = (currentItems: CartItem[]) => {
    const totalMinQuantityAccessories = currentItems.reduce((sum, item) => {
      return isMinQuantityAccessory(item.product) ? sum + item.quantity : sum
    }, 0)

    const hasMinQuantityAccessoryInCart = currentItems.some((item) => isMinQuantityAccessory(item.product))

    setShowAccessoryWarning(hasMinQuantityAccessoryInCart && totalMinQuantityAccessories < 20)
  }

  const addToCart = (product: Product, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      let newItems

      if (existing) {
        newItems = prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        newItems = [...prev, { product, quantity }]
      }
      updateAccessoryWarning(newItems)
      return newItems
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.product.id !== productId)
      updateAccessoryWarning(newItems)
      return newItems
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 0) return

    setItems((prev) => {
      const updatedItems = prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      updateAccessoryWarning(updatedItems)
      return updatedItems
    })
  }

  const clearCart = () => {
    setItems([])
    setShowAccessoryWarning(false)
    setIsDrawerOpen(false)
  }

  const getTotalPrice = () => {
    const total = items.reduce((sum, item) => {
      const pricePerUnit = getPricePerUnit(item.product)
      return sum + pricePerUnit * item.quantity
    }, 0)
    return total
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getPricePerUnit,
        getMinQuantityAccessoryTotal,
        showAccessoryWarning,
        isMinQuantityAccessory,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
