"use client";

import { MiniAppProvider } from "@neynar/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import { PortfolioProvider } from "../lib/PortfolioProvider";

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
        <PortfolioProvider>
          <MiniAppProvider analyticsEnabled={false}>
            {children}
          </MiniAppProvider>
        </PortfolioProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
