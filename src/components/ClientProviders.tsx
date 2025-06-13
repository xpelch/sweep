'use client';
import type { Session } from "next-auth";
import { Toaster } from 'sonner';
import { Providers } from "~/app/providers";

export default function ClientProviders({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <>
      <Toaster theme="dark" position="bottom-right" richColors />
      <Providers session={session}>{children}</Providers>
    </>
  );
} 