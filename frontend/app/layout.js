import './globals.css';

export const metadata = {
  title: 'Offisphere',
  description: 'Office management platform - Offisphere'
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
