import { Suspense } from 'react';
import { getInitialServerData } from '@/lib/serverFetch';
import DashboardClient from './DashboardClient';

/**
 * Server Component: pre-fetch ringkasan data dari Google Sheets di sisi server
 * menggunakan ISR (revalidate 180 detik / 3 menit).
 * Data awal dikirim sebagai props ke Client Component agar hero section
 * langsung menampilkan angka yang benar tanpa kedipan "Memuat..." saat halaman
 * pertama kali dibuka.
 */
export default async function DashboardPage() {
  const initialData = await getInitialServerData();
  return (
    <Suspense fallback={null}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}
