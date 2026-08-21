"use client";
import { createContext, useContext, useState, ReactNode } from "react";

const CartContext = createContext<any>(null);

export function CartProvider({ children } : { children: ReactNode }) {
    const [cart, setCart] = useState<any[]>([])

    const addToCart = (glowstick: any) => {
        setCart((prevCart) => [...prevCart, glowstick]);
    }; 

    const removefromCart = (id: string | number) => {
        setCart((prevCart: any) => prevCart.filter((item: any) => item.id !== id));
    }

    const updateQuantity = (id: string | number, quantity: number) => {
      setCart((prevCart: any) => 
      prevCart.map((item: any) => 
      item.id === id ? {
        ...item, quantity: Math.max(1, quantity) } : item
      )
      )
     }
    

    return (
        <CartContext.Provider value={{ cart, addToCart, removefromCart, updateQuantity}}>{children}</CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)