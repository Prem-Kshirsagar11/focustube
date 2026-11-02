import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FocusTube",
  description: "Study smarter with Pomodoro-powered YouTube sessions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}