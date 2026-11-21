import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/Toaster";
import { CRYPTO_RANDOM_UUID_POLYFILL } from "@/lib/crypto-random-uuid-inline";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlanta Telecables Ops",
  description: "Plant P&L daily entry and operations",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-app">
        <Script
          id="crypto-randomuuid-polyfill"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: CRYPTO_RANDOM_UUID_POLYFILL }}
        />
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
