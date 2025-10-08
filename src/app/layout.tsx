import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { siteMetadata } from "@/lib/brand-config";
import { AnalyticsPixels } from "@/components/analytics/pixels";

const poppinsBold = Poppins({
  weight: "700",
  variable: "--font-poppins-bold",
  subsets: ["latin"],
  display: "swap",
});

const poppinsRegular = Poppins({
  weight: "400",
  variable: "--font-poppins-regular",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-br" suppressHydrationWarning>
        <body
          className={`${poppinsRegular.variable} ${poppinsBold.variable} ${geistMono.variable} antialiased text-foreground`}
          suppressHydrationWarning
        >
          <AnalyticsPixels />
          <QueryProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
