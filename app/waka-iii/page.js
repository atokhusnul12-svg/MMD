import { Suspense } from 'react';
import { getInitialServerData } from '@/lib/serverFetch';
import DashboardClient from '@/app/DashboardClient';
import PageLoading from '@/components/ui/PageLoading';

export const metadata = {
  title: 'WAKA III • Lembaga Bahtsul Masail & Kalender Kerja MMD',
  description:
    'Pusat pembinaan anggota santri LBM, kalender kerja madrasah, delegasi musyawarah bahtsul masail, dan transparansi anggaran belanja WAKA III.',
};

export default async function Waka3DashboardPage() {
  const initialData = await getInitialServerData();
  return (
    <Suspense fallback={<PageLoading message="Memuat data WAKA III..." />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}
