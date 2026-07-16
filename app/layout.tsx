import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'TorqueWorks Auto Repair',
  description: 'A modern demo site for a mechanic and auto repair business.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Shared shell keeps navigation and footer consistent on every page. */}
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}