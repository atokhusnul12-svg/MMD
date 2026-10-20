'use client';

import React from 'react';
import Image from 'next/image';

/**
 * ==============================================================================
 * KOMPONEN: KOP SURAT RESMI CETAK LAPORAN (PRINT-ONLY)
 * ==============================================================================
 * Komponen ini hanya muncul saat dicetak ke printer atau disimpan sebagai PDF.
 * Menjamin identitas formal MMD Darussalamah seragam di seluruh halaman.
 */
export function PrintHeader({
  title,
  subtitle = 'Tahun Ajaran 1447-1448 H / 2026-2027 M',
  filterInfo,
  totalInfo,
}) {
  const [printDate, setPrintDate] = React.useState('');
  const [printTime, setPrintTime] = React.useState('');

  React.useEffect(() => {
    queueMicrotask(() => {
      setPrintDate(
        new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
      setPrintTime(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    });
  }, []);

  return (
    <div className="print-only mb-6">
      {/* KOP SURAT RESMI */}
      <div className="flex items-center justify-center gap-4 pb-3 border-b-2 border-black">
        <Image
          src="/logo.png"
          alt="Logo MIDA Sumbersari"
          width={64}
          height={64}
          unoptimized
          className="w-16 h-16 object-contain shrink-0"
        />
        <div className="text-center flex-1">
          <h1 className="text-lg font-black uppercase tracking-wider text-black">
            MADRASAH ISLAMIYAH DARUSSALAMAH (MMD)
          </h1>
          <h2 className="text-sm font-bold uppercase tracking-wide text-black">
            PONDOK PESANTREN DARUSSALAM SUMBERSARI
          </h2>
          <p className="text-[11px] text-gray-700">
            Alamat: Kencong, Kec. Pare, Kab. Kediri, Jawa Timur 64211
          </p>
          <p className="text-[10px] text-gray-600 font-medium">
            Sistem Administrasi WAKA III — Lembaga Bahtsul Masail &amp; Keuangan
          </p>
        </div>
      </div>
      {/* Garis Ganda Formal Kop Surat */}
      <div className="border-b border-black mt-0.5 mb-4"></div>

      {/* JUDUL LAPORAN & METADATA */}
      <div className="text-center mb-3">
        <h2 className="text-base font-black uppercase tracking-wide text-black">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-gray-800 font-semibold mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* BARIS KETERANGAN FILTER & WAKTU CETAK */}
      <div className="flex items-center justify-between text-[11px] text-gray-700 bg-gray-100 p-2 rounded border border-gray-300 mb-2">
        <div>
          {filterInfo ? (
            <span><strong>Filter Aktif:</strong> {filterInfo}</span>
          ) : (
            <span><strong>Cakupan Data:</strong> Semua Data Terdaftar</span>
          )}
          {totalInfo && (
            <span className="ml-3 border-l border-gray-400 pl-3">
              <strong>Total:</strong> {totalInfo}
            </span>
          )}
        </div>
        <div className="text-right font-mono text-[10px]">
          {printDate ? `Dicetak: ${printDate}, pk ${printTime} WIB` : 'Laporan Resmi WAKA III'}
        </div>
      </div>
    </div>
  );
}

/**
 * ==============================================================================
 * KOMPONEN: TANDA TANGAN PENGESAHAN LAPORAN RESMI (PRINT-ONLY)
 * ==============================================================================
 */
export function PrintSignatures({
  leftTitle = 'Mengetahui,',
  leftRole = 'Kepala MMD Darussalamah',
  leftName = '( ............................................ )',
  rightRole = 'WAKA III Darussalamah',
  rightName = '( ............................................ )',
}) {
  const [currentDate, setCurrentDate] = React.useState('');

  React.useEffect(() => {
    queueMicrotask(() => {
      setCurrentDate(
        new Date().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    });
  }, []);

  return (
    <div className="print-only mt-8 pt-4 print-avoid-break">
      <div className="flex justify-between items-start text-xs text-center px-8">
        {/* Pihak Mengetahui (Kiri) */}
        <div className="w-56">
          <p className="text-gray-700">{leftTitle}</p>
          <p className="font-bold text-black mt-1">{leftRole}</p>
          <div className="h-16"></div>
          <p className="font-bold underline text-black">{leftName}</p>
        </div>

        {/* Pihak Pembuat Laporan (Kanan) */}
        <div className="w-56">
          <p className="text-gray-700">Kediri, {currentDate}</p>
          <p className="font-bold text-black mt-1">{rightRole}</p>
          <div className="h-16"></div>
          <p className="font-bold underline text-black">{rightName}</p>
        </div>
      </div>

      {/* Footer Hak Cipta Cetak */}
      <div className="text-center text-[9px] text-gray-500 mt-8 border-t border-gray-200 pt-2 font-mono">
        Dokumen resmi digenerate otomatis oleh Sistem Administrasi WAKA III MMD Darussalamah Sumbersari Pare.
      </div>
    </div>
  );
}
