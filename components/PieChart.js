'use client';

import React, { useState } from 'react';

// Pemetaan warna dan gaya untuk tiap status perkembangan
export const STATUS_COLORS = {
  'SENIOR - SANGAT BAIK': {
    color: '#2A9D8F',
    bgBadge: 'bg-[#2A9D8F]/15',
    textBadge: 'text-[#1D7A6F]',
    border: 'border-[#2A9D8F]/30',
  },
  'JUNIOR - SANGAT BAIK': {
    color: '#38A3A5',
    bgBadge: 'bg-[#38A3A5]/15',
    textBadge: 'text-[#22577A]',
    border: 'border-[#38A3A5]/30',
  },
  'ADAPTASI TOTAL': {
    color: '#57CC99',
    bgBadge: 'bg-[#57CC99]/20',
    textBadge: 'text-[#2D6A4F]',
    border: 'border-[#57CC99]/30',
  },
  'SENIOR - KURANG BAIK': {
    color: '#E9C46A',
    bgBadge: 'bg-[#E9C46A]/25',
    textBadge: 'text-[#8A6D14]',
    border: 'border-[#E9C46A]/40',
  },
  'DALAM MASA REPARASI': {
    color: '#F4A261',
    bgBadge: 'bg-[#F4A261]/20',
    textBadge: 'text-[#B2531F]',
    border: 'border-[#F4A261]/40',
  },
  'TERANCAM KELUAR': {
    color: '#E76F51',
    bgBadge: 'bg-[#E76F51]/20',
    textBadge: 'text-[#9B2226]',
    border: 'border-[#E76F51]/40',
  },
};

const DEFAULT_COLOR = {
  color: '#A0AEC0',
  bgBadge: 'bg-gray-100',
  textBadge: 'text-gray-700',
  border: 'border-gray-300',
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
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#2A9D8F]/15">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#2D3436]">
            Distribusi Status Perkembangan Anggota
          </h3>
          <p className="text-xs text-[#636E72] mt-0.5">
            Proporsi kondisi anggota LBM terkini ({total} santri)
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
              stroke="#F0EADB"
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
                <span className="text-2xl font-black text-[#2D3436]">
                  {data[hoveredIndex].count}
                </span>
                <span className="text-xs font-semibold text-[#1D7A6F]">
                  {data[hoveredIndex].percentage}%
                </span>
                <span className="text-[10px] text-[#636E72] max-w-[110px] truncate">
                  {data[hoveredIndex].status}
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-[#2D3436] tracking-tight">
                  {total}
                </span>
                <span className="text-xs font-medium text-[#636E72]">
                  Total Anggota
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend / Daftar Keterangan Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 w-full max-w-md">
          {data.map((item, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={item.status}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                  isHovered
                    ? 'bg-[#FDF6E3] border-[#2A9D8F]/40 shadow-xs translate-x-1'
                    : 'bg-white border-gray-100 hover:bg-[#FFFCF5]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-[#2D3436] truncate">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-bold text-[#2D3436]">
                    {item.count} orang
                  </span>
                  <span className="text-[11px] font-medium text-[#636E72] w-12 text-right">
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
