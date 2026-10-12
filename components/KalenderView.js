'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  RotateCcw,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  ShieldCheck,
} from 'lucide-react';
import AdminButton from './AdminButton';

export default function KalenderView({
  bulanList = [],
  allActivities = [],
  totalKegiatan = 0,
  totalWaka3 = 0,
  kordinatorList = [],
  editUrl,
}) {
  const [selectedBulanIndex, setSelectedBulanIndex] = useState(0); // Default ke bulan pertama atau semua
  const [showAllBulan, setShowAllBulan] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedKordinator, setSelectedKordinator] = useState('');

  // Dapatkan daftar kegiatan yang ditampilkan sesuai filter
  const currentActivities = useMemo(() => {
    let list = showAllBulan
      ? allActivities
      : (bulanList[selectedBulanIndex]?.kegiatan || []);

    return list.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        search === '' ||
        item.kegiatan.toLowerCase().includes(q) ||
        item.hari.toLowerCase().includes(q) ||
        item.kordinator.toLowerCase().includes(q) ||
        item.bulan.toLowerCase().includes(q);

      const matchKordinator =
        selectedKordinator === '' ||
        (selectedKordinator === 'WAKA_III'
          ? item.kordinator.toUpperCase().includes('WAKA III')
          : item.kordinator === selectedKordinator);

      return matchSearch && matchKordinator;
    });
  }, [bulanList, allActivities, selectedBulanIndex, showAllBulan, search, selectedKordinator]);

  // Fungsi styling badge waktu
  const getTimeStyle = (waktu) => {
    const w = (waktu || '').toLowerCase();
    if (w.includes('pagi')) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Sunrise,
      };
    }
    if (w.includes('siang')) {
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: Sun,
      };
    }
    if (w.includes('sore')) {
      return {
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: Sunset,
      };
    }
    if (w.includes('malam')) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: Moon,
      };
    }
    return {
      bg: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: Clock,
    };
  };

  // Fungsi styling badge kordinator
  const getKordinatorStyle = (kordinator) => {
    const k = (kordinator || '').toUpperCase();
    if (k.includes('WAKA III')) {
      return 'bg-[#2A9D8F]/15 text-[#1D7A6F] border border-[#2A9D8F]/40 font-bold';
    }
    if (k.includes('KEPALA')) {
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold';
    }
    if (k.includes('WAKA II')) {
      return 'bg-teal-50 text-teal-800 border border-teal-200 font-medium';
    }
    if (k.includes('WAKA I')) {
      return 'bg-cyan-50 text-cyan-800 border border-cyan-200 font-medium';
    }
    if (k.includes('SEKRETARIS')) {
      return 'bg-slate-100 text-slate-800 border border-slate-200 font-medium';
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const handleResetFilter = () => {
    setSearch('');
    setSelectedKordinator('');
  };

  return (
    <div className="space-y-6">
      
      {/* 3 KARTU STATISTIK ATAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-[#2A9D8F]/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#636E72]">
              Total Kegiatan MMD
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#2D3436] mt-1">
              {totalKegiatan} Agenda
            </div>
            <p className="text-xs text-[#636E72] mt-0.5">Tercatat dalam 1 tahun ajaran</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F5F3] text-[#2A9D8F] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setSelectedKordinator(selectedKordinator === 'WAKA_III' ? '' : 'WAKA_III')}
          className={`cursor-pointer rounded-2xl p-5 border shadow-xs flex items-center justify-between transition-all ${
            selectedKordinator === 'WAKA_III'
              ? 'bg-[#E8F5F3] border-[#2A9D8F] ring-2 ring-[#2A9D8F]'
              : 'bg-white border-[#2A9D8F]/30 hover:border-[#2A9D8F]'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1D7A6F]">
                Agenda Khusus WAKA III
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#2A9D8F] text-white">Klik Filter</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#1D7A6F] mt-1">
              {totalWaka3} Kegiatan
            </div>
            <p className="text-xs text-[#1D7A6F]/80 mt-0.5">LBM, BM Santri, Ubudiyah, dll</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#2A9D8F] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#636E72]">
              Bulan Periode
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
              {bulanList.length} Bulan
            </div>
            <p className="text-xs text-[#636E72] mt-0.5">Dari Syawwal s/d Sya'ban</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* CONTAINER UTAMA KALENDER */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#2A9D8F]/15 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFCF5]">
          <div>
            <h2 className="text-xl font-bold text-[#2D3436] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#2A9D8F]" />
              Kalender Kerja MMD Darussalamah
            </h2>
            <p className="text-xs text-[#636E72] mt-0.5">
              Jadwal kegiatan madrasah, musyawarah, takror, ujian, dan rutinitas LBM tahun 1447-1448 H / 2026-2027 M
            </p>
          </div>

          <AdminButton editUrl={editUrl} title="Edit Kalender di Sheets" />
        </div>

        {/* TAB PILIHAN BULAN (Horizontal Scrollable) */}
        <div className="p-3 sm:p-4 bg-[#FDF6E3]/50 border-b border-[#2A9D8F]/15 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => {
                setShowAllBulan(false);
                setSelectedBulanIndex(0);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !showAllBulan && selectedBulanIndex === 0
                  ? 'bg-[#2A9D8F] text-white shadow-xs'
                  : 'bg-white text-[#2D3436] hover:bg-[#E8F5F3] border border-gray-200'
              }`}
            >
              Syawwal
            </button>

            {bulanList.slice(1).map((b, idx) => {
              const actualIdx = idx + 1;
              const isSelected = !showAllBulan && selectedBulanIndex === actualIdx;
              // Bersihkan nama agar ringkas untuk tombol tab
              const shortName = b.nama.replace('Bulan ', '').split(' 144')[0].trim();

              return (
                <button
                  key={actualIdx}
                  onClick={() => {
                    setShowAllBulan(false);
                    setSelectedBulanIndex(actualIdx);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2A9D8F] text-white shadow-xs'
                      : 'bg-white text-[#2D3436] hover:bg-[#E8F5F3] border border-gray-200'
                  }`}
                >
                  {shortName}
                </button>
              );
            })}

            <button
              onClick={() => setShowAllBulan(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showAllBulan
                  ? 'bg-[#1D7A6F] text-white shadow-xs'
                  : 'bg-white text-[#2D3436] hover:bg-[#E8F5F3] border border-gray-200'
              }`}
            >
              Semua Bulan ({totalKegiatan})
            </button>
          </div>
        </div>

        {/* BARIS PENCARIAN & FILTER KOORDINATOR */}
        <div className="p-4 sm:p-6 bg-white border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Input Search */}
            <div className="sm:col-span-7 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kegiatan (LBM, takror, musyawarah, ujian, haul, dll)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436]"
              />
            </div>

            {/* Filter Koordinator */}
            <div className="sm:col-span-4">
              <select
                value={selectedKordinator}
                onChange={(e) => setSelectedKordinator(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436] bg-white font-medium"
              >
                <option value="">Semua Koordinator</option>
                <option value="WAKA_III">★ Khusus WAKA III ({totalWaka3})</option>
                {kordinatorList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter */}
            <div className="sm:col-span-1 flex items-center justify-center">
              {(search || selectedKordinator) && (
                <button
                  onClick={handleResetFilter}
                  title="Reset Filter"
                  className="w-full sm:w-auto p-2.5 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#636E72] gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#2D3436]">
                {showAllBulan
                  ? 'Menampilkan Semua Bulan'
                  : bulanList[selectedBulanIndex]?.nama}
              </span>
              <span>•</span>
              <span>{currentActivities.length} agenda ditemukan</span>
            </div>

            {selectedKordinator && (
              <span className="bg-[#E8F5F3] text-[#1D7A6F] px-2.5 py-0.5 rounded-md font-semibold">
                Filter: {selectedKordinator === 'WAKA_III' ? 'Khusus WAKA III' : selectedKordinator}
              </span>
            )}
          </div>
        </div>

        {/* LIST AGENDA / TIMELINE */}
        <div className="divide-y divide-gray-100">
          {currentActivities.length > 0 ? (
            currentActivities.map((item, idx) => {
              const timeStyle = getTimeStyle(item.waktu);
              const TimeIcon = timeStyle.icon;
              const kordStyle = getKordinatorStyle(item.kordinator);

              return (
                <div
                  key={item.id || idx}
                  className="p-4 sm:p-5 hover:bg-[#FFFCF5] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Kolom Kiri: Tanggal & Waktu */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    
                    {/* Kotak Tanggal */}
                    <div className="w-16 h-16 rounded-2xl bg-[#FDF6E3] border border-[#2A9D8F]/25 flex flex-col items-center justify-center shrink-0 text-center leading-tight shadow-2xs">
                      <span className="text-[10px] font-bold uppercase text-[#636E72]">
                        {item.hari}
                      </span>
                      <span className="text-base font-black text-[#2D3436]">
                        {item.tglM !== '-' ? item.tglM : item.tglH}
                      </span>
                      <span className="text-[9px] font-semibold text-[#1D7A6F]">
                        {item.tglH !== '-' ? `${item.tglH} H` : `${item.tglM} M`}
                      </span>
                    </div>

                    {/* Informasi Agenda */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Waktu */}
                        {item.waktu && item.waktu !== '-' && (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${timeStyle.bg}`}>
                            <TimeIcon className="w-3 h-3" />
                            {item.waktu}
                          </span>
                        )}

                        {showAllBulan && (
                          <span className="text-[10px] font-medium text-[#636E72] bg-gray-100 px-2 py-0.5 rounded-sm">
                            {item.bulan.split('/')[0]}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-[#2D3436] leading-snug">
                        {item.kegiatan}
                      </h3>
                    </div>

                  </div>

                  {/* Kolom Kanan: Koordinator */}
                  <div className="shrink-0 sm:text-right pl-20 sm:pl-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${kordStyle}`}>
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span>{item.kordinator}</span>
                    </span>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="p-16 text-center text-gray-400 text-sm">
              Tidak ada agenda kerja yang sesuai dengan filter atau pencarian Anda.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
