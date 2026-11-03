import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScamPilot AI - Remote Control Investigation Agent",
  description: "Paste the message. Let AI investigate. You stay in control.",
  applicationName: "ScamPilot AI",
  keywords: ["scam detection", "phishing", "AI investigation", "cybersecurity"],
  authors: [{ name: "ScamPilot AI Team" }],
  openGraph: {
    title: "ScamPilot AI - Remote Control Investigation Agent",
    description: "Paste the message. Let AI investigate. You stay in control.",
    type: "website",
    siteName: "ScamPilot AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScamPilot AI - Remote Control Investigation Agent",
    description: "Paste the message. Let AI investigate. You stay in control.",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-ink-950 text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
