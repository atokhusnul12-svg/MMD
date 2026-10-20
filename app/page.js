import React, { Suspense } from 'react';
import PortalClient from '@/components/portal/PortalClient';
import PageLoading from '@/components/ui/PageLoading';

export const metadata = {
  title: 'MMD • HOME — Majlis Musyawaroh Darussalam',
  description:
    'Halaman utama HOME Majlis Musyawaroh Darussalam (MMD), Madrasah Islamiyah Darussalamah, Pondok Pesantren Darussalam Sumbersari Kencong Pare Kediri.',
};

export default function HomePage() {
  return (
    <Suspense fallback={<PageLoading message="Memuat HOME MMD..." />}>
      <PortalClient />
    </Suspense>
  );
}
