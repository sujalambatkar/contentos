import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import ToasterProvider from "./components/ToasterProvider";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ContentOS — AI Content Repurposing",
  description:
    "Transform any transcript, blog post, or notes into platform-ready content for Twitter, LinkedIn, Instagram, and more — in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body
        className="min-h-screen bg-background text-warm font-body antialiased"
        suppressHydrationWarning
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
