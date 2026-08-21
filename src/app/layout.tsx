
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import { CartProvider } from "@/context/context";
config.autoAddCss = false;
import "./globals.css";
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GlowRush | Exclusive GlowSticks & Trending Deals",
  description: "Discover GlowRush for exclusive glowsticks, trending deals, and fast shipping. Shop our curated collection today and elevate your lifestyle.",
  keywords: ["GlowRush", "online shopping", "trending deals", "exclusive glowsticks"],
  authors: [{ name: "Andrew" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "GlowRush | Exclusive GlowSticks & Trending Deals",
    description: "Discover GlowRush for exclusive glowsticks, trending deals, and fast shipping.",
    siteName: "GlowRush",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
   
        <html lang="en">
          <body>
          <CartProvider>
            <Header />
            {children}
            <Footer />
            </CartProvider>
            
          </body>
          </html>
  );
}
