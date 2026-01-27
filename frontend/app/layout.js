import "./globals.css";
import RegisterSW from "./pwa/RegisterSW";

export const metadata = {
  title: "Offisphere",
  description: "Office management platform - Offisphere",
  icons: {
    icon: "/offisphere-logo.png",
    shortcut: "/offisphere-logo.png",
    apple: "/offisphere-logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/offisphere-logo.png" />
      </head>
      <body className="min-h-screen bg-slate-100 text-slate-900">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
