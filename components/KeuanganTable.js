'use client';

import React, { useState } from 'react';
import { formatRupiah, fetchDetailSheetData } from '@/lib/fetchCSV';
import { DATA_LINKS } from '@/lib/dataLinks';
import AdminButton from './AdminButton';
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

  return (
    <div className="space-y-6">
      
      {/* KOP SURAT RESMI (HANYA MUNCUL SAAT DICETAK KE PRINTER / PDF) */}
      <div className="print-only flex items-center justify-center gap-4 border-b-2 border-black pb-4 mb-6">
        <img src="/logo.png" alt="Logo MIDA" className="w-16 h-16 object-contain" />
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            MADRASAH ISLAMIYAH DARUSSALAMAH (MMD)
          </h1>
          <h2 className="text-sm font-semibold">
            Pondok Pesantren Darussalam Sumbersari Kencong Kediri
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Laporan Keuangan: Rekapitulasi Rencana Anggaran Biaya (RAB) & Laporan Pertanggungjawaban (LPJ)
          </p>
          <p className="text-xs text-gray-500">Tahun Ajaran 1447-1448 H / 2026-2027 M</p>
        </div>
      </div>

      {/* HEADER SECTION & TOMBOL AKSI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="inline-flex p-1 rounded-2xl bg-white border border-[#2A9D8F]/20 shadow-xs max-w-full overflow-x-auto">
          <button
            onClick={() => handleTabChange('KOMPARASI')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'KOMPARASI'
                ? 'bg-[#2A9D8F] text-white shadow-xs'
                : 'text-[#2D3436] hover:bg-[#E8F5F3]'
            }`}
          >
            Rekap RAB vs LPJ
          </button>
          <button
            onClick={() => handleTabChange('RAB')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'RAB'
                ? 'bg-[#2A9D8F] text-white shadow-xs'
                : 'text-[#2D3436] hover:bg-[#E8F5F3]'
            }`}
          >
            Khusus RAB (Anggaran)
          </button>
          <button
            onClick={() => handleTabChange('LPJ')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'LPJ'
                ? 'bg-[#2A9D8F] text-white shadow-xs'
                : 'text-[#2D3436] hover:bg-[#E8F5F3]'
            }`}
          >
            Khusus LPJ (Realisasi)
          </button>
          <button
            onClick={() => handleTabChange('DETAIL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'DETAIL'
                ? 'bg-[#1D7A6F] text-white shadow-xs'
                : 'text-[#2D3436] hover:bg-[#E8F5F3]'
            }`}
          >
            Rincian Belanja Detail
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Cetak / Print PDF */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-300 text-[#2D3436] hover:bg-gray-50 shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="Cetak Laporan atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4 text-[#2A9D8F]" />
            <span>Cetak / PDF</span>
          </button>

          <AdminButton editUrl={editUrl} title="Edit di Sheets" />
        </div>
      </div>

      {/* 3 KARTU RINGKASAN METRIK KEUANGAN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 card-print">
        
        <div className="bg-white rounded-2xl p-5 border border-[#2A9D8F]/20 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#636E72] uppercase tracking-wider">
            <span>RAB / Total Subsidi</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] text-[#2A9D8F] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2D3436] mt-2">
            {formatRupiah(total?.subsidi || 0)}
          </div>
          <p className="text-xs text-[#636E72] mt-1">Total alokasi anggaran masuk</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#636E72] uppercase tracking-wider">
            <span>LPJ / Realisasi Belanja</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(total?.pengeluaran || 0)}
          </div>
          <p className="text-xs text-[#636E72] mt-1">
            Realisasi: <strong className="text-rose-700">{persenRealisasiTotal}%</strong> dari RAB
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#2A9D8F] shadow-xs bg-linear-to-br from-white to-[#E8F5F3]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1D7A6F] uppercase tracking-wider">
            <span>Saldo (Dikembalikan)</span>
            <div className="w-8 h-8 rounded-lg bg-[#2A9D8F] text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1D7A6F] mt-2">
            {formatRupiah(total?.saldo || 0)}
          </div>
          <p className="text-xs text-[#1D7A6F]/80 mt-1">Sisa dana disetor kembali ke kas pusat pondok</p>
        </div>

      </div>

      {/* ============================================================== */}
      {/* KONTEN TAB 1: KOMPARASI REKAPITULASI RAB VS LPJ                */}
      {/* ============================================================== */}
      {activeTab === 'KOMPARASI' && (
        <div className="bg-white rounded-2xl shadow-xs border border-[#2A9D8F]/15 overflow-hidden card-print">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FFFCF5]">
            <div>
              <h2 className="text-lg font-bold text-[#2D3436]">
                Rekapitulasi Komparasi: RAB (Anggaran) vs LPJ (Pengeluaran)
              </h2>
              <p className="text-xs text-[#636E72]">
                Perbandingan alokasi rencana anggaran terhadap realisasi nyata per periode
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FDF6E3] border-b border-[#2A9D8F]/20 text-xs font-semibold text-[#636E72] uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Bulan / Periode</th>
                  <th className="py-3.5 px-4 text-right">RAB (Anggaran)</th>
                  <th className="py-3.5 px-4 text-right">LPJ (Realisasi)</th>
                  <th className="py-3.5 px-4 text-right">Saldo Kas</th>
                  <th className="py-3.5 px-4 text-center">Rasio (%)</th>
                  <th className="py-3.5 px-4 sm:px-6">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rekapitulasi.map((item, idx) => {
                  const rasio = item.subsidi > 0 ? ((item.pengeluaran / item.subsidi) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx} className="hover:bg-[#FFFCF5] transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-semibold text-[#2D3436]">
                        {item.bulan}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-[#2D3436]">
                        {formatRupiah(item.subsidi)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-rose-600">
                        {formatRupiah(item.pengeluaran)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[#1D7A6F]">
                        {formatRupiah(item.saldo)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {rasio}%
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-[#636E72] text-xs">
                        {item.keterangan || '-'}
                      </td>
                    </tr>
                  );
                })}

                {/* Baris TOTAL */}
                {total && (
                  <tr className="bg-[#E8F5F3]/80 border-t-2 border-[#2A9D8F] font-bold text-sm">
                    <td className="py-4 px-4 sm:px-6 text-[#1D7A6F]">
                      {total.bulan || 'TOTAL'}
                    </td>
                    <td className="py-4 px-4 text-right text-[#2D3436]">
                      {formatRupiah(total.subsidi)}
                    </td>
                    <td className="py-4 px-4 text-right text-rose-700">
                      {formatRupiah(total.pengeluaran)}
                    </td>
                    <td className="py-4 px-4 text-right text-[#1D7A6F] font-black text-base">
                      {formatRupiah(total.saldo)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-[#2A9D8F] text-white">
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
          <div className="bg-white rounded-2xl shadow-xs border border-[#2A9D8F]/15 overflow-hidden card-print">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FFFCF5]">
              <div>
                <h2 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#2A9D8F]" />
                  Rencana Anggaran Biaya (RAB) / Alokasi Subsidi Masuk
                </h2>
                <p className="text-xs text-[#636E72]">
                  Daftar plafon anggaran yang dialokasikan untuk operasional MMD Darussalamah
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FDF6E3] border-b border-[#2A9D8F]/20 text-xs font-semibold text-[#636E72] uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Periode Kegiatan</th>
                    <th className="py-3.5 px-4 text-right">Plafon Anggaran (RAB)</th>
                    <th className="py-3.5 px-4 sm:px-6">Keterangan Alokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rekapitulasi.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FFFCF5] transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-semibold text-[#2D3436]">
                        {item.bulan}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[#2D3436] text-base">
                        {formatRupiah(item.subsidi)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-[#636E72] text-xs">
                        {item.keterangan || 'Subsidi Terjadwal'}
                      </td>
                    </tr>
                  ))}
                  {total && (
                    <tr className="bg-[#E8F5F3]/80 border-t-2 border-[#2A9D8F] font-bold text-sm">
                      <td className="py-4 px-4 sm:px-6 text-[#1D7A6F]">
                        TOTAL RAB KESELURUHAN
                      </td>
                      <td className="py-4 px-4 text-right text-[#1D7A6F] font-black text-lg">
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
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#2A9D8F]/15 card-print">
            <h3 className="font-bold text-base text-[#2D3436] flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#2A9D8F]" />
              Proyeksi RAB Bulan Berikutnya (Rabiul Awal & Rabiul Tsani)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {catatanBerikutnya.map((note, index) => (
                <div key={index} className="p-3.5 rounded-xl bg-[#FDF6E3] border border-[#2A9D8F]/20 text-[#2D3436]">
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
          <div className="bg-white rounded-2xl shadow-xs border border-rose-200 overflow-hidden card-print">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-rose-50/40">
              <div>
                <h2 className="text-lg font-bold text-[#2D3436] flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  Laporan Pertanggungjawaban (LPJ) / Realisasi Belanja
                </h2>
                <p className="text-xs text-[#636E72]">
                  Laporan rekapitulasi penggunaan dana nyata yang telah dipertanggungjawabkan
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-rose-50/60 border-b border-rose-200 text-xs font-semibold text-rose-900 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Bulan Realisasi</th>
                    <th className="py-3.5 px-4 text-right">Pengeluaran Nyata (LPJ)</th>
                    <th className="py-3.5 px-4 text-right">Sisa Saldo Kas</th>
                    <th className="py-3.5 px-4 sm:px-6">Status Pertanggungjawaban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rekapitulasi.map((item, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-semibold text-[#2D3436]">
                        {item.bulan}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-rose-600 text-base">
                        {formatRupiah(item.pengeluaran)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[#1D7A6F]">
                        {formatRupiah(item.saldo)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs text-emerald-700 font-semibold flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>LPJ Telah Disahkan ({item.keterangan || 'Lengkap'})</span>
                      </td>
                    </tr>
                  ))}
                  {total && (
                    <tr className="bg-rose-100/60 border-t-2 border-rose-400 font-bold text-sm">
                      <td className="py-4 px-4 sm:px-6 text-rose-900">
                        TOTAL REALISASI PENGELUARAN
                      </td>
                      <td className="py-4 px-4 text-right text-rose-700 font-black text-lg">
                        {formatRupiah(total.pengeluaran)}
                      </td>
                      <td className="py-4 px-4 text-right text-[#1D7A6F] font-black text-lg">
                        {formatRupiah(total.saldo)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs text-rose-900">
                        Saldo Akhir Kas Tersimpan: {formatRupiah(total.saldo)}
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
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#2A9D8F]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-[#2A9D8F]" />
              <span className="text-xs sm:text-sm font-bold text-[#2D3436]">
                Pilih Sheet Rincian:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {DATA_LINKS.keuangan.detailSheets?.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => loadDetailSheet(sheet.csvUrl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDetailSheet === sheet.csvUrl
                      ? 'bg-[#2A9D8F] text-white shadow-xs'
                      : 'bg-gray-100 text-[#2D3436] hover:bg-[#E8F5F3]'
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
          </div>

          {/* Konten Tabel Detail Itemized */}
          {loadingDetail ? (
            <div className="bg-white rounded-2xl p-16 text-center text-gray-400 border border-[#2A9D8F]/15">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2A9D8F] mb-3" />
              <p className="text-sm font-medium">Memuat rincian item belanja dari Google Sheets...</p>
            </div>
          ) : detailData ? (
            <div className="space-y-6 card-print">
              <div className="bg-white rounded-2xl p-5 border border-[#2A9D8F]/20 shadow-xs">
                <h2 className="text-lg font-bold text-[#2D3436]">
                  {detailData.title}
                </h2>
                {detailData.docNumber && (
                  <p className="text-xs text-[#636E72] mt-0.5">{detailData.docNumber}</p>
                )}
              </div>

              {detailData.sections?.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white rounded-2xl shadow-xs border border-[#2A9D8F]/15 overflow-hidden card-print"
                >
                  <div className="p-4 bg-[#FFFCF5] border-b border-gray-100">
                    <h3 className="font-bold text-sm sm:text-base text-[#1D7A6F]">
                      {section.title}
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-[#FDF6E3] border-b border-[#2A9D8F]/20 text-[11px] font-semibold text-[#636E72] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-12 text-center">No</th>
                          <th className="py-2.5 px-4">Uraian Barang / Kegiatan</th>
                          <th className="py-2.5 px-3">Jumlah</th>
                          <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                          <th className="py-2.5 px-4 text-right">Anggaran / Realisasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {section.items?.map((it, iIdx) => (
                          <tr
                            key={iIdx}
                            className={`hover:bg-[#FFFCF5] ${
                              it.isTotal
                                ? 'bg-[#E8F5F3]/70 font-bold text-[#1D7A6F] border-t-2 border-[#2A9D8F]'
                                : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center text-gray-400">
                              {it.no || '-'}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-[#2D3436]">
                              {it.uraian}
                            </td>
                            <td className="py-2.5 px-3 text-[#636E72]">
                              {it.jumlah}
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#636E72]">
                              {it.hargaSatuan}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#2D3436]">
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
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
              Pilih salah satu sheet di atas untuk melihat rincian item belanja.
            </div>
          )}

        </div>
      )}

      {/* TANDA TANGAN PENGESAHAN (MUNCUL DI HASIL PRINT LAPORAN RESMI) */}
      <div className="print-only mt-12 pt-6">
        <div className="flex justify-between text-xs text-center px-12">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold mt-1">Kepala MMD Darussalamah</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( ............................................ )</p>
          </div>
          <div>
            <p>Kediri, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="font-bold mt-1">WAKA III / Bendahara LBM</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( ............................................ )</p>
          </div>
        </div>
      </div>

    </div>
  );
}
