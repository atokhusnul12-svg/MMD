'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Award,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { WAKA2_PROGRAMS } from '@/lib/waka2Config';

import CountUp from '@/components/motion/CountUp';

const ICON_MAP = {
  GraduationCap,
  BookOpen,
  Award,
};

export default function ProgramCards({ programStats = {} }) {
  const shouldReduceMotion = useReducedMotion();
  const programs = Object.values(WAKA2_PROGRAMS);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {programs.map((prog, idx) => {
        const IconComponent = ICON_MAP[prog.iconName] || GraduationCap;
        const stats = programStats[prog.id] || null;
        const rawPersen = stats?.persenKehadiranKeseluruhan || stats?.rataRataHadir || '100%';
        const persenNum = parseFloat(String(rawPersen).replace('%', '')) || 0;
        const persenDecimals = String(rawPersen).includes('.') ? 1 : 0;

        return (
          <motion.div
            key={prog.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }
            }
            whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="group relative bg-white rounded-2xl border border-[#DCE5E0] hover:border-[#1D7A6F]/40 shadow-xs hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Aksen visual atas kartu */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#1D7A6F] via-[#C6A66B] to-[#1D7A6F]" />

            <div className="p-5 sm:p-6 space-y-4 flex-1">
              {/* Header Kartu: Icon & Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#F7F5EF] text-[#1D7A6F] flex items-center justify-center shrink-0 border border-[#DCE5E0] group-hover:scale-108 group-hover:border-[#1D7A6F]/40 transition-transform duration-200">
                  <IconComponent className="w-6 h-6" />
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${prog.badgeColor.bg} ${prog.badgeColor.text} ${prog.badgeColor.border}`}
                >
                  <Sparkles className="w-3 h-3" />
                  {prog.shortName}
                </span>
              </div>

              {/* Judul & Deskripsi */}
              <div>
                <Link
                  href={`/waka-ii/${prog.slug}`}
                  className="group/title inline-block focus:outline-hidden"
                >
                  <h3 className="text-xl font-black text-[#26332E] font-serif group-hover/title:text-[#1D7A6F] transition-colors">
                    {prog.name}
                  </h3>
                </Link>
                <p className="text-xs font-semibold text-[#8C6D23] mt-0.5">{prog.tingkat}</p>
                <p className="text-xs text-[#5C6E66] mt-2 leading-relaxed line-clamp-3">
                  {prog.description}
                </p>
              </div>

              {/* Ringkasan Cepat */}
              <div className="pt-3 border-t border-[#DCE5E0]/70 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F7F5EF]/60 border border-[#DCE5E0]/50">
                  <span className="text-[10px] text-[#5C6E66] block font-medium">Total Anggota</span>
                  <span className="font-bold text-[#26332E] text-sm">
                    {stats?.totalSantri ? (
                      <>
                        <CountUp target={stats.totalSantri} duration={1000} formatThousand={false} /> Santri
                      </>
                    ) : (
                      'Tersinkron'
                    )}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F7F5EF]/60 border border-[#DCE5E0]/50">
                  <span className="text-[10px] text-[#5C6E66] block font-medium">Kehadiran Rata2</span>
                  <span className="font-bold text-[#1D7A6F] text-sm">
                    <CountUp
                      target={persenNum}
                      decimals={persenDecimals}
                      suffix="%"
                      duration={1000}
                    />
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Aksi Bawah: Absensi & Jurnal */}
            <div className="px-5 py-4 bg-[#F7F5EF]/50 border-t border-[#DCE5E0] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/waka-ii/${prog.slug}?tab=absensi`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#DCE5E0] hover:border-[#1D7A6F] text-[#26332E] hover:text-[#1D7A6F] text-xs font-semibold transition-all shadow-2xs hover:shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-[#1D7A6F]" />
                  <span>Absensi</span>
                </Link>

                <Link
                  href={`/waka-ii/${prog.slug}?tab=jurnal`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#DCE5E0] hover:border-[#8C6D23] text-[#26332E] hover:text-[#8C6D23] text-xs font-semibold transition-all shadow-2xs hover:shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[#8C6D23]" />
                  <span>Jurnal</span>
                </Link>
              </div>

              <Link
                href={`/waka-ii/${prog.slug}`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1D7A6F] text-white hover:bg-[#165E55] text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
              >
                <span>Buka Detail Program</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
