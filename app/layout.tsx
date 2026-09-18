import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { ThemeProvider } from "@/components/theme-provider";
import { LifeProvider } from "@/lib/life-store";

export const metadata: Metadata = {
  applicationName: "LifeEdit",
  title: "The Life Edit",
  description: "A calm personal life operating system for intentional growth.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeEdit"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "192x192", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eef3f7"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PwaRegistrar />
        <ThemeProvider>
          <LifeProvider><AppShell>{children}</AppShell></LifeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
