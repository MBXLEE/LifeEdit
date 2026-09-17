import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { LifeProvider } from "@/lib/life-store";

export const metadata: Metadata = {
  title: "The Life Edit",
  description: "A calm personal life operating system for intentional growth."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LifeProvider><AppShell>{children}</AppShell></LifeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
