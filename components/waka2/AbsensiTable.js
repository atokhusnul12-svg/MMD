'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Calendar,
  Layers,
  Table as TableIcon,
  ListFilter,
  BarChart3,
  ExternalLink,
  RotateCcw,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const STATUS_CONFIG = {
  H: { title: 'Hadir', bg: 'bg-[#E8F5F3]', text: 'text-[#1D7A6F]', border: 'border-[#C8E3DC]' },
  S: { title: 'Sakit', bg: 'bg-[#EFF5F9]', text: 'text-[#2D6A9F]', border: 'border-[#BFD5E7]' },
  I: { title: 'Izin', bg: 'bg-[#FAF3E6]', text: 'text-[#8C6D23]', border: 'border-[#ECD8A5]' },
  A: { title: 'Alpa / Ghaib', bg: 'bg-[#FAF0ED]', text: 'text-[#8A2F1B]', border: 'border-[#E8BCB0]' },
};

function StatusBadge({ status, value }) {
  if (!value || value === '0') {
    return <span className="text-[#5C6E66]/40 text-xs font-mono">-</span>;
  }

  const s = String(status).toUpperCase();
  const cfg = STATUS_CONFIG[s];

  if (cfg) {
    return (
      <span
        title={cfg.title}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${cfg.bg} ${cfg.text} border ${cfg.border} text-xs font-bold`}
      >
        {s}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#F7F5EF] text-[#26332E] text-xs font-bold">
      {status}
    </span>
  );
}

function PersenBadge({ persen, persenText }) {
  if (persen === null || persen === undefined || persenText === '—') {
    return <span className="text-[#5C6E66]/40 text-xs font-mono">—</span>;
  }

  const p = typeof persen === 'number' ? persen : parseFloat(String(persen).replace('%', ''));
  const isSempurna = p >= 100;
  const isBaik = p >= 75;
  const isKurang = p < 50;

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border font-mono ${
        isSempurna
          ? 'bg-[#E8F5F3] text-[#1D7A6F] border-[#C8E3DC]'
          : isBaik
          ? 'bg-[#EBF3EF] text-[#165E55] border-[#C2DDD6]'
          : isKurang
          ? 'bg-[#FAF0ED] text-[#8A2F1B] border-[#E8BCB0]'
          : 'bg-[#FAF3E6] text-[#8C6D23] border-[#ECD8A5]'
      }`}
    >
      {persenText || `${p}%`}
    </span>
  );
}

