import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/medical-design.css";
import { Providers } from "@/components/providers";
import { EnhancedMedicalHeader } from "@/components/enhanced-medical-header";
import { MobileDebugInfo } from "@/components/mobile-debug";
import { PWAServiceWorker } from "@/components/pwa-service-worker";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PerformanceMonitor } from "@/components/performance-monitor";
import "@/lib/warmup"; // Auto-warmup database

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiverTracker - Medical Intelligence Platform",
  description: "World-class medical intelligence platform for liver health monitoring, analysis, and clinical decision support",
  keywords: ["liver health", "medical tracker", "health monitoring", "MELD score", "Child-Pugh", "medical calculator", "health analytics"],
  authors: [{ name: "LiverTracker Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LiverTracker",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "LiverTracker",
    title: "LiverTracker - Medical Intelligence Platform", 
    description: "World-class medical intelligence platform for liver health monitoring and analysis",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LiverTracker" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        {/* Splash Screens */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-medical-neutral-50`} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <EnhancedMedicalHeader />
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
          <PWAServiceWorker />
          <OfflineIndicator />
          <MobileDebugInfo />
          <PerformanceMonitor />
        </Providers>
      </body>
    </html>
  );
}
