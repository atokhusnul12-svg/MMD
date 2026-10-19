import React, { Suspense } from 'react';
import PortalClient from '@/components/portal/PortalClient';

export const metadata = {
  title: 'MMD • HOME — Majlis Musyawaroh Darussalam',
  description:
    'Halaman utama HOME Majlis Musyawaroh Darussalam (MMD), Madrasah Islamiyah Darussalamah, Pondok Pesantren Darussalam Sumbersari Kencong Pare Kediri.',
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#1D7A6F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#5C6B64]">Memuat HOME MMD...</p>
          </div>
        </div>
      }
    >
      <PortalClient />
    </Suspense>
  );
}
