import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from './components/Navigation';

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BNHP Mobile Apps Scanner",
  description: "BNHP Mobile Apps Scanner",
  icons: {
    icon: [
      { url: '/bnhp_logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/bnhp_logo.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/bnhp_logo.png',
    apple: '/bnhp_logo.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${geistSans.className} antialiased min-h-screen bg-background`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}