import type { Metadata } from "next";

import "~/app/globals.css";
import { getSession } from "~/auth";
import { APP_DESCRIPTION, APP_ICON_URL, APP_NAME, APP_OG_IMAGE_URL, APP_URL } from "~/lib/constants";
import ClientProviders from "../components/ClientProviders";

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
  {/* Base */} 
  <meta charSet="utf-8" />
  <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{APP_NAME}</title>
  <meta name="description" content={APP_DESCRIPTION} />
  <meta property="og:image" content={APP_OG_IMAGE_URL} /> {/* Add a fid to the url to get the user's avatar */}

  {/* Favicon / manifest */}
  <link rel="icon" href={APP_ICON_URL} sizes="any" />
  <link rel="apple-touch-icon" href={APP_ICON_URL} />
  <meta name="theme-color" content="#121212" />

  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content={APP_URL} />
  <meta property="og:title" content={APP_NAME} />
  <meta property="og:description" content={APP_DESCRIPTION} />
  <meta property="og:image" content={APP_OG_IMAGE_URL} />

  {/* Twitter Card */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@SWEEP_APP" />
  <meta name="twitter:title" content={APP_NAME} />
  <meta name="twitter:description" content={APP_DESCRIPTION} />
  <meta name="twitter:image" content={APP_OG_IMAGE_URL} />

  {/* Farcaster Frame vNext */}
  <meta
    name="fc:frame"
    content={`{
      "version":"vNext",
      "imageUrl":"${APP_OG_IMAGE_URL}",
      "button":{
        "title":"🚩 Start",
        "action":{
          "type":"launch_frame",
          "url":"${APP_URL}",
          "name":"${APP_NAME}",
          "splashImageUrl":"${APP_ICON_URL}",
          "splashBackgroundColor":"#f5f0ec"
        }
      }
    }`.replace(/\s+/g, '')}  /* compresse le JSON inline */
  />
</head>

      <body>
          <ClientProviders session={session}>{children}</ClientProviders>
      </body>
    </html>
  );
}
