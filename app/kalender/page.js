import { Suspense } from 'react';
import { getKalenderServerData } from '@/lib/sheets';
import KalenderMmdClient from '../kalender-mmd/KalenderMmdClient';
import PageLoading from '@/components/ui/PageLoading';

export const metadata = {
  title: 'Kalender MMD • Jadwal Agenda & Kalender Kerja Madrasah',
  description:
    'Pusat informasi dan jadwal kalender kerja Majlis Musyawaroh Darussalam (MMD), kegiatan madrasah, musyawarah, ujian, dan rutinitas santri.',
};

export default async function KalenderPage() {
  const { data, error } = await getKalenderServerData({ revalidate: 60 });

  return (
    <Suspense fallback={<PageLoading message="Memuat Kalender MMD..." minHeight="min-h-[350px]" />}>
      <KalenderMmdClient initialData={data} serverError={error} />
    </Suspense>
  );
}
