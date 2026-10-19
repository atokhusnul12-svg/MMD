import { getKalenderServerData } from '@/lib/sheets';
import KalenderMmdClient from './KalenderMmdClient';

export const metadata = {
  title: 'Kalender MMD • Jadwal Agenda & Kalender Kerja Madrasah',
  description:
    'Pusat informasi dan jadwal kalender kerja Majlis Musyawaroh Darussalam (MMD), kegiatan madrasah, musyawarah, ujian, dan rutinitas santri.',
};

export default async function KalenderMmdPage() {
  const { data, error } = await getKalenderServerData({ revalidate: 60 });

  return <KalenderMmdClient initialData={data} serverError={error} />;
}
