import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'DrBlooMedi - Hospital Management System',
  description: 'Enterprise Healthcare & EMR Platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-slate-50 antialiased min-h-full flex flex-col overflow-x-hidden">
        <ToastProvider>
          <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}