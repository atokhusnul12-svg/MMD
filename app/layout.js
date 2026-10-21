import './globals.css';
import { Lora, Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import AutoScrollManager from '@/components/AutoScrollManager';
import { AuthProvider } from '@/lib/auth';
import MotionProvider from '@/components/motion/MotionProvider';

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'MMD • Majlis Musyawaroh Darussalam — Madrasah Islamiyah Darussalamah',
  description:
    'Portal Resmi Majlis Musyawaroh Darussalam (MMD), Madrasah Islamiyah Darussalamah, Pondok Pesantren Darussalam Sumbersari Kencong Pare Kediri.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`h-full scroll-smooth ${lora.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-[#F7F5EF] text-[#26332E] font-sans antialiased">
        <AuthProvider>
          <MotionProvider>
            <AutoScrollManager />
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-5 lg:py-6">
              {children}
            </main>
            <Footer />
            <ScrollToTop />
          </MotionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
