'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Pemetaan warna dan gaya untuk tiap status perkembangan (Islamic Contemporary Palette)
export const STATUS_COLORS = {
  'SENIOR - SANGAT BAIK': {
    color: '#1D7A6F',
    bgBadge: 'bg-[#E8F5F3]',
    textBadge: 'text-[#1D7A6F]',
    border: 'border-[#C8E3DC]',
  },
  'JUNIOR - SANGAT BAIK': {
    color: '#224A63',
    bgBadge: 'bg-[#EDF3F7]',
    textBadge: 'text-[#224A63]',
    border: 'border-[#B9D1E0]',
  },
  'ADAPTASI TOTAL': {
    color: '#436A5B',
    bgBadge: 'bg-[#EEF4F1]',
    textBadge: 'text-[#2A5243]',
    border: 'border-[#C3D8CE]',
  },
  'SENIOR - KURANG BAIK': {
    color: '#C6A66B',
    bgBadge: 'bg-[#FAF3E6]',
    textBadge: 'text-[#8C6D23]',
    border: 'border-[#E8D5A7]',
  },
  'DALAM MASA REPARASI': {
    color: '#C47C35',
    bgBadge: 'bg-[#FDF4EB]',
    textBadge: 'text-[#9A5212]',
    border: 'border-[#F0D0B4]',
  },
  'TERANCAM KELUAR': {
    color: '#A8382B',
    bgBadge: 'bg-[#FAF0ED]',
    textBadge: 'text-[#8A2F1B]',
    border: 'border-[#E8BCB0]',
  },
};

const DEFAULT_COLOR = {
  color: '#6E7C77',
  bgBadge: 'bg-[#F7F5EF]',
  textBadge: 'text-[#26332E]',
  border: 'border-[#DCE5E0]',
};

export default function PieChart({ statusCounts = {}, total = 0 }) {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Ubah statusCounts menjadi array terurut
  const data = Object.entries(statusCounts).map(([status, count]) => {
    const styling = STATUS_COLORS[status] || DEFAULT_COLOR;
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    return {
      status,
      count,
      percentage,
      color: styling.color,
      bgBadge: styling.bgBadge,
      textBadge: styling.textBadge,
      border: styling.border,
    };
  });

  // Urutkan dari jumlah terbanyak
  data.sort((a, b) => b.count - a.count);

  // Perhitungan SVG Donut Chart
  const size = 260;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay: 0.15, ease: [0.25, 0.1, 0.25, 1.0] }}
      whileHover={shouldReduceMotion ? undefined : { y: -3, transition: { duration: 0.22, ease: 'easeOut' } }}
      className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all duration-300 print-avoid-break"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-[#DCE5E0]">
        <div>
          <h3 className="text-lg font-bold text-[#26332E] font-serif">
            Distribusi Status Perkembangan Anggota
          </h3>
          <p className="text-xs text-[#5C6E66] mt-0.5">
            Proporsi kondisi evaluasi {total} santri Lembaga Bahtsul Masail
          </p>
        </div>

        <Link
          href="/anggota"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D7A6F] hover:underline no-print"
        >
          <span>Buka Data Anggota Lengkap</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C6A66B]" />
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 justify-around">
        
        {/* Visualisasi Donut Chart Menggunakan SVG */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-52 h-52 sm:w-64 sm:h-64 max-w-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F7F5EF"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {data.map((item, index) => {
              const strokeDasharray = `${(item.count / total) * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += item.count / total;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={item.status}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Teks di tengah Donut */}
          <Link
            href="/anggota"
            className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F] rounded-full"
            title="Klik untuk membuka Halaman Data Anggota LBM"
            aria-label={`Buka data anggota LBM (${total} santri terdaftar)`}
          >
            {hoveredIndex !== null ? (
              <>
                <span className="text-2xl font-black text-[#26332E] font-serif group-hover:text-[#1D7A6F] transition-colors">
                  {data[hoveredIndex].count}
                </span>
                <span className="text-xs font-bold text-[#1D7A6F]">
                  {data[hoveredIndex].percentage}%
                </span>
                <span className="text-[10px] text-[#5C6E66] max-w-[120px] truncate px-1">
                  {data[hoveredIndex].status}
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-[#26332E] tracking-tight font-serif group-hover:text-[#1D7A6F] transition-colors">
                  {total}
                </span>
                <span className="text-xs font-semibold text-[#5C6E66] group-hover:underline">
                  Total Anggota
                </span>
              </>
            )}
          </Link>
        </div>

        {/* Legend / Daftar Keterangan Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 w-full max-w-md">
          {data.map((item, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <Link
                key={item.status}
                href="/anggota"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2.5 rounded-lg transition-all duration-150 cursor-pointer border group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F] select-none ${
                  isHovered
                    ? 'bg-[#F7F5EF] border-[#1D7A6F] shadow-xs'
                    : 'bg-white border-[#DCE5E0] hover:bg-[#F7F5EF]/80 hover:border-[#1D7A6F]/40'
                }`}
                title={`Lihat santri dengan status ${item.status} di Halaman Anggota`}
                aria-label={`Lihat santri dengan status ${item.status} (${item.count} santri)`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-[#26332E] truncate group-hover:text-[#1D7A6F] transition-colors">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-bold text-[#26332E]">
                    {item.count} santri
                  </span>
                  <span className="text-[11px] font-medium text-[#5C6E66] w-12 text-right">
                    ({item.percentage}%)
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
}

