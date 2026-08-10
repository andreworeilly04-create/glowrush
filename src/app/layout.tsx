import type { Metadata } from "next"
import { Inter } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core"
config.autoAddCss = false;
import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css"

const inter = Inter({ subsets: ["latin"]})

export const metadata: Metadata = {
    title:"GlowRush"
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;

}) {
    return (
        <html lang="en">
            <body>{children}</body>
            </html>
    );
}