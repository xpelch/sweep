// src/components/ClientReady.tsx
"use client";
import { useEffect, useState } from "react";

export default function ClientReady({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);   // déclenché juste après le 1er paint
  return ready ? <>{children}</> : null; // ou un Spinner si tu préfères
}
