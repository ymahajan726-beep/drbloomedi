import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DrBlooMedi - Hospital Management System',
  description: 'Enterprise Healthcare & EMR Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased">{children}</body>
    </html>
  );
}