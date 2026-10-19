import { getBahsuServerData } from '@/lib/sheets';
import BahsuClient from './BahsuClient';

/**
 * Next.js Server Component dengan Incremental Static Regeneration (ISR).
 * Menggunakan fetch(CSV_URL, { next: { revalidate: 60 } }) di sisi server.
 * Memastikan pemuatan jadwal Bahtsul Masail instan tanpa loading di browser.
 */
export default async function BahsuPage() {
  const { data, anggotaList, error } = await getBahsuServerData({ revalidate: 60 });

  return (
    <BahsuClient
      initialData={data}
      initialAnggotaList={anggotaList}
      serverError={error}
    />
  );
}
