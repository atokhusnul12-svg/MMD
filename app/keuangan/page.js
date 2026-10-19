import { Suspense } from 'react';
import { getKeuanganServerData } from '@/lib/sheets';
import KeuanganClient from './KeuanganClient';

export const metadata = {
  title: 'KEUANGAN • Transparansi Anggaran Kas, RAB & LPJ MMD',
  description:
    'Pusat transparansi dan akuntabilitas keuangan MMD Darussalamah, rekapitulasi anggaran subsidi masuk (RAB), realisasi belanja berkala (LPJ), dan saldo kas.',
};

export default async function KeuanganPage() {
  const { data, error } = await getKeuanganServerData({ revalidate: 60 });

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="text-center space-y-3">
            <div className="w-9 h-9 border-3 border-[#1D7A6F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#5C6E66]">Memuat data Keuangan...</p>
          </div>
        </div>
      }
    >
      <KeuanganClient initialData={data} serverError={error} />
    </Suspense>
  );
}
