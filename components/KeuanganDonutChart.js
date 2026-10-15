'use client';

import React, { useState, useMemo } from 'react';
import { formatRupiah } from '@/lib/fetchCSV';
import { Wallet, PieChart as PieChartIcon, TrendingDown, Info, ArrowUpRight } from 'lucide-react';

// Palet warna harmonis tema web WAKA III (Islamic Contemporary: Deep Pine, Gold, Slate Blue, Amber, Sage)
export const KEUANGAN_COLORS = [
  {
    color: '#1D7A6F',
    bgBadge: 'bg-[#E8F5F3]',
    textBadge: 'text-[#1D7A6F]',
    border: 'border-[#C8E3DC]',
    lightBg: 'bg-[#F7F5EF]',
  },
  {
    color: '#C6A66B',
    bgBadge: 'bg-[#FAF3E6]',
    textBadge: 'text-[#8C6D23]',
    border: 'border-[#E8D5A7]',
    lightBg: 'bg-[#FAF8F2]',
  },
  {
    color: '#224A63',
    bgBadge: 'bg-[#EDF3F7]',
    textBadge: 'text-[#224A63]',
    border: 'border-[#B9D1E0]',
    lightBg: 'bg-[#F4F7F9]',
  },
  {
    color: '#436A5B',
    bgBadge: 'bg-[#EEF4F1]',
    textBadge: 'text-[#2A5243]',
    border: 'border-[#C3D8CE]',
    lightBg: 'bg-[#F5F8F6]',
  },
  {
    color: '#C47C35',
    bgBadge: 'bg-[#FDF4EB]',
    textBadge: 'text-[#9A5212]',
    border: 'border-[#F0D0B4]',
    lightBg: 'bg-[#FDF7F2]',
  },
  {
    color: '#A8382B',
    bgBadge: 'bg-[#FAF0ED]',
    textBadge: 'text-[#8A2F1B]',
    border: 'border-[#E8BCB0]',
    lightBg: 'bg-[#FCF5F3]',
  },
  {
    color: '#9C824E',
    bgBadge: 'bg-[#F8F5EE]',
    textBadge: 'text-[#6B572B]',
    border: 'border-[#DFD6C3]',
    lightBg: 'bg-[#F9F7F2]',
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
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#DCE5E0] animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-4 bg-stone-200 rounded w-48"></div>
            <div className="h-3 bg-stone-100 rounded w-64"></div>
          </div>
          <div className="h-6 bg-stone-200 rounded w-28"></div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
          <div className="w-56 h-56 rounded-full bg-stone-200/80 animate-pulse relative flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-white"></div>
          </div>
          <div className="space-y-2.5 w-full max-w-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. STATE ERROR
  if (error) {
    return (
      <div className="bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] rounded-xl p-5 text-sm flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 text-[#8A2F1B] mt-0.5" />
        <div>
          <h4 className="font-bold text-sm">Gagal Menampilkan Diagram Pengeluaran</h4>
          <p className="text-xs text-[#8A2F1B] mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // 3. STATE EMPTY
  if (chartData.length === 0 || calculatedTotal <= 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-[#DCE5E0] text-center text-[#5C6E66]">
        <PieChartIcon className="w-10 h-10 mx-auto text-stone-300 mb-2" />
        <p className="text-sm font-semibold text-[#26332E]">Belum ada data pengeluaran yang terdata</p>
        <p className="text-xs text-[#5C6E66] mt-1">Data akan otomatis muncul saat LPJ tercatat di Google Sheets.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#DCE5E0] shadow-xs">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#DCE5E0]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#E8F5F3] text-[#1D7A6F] text-[11px] font-bold border border-[#C8E3DC] mb-1.5">
            <PieChartIcon className="w-3.5 h-3.5 text-[#1D7A6F]" />
            Visualisasi Distribusi Keuangan
          </div>
          <h3 className="font-extrabold text-xl text-[#26332E] tracking-tight font-serif flex items-center gap-2">
            Proporsi Realisasi Pengeluaran (LPJ) Antar Periode
          </h3>
          <p className="text-xs sm:text-sm text-[#5C6E66] mt-0.5">
            Komposisi dan persentase penyerapan dana dari total realisasi {formatRupiah(calculatedTotal)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#1D7A6F] bg-[#E8F5F3] px-3 py-1 rounded border border-[#C8E3DC]">
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
              stroke="#F7F5EF"
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
                  strokeWidth={highlight ? strokeWidth + 6 : strokeWidth}
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66] block max-w-[140px] truncate">
                  {activeHoverItem.bulan}
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#26332E] tracking-tight font-serif block">
                  {formatRupiah(activeHoverItem.pengeluaran)}
                </span>
                <span
                  className="inline-block text-xs font-bold px-2 py-0.5 rounded text-white shadow-xs"
                  style={{ backgroundColor: activeHoverItem.color }}
                >
                  {activeHoverItem.percentage}% dari Total
                </span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6E66] block">
                  Total Realisasi (LPJ)
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#26332E] tracking-tight font-serif block">
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
        <div className="flex-1 w-full max-w-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#5C6E66] px-2 mb-1">
            <span>Nama Periode Bulan</span>
            <span>Nominal Realisasi &amp; Porsi</span>
          </div>

          <div className="space-y-1.5">
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
                  className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer border ${
                    highlight
                      ? 'bg-[#F7F5EF] border-[#1D7A6F]/50 shadow-xs'
                      : 'bg-white border-[#DCE5E0] hover:bg-[#F7F5EF]/60'
                  }`}
                >
                  {/* Sisi Kiri: Dot Warna & Nama Periode */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0 transition-transform duration-200"
                      style={{
                        backgroundColor: item.color,
                        transform: highlight ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${highlight ? 'text-[#1D7A6F]' : 'text-[#26332E]'}`}>
                          {item.bulan}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#1D7A6F] text-white">
                            AKTIF
                          </span>
                        )}
                      </div>
                      {item.keterangan && (
                        <p className="text-[10px] text-[#5C6E66] truncate">
                          {item.keterangan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sisi Kanan: Nominal Rupiah & Persentase Badge */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-[#26332E] block">
                        {formatRupiah(item.pengeluaran)}
                      </span>
                      <span className="text-[10px] text-[#5C6E66]">
                        dari {formatRupiah(item.subsidi)}
                      </span>
                    </div>

                    <span
                      className="text-xs font-black px-2 py-0.5 rounded text-right w-14 shrink-0 transition-colors"
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

          <p className="text-[11px] text-[#5C6E66] pt-1 px-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#1D7A6F] shrink-0" />
            <span>Arahkan kursor atau klik periode untuk menyorot detail anggaran di tabel bawah.</span>
          </p>
        </div>

      </div>
    </div>
  );
}

