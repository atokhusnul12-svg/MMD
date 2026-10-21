import React, { Suspense } from 'react';
import { getWaka1Data } from '@/lib/fetchWaka1';
import Waka1Client from '@/components/waka1/Waka1Client';
import Waka1Skeleton from '@/components/waka1/Waka1Skeleton';

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
    <Suspense fallback={<Waka1Skeleton />}>
      <Waka1Client initialData={initialData} />
    </Suspense>
  );
}
