'use client';

import React from 'react';
import { Users, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Waka1SummaryCards({
  summary = {},
  statusFilter = 'ALL',
  onSelectStatusFilter,
}) {
  const {
    totalSiswa = 0,
    totalBebasTakziran = 0,
    totalKenaTakziran = 0,
    totalPerhatianKhusus = 0,
    persenDisiplin = '0%',
  } = summary;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Total Siswa */}
      <div
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('ALL')}
        className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-xs group ${
          statusFilter === 'ALL' ? 'border-[#1D7A6F] ring-2 ring-[#1D7A6F]/10' : 'border-[#DCE5E0]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66]">
            Total Siswa MIDA
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#F7F5EF] text-[#1D7A6F] flex items-center justify-center shrink-0 border border-[#DCE5E0] group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-[#26332E] mt-2 font-serif">
          {totalSiswa}
        </div>
        <p className="text-xs text-[#5C6E66] mt-0.5">Gabungan MI, MTs, &amp; MA</p>
      </div>

      {/* 2. Bebas Takziran (Disiplin) */}
      <div
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('BEBAS')}
        className={`p-4 sm:p-5 rounded-2xl bg-[#E8F5F3] border transition-all cursor-pointer shadow-2xs hover:shadow-xs group ${
          statusFilter === 'BEBAS' ? 'border-[#1D7A6F] ring-2 ring-[#1D7A6F]/20' : 'border-[#C8E3DC]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D7A6F]">
            Bebas Takziran
          </span>
          <div className="w-8 h-8 rounded-lg bg-white text-[#1D7A6F] flex items-center justify-center shrink-0 border border-[#C8E3DC] group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-[#1D7A6F] mt-2 font-serif">
          {totalBebasTakziran}
        </div>
        <p className="text-xs text-[#1D7A6F]/80 mt-0.5">{persenDisiplin} berstatus tertib</p>
      </div>

      {/* 3. Tercatat Takziran (1+ Bulan) */}
      <div
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('TAKZIR')}
        className={`p-4 sm:p-5 rounded-2xl bg-[#FAF3E6] border transition-all cursor-pointer shadow-2xs hover:shadow-xs group ${
          statusFilter === 'TAKZIR' ? 'border-[#8C6D23] ring-2 ring-[#8C6D23]/20' : 'border-[#ECD8A5]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D23]">
            Kena Takziran
          </span>
          <div className="w-8 h-8 rounded-lg bg-white text-[#8C6D23] flex items-center justify-center shrink-0 border border-[#ECD8A5] group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-[#8C6D23] mt-2 font-serif">
          {totalKenaTakziran}
        </div>
        <p className="text-xs text-[#8C6D23]/80 mt-0.5">Pernah takzir (1 bulan+)</p>
      </div>

      {/* 4. Perhatian Khusus (3+ Bulan) */}
      <div
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('KHUSUS')}
        className={`p-4 sm:p-5 rounded-2xl bg-[#FAF0ED] border transition-all cursor-pointer shadow-2xs hover:shadow-xs group ${
          statusFilter === 'KHUSUS' ? 'border-[#8A2F1B] ring-2 ring-[#8A2F1B]/20' : 'border-[#E8BCB0]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A2F1B]">
            Perhatian Khusus
          </span>
          <div className="w-8 h-8 rounded-lg bg-white text-[#8A2F1B] flex items-center justify-center shrink-0 border border-[#E8BCB0] group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-[#8A2F1B] mt-2 font-serif">
          {totalPerhatianKhusus}
        </div>
        <p className="text-xs text-[#8A2F1B]/80 mt-0.5">Takziran 3 bulan atau lebih</p>
      </div>
    </div>
  );
}
