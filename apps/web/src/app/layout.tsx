import "@fontsource-variable/manrope";
import "./globals.css";
import "./product.css";

import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";

import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  description: "Reconstrua seu tempo. Entenda sua jornada.",
  icons: {
    icon: "/brand/logo/rekko-logo-purple.svg",
  },
  title: {
    default: "Rekko",
    template: "%s · Rekko",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { color: "#f7f7fb", media: "(prefers-color-scheme: light)" },
    { color: "#0f1117", media: "(prefers-color-scheme: dark)" },
  ],
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <ThemeProvider>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
