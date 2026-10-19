import React, { Suspense } from 'react';
import { getWaka1Data } from '@/lib/fetchWaka1';
import Waka1Client from '@/components/waka1/Waka1Client';

export const metadata = {
  title: 'WAKA I • Data Siswa & Kedisiplinan Takziran',
  description:
    'Pusat pemantauan data siswa dan kedisiplinan takziran bulanan Madrasah Islamiyah Darussalamah (MI, MTs, MA).',
};

export default async function Waka1Page() {
  let initialData = null;
  try {
    initialData = await getWaka1Data({ revalidate: 60 });
  } catch (err) {
    console.error('Error fetching initial WAKA I data:', err);
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#1D7A6F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#5C6B64]">Memuat data WAKA I...</p>
          </div>
        </div>
      }
    >
      <Waka1Client initialData={initialData} />
    </Suspense>
  );
}
