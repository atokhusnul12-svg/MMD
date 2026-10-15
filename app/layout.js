import './globals.css';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/auth';
import { OneSignalProvider } from '@/components/OneSignalProvider';

export const metadata = {
  title: 'WAKA III — MMD Madrasah Islamiyah Darussalamah',
  description: 'Aplikasi Manajemen Anggota LBM dan Rekapitulasi Keuangan RAB & LPJ Terintegrasi Google Sheets',
  manifest: '/manifest.json',
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
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FDF6E3] text-[#2D3436] antialiased">
        {/* Load OneSignal Web SDK v16 */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />

        {/* Inisialisasi OneSignal Client */}
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
              const appId = "${oneSignalAppId}";
              if (appId && appId.trim().length > 0) {
                try {
                  await OneSignal.init({
                    appId: appId,
                    allowLocalhostAsSecureOrigin: true,
                    notifyButton: {
                      enable: false // Menggunakan tombol kustom bertema pesantren
                    }
                  });
                  console.log("[OneSignal v16] Berhasil diinisialisasi untuk WAKA III");
                } catch (e) {
                  console.warn("[OneSignal v16] Error inisialisasi:", e);
                }
              } else {
                console.info("[OneSignal] Menunggu konfigurasi NEXT_PUBLIC_ONESIGNAL_APP_ID");
              }
            });
          `}
        </Script>

        <AuthProvider>
          <OneSignalProvider appId={oneSignalAppId}>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
              {children}
            </main>
            <Footer />
          </OneSignalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
