'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
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
  const [selectedTingkat, setSelectedTingkat] = useState('ALL'); // 'ALL' | 'MI' | 'MTs' | 'MA'
  const [selectedBulan, setSelectedBulan] = useState('ALL'); // 'ALL' | 'dzulqodah' | ...
  const [selectedDomisili, setSelectedDomisili] = useState('ALL');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset pagination saat filter berubah
  useMemo(() => {
    setCurrentPage(1);
  }, [search, selectedTingkat, selectedDomisili, selectedKelas, statusFilter, selectedBulan]);

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
    if (onSelectStatusFilter) onSelectStatusFilter('ALL');
    setSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-[#DCE5E0] overflow-hidden space-y-0">
      {/* Toolbar Filter & Pencarian */}
      <div className="p-4 sm:p-5 border-b border-[#DCE5E0] space-y-3.5 bg-white">
        {/* Baris Tab Tingkat & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE5E0]/60">
          {/* Tab Filter Tingkat */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#F7F5EF] border border-[#DCE5E0] text-xs">
            {['ALL', 'MI', 'MTs', 'MA'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTingkat(t)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedTingkat === t
                    ? 'bg-[#1D7A6F] text-white shadow-2xs'
                    : 'text-[#5C6E66] hover:text-[#26332E]'
                }`}
              >
                {t === 'ALL' ? 'Semua Tingkat' : t}
              </button>
            ))}
          </div>

          {/* Indikator Jumlah Hasil */}
          <div className="text-xs text-[#5C6E66]">
            Menampilkan <strong>{filteredStudents.length}</strong> dari {students.length} siswa
          </div>
        </div>

        {/* Baris Dropdown Filter & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Input Pencarian */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-[#5C6E66] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama santri, kelas, atau domisili..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DCE5E0] text-xs sm:text-sm focus:outline-hidden focus:border-[#1D7A6F] text-[#26332E] placeholder-[#5C6E66]/60 bg-white"
            />
          </div>

          {/* Filter Status Takziran */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => onSelectStatusFilter && onSelectStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-xs sm:text-sm focus:outline-hidden focus:border-[#1D7A6F] text-[#26332E] bg-white font-medium cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="BEBAS">★ Bebas Takziran (0)</option>
              <option value="TAKZIR">Ada Takziran (1+)</option>
              <option value="KHUSUS">Perhatian Khusus (3+)</option>
            </select>
          </div>

          {/* Filter Bulan Takziran Tertentu */}
          <div className="sm:col-span-2">
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-xs sm:text-sm focus:outline-hidden focus:border-[#1D7A6F] text-[#26332E] bg-white font-medium cursor-pointer"
            >
              <option value="ALL">Semua Bulan</option>
              {bulanList.map((b) => (
                <option key={b.id} value={b.id}>
                  Takzir {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Domisili (Pondok/Asrama) */}
          <div className="sm:col-span-2">
            <select
              value={selectedDomisili}
              onChange={(e) => setSelectedDomisili(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#DCE5E0] text-xs sm:text-sm focus:outline-hidden focus:border-[#1D7A6F] text-[#26332E] bg-white font-medium cursor-pointer"
            >
              <option value="ALL">Semua Domisili</option>
              {domisiliList.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Reset Filter */}
          <div className="sm:col-span-1 flex items-center justify-center">
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset Semua Filter"
                className="w-full p-2 rounded-lg text-[#5C6E66] hover:text-[#8A2F1B] hover:bg-[#FAF0ED] border border-[#DCE5E0] transition-colors flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Tampilan Desktop */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider">
              <th className="py-3 px-3.5 w-12 text-center">No</th>
              <th className="py-3 px-4 min-w-[200px]">Nama Siswa Santri</th>
              <th className="py-3 px-3 w-28 text-center">Tingkat &amp; Kelas</th>
              <th className="py-3 px-3 w-24 text-center">Domisili</th>
              <th className="py-3 px-3 w-28 text-center">Bulan Takzir</th>
              {/* Kolom 6 Bulan Takziran */}
              <th className="py-3 px-2 text-center w-14">Dzulq</th>
              <th className="py-3 px-2 text-center w-14">Dzulh</th>
              <th className="py-3 px-2 text-center w-14">Muhar</th>
              <th className="py-3 px-2 text-center w-14">Shofar</th>
              <th className="py-3 px-2 text-center w-14">R.Awal</th>
              <th className="py-3 px-2 text-center w-14">R.Tsani</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE5E0]/60">
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((item, idx) => {
                const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                const isBebas = item.isBebasTakziran;
                const isKhusus = item.isPerhatianKhusus;

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-[#F7F5EF]/60 transition-colors group"
                  >
                    <td className="py-3 px-3.5 text-center font-mono text-xs text-[#5C6E66]">
                      {globalIdx}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#26332E] group-hover:text-[#1D7A6F] transition-colors">
                        {item.nama}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F7F5EF] text-[#26332E] border border-[#DCE5E0]">
                        <span className="font-bold text-[#1D7A6F]">{item.tingkat}</span>
                        <span>{item.kelas}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]/60">
                        {item.domisili}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isBebas
                            ? 'bg-[#E8F5F3] text-[#1D7A6F] border-[#C8E3DC]'
                            : isKhusus
                            ? 'bg-[#FAF0ED] text-[#8A2F1B] border-[#E8BCB0]'
                            : 'bg-[#FAF3E6] text-[#8C6D23] border-[#ECD8A5]'
                        }`}
                      >
                        {item.jmlBulanTakziran === 0
                          ? 'Bebas'
                          : `${item.jmlBulanTakziran} Bulan`}
                      </span>
                    </td>

                    {/* Indikator 6 Bulan */}
                    <td className="py-3 px-2 text-center">
                      {item.takziranBulanan.dzulqodah ? (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                          YA
                        </span>
                      ) : (
                        <span className="text-[#5C6E66]/30 text-xs font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {item.takziranBulanan.dzulhijjah ? (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                          YA
                        </span>
                      ) : (
                        <span className="text-[#5C6E66]/30 text-xs font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {item.takziranBulanan.muharram ? (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                          YA
                        </span>
                      ) : (
                        <span className="text-[#5C6E66]/30 text-xs font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {item.takziranBulanan.shofar ? (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                          YA
                        </span>
                      ) : (
                        <span className="text-[#5C6E66]/30 text-xs font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {item.takziranBulanan.rawai ? (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                          YA
                        </span>
                      ) : (
                        <span className="text-[#5C6E66]/30 text-xs font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {item.takziranBulanan.rtsani ? (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FAF0ED] text-[#8A2F1B] border border-[#E8BCB0]">
                          YA
                        </span>
                      ) : (
                        <span className="text-[#5C6E66]/30 text-xs font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-12 text-center text-[#5C6E66] text-sm">
                  Tidak ada data siswa yang cocok dengan kriteria filter yang dipilih.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu Khusus Mobile */}
      <div className="md:hidden divide-y divide-[#DCE5E0]/60">
        {paginatedStudents.length > 0 ? (
          paginatedStudents.map((item, idx) => {
            const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
            const isBebas = item.isBebasTakziran;
            const isKhusus = item.isPerhatianKhusus;

            return (
              <div key={item.id || idx} className="p-4 space-y-2.5 hover:bg-[#F7F5EF]/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#5C6E66]">No. {globalIdx}</span>
                    <h4 className="font-bold text-[#26332E] text-sm mt-0.5">{item.nama}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F7F5EF] text-[#1D7A6F] border border-[#DCE5E0]">
                        {item.tingkat} {item.kelas}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]">
                        {item.domisili}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${
                      isBebas
                        ? 'bg-[#E8F5F3] text-[#1D7A6F] border-[#C8E3DC]'
                        : isKhusus
                        ? 'bg-[#FAF0ED] text-[#8A2F1B] border-[#E8BCB0]'
                        : 'bg-[#FAF3E6] text-[#8C6D23] border-[#ECD8A5]'
                    }`}
                  >
                    {item.jmlBulanTakziran === 0 ? 'Bebas' : `${item.jmlBulanTakziran} Bulan`}
                  </span>
                </div>

                {/* Status Takziran Bulanan Mini */}
                {!isBebas && (
                  <div className="p-2 rounded-lg bg-[#FAF0ED]/60 border border-[#E8BCB0]/50 text-xs text-[#8A2F1B]">
                    <span className="font-semibold block text-[10px] uppercase">Bulan Takziran:</span>
                    <span className="text-xs">{item.dataTakziran}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-[#5C6E66] text-sm">
            Tidak ada siswa yang cocok dengan filter.
          </div>
        )}
      </div>

      {/* Pagination & Footer */}
      <div className="p-4 border-t border-[#DCE5E0] bg-[#F7F5EF]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5C6E66]">
        <div>
          Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total {filteredStudents.length} siswa)
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-[#26332E]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-[#F7F5EF] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

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
  );
}
