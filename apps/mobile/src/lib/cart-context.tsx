import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "reef-market-cart";

export interface CartItem {
  listingId: string;
  quantity: number;
  shippingMethod: "shipping" | "local_pickup";
  pickupTime?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (item: CartItem) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clear: () => void;
  clearItems: (listingIds: string[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.listingId === item.listingId);
      if (existing) return prev.map((i) => (i.listingId === item.listingId ? item : i));
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }, []);

  const updateQuantity = useCallback((listingId: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.listingId === listingId ? { ...i, quantity } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const clearItems = useCallback((listingIds: string[]) => {
    setItems((prev) => prev.filter((i) => !listingIds.includes(i.listingId)));
  }, []);

  return (
    <CartContext.Provider value={{ items, count: items.length, addItem, removeItem, updateQuantity, clear, clearItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
