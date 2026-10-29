'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

export default function PortalHeader() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-[#DCE5E0] p-3.5 sm:p-4.5 lg:p-5 shadow-xs relative overflow-hidden"
    >
      {/* Garis Aksen Emas & Emerald di Bagian Atas */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D7A6F] via-[#C6A66B] to-[#124B44]" />

      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3 sm:gap-4 text-center md:text-left">
        {/* Kolom Kiri: Logo & Teks Identitas */}
        <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4">
          {/* Logo Resmi MMD */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#FAF6EF] p-1.5 border border-[#DCE5E0] shadow-2xs flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="Logo Resmi MMD"
              width={64}
              height={64}
              priority
              className="w-full h-full object-contain filter drop-shadow-2xs"
            />
          </div>

          {/* Teks Identitas Resmi */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#1D7A6F] tracking-tight leading-none">
                MMD
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]/40">
                HOME
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-[#26332E] font-serif leading-tight">
              Majlis Musyawaroh Darussalam
            </p>

            <p className="text-[11px] sm:text-xs text-[#5C6E66] leading-tight">
              Madrasah Islamiyah Darussalamah • Pondok Pesantren Darussalam Sumbersari
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Quick Info */}
        <div className="flex flex-col items-center md:items-end gap-1 shrink-0">
          <p className="text-xs text-[#5C6E66] font-medium">
            Pusat Informasi &amp; Layanan Data Terpadu
          </p>
        </div>
      </div>
    </motion.div>
  );
}
