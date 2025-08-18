import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MedicalHeader } from "@/components/medical-header";
import { MobileDebugInfo } from "@/components/mobile-debug";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiverTracker - Medical Data Intelligence",
  description: "Professional liver health tracking with AI-powered insights and medical-grade data analysis",
  keywords: ["liver health", "medical tracking", "lab results", "healthcare"],
  authors: [{ name: "LiverTracker Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-medical-neutral-50`} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <MedicalHeader />
            <main className="flex-1">
              {children}
            </main>
            <footer className="bg-white border-t border-medical-neutral-200 py-8 mt-16">
              <div className="medical-layout-container">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-medical-primary-500 to-medical-primary-600 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">🩺</span>
                    </div>
                    <span className="text-medical-neutral-600 text-sm">
                      © 2025 LiverTracker. Medical-grade health tracking.
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-medical-neutral-500">
                    <a href="#" className="hover:text-medical-primary-600 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-medical-primary-600 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-medical-primary-600 transition-colors">Support</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
          <MobileDebugInfo />
        </Providers>
      </body>
    </html>
  );
}
