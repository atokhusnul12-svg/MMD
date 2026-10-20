import React from 'react';
import {
  Users,
  FileText,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';
import ProgramCards from '@/components/waka2/ProgramCards';
import { getAllProgramSlugs } from '@/lib/waka2Config';
import { getWaka2Absensi } from '@/lib/fetchWaka2';

export const metadata = {
  title: 'WAKA II MMD • Pusat Informasi & Pemantauan Akademik',
  description:
    'Pusat pemantauan kegiatan akademik santri, absensi kehadiran, dan jurnal pembahasan kajian fiqih MMD Darussalamah.',
};

export default async function Waka2DashboardPage() {
  const slugs = getAllProgramSlugs();
  const programStats = {};

  // Fetch ringkasan data untuk masing-masing program secara paralel di server dengan ISR revalidate 60
  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const res = await getWaka2Absensi(slug, { revalidate: 60 });
        if (res && res.summary) {
          programStats[slug] = res.summary;
        }
      } catch (err) {
        console.warn(`Gagal memuat ringkasan awal program ${slug}:`, err.message);
      }
    })
  );

  return (
    <div className="space-y-8">
      {/* Header Halaman Dashboard WAKA II MMD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1D7A6F] to-[#124B44] text-white p-6 sm:p-8 lg:p-10 shadow-md">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-[#ECD8A5] border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-[#C6A66B]" />
            <span>Pusat Informasi &amp; Pemantauan Akademik</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight leading-tight">
            WAKA II MMD
          </h1>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
            Sistem pemantauan presensi santri dan jurnal kajian fiqih Madrasah Islamiyah Darussalamah.
            Kelola dan pantau aktivitas 3 program akademik terpadu yang tersinkron langsung dengan Google Sheets dan Google Docs.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-white/80">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#C6A66B]" /> 3 Program Utama
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#C6A66B]" /> Absensi Presensi Digital
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#C6A66B]" /> Jurnal Kajian Terbitan Web
            </span>
          </div>
        </div>

        {/* Pola dekorasi background */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* Grid 3 Kartu Program */}
      <section id="program-cards" className="space-y-4 scroll-mt-28 sm:scroll-mt-36">
        <div>
          <h2 className="text-xl font-black text-[#26332E] font-serif">
            Program Kegiatan Akademik
          </h2>
          <p className="text-xs text-[#5C6E66] mt-0.5">
            Pilih salah satu program untuk melihat tabel absensi anggota atau membuka jurnal pembahasan kajian
          </p>
        </div>

        <ProgramCards programStats={programStats} />
      </section>

      {/* Panel Informasi & Panduan Integrasi */}
      <section className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DCE5E0] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
        <h3 className="text-sm font-bold text-[#26332E] font-serif flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#1D7A6F]" />
          <span>Tentang Sumber Data &amp; Integrasi WAKA II MMD</span>
        </h3>
        <p className="text-xs text-[#5C6E66] leading-relaxed">
          Seluruh data presensi dan rekapitulasi kehadiran santri diambil secara otomatis dari Google Sheets melalui tautan publikasi CSV, sementara notulensi materi dan ibarot musyawarah terhubung langsung ke Google Docs resmi.
        </p>
      </section>
    </div>
  );
}
