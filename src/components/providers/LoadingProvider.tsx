import React, { createContext, useContext, useState } from "react";

// Loading context
export interface LoadingContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  text: string;
  setText: (text: string) => void;
  setLoadingWithText: (loading: boolean, text?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("Logging you in…");
  const setLoadingWithText = (loading: boolean, textOverride?: string) => {
    setLoading(loading);
    if (typeof textOverride === 'string') setText(textOverride);
  };
  const value = { loading, setLoading, text, setText, setLoadingWithText };
  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function BubblySpinner() {
  return (
    <div className="flex items-center justify-center space-x-2 h-8 my-2">
      <div className="w-3 h-3 bg-[#9F7AEA] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
      <div className="w-3 h-3 bg-[#B8B4D8] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
      <div className="w-3 h-3 bg-[#9F7AEA] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
    </div>
  );
}

export function LoadingOverlay() {
  const { loading, text } = useLoading();
  if (!loading) return null;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#18122B]/80 z-50 backdrop-blur-sm">
      <span className="text-white text-lg font-medium mb-4">{text}</span>
      <BubblySpinner />
    </div>
  );
}

export function SuspenseFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#18122B]/80 z-50 backdrop-blur-sm">
      <BubblySpinner />
    </div>
  );
} 