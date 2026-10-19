import { getKalenderServerData } from '@/lib/sheets';
import KalenderClient from './KalenderClient';

/**
 * Next.js Server Component dengan Incremental Static Regeneration (ISR).
 * Menggunakan fetch(CSV_URL, { next: { revalidate: 60 } }) di sisi server.
 * Memastikan pemuatan Kalender Kerja instan tanpa loading di browser.
 */
export default async function KalenderPage() {
  const { data, error } = await getKalenderServerData({ revalidate: 60 });

  return <KalenderClient initialData={data} serverError={error} />;
}
