import { Suspense } from 'react';
import { getKalenderServerData } from '@/lib/sheets';
import KalenderMmdClient from './KalenderMmdClient';

export const metadata = {
  title: 'Kalender MMD • Jadwal Agenda & Kalender Kerja Madrasah',
  description:
    'Pusat informasi dan jadwal kalender kerja Majlis Musyawaroh Darussalam (MMD), kegiatan madrasah, musyawarah, ujian, dan rutinitas santri.',
};

export default async function KalenderMmdPage() {
  const { data, error } = await getKalenderServerData({ revalidate: 60 });

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="text-center space-y-3">
            <div className="w-9 h-9 border-3 border-[#1D7A6F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#5C6E66]">Memuat Kalender MMD...</p>
          </div>
        </div>
      }
    >
      <KalenderMmdClient initialData={data} serverError={error} />
    </Suspense>
  );
}
