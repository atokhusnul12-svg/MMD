import { getKeuanganServerData } from '@/lib/sheets';
import KeuanganClient from './KeuanganClient';

/**
 * Next.js Server Component dengan Incremental Static Regeneration (ISR).
 * Menggunakan fetch(CSV_URL, { next: { revalidate: 60 } }) di sisi server.
 * Memastikan pemuatan data keuangan instan tanpa loading di browser.
 */
export default async function KeuanganPage() {
  const { data, error } = await getKeuanganServerData({ revalidate: 60 });

  return <KeuanganClient initialData={data} serverError={error} />;
}
