import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const fraunces = localFont({
  src: [
    { path: "./fonts/Fraunces-var.ttf", style: "normal" },
    { path: "./fonts/Fraunces-Italic-var.ttf", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = localFont({
  src: [
    { path: "./fonts/Inter-var.ttf", style: "normal" },
    { path: "./fonts/Inter-Italic-var.ttf", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sabiá — Prática conversacional de idiomas",
  description:
    "Aplicativo de prática conversacional personalizada por machine learning. Projeto de pesquisa do MBA em Data Science e Analytics — USP ESALQ.",
  keywords: ["idiomas", "machine learning", "personalização", "pesquisa", "conversação"],
  authors: [{ name: "Ana Luiza Gonçalves César" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#243D2C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${inter.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
