import { getKeuanganServerData } from '@/lib/sheets';
import KeuanganClient from './KeuanganClient';

export const metadata = {
  title: 'KEUANGAN • Transparansi Anggaran Kas, RAB & LPJ MMD',
  description:
    'Pusat transparansi dan akuntabilitas keuangan MMD Darussalamah, rekapitulasi anggaran subsidi masuk (RAB), realisasi belanja berkala (LPJ), dan saldo kas.',
};

export default async function KeuanganPage() {
  const { data, error } = await getKeuanganServerData({ revalidate: 60 });

  return <KeuanganClient initialData={data} serverError={error} />;
}
