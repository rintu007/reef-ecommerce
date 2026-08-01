import { createContext, useContext, useState } from "react";

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [market, setMarket] = useState(null); // null = not yet chosen

  return (
    <MarketContext.Provider value={{ market, setMarket }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  return useContext(MarketContext);
}