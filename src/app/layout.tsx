import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Esquadra 271 | Horas de Voo C-295",
  description: "Aplicação de gestão de horas de voo da Esquadra 271 - C295, 27 RAVP - Angola.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#04080f]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
