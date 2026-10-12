import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/auth';

export const metadata = {
  title: 'WAKA III — MMD Madrasah Islamiyah Darussalamah',
  description: 'Aplikasi Manajemen Anggota LBM dan Rekapitulasi Keuangan RAB & LPJ Terintegrasi Google Sheets',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '256x256', type: 'image/png' },
      { url: '/logo.png', sizes: '840x1024', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '256x256', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FDF6E3] text-[#2D3436] antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
