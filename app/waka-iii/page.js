import { Suspense } from 'react';
import { getInitialServerData } from '@/lib/serverFetch';
import DashboardClient from '@/app/DashboardClient';

export const metadata = {
  title: 'WAKA III • Lembaga Bahtsul Masail & Administrasi MMD',
  description:
    'Pusat komando pembinaan santri LBM, monitoring agenda kalender kerja madrasah, koordinasi forum delegasi Bahtsul Masail, serta transparansi anggaran belanja (RAB & LPJ) terintegrasi Google Sheets.',
};

export default async function Waka3DashboardPage() {
  const initialData = await getInitialServerData();
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#1D7A6F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#5C6B64]">Memuat data WAKA III...</p>
          </div>
        </div>
      }
    >
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}
