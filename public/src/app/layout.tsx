import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PrivyWrapper from "@/components/privy-wrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import "@/lib/env"; // Validate environment variables

const grange = localFont({ src: "../assets/fonts/grange-heavy-condensed.otf", display: "auto", preload: true });
const aeonik = localFont({
  src: [
    {
      path: "../assets/fonts/aeonik/Aeonik-Thin.woff2",
      weight: "200",
    },
    {
      path: "../assets/fonts/aeonik/Aeonik-Light.woff2",
      weight: "300",
    },
    {
      path: "../assets/fonts/aeonik/Aeonik-Regular.woff2",
      weight: "400",
    },
    {
      path: "../assets/fonts/aeonik/Aeonik-Medium.woff2",
      weight: "500",
    },
    {
      path: "../assets/fonts/aeonik/Aeonik-Bold.woff2",
      weight: "700",
    },
  ],
  display: "swap",
  preload: true,
  variable: "--aeonik",
});

export const metadata: Metadata = {
  title: "DeVolt | Decentralized EV Charging Network",
  description: "The future of electric vehicle charging on the blockchain. Fast, secure, and decentralized charging stations worldwide.",
  keywords: ["EV charging", "blockchain", "decentralized", "electric vehicle", "crypto payments", "Web3"],
  authors: [{ name: "DeVolt Team" }],
  creator: "DeVolt Network",
  publisher: "DeVolt Network",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "DeVolt | Decentralized EV Charging Network",
    description: "The future of electric vehicle charging on the blockchain",
    type: "website",
    locale: "en_US",
    siteName: "DeVolt",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeVolt | Decentralized EV Charging Network",
    description: "The future of electric vehicle charging on the blockchain",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
        <style dangerouslySetInnerHTML={{ __html: `:root{--grange: ${grange.style.fontFamily};}` }}></style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Comprehensive error suppression for cross-origin and 404 errors
              window.addEventListener('error', function(e) {
                if (e.message && (
                  e.message.includes('ethereum') || 
                  e.message.includes('cross-origin') ||
                  e.message.includes('Cross-Origin-Opener-Policy') ||
                  e.message.includes('404') ||
                  e.message.includes('Failed to fetch')
                )) {
                  console.log('Suppressed cross-origin/404 error:', e.message);
                  e.preventDefault();
                  return false;
                }
              });
              
              // Suppress unhandled promise rejections
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && (
                  e.reason.toString().includes('ethereum') ||
                  e.reason.toString().includes('cross-origin') ||
                  e.reason.toString().includes('Cross-Origin-Opener-Policy') ||
                  e.reason.toString().includes('404')
                )) {
                  console.log('Suppressed promise rejection:', e.reason);
                  e.preventDefault();
                }
              });
              
              // Suppress console errors for specific patterns
              const originalConsoleError = console.error;
              console.error = function(...args) {
                const message = args.join(' ');
                if (message.includes('Cross-Origin-Opener-Policy') || 
                    message.includes('404') ||
                    message.includes('Failed to fetch')) {
                  return;
                }
                originalConsoleError.apply(console, args);
              };
            `,
          }}
        />
      </head>

      <body className={`${aeonik.variable} bg-black text-white`} suppressHydrationWarning={true}>
        <ErrorBoundary>
          <PerformanceMonitor />
          <PrivyWrapper>
            {children}
          </PrivyWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}