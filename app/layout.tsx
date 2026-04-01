import type { Metadata } from "next";
import "@fontsource/ibm-plex-mono";
import { OSProvider } from "@/lib/osContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "joof.dev",
  description: "J.O — portfolio as a desktop OS",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: '"IBM Plex Mono", monospace' }}
      >
        <OSProvider>{children}</OSProvider>
      </body>
    </html>
  );
}
