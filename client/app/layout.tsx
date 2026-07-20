import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TorqueWorks",
  description: "Real-time team task board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
