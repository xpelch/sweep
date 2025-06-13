"use client";
import { createContext, ReactNode, useContext } from "react";
import { useAlchemyPortfolio } from "./useAlchemyPortfolio";

// Infer the type from the hook
export type PortfolioContextType = ReturnType<typeof useAlchemyPortfolio>;

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const portfolio = useAlchemyPortfolio();
  return (
    <PortfolioContext.Provider value={portfolio}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within a PortfolioProvider");
  return ctx;
} 