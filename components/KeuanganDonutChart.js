'use client';

import React, { useState, useMemo } from 'react';
import { formatRupiah } from '@/lib/fetchCSV';
import { Wallet, PieChart as PieChartIcon, TrendingDown, Info, ArrowUpRight } from 'lucide-react';

// Palet warna harmonis tema web WAKA III (Teal / Tosca / Hijau Islami / Warm Gold / Coral)
export const KEUANGAN_COLORS = [
  {
    color: '#2A9D8F',
    bgBadge: 'bg-[#2A9D8F]/15',
    textBadge: 'text-[#1D7A6F]',
    border: 'border-[#2A9D8F]/30',
    lightBg: 'bg-[#E8F5F3]',
  },
  {
    color: '#38A3A5',
    bgBadge: 'bg-[#38A3A5]/15',
    textBadge: 'text-[#22577A]',
    border: 'border-[#38A3A5]/30',
    lightBg: 'bg-[#EAF4F4]',
  },
  {
    color: '#E9C46A',
    bgBadge: 'bg-[#E9C46A]/25',
    textBadge: 'text-[#8A6D14]',
    border: 'border-[#E9C46A]/40',
    lightBg: 'bg-[#FDF6E3]',
  },
  {
    color: '#57CC99',
    bgBadge: 'bg-[#57CC99]/20',
    textBadge: 'text-[#2D6A4F]',
    border: 'border-[#57CC99]/30',
    lightBg: 'bg-[#EBFBF4]',
  },
  {
    color: '#F4A261',
    bgBadge: 'bg-[#F4A261]/20',
    textBadge: 'text-[#B2531F]',
    border: 'border-[#F4A261]/40',
    lightBg: 'bg-[#FFF3EB]',
  },
  {
    color: '#22577A',
    bgBadge: 'bg-[#22577A]/15',
    textBadge: 'text-[#153B54]',
    border: 'border-[#22577A]/30',
    lightBg: 'bg-[#E9F1F6]',
  },
  {
    color: '#E76F51',
    bgBadge: 'bg-[#E76F51]/20',
    textBadge: 'text-[#9B2226]',
    border: 'border-[#E76F51]/40',
    lightBg: 'bg-[#FDF0ED]',
  },
];

