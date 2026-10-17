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
        bg: 'bg-[#FAF3E6] text-[#8C6D23] border-[#E8D5A7]',
        icon: Sunrise,
      };
    }
    if (w.includes('siang')) {
      return {
        bg: 'bg-[#EDF3F7] text-[#224A63] border-[#B9D1E0]',
        icon: Sun,
      };
    }
    if (w.includes('sore')) {
      return {
        bg: 'bg-[#FAF0ED] text-[#8A2F1B] border-[#E8BCB0]',
        icon: Sunset,
      };
    }
    if (w.includes('malam')) {
      return {
        bg: 'bg-[#F7F5EF] text-[#26332E] border-[#DCE5E0]',
        icon: Moon,
      };
    }
    return {
      bg: 'bg-[#F7F5EF] text-[#26332E] border-[#DCE5E0]',
      icon: Clock,
    };
  };

  // Fungsi styling badge kordinator
  const getKordinatorStyle = (kordinator) => {
    const k = (kordinator || '').toUpperCase();
    if (k.includes('WAKA III')) {
      return 'bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] font-bold';
    }
    if (k.includes('KEPALA')) {
      return 'bg-[#FAF3E6] text-[#8C6D23] border border-[#E8D5A7] font-semibold';
    }
    if (k.includes('WAKA II')) {
      return 'bg-[#EDF3F7] text-[#224A63] border border-[#B9D1E0] font-medium';
    }
    if (k.includes('WAKA I')) {
      return 'bg-[#EEF4F1] text-[#2A5243] border border-[#C3D8CE] font-medium';
    }
    if (k.includes('SEKRETARIS')) {
      return 'bg-[#F7F5EF] text-[#26332E] border border-[#DCE5E0] font-medium';
    }
    return 'bg-[#F7F5EF] text-[#5C6E66] border border-[#DCE5E0]';
  };

  const handleResetFilter = () => {
    setSearch('');
    setSelectedKordinator('');
  };

  return (
    <div className="space-y-6">
      
      {/* 3 KARTU STATISTIK ATAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-xl p-5 border border-[#DCE5E0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66]">
              Total Kegiatan MMD
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#26332E] mt-1 font-serif">
              {totalKegiatan} Agenda
            </div>
            <p className="text-xs text-[#5C6E66] mt-0.5">Tercatat dalam 1 tahun ajaran</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#F7F5EF] text-[#1D7A6F] flex items-center justify-center shrink-0 border border-[#DCE5E0]">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSelectedKordinator(selectedKordinator === 'WAKA_III' ? '' : 'WAKA_III')}
          className={`cursor-pointer rounded-xl p-5 border shadow-xs flex items-center justify-between transition-colors ${
            selectedKordinator === 'WAKA_III'
              ? 'bg-[#E8F5F3] border-[#C8E3DC] ring-1 ring-[#1D7A6F]'
              : 'bg-white border-[#DCE5E0] hover:border-[#1D7A6F]'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D7A6F]">
                Agenda Khusus WAKA III
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1D7A6F] text-white font-bold">Filter</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#1D7A6F] mt-1 font-serif">
              {totalWaka3} Kegiatan
            </div>
            <p className="text-xs text-[#1D7A6F]/80 mt-0.5">LBM, Bahtsu Santri, Ubudiyah, dll</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#1D7A6F] text-[#C6A66B] flex items-center justify-center shrink-0 border border-[#C6A66B]/30 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#DCE5E0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66]">
              Rentang Periode
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#8C6D23] mt-1 font-serif">
              {bulanList.length} Bulan
            </div>
            <p className="text-xs text-[#5C6E66] mt-0.5">Mulai Syawwal hingga Sya&apos;ban</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#FAF3E6] text-[#8C6D23] flex items-center justify-center shrink-0 border border-[#E8D5A7]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* CONTAINER UTAMA KALENDER */}
      <div className="bg-white rounded-xl shadow-xs border border-[#DCE5E0] overflow-hidden">
        

        {/* TAB PILIHAN BULAN (Horizontal Scrollable) */}
        <div className="p-3 sm:p-4 bg-[#F7F5EF]/50 border-b border-[#DCE5E0] overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => {
                setShowAllBulan(false);
                setSelectedBulanIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                !showAllBulan && selectedBulanIndex === 0
                  ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-xs'
                  : 'bg-white text-[#26332E] hover:bg-[#F7F5EF] border-[#DCE5E0]'
              }`}
            >
              Syawwal
            </button>

            {bulanList.slice(1).map((b, idx) => {
              const actualIdx = idx + 1;
              const isSelected = !showAllBulan && selectedBulanIndex === actualIdx;
              const shortName = b.nama.replace('Bulan ', '').split(' 144')[0].trim();

              return (
                <button
                  key={actualIdx}
                  onClick={() => {
                    setShowAllBulan(false);
                    setSelectedBulanIndex(actualIdx);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-xs'
                      : 'bg-white text-[#26332E] hover:bg-[#F7F5EF] border-[#DCE5E0]'
                  }`}
                >
                  {shortName}
                </button>
              );
            })}

            <button
              onClick={() => setShowAllBulan(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                showAllBulan
                  ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-xs'
                  : 'bg-white text-[#26332E] hover:bg-[#F7F5EF] border-[#DCE5E0]'
              }`}
            >
              Semua Bulan ({totalKegiatan})
            </button>
          </div>
        </div>

        {/* BARIS PENCARIAN & FILTER KOORDINATOR */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#DCE5E0] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            
            {/* Input Search */}
            <div className="sm:col-span-7 relative">
              <Search className="w-4 h-4 text-[#5C6E66] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kegiatan (LBM, takror, musyawarah, ujian, haul, dll)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 text-[#26332E] placeholder-[#5C6E66]/60 bg-white"
              />
            </div>

            {/* Filter Koordinator */}
            <div className="sm:col-span-4">
              <select
                value={selectedKordinator}
                onChange={(e) => setSelectedKordinator(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-1 focus:ring-[#1D7A6F]/20 text-[#26332E] bg-white font-medium cursor-pointer"
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
                  className="w-full sm:w-auto p-2 rounded-lg text-[#5C6E66] hover:text-[#8A2F1B] hover:bg-[#FAF0ED] border border-[#DCE5E0] transition-colors flex items-center justify-center cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#5C6E66] gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#26332E]">
                {showAllBulan
                  ? 'Menampilkan Semua Bulan'
                  : bulanList[selectedBulanIndex]?.nama}
              </span>
              <span>•</span>
              <span>{currentActivities.length} agenda ditemukan</span>
            </div>

            {selectedKordinator && (
              <span className="bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC] px-2.5 py-0.5 rounded font-semibold">
                Filter: {selectedKordinator === 'WAKA_III' ? 'Khusus WAKA III' : selectedKordinator}
              </span>
            )}
          </div>
        </div>

        {/* LIST AGENDA / TIMELINE */}
        <div className="divide-y divide-[#DCE5E0]/60">
          {currentActivities.length > 0 ? (
            currentActivities.map((item, idx) => {
              const timeStyle = getTimeStyle(item.waktu);
              const TimeIcon = timeStyle.icon;
              const kordStyle = getKordinatorStyle(item.kordinator);

              return (
                <div
                  key={item.id || idx}
                  className="p-4 sm:p-5 hover:bg-[#F7F5EF]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Kolom Kiri: Tanggal & Waktu */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    
                    {/* Kotak Tanggal */}
                    <div className="w-14 h-14 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0] flex flex-col items-center justify-center shrink-0 text-center leading-tight shadow-xs">
                      <span className="text-[10px] font-bold uppercase text-[#5C6E66]">
                        {item.hari}
                      </span>
                      <span className="text-base font-black text-[#26332E] font-serif">
                        {item.tglM !== '-' ? item.tglM : item.tglH}
                      </span>
                      <span className="text-[9px] font-semibold text-[#1D7A6F] font-mono">
                        {item.tglH !== '-' ? `${item.tglH} H` : `${item.tglM} M`}
                      </span>
                    </div>

                    {/* Informasi Agenda */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Waktu */}
                        {item.waktu && item.waktu !== '-' && (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${timeStyle.bg}`}>
                            <TimeIcon className="w-3 h-3" />
                            {item.waktu}
                          </span>
                        )}

                        {item.tanggalLengkap ? (
                          <span className="text-[11px] font-medium text-[#5C6E66]">
                            {item.tanggalLengkap}
                          </span>
                        ) : showAllBulan && (
                          <span className="text-[10px] font-medium text-[#5C6E66] bg-[#F7F5EF] border border-[#DCE5E0] px-2 py-0.5 rounded">
                            {item.bulan.split('/')[0]}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-[#26332E] leading-snug">
                        {item.kegiatan}
                      </h3>
                    </div>

                  </div>

                  {/* Kolom Kanan: Koordinator */}
                  <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-0 border-[#DCE5E0]/40">
                    <span className="text-[11px] text-[#5C6E66] sm:hidden">Koordinator:</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded ${kordStyle}`}>
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span>{item.kordinator}</span>
                    </span>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="p-16 text-center text-[#5C6E66] text-sm">
              Tidak ada agenda kerja yang sesuai dengan filter atau pencarian Anda.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

