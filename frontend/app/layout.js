import './globals.css';

export const metadata = {
  title: 'Offisphere',
  description: 'Office management platform - Offisphere',
  icons: {
    icon: '/offisphere-logo.png',
    shortcut: '/offisphere-logo.png',
    apple: '/offisphere-logo.png'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        {children}
      </body>
    </html>
  );
}
