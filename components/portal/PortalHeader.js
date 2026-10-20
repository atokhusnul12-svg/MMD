'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Compass } from 'lucide-react';

export default function PortalHeader({ isAnimating = false }) {
  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 15 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-[#DCE5E0] p-6 sm:p-8 shadow-xs relative overflow-hidden"
    >
      {/* Garis Aksen Emas & Emerald di Bagian Atas */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D7A6F] via-[#C6A66B] to-[#124B44]" />

      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
        {/* Kolom Kiri: Logo & Teks Identitas */}
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-5">
          {/* Logo Resmi MMD */}
          <motion.div
            initial={isAnimating ? { opacity: 0, scale: 0.85 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FAF6EF] p-2 border border-[#DCE5E0] shadow-xs flex items-center justify-center shrink-0"
          >
            <Image
              src="/logo.png"
              alt="Logo Resmi MMD"
              width={80}
              height={80}
              priority
              className="w-full h-full object-contain filter drop-shadow-2xs"
            />
          </motion.div>

          {/* Teks Identitas Resmi */}
          <div className="space-y-1">
            <motion.div
              initial={isAnimating ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E8F5F3] text-[#1D7A6F] text-[11px] font-semibold border border-[#C8E3DC]"
            >
              <Sparkles className="w-3 h-3 text-[#C6A66B]" />
              <span>HOME • Majlis Musyawaroh Darussalam</span>
            </motion.div>

            <motion.div
              initial={isAnimating ? { opacity: 0, y: 12, scale: 0.95 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.4, ease: 'easeOut' }}
              className="flex items-center justify-center md:justify-start gap-2"
            >
              <h1 className="text-3xl sm:text-4xl font-black font-serif text-[#1D7A6F] tracking-tight">
                MMD
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]/40">
                HOME
              </span>
            </motion.div>

            <motion.p
              initial={isAnimating ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.65, ease: 'easeOut' }}
              className="text-base sm:text-lg font-bold text-[#26332E] font-serif leading-snug"
            >
              Majlis Musyawaroh Darussalam
            </motion.p>

            <motion.p
              initial={isAnimating ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.9, ease: 'easeOut' }}
              className="text-xs sm:text-sm text-[#5C6E66] leading-tight"
            >
              Madrasah Islamiyah Darussalamah • Pondok Pesantren Darussalam Sumbersari
            </motion.p>
          </div>
        </div>

        {/* Kolom Kanan: Quick Info */}
        <motion.div
          initial={isAnimating ? { opacity: 0, x: 10 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 1.05, ease: 'easeOut' }}
          className="flex flex-col items-center md:items-end gap-2 shrink-0"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF6EF] text-[#1D7A6F] text-xs font-semibold border border-[#DCE5E0]">
            <Compass className="w-4 h-4 text-[#C6A66B]" />
            <span>Waktu Istiwa&apos; &amp; 5 Pilar Layanan MMD</span>
          </div>
          <p className="text-[11px] text-[#5C6E66]">
            Pusat Informasi &amp; Layanan Data Terpadu
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
