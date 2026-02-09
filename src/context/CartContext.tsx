import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { CartItemInput } from '../types';

// 1. Define what a Cart Item looks like
export interface CartItem {
  id: number; // Product ID
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  store_id: number;
}

// 2. Define the Context Shape
interface CartContextType {
  items: CartItem[];
  addToCart: (product: CartItemInput) => void;
  removeFromCart: (productId: number) => void;
  decreaseCount: (productId: number) => void;
  clearCart: () => void;
  totalPrice: number;
  count: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Calculate generic total stats
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + (item.price * item.quantity), 0), [items]);

  // A. Add Item Logic
  const addToCart = useCallback((product: CartItemInput) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);

      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
        store_id: product.store_id ?? 0
      }];
    });
  }, []);

  // B. Remove Item Logic
  const removeFromCart = useCallback((productId: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
  }, []);

  // C. Decrease Count Logic
  const decreaseCount = useCallback((productId: number) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === productId);

      if (existingItem?.quantity === 1) {
        return currentItems.filter(item => item.id !== productId);
      }

      return currentItems.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  }, []);

  // D. Clear Cart Logic
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      decreaseCount,
      clearCart,
      totalPrice,
      count
      }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};