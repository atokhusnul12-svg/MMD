import React, { Suspense } from 'react';
import { getWaka1Data } from '@/lib/fetchWaka1';
import Waka1Client from '@/components/waka1/Waka1Client';
import PageLoading from '@/components/ui/PageLoading';

export const metadata = {
  title: 'Data Santri dan Takziran • WAKA I MMD',
  description:
    'Sistem pendataan santri dan monitoring catatan kedisiplinan santri Madrasah Islamiyah Darussalamah (MI, MTs, MA).',
};

export default async function Waka1Page() {
  let initialData = null;
  try {
    initialData = await getWaka1Data({ revalidate: 60 });
  } catch (err) {
    console.error('Error fetching initial WAKA I data:', err);
  }

  return (
    <Suspense fallback={<PageLoading message="Memuat data santri & takziran..." />}>
      <Waka1Client initialData={initialData} />
    </Suspense>
  );
}