export default function AbsensiTable({
  members = [],
  availableMonths = [],
  monthlyAggregates = [],
  summary = {},
  sourceUrl,
  classes = [],
  domisiliList = [],
}) {
  // Filter Periode (Poin 2): Default 'ALL' (Seluruh Periode)
  const [selectedPeriod, setSelectedPeriod] = useState('ALL'); // 'ALL' | monthId
  const [selectedYear, setSelectedYear] = useState('ALL'); // 'ALL' | year string

  // Toggle Mode Tampilan (Poin 5): 'rekap' (Rekap Per Anggota) vs 'detail' (Detail Catatan Absensi)
  const [viewMode, setViewMode] = useState('rekap'); // 'rekap' | 'detail'

  // Filter Usbu' (khusus pada mode detail): 'ALL' | 0 | 1 | 2 | 3
  const [selectedUsbu, setSelectedUsbu] = useState('ALL');

  // Filter pencarian dan profil
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedDomisili, setSelectedDomisili] = useState('ALL');

  // Daftar tahun unik jika ada
  const availableYears = useMemo(() => {
    const ySet = new Set();
    availableMonths.forEach((m) => {
      if (m.year) ySet.add(m.year);
    });
    return Array.from(ySet).sort();
  }, [availableMonths]);

  // Bulan yang aktif sesuai filter tahun
  const activeMonthsList = useMemo(() => {
    if (selectedYear === 'ALL') return availableMonths;
    return availableMonths.filter((m) => m.year === selectedYear);
  }, [availableMonths, selectedYear]);

  // Bulan tunggal yang terpilih jika pengguna memilih bulan tertentu
  const activeSingleMonth = useMemo(() => {
    if (selectedPeriod === 'ALL') return null;
    return availableMonths.find((m) => m.id === selectedPeriod) || null;
  }, [availableMonths, selectedPeriod]);

  // Filter anggota berdasarkan pencarian dan dropdown kelas/domisili
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.nama.toLowerCase().includes(q) ||
        m.domisili.toLowerCase().includes(q) ||
        m.kelas.toLowerCase().includes(q);

      const matchClass = selectedClass === 'ALL' || m.kelas === selectedClass;
      const matchDomisili = selectedDomisili === 'ALL' || m.domisili === selectedDomisili;

      // Jika memilih bulan tertentu, pastikan anggota memiliki catatan di bulan tersebut
      const matchMonth =
        selectedPeriod === 'ALL' || Boolean(m.monthlyRecords && m.monthlyRecords[selectedPeriod]);

      return matchSearch && matchClass && matchDomisili && matchMonth;
    });
  }, [members, search, selectedClass, selectedDomisili, selectedPeriod]);

  // Statistik Dinamis berdasarkan Periode yang dipilih
  const displayStats = useMemo(() => {
    if (activeSingleMonth) {
      // Statistik bulan tertentu
      const agg = monthlyAggregates.find((a) => a.monthId === activeSingleMonth.id);
      return {
        labelPeriode: activeSingleMonth.name,
        totalSantri: agg?.totalSantriValid || filteredMembers.length,
        totalPertemuan: activeSingleMonth.pertemuanCount || 4,
        persenKehadiran: agg?.rasioKehadiranTotal ? `${agg.rasioKehadiranTotal}%` : '—',
        totalHadir: agg?.totalHadirSemua || 0,
        totalSakit: agg?.totalSakitSemua || 0,
        totalIzin: agg?.totalIzinSemua || 0,
        totalAlpa: agg?.totalAlpaSemua || 0,
        avgPersenAnggota: agg?.avgKehadiranAnggota ? `${agg.avgKehadiranAnggota}%` : '—',
      };
    }

    // Statistik seluruh periode
    return {
      labelPeriode: `Seluruh Periode (${availableMonths.length} Bulan)`,
      totalSantri: summary.totalSantri || members.length,
      totalPertemuan: summary.totalPertemuanValid || availableMonths.length * 4,
      persenKehadiran: summary.persenKehadiranKeseluruhan || '0%',
      totalHadir: summary.totalHadirSemua || 0,
      totalSakit: summary.totalSakitSemua || 0,
      totalIzin: summary.totalIzinSemua || 0,
      totalAlpa: summary.totalAlpaSemua || 0,
      avgPersenAnggota: summary.persenKehadiranKeseluruhan || '0%',
    };
  }, [activeSingleMonth, monthlyAggregates, filteredMembers, availableMonths, summary, members]);

  const isFilterActive =
    selectedPeriod !== 'ALL' ||
    selectedYear !== 'ALL' ||
    search !== '' ||
    selectedClass !== 'ALL' ||
    selectedDomisili !== 'ALL' ||
    selectedUsbu !== 'ALL';

  const resetAllFilters = () => {
    setSelectedPeriod('ALL');
    setSelectedYear('ALL');
    setSearch('');
    setSelectedClass('ALL');
    setSelectedDomisili('ALL');
    setSelectedUsbu('ALL');
  };

  return (
    <div className="space-y-6">
      {/* 4 Kartu Ringkasan Statistik Absensi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Santri */}
        <div className="p-4 rounded-xl bg-white border border-[#DCE5E0] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E66]">
            Total Santri Terdata
          </span>
          <div className="text-2xl font-black text-[#26332E] mt-1 font-serif">
            {displayStats.totalSantri}
          </div>
          <p className="text-xs text-[#5C6E66] mt-0.5 truncate">{displayStats.labelPeriode}</p>
        </div>

        {/* Persentase Kehadiran */}
        <div className="p-4 rounded-xl bg-[#E8F5F3] border border-[#C8E3DC] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D7A6F]">
            {selectedPeriod === 'ALL' ? 'Kehadiran Keseluruhan' : 'Kehadiran Periode'}
          </span>
          <div className="text-2xl font-black text-[#1D7A6F] mt-1 font-serif">
            {displayStats.persenKehadiran}
          </div>
          <p className="text-xs text-[#1D7A6F]/80 mt-0.5">
            {displayStats.totalHadir} hadir dari total kesempatan
          </p>
        </div>

        {/* Akumulasi Sakit & Izin */}
        <div className="p-4 rounded-xl bg-[#FAF3E6] border border-[#ECD8A5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D23]">
            Sakit &amp; Izin
          </span>
          <div className="text-2xl font-black text-[#8C6D23] mt-1 font-serif">
            {displayStats.totalSakit + displayStats.totalIzin}
          </div>
          <p className="text-xs text-[#8C6D23]/80 mt-0.5">
            {displayStats.totalSakit} Sakit, {displayStats.totalIzin} Izin
          </p>
        </div>

        {/* Total Alpa */}
        <div className="p-4 rounded-xl bg-[#FAF0ED] border border-[#E8BCB0] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A2F1B]">
            Alpa (Ghaib)
          </span>
          <div className="text-2xl font-black text-[#8A2F1B] mt-1 font-serif">
            {displayStats.totalAlpa}
          </div>
          <p className="text-xs text-[#8A2F1B]/80 mt-0.5">Tanpa keterangan sah</p>
        </div>
      </div>

      {/* Kontainer Utama Tabel & Filter */}
      <div className="bg-white rounded-xl shadow-xs border border-[#DCE5E0] overflow-hidden">
        {/* Toolbar Atas: Toggle Mode Tampilan & Filter Periode */}
        <div className="p-4 sm:p-5 border-b border-[#DCE5E0] space-y-4 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#DCE5E0]/60">
            <div>
              <h3 className="text-base font-bold text-[#26332E] font-serif flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1D7A6F]" />
                <span>
                  {viewMode === 'rekap'
                    ? 'Rekapitulasi Persentase Kehadiran Santri'
                    : 'Detail Catatan Presensi Pertemuan'}
                </span>
              </h3>
              <p className="text-xs text-[#5C6E66] mt-0.5">
                {viewMode === 'rekap'
                  ? 'Menampilkan persentase kehadiran per bulan dan keseluruhan secara dinamis'
                  : 'Catatan rinci presensi tiap pertemuan (Usbu&apos;) dengan status kehadiran H/S/I/A'}
              </p>
            </div>

            {/* Toggle Mode Tampilan: Rekap vs Detail (Poin 5) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] shrink-0 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('rekap')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'rekap'
                    ? 'bg-[#1D7A6F] text-white shadow-2xs'
                    : 'text-[#5C6E66] hover:text-[#26332E]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Rekap Per Anggota</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('detail')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'detail'
                    ? 'bg-[#1D7A6F] text-white shadow-2xs'
                    : 'text-[#5C6E66] hover:text-[#26332E]'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Detail Catatan Pertemuan</span>
              </button>
            </div>
          </div>

          {/* Baris Filter Periode, Bulan, dan Input Pencarian (Poin 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Filter Periode / Bulan (Default: Seluruh Periode) */}
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-[#5C6E66] uppercase mb-1">
                Pilihan Periode
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-xs sm:text-sm focus:outline-hidden focus:border-[#1D7A6F] text-[#26332E] bg-white font-medium cursor-pointer"
              >
                <option value="ALL">★ Seluruh Periode ({availableMonths.length} Bulan)</option>
                {activeMonthsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tahun (jika ada data multi-tahun) */}
            {availableYears.length > 1 && (
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-[#5C6E66] uppercase mb-1">
                  Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-xs sm:text-sm focus:outline-hidden focus:border-[#1D7A6F] text-[#26332E] bg-white font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Tahun</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Input Pencarian Nama Santri / Domisili / Kelas */}
            <div className={availableYears.length > 1 ? 'sm:col-span-4' : 'sm:col-span-5'}>
              <label className="block text-[10px] font-bold text-[#5C6E66] uppercase mb-1">
                Cari Santri
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#5C6E66] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama santri, domisili, atau kelas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DCE5E0] text-xs sm:text-sm focus:outline-hidden focus:border-[#1D7A6F] text-[#26332E] placeholder-[#5C6E66]/60 bg-white"
                />
              </div>
            </div>

            {/* Filter Kelas */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-[#5C6E66] uppercase mb-1">
                Kelas
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-xs sm:text-sm focus:outline-hidden focus:border-[#1D7A6F] text-[#26332E] bg-white font-medium cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Reset Filter */}
            <div className="sm:col-span-1 flex items-end">
              {isFilterActive && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  title="Reset Semua Filter"
                  className="w-full p-2.5 rounded-lg text-[#5C6E66] hover:text-[#8A2F1B] hover:bg-[#FAF0ED] border border-[#DCE5E0] transition-colors flex items-center justify-center cursor-pointer mb-0.5"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-baris filter Usbu' khusus pada mode detail */}
          {viewMode === 'detail' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DCE5E0]/50 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[#5C6E66] font-semibold">Tampilkan Pertemuan:</span>
                <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0]">
                  <button
                    type="button"
                    onClick={() => setSelectedUsbu('ALL')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      selectedUsbu === 'ALL'
                        ? 'bg-[#1D7A6F] text-white shadow-2xs'
                        : 'text-[#5C6E66] hover:text-[#26332E]'
                    }`}
                  >
                    Semua Usbu&apos;
                  </button>
                  {[1, 2, 3, 4].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setSelectedUsbu(u - 1)}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        selectedUsbu === u - 1
                          ? 'bg-[#1D7A6F] text-white shadow-2xs'
                          : 'text-[#5C6E66] hover:text-[#26332E]'
                      }`}
                    >
                      U-{u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Legend */}
              <div className="flex items-center gap-3 text-[11px] text-[#5C6E66] font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#1D7A6F]" /> H = Hadir
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2D6A9F]" /> S = Sakit
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#8C6D23]" /> I = Izin
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#8A2F1B]" /> A = Alpa
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* TAMPILAN A: REKAP PER ANGGOTA (KOLOM BULANAN DINAMIS) (Poin 5A) */}
        {/* ============================================================== */}
        {viewMode === 'rekap' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Anggota Santri</th>
                  <th className="py-3 px-3 w-24">Domisili</th>
                  <th className="py-3 px-3 w-28">Kelas</th>

                  {/* Kolom Tiap Bulan Dibuat Secara Dinamis */}
                  {activeMonthsList.map((m) => (
                    <th key={m.id} className="py-3 px-4 text-center min-w-[120px]">
                      <span className="block font-bold">{m.name}</span>
                      <span className="text-[10px] font-normal text-[#5C6E66]/80 block lowercase">
                        {m.pertemuanCount} pertemuan
                      </span>
                    </th>
                  ))}

                  {/* Kolom Keseluruhan (Total Hadir / Total Pertemuan Valid) */}
                  <th className="py-3 px-4 text-center min-w-[130px] bg-[#EBF3EF]/60 text-[#1D7A6F]">
                    <span className="block font-black">Keseluruhan</span>
                    <span className="text-[10px] font-normal block lowercase text-[#1D7A6F]/80">
                      seluruh periode
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E0]/60">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-[#F7F5EF]/60 transition-colors group"
                    >
                      <td className="py-3 px-3.5 text-center font-mono text-xs text-[#5C6E66]">
                        {item.no}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#26332E] group-hover:text-[#1D7A6F] transition-colors">
                          {item.nama}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]/60">
                          {item.domisili}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#5C6E66] font-medium">
                        {item.kelas}
                      </td>

                      {/* Sel Tiap Bulan */}
                      {activeMonthsList.map((m) => {
                        const rec = item.monthlyRecords ? item.monthlyRecords[m.id] : null;
                        return (
                          <td key={m.id} className="py-3 px-4 text-center">
                            {rec ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <PersenBadge
                                  persen={rec.persenHadir}
                                  persenText={rec.persenHadirText}
                                />
                                <span className="text-[10px] text-[#5C6E66] font-mono">
                                  {rec.hadir}/{rec.pertemuanCount} hadir
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#5C6E66]/40 text-xs font-mono">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Sel Persentase Keseluruhan */}
                      <td className="py-3 px-4 text-center bg-[#EBF3EF]/30">
                        <div className="flex flex-col items-center gap-0.5">
                          <PersenBadge
                            persen={item.overall?.persenHadir}
                            persenText={item.overall?.persenHadirText}
                          />
                          <span className="text-[10px] text-[#1D7A6F] font-mono font-medium">
                            {item.overall?.totalHadir}/{item.overall?.totalPertemuanValid} pertemuan
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5 + activeMonthsList.length}
                      className="py-12 text-center text-[#5C6E66] text-sm"
                    >
                      Tidak ada santri yang cocok dengan kriteria filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAMPILAN B: DETAIL CATATAN ABSENSI (PRESENSI USBU') (Poin 5B)   */}
        {/* ============================================================== */}
        {viewMode === 'detail' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Anggota Santri</th>
                  <th className="py-3 px-3 w-24">Domisili</th>
                  <th className="py-3 px-3 w-28">Kelas</th>

                  {/* Kolom Usbu' 1 s/d 4 */}
                  {(selectedUsbu === 'ALL' || selectedUsbu === 0) && (
                    <th className="py-3 px-2 w-16 text-center">Usbu&apos; 1</th>
                  )}
                  {(selectedUsbu === 'ALL' || selectedUsbu === 1) && (
                    <th className="py-3 px-2 w-16 text-center">Usbu&apos; 2</th>
                  )}
                  {(selectedUsbu === 'ALL' || selectedUsbu === 2) && (
                    <th className="py-3 px-2 w-16 text-center">Usbu&apos; 3</th>
                  )}
                  {(selectedUsbu === 'ALL' || selectedUsbu === 3) && (
                    <th className="py-3 px-2 w-16 text-center">Usbu&apos; 4</th>
                  )}

                  {/* Rekap H/S/I/A & % Hadir */}
                  <th className="py-3 px-3 w-28 text-center">Rekap (H/S/I/A)</th>
                  <th className="py-3 px-4 w-28 text-center">% Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E0]/60">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((item, idx) => {
                    // Ambil record bulan aktif atau bulan pertama
                    const targetMonthId = activeSingleMonth
                      ? activeSingleMonth.id
                      : availableMonths[0]?.id;
                    const rec = item.monthlyRecords ? item.monthlyRecords[targetMonthId] : null;
                    const usbuList = rec?.usbu || [];

                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-[#F7F5EF]/60 transition-colors group"
                      >
                        <td className="py-3 px-3.5 text-center font-mono text-xs text-[#5C6E66]">
                          {item.no}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#26332E] group-hover:text-[#1D7A6F] transition-colors">
                            {item.nama}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]/60">
                            {item.domisili}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-[#5C6E66] font-medium">
                          {item.kelas}
                        </td>

                        {/* Usbu' 1..4 */}
                        {(selectedUsbu === 'ALL' || selectedUsbu === 0) && (
                          <td className="py-3 px-2 text-center">
                            <StatusBadge
                              status={usbuList[0]?.status}
                              value={usbuList[0]?.h || usbuList[0]?.s || usbuList[0]?.i || usbuList[0]?.a}
                            />
                          </td>
                        )}
                        {(selectedUsbu === 'ALL' || selectedUsbu === 1) && (
                          <td className="py-3 px-2 text-center">
                            <StatusBadge
                              status={usbuList[1]?.status}
                              value={usbuList[1]?.h || usbuList[1]?.s || usbuList[1]?.i || usbuList[1]?.a}
                            />
                          </td>
                        )}
                        {(selectedUsbu === 'ALL' || selectedUsbu === 2) && (
                          <td className="py-3 px-2 text-center">
                            <StatusBadge
                              status={usbuList[2]?.status}
                              value={usbuList[2]?.h || usbuList[2]?.s || usbuList[2]?.i || usbuList[2]?.a}
                            />
                          </td>
                        )}
                        {(selectedUsbu === 'ALL' || selectedUsbu === 3) && (
                          <td className="py-3 px-2 text-center">
                            <StatusBadge
                              status={usbuList[3]?.status}
                              value={usbuList[3]?.h || usbuList[3]?.s || usbuList[3]?.i || usbuList[3]?.a}
                            />
                          </td>
                        )}

                        {/* Rekap H/S/I/A */}
                        <td className="py-3 px-3 text-center">
                          {rec ? (
                            <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold">
                              <span className="text-[#1D7A6F]">{rec.hadir}</span>
                              <span className="text-[#5C6E66]/40">/</span>
                              <span className="text-[#2D6A9F]">{rec.sakit}</span>
                              <span className="text-[#5C6E66]/40">/</span>
                              <span className="text-[#8C6D23]">{rec.izin}</span>
                              <span className="text-[#5C6E66]/40">/</span>
                              <span className="text-[#8A2F1B]">{rec.alpa}</span>
                            </div>
                          ) : (
                            <span className="text-[#5C6E66]/40 text-xs font-mono">—</span>
                          )}
                        </td>

                        {/* Persentase Kehadiran */}
                        <td className="py-3 px-4 text-center">
                          {rec ? (
                            <PersenBadge
                              persen={rec.persenHadir}
                              persenText={rec.persenHadirText}
                            />
                          ) : (
                            <span className="text-[#5C6E66]/40 text-xs font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#5C6E66] text-sm">
                      Tidak ada santri yang cocok dengan kriteria filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Transparansi Sumber */}
        <div className="p-3.5 bg-[#F7F5EF]/50 border-t border-[#DCE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5C6E66]">
          <span>
            Menampilkan <strong>{filteredMembers.length}</strong> dari {members.length} santri •{' '}
            {displayStats.labelPeriode}
          </span>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#1D7A6F] hover:underline font-semibold"
            >
              <span>Buka Google Sheets CSV Sumber</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. REKAP PERSENTASE BULANAN UNTUK SELURUH ANGGOTA (Poin 6)     */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl shadow-xs border border-[#DCE5E0] overflow-hidden p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold text-[#26332E] font-serif flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1D7A6F]" />
              <span>Rekapitulasi Persentase Bulanan untuk Seluruh Anggota</span>
            </h4>
            <p className="text-xs text-[#5C6E66] mt-0.5">
              Agregasi performa kehadiran forum per bulan berdasarkan seluruh anggota yang aktif
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider">
                <th className="py-3 px-4">Bulan / Periode</th>
                <th className="py-3 px-3 text-center">Jumlah Pertemuan Valid</th>
                <th className="py-3 px-3 text-center">Anggota Aktif</th>
                <th className="py-3 px-4 text-center">
                  Rata-rata Kehadiran Anggota
                  <span className="block text-[9px] font-normal lowercase text-[#5C6E66]">
                    (rata-rata per santri)
                  </span>
                </th>
                <th className="py-3 px-4 text-center bg-[#EBF3EF]/40 text-[#1D7A6F]">
                  Rasio Kehadiran Total
                  <span className="block text-[9px] font-normal lowercase text-[#1D7A6F]/80">
                    (total hadir ÷ total kesempatan)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E0]/60">
              {monthlyAggregates.map((agg) => (
                <tr key={agg.monthId} className="hover:bg-[#F7F5EF]/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#26332E]">{agg.monthName}</td>
                  <td className="py-3 px-3 text-center font-mono text-xs text-[#5C6E66]">
                    {agg.pertemuanCount} pertemuan
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-xs text-[#26332E]">
                    {agg.totalSantriValid} santri
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]">
                      {agg.avgKehadiranAnggota}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center bg-[#EBF3EF]/20">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC]">
                      {agg.rasioKehadiranTotal}%
                    </span>
                    <span className="block text-[10px] text-[#1D7A6F] font-mono mt-0.5">
                      {agg.totalHadirSemua} / {agg.totalKesempatanHadir} hadir
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kotak Catatan Metodologi Agregasi (Poin 6: Tidak Mencampur Metode) */}
        <div className="p-3.5 rounded-lg bg-[#F7F5EF]/80 border border-[#DCE5E0] text-xs text-[#5C6E66] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#26332E]">
            <Info className="w-3.5 h-3.5 text-[#1D7A6F]" />
            <span>Keterangan Metodologi Perhitungan:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed text-[#5C6E66]">
            <li>
              <strong>Rata-rata Kehadiran Anggota:</strong> Dihitung dari jumlah persentase kehadiran masing-masing santri dibagi total santri aktif yang memiliki kewajiban hadir pada periode tersebut.
            </li>
            <li>
              <strong>Rasio Kehadiran Total:</strong> Dihitung dari akumulasi seluruh kehadiran santri (kolom H) dibagi total seluruh kesempatan hadir (jumlah pertemuan valid × jumlah santri).
            </li>
            <li>
              <strong>Persentase Keseluruhan:</strong> Dihitung menggunakan bobot riil (Total Kehadiran Seluruh Bulan dibagi Total Pertemuan Valid Seluruh Bulan), bukan rata-rata sederhana dari persentase bulanan.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
