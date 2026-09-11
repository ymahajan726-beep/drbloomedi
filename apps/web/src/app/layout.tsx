import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';
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
    <html lang="en" className="h-full" data-theme="light">
      <body className="antialiased min-h-full flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white">
        <ThemeProvider>
          <ToastProvider>
            {/* Official Razorpay Checkout Script Injection */}
            <script src="https://checkout.razorpay.com/v1/checkout.js" async />

            <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
              {children}
            </div>

            {/* Global Theme Button */}
            <div className="fixed right-5 bottom-5 z-[9999]">
              <ThemeToggle />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}