export default function KeuanganDonutChart({
  rekapitulasi = [],
  totalPengeluaran = 0,
  isLoading = false,
  error = null,
  selectedBulan = 'TOTAL',
  onSelectBulan = () => {},
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Filter hanya periode yang valid dan bukan baris TOTAL
  const validPeriods = useMemo(() => {
    if (!rekapitulasi || !Array.isArray(rekapitulasi)) return [];
    return rekapitulasi.filter(
      (item) => item && item.bulan && !item.bulan.toUpperCase().includes('TOTAL')
    );
  }, [rekapitulasi]);

  // Hitung total pengeluaran dari seluruh periode jika tidak disediakan
  const calculatedTotal = useMemo(() => {
    if (totalPengeluaran && totalPengeluaran > 0) return totalPengeluaran;
    return validPeriods.reduce((acc, curr) => acc + (curr.pengeluaran || 0), 0);
  }, [validPeriods, totalPengeluaran]);

  // Siapkan data chart beserta warna dan persentase
  const chartData = useMemo(() => {
    if (calculatedTotal <= 0) return [];

    return validPeriods.map((item, index) => {
      const palette = KEUANGAN_COLORS[index % KEUANGAN_COLORS.length];
      const pengeluaran = item.pengeluaran || 0;
      const percentageNum = calculatedTotal > 0 ? (pengeluaran / calculatedTotal) * 100 : 0;
      const percentage = percentageNum.toFixed(1);

      return {
        bulan: item.bulan,
        pengeluaran,
        subsidi: item.subsidi || 0,
        saldo: item.saldo || 0,
        percentageNum,
        percentage,
        color: palette.color,
        bgBadge: palette.bgBadge,
        textBadge: palette.textBadge,
        border: palette.border,
        lightBg: palette.lightBg,
        keterangan: item.keterangan || '',
      };
    });
  }, [validPeriods, calculatedTotal]);

  // Dimensi SVG Donut
  const size = 280;
  const strokeWidth = 38;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Akumulasi rotasi stroke dashoffset
  let accumulatedPercent = 0;

  // Item yang sedang aktif di-hover (atau fallback ke periode yang dipilih via filter tab jika cocok)
  const activeHoverItem = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  // 1. STATE LOADING (SKELETON SHIMMER)
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#2A9D8F]/15 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
            <div className="h-3 bg-gray-100 rounded w-64"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-28"></div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
          <div className="w-56 h-56 rounded-full bg-gray-200/80 animate-pulse relative flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-white"></div>
          </div>
          <div className="space-y-3 w-full max-w-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. STATE ERROR
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-5 text-sm flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm">Gagal Menampilkan Diagram Pengeluaran</h4>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // 3. STATE EMPTY
  if (chartData.length === 0 || calculatedTotal <= 0) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-xs border border-[#2A9D8F]/15 text-center text-gray-400">
        <PieChartIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-600">Belum ada data pengeluaran yang terdata</p>
        <p className="text-xs text-gray-400 mt-1">Data akan otomatis muncul saat LPJ tercatat di Google Sheets.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#2A9D8F]/15">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F3] text-[#1D7A6F] text-xs font-semibold mb-1">
            <PieChartIcon className="w-3.5 h-3.5" />
            Visualisasi Distribusi Keuangan
          </div>
          <h3 className="font-extrabold text-xl text-[#2D3436] tracking-tight flex items-center gap-2">
            Proporsi Realisasi Pengeluaran (LPJ) Antar Periode
          </h3>
          <p className="text-xs sm:text-sm text-[#636E72] mt-0.5">
            Komposisi dan persentase penyerapan dana dari total realisasi {formatRupiah(calculatedTotal)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#1D7A6F] bg-[#E8F5F3] px-3 py-1.5 rounded-xl border border-[#2A9D8F]/20">
            {chartData.length} Periode Terdata
          </span>
        </div>
      </div>

      {/* Konten Utama Donut Chart & Legenda */}
      <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
        
        {/* ============================================================== */}
        {/* 1. VISUAL DONUT CHART (SVG MODERN)                             */}
        {/* ============================================================== */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 drop-shadow-xs"
          >
            {/* Background Ring Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F4EFE6"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Slices Tiap Periode */}
            {chartData.map((item, index) => {
              const fraction = item.pengeluaran / calculatedTotal;
              const strokeDasharray = `${fraction * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += fraction;

              const isHovered = hoveredIndex === index;
              const isSelected = selectedBulan === item.bulan;
              const highlight = isHovered || isSelected;

              return (
                <circle
                  key={item.bulan}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={highlight ? strokeWidth + 7 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  strokeLinecap="butt"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: hoveredIndex !== null && !highlight ? 0.45 : 1,
                    filter: highlight ? 'drop-shadow(0px 3px 6px rgba(0,0,0,0.15))' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectBulan(item.bulan)}
                />
              );
            })}
          </svg>

          {/* Teks Ringkasan di Tengah Lubang Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
            {activeHoverItem ? (
              <div className="animate-fade-in space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#636E72] block max-w-[140px] truncate">
                  {activeHoverItem.bulan}
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#2D3436] tracking-tight block">
                  {formatRupiah(activeHoverItem.pengeluaran)}
                </span>
                <span
                  className="inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white shadow-xs"
                  style={{ backgroundColor: activeHoverItem.color }}
                >
                  {activeHoverItem.percentage}% dari Total
                </span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#636E72] block">
                  Total Realisasi (LPJ)
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#2D3436] tracking-tight block">
                  {formatRupiah(calculatedTotal)}
                </span>
                <span className="text-[11px] font-semibold text-[#1D7A6F] block">
                  100% ({chartData.length} Periode)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. LEGENDA & DETAIL NOMINAL PER PERIODE                        */}
        {/* ============================================================== */}
        <div className="flex-1 w-full max-w-lg space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#636E72] px-2 mb-1">
            <span>Nama Periode Bulan</span>
            <span>Nominal Realisasi &amp; Porsi</span>
          </div>

          <div className="space-y-2">
            {chartData.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const isSelected = selectedBulan === item.bulan;
              const highlight = isHovered || isSelected;

              return (
                <div
                  key={item.bulan}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectBulan(item.bulan)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
                    highlight
                      ? 'bg-[#FFFCF5] border-[#2A9D8F]/50 shadow-xs translate-x-1'
                      : 'bg-[#FDFCFB] border-gray-100 hover:bg-[#FFFCF5] hover:border-gray-200'
                  }`}
                >
                  {/* Sisi Kiri: Dot Warna & Nama Periode */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs transition-transform duration-200"
                      style={{
                        backgroundColor: item.color,
                        transform: highlight ? 'scale(1.3)' : 'scale(1)',
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${highlight ? 'text-[#1D7A6F]' : 'text-[#2D3436]'}`}>
                          {item.bulan}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#2A9D8F] text-white">
                            AKTIF
                          </span>
                        )}
                      </div>
                      {item.keterangan && (
                        <p className="text-[10px] text-[#636E72] truncate">
                          {item.keterangan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sisi Kanan: Nominal Rupiah & Persentase Badge */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-[#2D3436] block">
                        {formatRupiah(item.pengeluaran)}
                      </span>
                      <span className="text-[10px] text-[#636E72]">
                        dari {formatRupiah(item.subsidi)}
                      </span>
                    </div>

                    <span
                      className="text-xs font-black px-2.5 py-1 rounded-xl text-right w-14 shrink-0 transition-colors"
                      style={{
                        backgroundColor: highlight ? item.color : `${item.color}20`,
                        color: highlight ? '#ffffff' : item.color,
                      }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[#636E72] pt-1 px-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#2A9D8F] shrink-0" />
            <span>Arahkan kursor atau klik periode untuk menyorot detail anggaran di tabel bawah.</span>
          </p>
        </div>

      </div>
    </div>
  );
}
