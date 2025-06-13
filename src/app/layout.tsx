import type { Metadata } from "next";

import "~/app/globals.css";
import { getSession } from "~/auth";
import { APP_DESCRIPTION, APP_NAME } from "~/lib/constants";
import ClientProviders from "../components/ClientProviders";
import FarcasterReady from "../components/FarcasterReady";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  const session = await getSession()


  return (
    <html lang="en">
      <head>
        {/* Farcaster Frame Embed Meta Tag */}
        <meta name="fc:frame" content='{"version":"next","imageUrl":"https://yourdomain.com/opengraph-image","button":{"title":"🚩 Start","action":{"type":"launch_frame","url":"https://yourdomain.com","name":"Sweep","splashImageUrl":"https://yourdomain.com/logo.png","splashBackgroundColor":"#f5f0ec"}}}' />
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Sweep Mini App" />
        <meta property="og:description" content="A secure, dockerized Farcaster Mini App." />
        <meta property="og:image" content="https://yourdomain.com/opengraph-image" />
      </head>
      <body>
          <FarcasterReady />
          <ClientProviders session={session}>{children}</ClientProviders>
      </body>
    </html>
  );
}
