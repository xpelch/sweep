"use client";

import { MiniAppProvider } from "@neynar/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import FarcasterReady from "~/components/FarcasterReady";
import { PortfolioProvider } from "~/components/providers/PortfolioProvider";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        <MiniAppProvider analyticsEnabled={false}>
          <PortfolioProvider>
          <FarcasterReady />
            {children}
          </PortfolioProvider>
        </MiniAppProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
