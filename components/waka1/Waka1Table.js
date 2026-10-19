'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const ITEMS_PER_PAGE = 50;

export default function Waka1Table({
  students = [],
  bulanList = [],
  classes = [],
  domisiliList = [],
  sourceUrl,
  statusFilter = 'ALL',
  onSelectStatusFilter,
}) {
  const [selectedTingkat, setSelectedTingkat] = useState('ALL');
  const [selectedBulan, setSelectedBulan] = useState('ALL');
  const [selectedDomisili, setSelectedDomisili] = useState('ALL');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Helper untuk memisahkan kelas dan domisili jika menempel di data sumber (misal: "MTs 1 APPDS" -> "MTs 1 A", "PPDS")
  const parseClassAndDomisili = (rawKelas, rawDomisili) => {
    let kelasClean = rawKelas || '-';
    let domClean = rawDomisili || '-';

    if (kelasClean && domClean && kelasClean.endsWith(domClean)) {
      kelasClean = kelasClean.slice(0, -domClean.length).trim();
    } else if (kelasClean) {
      const match = kelasClean.match(/^(.*?)((?:PPDS|IAIFA|N-DS|LUAR|NON|PONDOK).*)$/i);
      if (match) {
        kelasClean = match[1].trim();
        if (!domClean || domClean === '-') {
          domClean = match[2].trim();
        }
      }
    }
    return { kelas: kelasClean || rawKelas, domisili: domClean || rawDomisili };
  };

  // Filter siswa berdasarkan seluruh kriteria
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.kelas.toLowerCase().includes(q) ||
        s.domisili.toLowerCase().includes(q);

      const matchTingkat = selectedTingkat === 'ALL' || s.tingkat === selectedTingkat;
      const matchDomisili = selectedDomisili === 'ALL' || s.domisili === selectedDomisili;
      const matchKelas = selectedKelas === 'ALL' || s.kelas === selectedKelas;

      let matchStatus = true;
      if (statusFilter === 'BEBAS') matchStatus = s.isBebasTakziran;
      else if (statusFilter === 'TAKZIR') matchStatus = !s.isBebasTakziran;
      else if (statusFilter === 'KHUSUS') matchStatus = s.isPerhatianKhusus;

      let matchBulan = true;
      if (selectedBulan !== 'ALL') {
        matchBulan = Boolean(s.takziranBulanan && s.takziranBulanan[selectedBulan]);
      }

      return matchSearch && matchTingkat && matchDomisili && matchKelas && matchStatus && matchBulan;
    });
  }, [students, search, selectedTingkat, selectedDomisili, selectedKelas, statusFilter, selectedBulan]);

  // Reset pagination saat filter berubah tanpa melanggar aturan hook React 19
  const filterKey = `${search}|${selectedTingkat}|${selectedDomisili}|${selectedKelas}|${statusFilter}|${selectedBulan}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const isFiltered =
    selectedTingkat !== 'ALL' ||
    selectedBulan !== 'ALL' ||
    selectedDomisili !== 'ALL' ||
    selectedKelas !== 'ALL' ||
    statusFilter !== 'ALL' ||
    search !== '';

  const handleResetFilters = () => {
    setSelectedTingkat('ALL');
    setSelectedBulan('ALL');
    setSelectedDomisili('ALL');
    setSelectedKelas('ALL');
    setSearch('');
    if (onSelectStatusFilter) onSelectStatusFilter('ALL');
  };

  const startIndex = filteredStudents.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length);

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5E0] shadow-xs overflow-hidden">
      {/* ============================================================== */}
      {/* 1. TOOLBAR FILTER & PENCARIAN SISWA                            */}
      {/* ============================================================== */}
      <div className="p-4 sm:p-5 border-b border-[#DCE5E0] bg-[#FAF6EF]/50 space-y-4">
        {/* Baris Atas: Search Box & Segmented Tab Tingkat */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5C6E66] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari santri berdasarkan nama, kelas, atau domisili..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#DCE5E0] bg-white text-xs sm:text-sm text-[#26332E] placeholder-[#5C6E66]/70 focus:outline-hidden focus:border-[#1D7A6F] focus:ring-2 focus:ring-[#1D7A6F]/15 transition-all shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5C6E66] hover:text-[#26332E]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Segmented Button: Tingkat Madrasah */}
          <div className="inline-flex p-1 rounded-xl bg-white border border-[#DCE5E0] shadow-2xs self-start md:self-auto">
            {['ALL', 'MI', 'MTs', 'MA'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTingkat(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTingkat === t
                    ? 'bg-[#1D7A6F] text-white shadow-2xs'
                    : 'text-[#5C6E66] hover:text-[#26332E] hover:bg-[#FAF6EF]'
                }`}
              >
                {t === 'ALL' ? 'Semua Tingkat' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Baris Bawah: Dropdown Filter & Tombol Reset */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
          {/* Filter Status Kedisiplinan */}
          <select
            value={statusFilter}
            onChange={(e) => onSelectStatusFilter && onSelectStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] font-medium focus:outline-hidden focus:border-[#1D7A6F] shadow-2xs cursor-pointer"
          >
            <option value="ALL">Semua status</option>
            <option value="BEBAS">Bebas takziran</option>
            <option value="TAKZIR">Ada takziran (1+)</option>
            <option value="KHUSUS">Perhatian khusus (3+)</option>
          </select>

          {/* Filter Bulan Takziran Tertentu */}
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] font-medium focus:outline-hidden focus:border-[#1D7A6F] shadow-2xs cursor-pointer"
          >
            <option value="ALL">Semua Bulan Takziran</option>
            {bulanList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Filter Kelas */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] font-medium focus:outline-hidden focus:border-[#1D7A6F] shadow-2xs cursor-pointer"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                Kelas {c}
              </option>
            ))}
          </select>

          {/* Filter Domisili Asrama */}
          <select
            value={selectedDomisili}
            onChange={(e) => setSelectedDomisili(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] font-medium focus:outline-hidden focus:border-[#1D7A6F] shadow-2xs cursor-pointer"
          >
            <option value="ALL">Semua Domisili</option>
            {domisiliList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Tombol Reset Filter */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8A2F1B] bg-[#FAF0ED] hover:bg-[#F5DFD8] border border-[#E8BCB0] transition-colors cursor-pointer ml-auto"
              title="Kembalikan semua filter ke awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. INFORMASI JUMLAH DATA & INDIKATOR FILTER                    */}
      {/* ============================================================== */}
      <div className="px-5 py-2.5 bg-white border-b border-[#DCE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5C6E66]">
        <div>
          Menampilkan <strong className="text-[#26332E] font-serif">{startIndex}–{endIndex}</strong> dari <strong className="text-[#1D7A6F] font-serif">{filteredStudents.length}</strong> santri
          {isFiltered && <span> (terfilter)</span>}
        </div>
        <div className="text-[11px] text-[#5C6E66]/80">
          Data tersinkron otomatis dari Google Sheets
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TABEL DATA SISWA (DESKTOP)                                  */}
      {/* ============================================================== */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-[#FAF6EF] text-[#26332E] font-bold border-b border-[#DCE5E0] text-[11px] sm:text-xs uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4 min-w-[200px]">Nama Santri</th>
              <th className="py-3 px-4 w-28">Kelas</th>
              <th className="py-3 px-4 w-28">Domisili</th>
              <th className="py-3 px-4 w-36 text-center">Status &amp; Total</th>
              <th className="py-3 px-4 min-w-[240px]">Bulan Takziran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE5E0]">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#5C6E66] space-y-2">
                  <Users className="w-8 h-8 text-[#5C6E66]/40 mx-auto" />
                  <p className="font-semibold text-sm">Tidak ada data santri yang cocok.</p>
                  <p className="text-xs">Silakan ubah kata kunci pencarian atau sesuaikan filter Anda.</p>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((s, idx) => {
                const parsed = parseClassAndDomisili(s.kelas, s.domisili);
                const isWarningRow = s.isPerhatianKhusus;
                const isBebasRow = s.isBebasTakziran;

                return (
                  <tr
                    key={s.id || idx}
                    className={`transition-colors ${
                      isWarningRow
                        ? 'bg-[#FAF0ED]/40 hover:bg-[#FAF0ED]/70'
                        : isBebasRow
                        ? 'hover:bg-[#FAF6EF]/60'
                        : 'hover:bg-[#FAF3E6]/40'
                    }`}
                  >
                    {/* No Urut */}
                    <td className="py-3 px-4 text-center text-[#5C6E66] font-mono text-xs">
                      {startIndex + idx}
                    </td>

                    {/* Nama Siswa */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#26332E] flex items-center gap-1.5">
                        <span>{s.nama}</span>
                        {isWarningRow && (
                          <span
                            title="Perhatian Khusus (3+ Bulan Takziran)"
                            className="inline-flex text-[#8A2F1B] shrink-0"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#5C6E66] font-mono">
                        {s.nis ? `NIS: ${s.nis}` : `Tingkat ${s.tingkat}`}
                      </div>
                    </td>

                    {/* Kelas */}
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F7F5EF] text-[#26332E] border border-[#DCE5E0]">
                        {parsed.kelas}
                      </span>
                    </td>

                    {/* Domisili */}
                    <td className="py-3 px-4">
                      <span className="text-xs text-[#5C6E66] font-medium">
                        {parsed.domisili}
                      </span>
                    </td>

                    {/* Status & Total Takziran */}
                    <td className="py-3 px-4 text-center">
                      {isBebasRow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5F3] text-[#1D7A6F] border border-[#C8E3DC]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bebas</span>
                        </span>
                      ) : isWarningRow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{s.totalTakziran} Bulan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{s.totalTakziran} Bulan</span>
                        </span>
                      )}
                    </td>

                    {/* Rincian Bulan Takziran */}
                    <td className="py-3 px-4">
                      {isBebasRow ? (
                        <span className="text-xs text-[#1D7A6F]/80 italic">Tertib (tidak ada catatan)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {bulanList.map((b) => {
                            const kena = Boolean(s.takziranBulanan && s.takziranBulanan[b.id]);
                            if (!kena) return null;
                            return (
                              <span
                                key={b.id}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  isWarningRow
                                    ? 'bg-[#FAF0ED] text-[#8A2F1B] border-[#E8BCB0]'
                                    : 'bg-[#FAF3E6] text-[#8C6D23] border-[#ECD8A5]'
                                }`}
                              >
                                {b.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* 4. FOOTER PAGINATION                                           */}
      {/* ============================================================== */}
      <div className="px-5 py-3.5 bg-[#FAF6EF]/60 border-t border-[#DCE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-[#5C6E66]">
          Halaman <strong className="text-[#26332E]">{currentPage}</strong> dari <strong className="text-[#26332E]">{totalPages}</strong>
        </div>

        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#FAF6EF] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          <span className="px-3 py-1.5 rounded-lg font-bold text-xs bg-[#1D7A6F] text-white shadow-2xs">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#FAF6EF] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
