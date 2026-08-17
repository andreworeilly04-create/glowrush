
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;
import "./globals.css";
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GlowRush",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
   
        <html lang="en">
          <body>
          <Header />
            {children}
            <Footer />
          </body>
          </html>
  );
}
