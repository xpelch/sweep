"use client";

import type { Session } from "next-auth";
import Image from "next/image";
import React, { Suspense, useState } from "react";
import WalletSweep from "~/components/WalletSweep";
import { LoadingOverlay, LoadingProvider, SuspenseFallback, useLoading } from "~/components/providers/LoadingProvider";
import { Providers } from "./providers";

export default function App({ session }: { session: Session | null }) {
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);


  React.useEffect(() => {
    const splashTimeout = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(splashTimeout);
  }, []);

  return (
    <Providers session={session}>
      <LoadingProvider>
        <LoadingSync showSplash={showSplash} ready={ready} />
        <main className="min-h-screen bg-[#18122B] flex items-center justify-center relative">
          {showSplash ? (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <Image src="/icon-no-background.png" alt="Sweep Logo" width={80} height={80} className="rounded-2xl" priority />
            </div>
          ) : (
            <Suspense fallback={<SuspenseFallback />}>
              <>
                <WalletSweep onReady={() => setReady(true)} />
                <LoadingOverlay />
              </>
            </Suspense>
          )}
        </main>
      </LoadingProvider>
    </Providers>
  );
}

function LoadingSync({ showSplash, ready }: { showSplash: boolean; ready: boolean }) {
  const { setLoadingWithText } = useLoading();
  React.useEffect(() => {
    if (!showSplash && !ready) {
      setLoadingWithText(true, "Logging you in…");
    } else {
      setLoadingWithText(false);
    }
  }, [showSplash, ready, setLoadingWithText]);
  return null;
}
