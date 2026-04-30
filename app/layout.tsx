import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DoH DNS Resolver',
  description: 'DNS over HTTPS Resolver',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
