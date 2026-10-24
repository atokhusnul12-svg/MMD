import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProgramDetailClient from '@/components/waka2/ProgramDetailClient';
import { getProgramConfig, getAllProgramSlugs } from '@/lib/waka2Config';
import { getWaka2Absensi } from '@/lib/fetchWaka2';
import ProgramDetailSkeleton from '@/components/waka2/ProgramDetailSkeleton';

export async function generateStaticParams() {
  return getAllProgramSlugs().map((slug) => ({
    program: slug,
  }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const config = getProgramConfig(resolvedParams?.program);
  if (!config) {
    return {
      title: 'Program Tidak Ditemukan • WAKA II MMD',
    };
  }

  return {
    title: `${config.name} • WAKA II MMD`,
    description: config.description,
  };
}

async function ProgramDetailContent({ programPromise }) {
  const resolvedParams = await programPromise;
  const programSlug = resolvedParams?.program;
  const config = getProgramConfig(programSlug);

  if (!config) {
    notFound();
  }

  let absensiData = null;
  let serverError = null;

  try {
    absensiData = await getWaka2Absensi(config.id, { revalidate: 60 });
  } catch (err) {
    console.error(`Gagal memuat absensi server untuk program ${config.id}:`, err);
    serverError =
      err?.message ||
      'Gagal memuat data absensi dari Google Sheets. Silakan periksa koneksi atau tautan sumber CSV.';
  }

  return (
    <ProgramDetailClient
      program={config}
      initialData={absensiData}
      serverError={serverError}
    />
  );
}

export default function ProgramDetailPage({ params }) {
  return (
    <Suspense fallback={<ProgramDetailSkeleton />}>
      <ProgramDetailContent programPromise={params} />
    </Suspense>
  );
}

