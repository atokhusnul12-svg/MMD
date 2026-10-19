'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  GraduationCap,
  Layers,
  Wallet,
  CalendarDays,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function PortalWakaCards() {
  const wakaItems = [
    {
      id: 'waka-i',
      title: 'WAKA I',
      subtitle: 'Data Siswa & Kedisiplinan Takziran',
      badge: 'Bidang I • Kesiswaan',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'Pusat informasi 1.098 data santri madrasah jenjang MI, MTs, dan MA, monitoring catatan kedisiplinan dan rekapitulasi takziran bulanan santri terpadu dari Google Sheets.',
      icon: UserCheck,
      href: '/waka-i',
      buttonText: 'Buka Halaman WAKA I',
      features: [
        '1.098 Siswa Terdata (MI, MTs, MA)',
        'Rekap Takziran 6 Bulan Hijriyah',
        'Filter Status Disiplin Santri',
      ],
      accentGradient: 'from-[#1D7A6F] to-[#124B44]',
    },
    {
      id: 'waka-ii',
      title: 'WAKA II',
      subtitle: 'Program Tafaqquh & Tarbiyatul Mubahitsin',
      badge: 'Bidang II • Akademik',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
      description:
        'Pusat pemantauan kegiatan akademik santri, evaluasi kehadiran absensi multi-bulan dari Google Sheets, dan arsip jurnal pembahasan kajian fiqih dari Google Docs.',
      icon: GraduationCap,
      href: '/waka-ii',
      buttonText: 'Buka Halaman WAKA II',
      features: [
        'Tafaqquh Aliyah, Tsanawiyah & Mubahitsin',
        'Absensi Multi-Bulan & Persentase Kehadiran',
        'Integrasi Jurnal Pembahasan Google Docs',
      ],
      accentGradient: 'from-[#8C6D23] to-[#5C4512]',
    },
    {
      id: 'waka-iii',
      title: 'WAKA III',
      subtitle: 'Lembaga Bahtsul Masail & Santri LBM',
      badge: 'Bidang III • Administrasi',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      description:
        'Pusat komando pembinaan santri Lembaga Bahtsul Masail (LBM), pemantauan perkembangan anggota, dan koordinasi utusan delegasi forum ilmiah se-Jawa Madura.',
      icon: Layers,
      href: '/waka-iii',
      buttonText: 'Buka Dashboard WAKA III',
      features: [
        'Database Perkembangan Anggota LBM',
        'Utusan Delegasi Forum Bahtsul Masail',
        'Sinkronisasi Real-Time Google Sheets',
      ],
      accentGradient: 'from-[#1D7A6F] to-[#0D3832]',
    },
    {
      id: 'keuangan',
      title: 'KEUANGAN',
      subtitle: 'Transparansi Kas, RAB & LPJ Terpadu',
      badge: 'Bendahara • Keuangan',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'Pusat monitoring transparansi perputaran kas, rencana anggaran belanja (RAB), laporan pertanggungjawaban (LPJ), dan visualisasi distribusi realisasi per periode.',
      icon: Wallet,
      href: '/keuangan',
      buttonText: 'Buka Halaman Keuangan',
      features: [
        'Transparansi Kas & Sisa Saldo Periode',
        'Rencana Anggaran Belanja (RAB)',
        'Visualisasi Komposisi Realisasi LPJ',
      ],
      accentGradient: 'from-[#1D7A6F] to-[#124B44]',
    },
    {
      id: 'kalender-mmd',
      title: 'KALENDER MMD',
      subtitle: 'Kalender Kerja & Agenda Terstruktur',
      badge: 'Sekretariat • Agenda',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      description:
        'Pusat informasi kalender kerja madrasah, timeline kegiatan satu tahun ajaran MMD, agenda terdekat, hitung mundur hari, dan koordinasi penanggung jawab.',
      icon: CalendarDays,
      href: '/kalender-mmd',
      buttonText: 'Buka Kalender MMD',
      features: [
        'Timeline Kegiatan 1 Tahun Terpadu',
        'Sorotan Agenda Terdekat & Hitung Mundur',
        'Filter Bulan Hijriyah & Masehi',
      ],
      accentGradient: 'from-[#224A63] to-[#122A3A]',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Judul Section Pilar Organisasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#26332E] tracking-tight">
            Pusat Kepengurusan &amp; Layanan Terpadu
          </h2>
          <p className="text-xs sm:text-sm text-[#5C6E66]">
            Pilih bidang kepengurusan MMD untuk membuka sistem informasi dan manajemen data.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E6] text-[#8C6D23] text-xs font-semibold border border-[#E5D7B7] self-start sm:self-auto shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#C6A66B]" />
          <span>5 Menu Utama MMD</span>
        </div>
      </div>

      {/* Grid 5 Kartu Navigasi Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {wakaItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between bg-white rounded-2xl border border-[#DCE5E0] p-5 shadow-xs hover:shadow-md hover:border-[#1D7A6F] transition-all duration-200 overflow-hidden"
            >
              {/* Garis Aksen Warna saat Hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C6A66B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3.5">
                {/* Bagian Atas: Badge & Ikon */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6EF] group-hover:bg-[#E8F5F3] border border-[#DCE5E0] group-hover:border-[#1D7A6F]/30 flex items-center justify-center text-[#1D7A6F] transition-colors shadow-2xs shrink-0">
                    <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  </div>
                </div>

                {/* Judul & Subtitle */}
                <div>
                  <h3 className="text-lg sm:text-xl font-black font-serif text-[#26332E] group-hover:text-[#1D7A6F] transition-colors tracking-tight">
                    {item.title}
                  </h3>
                  <div className="text-[11px] font-semibold text-[#8C6D23] mt-0.5 line-clamp-1">
                    {item.subtitle}
                  </div>
                </div>

                {/* Deskripsi */}
                <p className="text-xs text-[#5C6E66] leading-relaxed line-clamp-3">
                  {item.description}
                </p>

                {/* Poin Fitur Utama */}
                <div className="pt-2 border-t border-[#F0EFE9] space-y-1.5">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#26332E]">
                      <CheckCircle2 className="w-3 h-3 text-[#1D7A6F] shrink-0 mt-0.5" />
                      <span className="leading-tight line-clamp-1">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol Masuk Menuju Halaman */}
              <div className="pt-4 mt-2">
                <Link
                  href={item.href}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF6EF] group-hover:bg-[#1D7A6F] text-[#1D7A6F] group-hover:text-white border border-[#DCE5E0] group-hover:border-[#1D7A6F] text-xs font-bold tracking-wide transition-all duration-200 shadow-2xs group-hover:shadow-sm"
                >
                  <span>{item.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
