"use client";

import { useState } from "react";
import { Providers } from "./providers";
import WalletSweep from "~/components/WalletSweep";
import type { Session } from "next-auth";
import Image from "next/image";
import React from "react";

export default function App({ session }: { session: Session | null }) {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Splash for 1.5s, then show WalletSweep and overlay spinner until ready
  React.useEffect(() => {
    const splashTimeout = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(splashTimeout);
  }, []);

  return (
    <Providers session={session}>
      <main className="min-h-screen bg-[#18122B] flex items-center justify-center relative">
        {showSplash ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <Image src="/icon.png" alt="Sweep Logo" width={140} height={140} className="rounded-2xl" priority />
          </div>
        ) : (
          <>
            <WalletSweep onReady={() => setReady(true)} />
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#18122B]/80 z-50 backdrop-blur-sm">
                <span className="text-white text-lg font-medium mb-4">Logging you in…</span>
                <span className="w-8 h-8 border-4 border-[#9F7AEA] border-t-transparent rounded-full animate-spin block"></span>
              </div>
            )}
          </>
        )}
      </main>
    </Providers>
  );
}
