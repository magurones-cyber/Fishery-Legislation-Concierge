import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "漁業関係法令コンシェルジュ",
  description: "水産行政、漁協、漁業者支援に特化したRAG型業務支援PWA",
  applicationName: "漁業関係法令コンシェルジュ",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "漁業法令"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b171d" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
