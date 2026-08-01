import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (listing) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === listing.id);
      const stock = listing.quantity || 1; // listing.quantity = available stock
      if (exists) {
        const newQty = Math.min(exists.quantity + 1, exists.stock || stock);
        return prev.map(i => i.id === listing.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { ...listing, stock, quantity: 1 }];
    });
  };

  const removeItem = (listingId) => {
    setItems(prev => prev.filter(i => i.id !== listingId));
  };

  const updateQuantity = (listingId, quantity) => {
    if (quantity <= 0) {
      removeItem(listingId);
    } else {
      setItems(prev => prev.map(i => {
        if (i.id !== listingId) return i;
        const capped = Math.min(quantity, i.stock || 1);
        return { ...i, quantity: capped };
      }));
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}