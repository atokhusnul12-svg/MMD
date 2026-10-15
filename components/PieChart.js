'use client';

import React, { useState } from 'react';

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
    <div className="bg-white rounded-xl p-6 border border-[#DCE5E0] shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#DCE5E0]">
        <div>
          <h3 className="text-lg font-bold text-[#26332E] font-serif">
            Distribusi Status Perkembangan Anggota
          </h3>
          <p className="text-xs text-[#5C6E66] mt-0.5">
            Proporsi kondisi evaluasi {total} santri Lembaga Bahtsul Masail
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 justify-around">
        
        {/* Visualisasi Donut Chart Menggunakan SVG */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {hoveredIndex !== null ? (
              <>
                <span className="text-2xl font-black text-[#26332E] font-serif">
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
                <span className="text-3xl font-black text-[#26332E] tracking-tight font-serif">
                  {total}
                </span>
                <span className="text-xs font-semibold text-[#5C6E66]">
                  Total Anggota
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend / Daftar Keterangan Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 w-full max-w-md">
          {data.map((item, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={item.status}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer border ${
                  isHovered
                    ? 'bg-[#F7F5EF] border-[#1D7A6F]/40 shadow-xs'
                    : 'bg-white border-[#DCE5E0] hover:bg-[#F7F5EF]/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-[#26332E] truncate">
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
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

