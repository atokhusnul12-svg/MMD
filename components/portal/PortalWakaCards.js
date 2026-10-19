'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  GraduationCap,
  Layers,
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
        'Filter Status Disiplin & Perhatian Khusus',
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
        'Tafaqquh Aliyah & Tsanawiyah, Tarbiyatul Mubahitsin',
        'Absensi Multi-Bulan & Persentase Kehadiran',
        'Integrasi Jurnal Pembahasan Google Docs',
      ],
      accentGradient: 'from-[#8C6D23] to-[#5C4512]',
    },
    {
      id: 'waka-iii',
      title: 'WAKA III',
      subtitle: 'Lembaga Bahtsul Masail, Kalender & Keuangan',
      badge: 'Bidang III • Administrasi',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      description:
        'Pusat komando pembinaan santri LBM, monitoring agenda kalender kerja madrasah, delegasi forum Bahtsul Masail antar-pesantren, dan transparansi anggaran belanja (RAB & LPJ).',
      icon: Layers,
      href: '/waka-iii',
      buttonText: 'Buka Dashboard WAKA III',
      features: [
        'Database Perkembangan Anggota LBM',
        'Utusan Delegasi Forum Bahtsul Masail',
        'Kalender Kerja 1 Tahun & Transparansi RAB/LPJ',
      ],
      accentGradient: 'from-[#1D7A6F] to-[#0D3832]',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Judul Section Tiga Pilar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#26332E] tracking-tight">
            Pusat Kepengurusan &amp; Divisi Terpadu
          </h2>
          <p className="text-xs sm:text-sm text-[#5C6E66]">
            Pilih bidang kepengurusan MMD untuk membuka sistem informasi dan manajemen data.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E6] text-[#8C6D23] text-xs font-semibold border border-[#E5D7B7] self-start sm:self-auto shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#C6A66B]" />
          <span>3 Pilar Organisasi</span>
        </div>
      </div>

      {/* Grid 3 Kartu Navigasi Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {wakaItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between bg-white rounded-2xl border border-[#DCE5E0] p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#1D7A6F] transition-all duration-200 overflow-hidden"
            >
              {/* Garis Aksen Warna saat Hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C6A66B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                {/* Bagian Atas: Badge & Ikon */}
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-[#FAF6EF] group-hover:bg-[#E8F5F3] border border-[#DCE5E0] group-hover:border-[#1D7A6F]/30 flex items-center justify-center text-[#1D7A6F] transition-colors shadow-2xs shrink-0">
                    <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                  </div>
                </div>

                {/* Judul & Subtitle */}
                <div>
                  <h3 className="text-2xl font-black font-serif text-[#26332E] group-hover:text-[#1D7A6F] transition-colors tracking-tight">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-[#8C6D23] mt-0.5">
                    {item.subtitle}
                  </div>
                </div>

                {/* Deskripsi */}
                <p className="text-xs sm:text-[13px] text-[#5C6E66] leading-relaxed">
                  {item.description}
                </p>

                {/* Poin Fitur Utama */}
                <div className="pt-2 border-t border-[#F0EFE9] space-y-1.5">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#26332E]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1D7A6F] shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol Masuk Menuju Halaman WAKA */}
              <div className="pt-5 mt-4">
                <Link
                  href={item.href}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF6EF] group-hover:bg-[#1D7A6F] text-[#1D7A6F] group-hover:text-white border border-[#DCE5E0] group-hover:border-[#1D7A6F] text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 shadow-2xs group-hover:shadow-sm"
                >
                  <span>{item.buttonText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
