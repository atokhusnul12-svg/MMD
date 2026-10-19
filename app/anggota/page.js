import { getAnggotaServerData } from '@/lib/sheets';
import AnggotaClient from './AnggotaClient';

/**
 * Next.js Server Component dengan Incremental Static Regeneration (ISR).
 * Menggunakan fetch(CSV_URL, { next: { revalidate: 60 } }) di sisi server.
 * Memastikan pemuatan data anggota instan tanpa loading di browser.
 */
export default async function AnggotaPage() {
  const { data, error } = await getAnggotaServerData({ revalidate: 60 });

  return <AnggotaClient initialData={data} serverError={error} />;
}
