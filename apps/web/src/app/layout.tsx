import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { EULAGate } from "@/components/EULAGate";
import { UserPrefsModal } from "@/components/UserPrefsModal";
import { Header } from "@/components/Header";
import { CartProvider } from "@/lib/cart-context";
import { LanguageProvider } from "@/lib/language-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reef Market",
  description: "Buy and sell corals, fish, inverts, and aquarium equipment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <CartProvider>
            <EULAGate />
            <UserPrefsModal />
            <AnnouncementBanner />
            <Header />
            {children}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
