'use client';

import React, { useState } from 'react';
import { formatRupiah, fetchDetailSheetData } from '@/lib/fetchCSV';
import { DATA_LINKS } from '@/lib/dataLinks';
import AdminButton from './AdminButton';
import { PrintHeader, PrintSignatures } from './PrintHeaderFooter';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Printer,
  Calendar,
  Layers,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  Percent,
  ListFilter,
  RefreshCw,
  FileText,
} from 'lucide-react';

export default function KeuanganTable({ keuanganData, editUrl }) {
  const [activeTab, setActiveTab] = useState('KOMPARASI'); // 'KOMPARASI' | 'RAB' | 'LPJ' | 'DETAIL'
  
  // State untuk Tab Detail Rincian Itemized
  const [selectedDetailSheet, setSelectedDetailSheet] = useState(
    DATA_LINKS.keuangan.detailSheets?.[0]?.csvUrl || ''
  );
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  if (!keuanganData) {
    return null;
  }

  const {
    title,
    subtitle,
    rekapitulasi = [],
    total,
    catatanBerikutnya = [],
    strukturFile = [],
  } = keuanganData;

  // Fungsi memuat detail sheet itemized
  const loadDetailSheet = async (url) => {
    if (!url) return;
    try {
      setLoadingDetail(true);
      setSelectedDetailSheet(url);
      const res = await fetchDetailSheetData(url);
      setDetailData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'DETAIL' && !detailData && DATA_LINKS.keuangan.detailSheets?.[0]?.csvUrl) {
      loadDetailSheet(DATA_LINKS.keuangan.detailSheets[0].csvUrl);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Hitung persentase realisasi total
  const persenRealisasiTotal = total?.subsidi && total.subsidi > 0
    ? ((total.pengeluaran / total.subsidi) * 100).toFixed(1)
    : 0;

  const tabTitleMap = {
    KOMPARASI: 'Laporan Rekapitulasi Komparasi RAB vs LPJ',
    RAB: 'Laporan Rencana Anggaran Biaya (RAB) Lembaga',
    LPJ: 'Laporan Pertanggungjawaban Realisasi Pengeluaran (LPJ)',
    DETAIL: detailData?.title ? `Laporan Rincian: ${detailData.title}` : 'Laporan Rincian Belanja Keuangan Itemized',
  };

  const currentTabLabel = tabTitleMap[activeTab] || 'Laporan Rekapitulasi Keuangan';

  return (
    <div className="space-y-6">
      
      {/* KOP SURAT RESMI CETAK (HANYA MUNCUL DI PRINT / PDF) */}
      <PrintHeader
        title={currentTabLabel}
        subtitle="Pondok Pesantren Darussalam Sumbersari Kencong Pare Kediri"
        filterInfo={`Tampilan: ${activeTab === 'KOMPARASI' ? 'Rekap RAB vs LPJ' : activeTab === 'RAB' ? 'Khusus RAB (Anggaran)' : activeTab === 'LPJ' ? 'Khusus LPJ (Realisasi)' : 'Rincian Belanja Detail'}`}
        totalInfo={`RAB: ${formatRupiah(total?.subsidi || 0)} | LPJ: ${formatRupiah(total?.pengeluaran || 0)} | Saldo: ${formatRupiah(total?.saldo || 0)} (Realisasi ${persenRealisasiTotal}%)`}
      />

      {/* TAB NAVIGASI KEUANGAN */}
      <div className="no-print overflow-x-auto pb-1">
        <div className="inline-flex p-1 rounded-xl bg-white border border-[#DCE5E0] shadow-xs min-w-max">
          <button
            onClick={() => handleTabChange('KOMPARASI')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'KOMPARASI'
                ? 'bg-[#1D7A6F] text-white shadow-xs'
                : 'text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F]'
            }`}
          >
            Rekap RAB vs LPJ
          </button>
          <button
            onClick={() => handleTabChange('RAB')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'RAB'
                ? 'bg-[#1D7A6F] text-white shadow-xs'
                : 'text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F]'
            }`}
          >
            Khusus RAB (Anggaran)
          </button>
          <button
            onClick={() => handleTabChange('LPJ')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'LPJ'
                ? 'bg-[#1D7A6F] text-white shadow-xs'
                : 'text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F]'
            }`}
          >
            Khusus LPJ (Realisasi)
          </button>
          <button
            onClick={() => handleTabChange('DETAIL')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'DETAIL'
                ? 'bg-[#1D7A6F] text-white shadow-xs'
                : 'text-[#26332E] hover:bg-[#F7F5EF] hover:text-[#1D7A6F]'
            }`}
          >
            Rincian Belanja Detail
          </button>
        </div>
      </div>

      {/* 3 KARTU RINGKASAN METRIK KEUANGAN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 card-print">
        
        <div className="bg-white rounded-xl p-5 border border-[#DCE5E0] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5C6D66] uppercase tracking-wider">
            <span>RAB / Total Subsidi</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#26332E] mt-2">
            {formatRupiah(total?.subsidi || 0)}
          </div>
          <p className="text-xs text-[#5C6D66] mt-1">Total alokasi anggaran masuk</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#DCE5E0] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5C6D66] uppercase tracking-wider">
            <span>LPJ / Realisasi Belanja</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF0ED] text-[#8A2F1B] flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#8A2F1B] mt-2">
            {formatRupiah(total?.pengeluaran || 0)}
          </div>
          <p className="text-xs text-[#5C6D66] mt-1">
            Realisasi: <strong className="text-[#8A2F1B] font-semibold">{persenRealisasiTotal}%</strong> dari RAB
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border-2 border-[#1D7A6F] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#C6A66B]" />
          <div className="flex items-center justify-between text-xs font-bold text-[#1D7A6F] uppercase tracking-wider">
            <span>Saldo (Dikembalikan)</span>
            <div className="w-8 h-8 rounded-lg bg-[#1D7A6F] text-[#C6A66B] flex items-center justify-center shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#1D7A6F] mt-2">
            {formatRupiah(total?.saldo || 0)}
          </div>
          <p className="text-xs text-[#5C6E66] mt-1">Sisa dana disetor kembali ke kas pusat pondok</p>
        </div>

      </div>

      {/* ============================================================== */}
      {/* KONTEN TAB 1: KOMPARASI REKAPITULASI RAB VS LPJ                */}
      {/* ============================================================== */}
      {activeTab === 'KOMPARASI' && (
        <div className="bg-white rounded-xl shadow-xs border border-[#DCE5E0] overflow-hidden card-print">
          <div className="p-5 border-b border-[#DCE5E0] flex items-center justify-between bg-[#FAF8F5]">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#1D7A6F]">
                Rekapitulasi Komparasi: RAB (Anggaran) vs LPJ (Pengeluaran)
              </h2>
              <p className="text-xs text-[#5C6D66] mt-0.5">
                Perbandingan alokasi rencana anggaran terhadap realisasi nyata per periode
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6D66] uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Bulan / Periode</th>
                  <th className="py-3.5 px-4 text-right">RAB (Anggaran)</th>
                  <th className="py-3.5 px-4 text-right">LPJ (Realisasi)</th>
                  <th className="py-3.5 px-4 text-right">Saldo Kas</th>
                  <th className="py-3.5 px-4 text-center">Rasio (%)</th>
                  <th className="py-3.5 px-4 sm:px-6">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E0]">
                {rekapitulasi.map((item, idx) => {
                  const rasio = item.subsidi > 0 ? ((item.pengeluaran / item.subsidi) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#26332E]">
                        {item.bulan}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#26332E]">
                        {formatRupiah(item.subsidi)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#8A2F1B]">
                        {formatRupiah(item.pengeluaran)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1D7A6F]">
                        {formatRupiah(item.saldo)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#EDF3F7] text-[#224A63] border border-[#224A63]/15">
                          {rasio}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-[#5C6D66] text-xs">
                        {item.keterangan || '-'}
                      </td>
                    </tr>
                  );
                })}

                {/* Baris TOTAL */}
                {total && (
                  <tr className="bg-[#E8F5F3] border-t-2 border-[#1D7A6F] font-bold text-sm">
                    <td className="py-4 px-4 sm:px-6 text-[#1D7A6F] font-serif">
                      {total.bulan || 'TOTAL'}
                    </td>
                    <td className="py-4 px-4 text-right text-[#26332E]">
                      {formatRupiah(total.subsidi)}
                    </td>
                    <td className="py-4 px-4 text-right text-[#8A2F1B]">
                      {formatRupiah(total.pengeluaran)}
                    </td>
                    <td className="py-4 px-4 text-right text-[#1D7A6F] font-black text-base font-serif">
                      {formatRupiah(total.saldo)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#1D7A6F] text-white">
                        {persenRealisasiTotal}%
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-xs text-[#1D7A6F]">
                      {total.keterangan || 'Akumulasi Semua Periode'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KONTEN TAB 2: KHUSUS RAB (RENCANA ANGGARAN BIAYA)              */}
      {/* ============================================================== */}
      {activeTab === 'RAB' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-[#DCE5E0] overflow-hidden card-print">
            <div className="p-5 border-b border-[#DCE5E0] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <h2 className="text-lg font-bold font-serif text-[#1D7A6F] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#1D7A6F]" />
                  Rencana Anggaran Biaya (RAB) / Alokasi Subsidi Masuk
                </h2>
                <p className="text-xs text-[#5C6D66] mt-0.5">
                  Daftar plafon anggaran yang dialokasikan untuk operasional MMD Darussalamah
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6D66] uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Periode Kegiatan</th>
                    <th className="py-3.5 px-4 text-right">Plafon Anggaran (RAB)</th>
                    <th className="py-3.5 px-4 sm:px-6">Keterangan Alokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E0]">
                  {rekapitulasi.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#26332E]">
                        {item.bulan}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#26332E] text-base font-serif">
                        {formatRupiah(item.subsidi)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-[#5C6D66] text-xs">
                        {item.keterangan || 'Subsidi Terjadwal'}
                      </td>
                    </tr>
                  ))}
                  {total && (
                    <tr className="bg-[#E8F5F3] border-t-2 border-[#1D7A6F] font-bold text-sm">
                      <td className="py-4 px-4 sm:px-6 text-[#1D7A6F] font-serif">
                        TOTAL RAB KESELURUHAN
                      </td>
                      <td className="py-4 px-4 text-right text-[#1D7A6F] font-black text-lg font-serif">
                        {formatRupiah(total.subsidi)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs text-[#1D7A6F]">
                        Akumulasi anggaran 4 periode
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Proyeksi RAB Bulan Berikutnya */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#DCE5E0] card-print">
            <h3 className="font-bold font-serif text-base text-[#1D7A6F] flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#C6A66B]" />
              Proyeksi RAB Bulan Berikutnya (Rabiul Awal & Rabiul Tsani)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {catatanBerikutnya.map((note, index) => (
                <div key={index} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#DCE5E0] text-[#26332E]">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KONTEN TAB 3: KHUSUS LPJ (LAPORAN PERTANGGUNGJAWABAN REALISASI)*/}
      {/* ============================================================== */}
      {activeTab === 'LPJ' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-[#DCE5E0] overflow-hidden card-print">
            <div className="p-5 border-b border-[#DCE5E0] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <h2 className="text-lg font-bold font-serif text-[#1D7A6F] flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#8A2F1B]" />
                  Laporan Pertanggungjawaban (LPJ) / Realisasi Belanja
                </h2>
                <p className="text-xs text-[#5C6D66] mt-0.5">
                  Laporan rekapitulasi penggunaan dana nyata yang telah dipertanggungjawabkan
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FAF0ED] border-b border-[#F1D3CC] text-[11px] font-bold text-[#8A2F1B] uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Bulan Realisasi</th>
                    <th className="py-3.5 px-4 text-right">Pengeluaran Nyata (LPJ)</th>
                    <th className="py-3.5 px-4 text-right">Sisa Saldo Kas</th>
                    <th className="py-3.5 px-4 sm:px-6">Status Pertanggungjawaban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E0]">
                  {rekapitulasi.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#26332E]">
                        {item.bulan}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#8A2F1B] text-base font-serif">
                        {formatRupiah(item.pengeluaran)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#1D7A6F] font-serif">
                        {formatRupiah(item.saldo)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-[#1D7A6F] font-semibold flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1D7A6F]" />
                        <span>LPJ Telah Disahkan ({item.keterangan || 'Lengkap'})</span>
                      </td>
                    </tr>
                  ))}
                  {total && (
                    <tr className="bg-[#FAF0ED] border-t-2 border-[#8A2F1B] font-bold text-sm">
                      <td className="py-4 px-4 sm:px-6 text-[#8A2F1B] font-serif">
                        TOTAL REALISASI PENGELUARAN
                      </td>
                      <td className="py-4 px-4 text-right text-[#8A2F1B] font-black text-lg font-serif">
                        {formatRupiah(total.pengeluaran)}
                      </td>
                      <td className="py-4 px-4 text-right text-[#1D7A6F] font-black text-lg font-serif">
                        {formatRupiah(total.saldo)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs text-[#5C6D66]">
                        Saldo Akhir Kas Tersimpan: <strong className="text-[#1D7A6F]">{formatRupiah(total.saldo)}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KONTEN TAB 4: RINCIAN BELANJA DETAIL PER SHEET (ITEMIZED)       */}
      {/* ============================================================== */}
      {activeTab === 'DETAIL' && (
        <div className="space-y-6">
          
          {/* Pemilih Sheet Detail */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#DCE5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-[#1D7A6F]" />
              <span className="text-xs sm:text-sm font-bold text-[#26332E]">
                Pilih Sheet Rincian:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {DATA_LINKS.keuangan.detailSheets?.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => loadDetailSheet(sheet.csvUrl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDetailSheet === sheet.csvUrl
                      ? 'bg-[#1D7A6F] text-white shadow-xs'
                      : 'bg-[#F7F5EF] text-[#26332E] hover:bg-[#E8F5F3] hover:text-[#1D7A6F] border border-[#DCE5E0]'
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
          </div>

          {/* Konten Tabel Detail Itemized */}
          {loadingDetail ? (
            <div className="bg-white rounded-2xl p-16 text-center text-[#5C6D66] border border-[#DCE5E0]">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1D7A6F] mb-3" />
              <p className="text-sm font-medium">Memuat rincian item belanja dari Google Sheets...</p>
            </div>
          ) : detailData ? (
            <div className="space-y-6 card-print">
              <div className="bg-white rounded-2xl p-5 border border-[#DCE5E0] shadow-xs">
                <h2 className="text-lg font-bold font-serif text-[#1D7A6F]">
                  {detailData.title}
                </h2>
                {detailData.docNumber && (
                  <p className="text-xs text-[#5C6D66] mt-0.5">{detailData.docNumber}</p>
                )}
              </div>

              {detailData.sections?.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white rounded-2xl shadow-xs border border-[#DCE5E0] overflow-hidden card-print"
                >
                  <div className="p-4 bg-[#FAF8F5] border-b border-[#DCE5E0]">
                    <h3 className="font-bold font-serif text-sm sm:text-base text-[#1D7A6F]">
                      {section.title}
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-[#F7F5EF] border-b border-[#DCE5E0] text-[11px] font-bold text-[#5C6D66] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-12 text-center">No</th>
                          <th className="py-2.5 px-4">Uraian Barang / Kegiatan</th>
                          <th className="py-2.5 px-3">Jumlah</th>
                          <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                          <th className="py-2.5 px-4 text-right">Anggaran / Realisasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE5E0]">
                        {section.items?.map((it, iIdx) => (
                          <tr
                            key={iIdx}
                            className={`hover:bg-[#FAF8F5] ${
                              it.isTotal
                                ? 'bg-[#E8F5F3] font-bold text-[#1D7A6F] border-t-2 border-[#1D7A6F]'
                                : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center text-[#5C6D66]">
                              {it.no || '-'}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-[#26332E]">
                              {it.uraian}
                            </td>
                            <td className="py-2.5 px-3 text-[#5C6D66]">
                              {it.jumlah}
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#5C6D66]">
                              {it.hargaSatuan}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#26332E] font-serif">
                              {it.kenyataan !== '-' ? it.kenyataan : it.anggaran}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-[#5C6D66] border border-[#DCE5E0]">
              Pilih salah satu sheet di atas untuk melihat rincian item belanja.
            </div>
          )}

        </div>
      )}

      {/* Tanda Tangan Resmi Pengesahan Laporan */}
      <PrintSignatures leftRole="Kepala MMD Darussalamah" rightRole="WAKA III / Bendahara LBM" />

    </div>
  );
}
