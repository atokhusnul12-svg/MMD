'use client';

import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  BookOpen,
  Loader2,
  AlertCircle,
  Sparkles,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

export default function JurnalViewer({
  jurnalUrl,
  programName = 'Program WAKA II',
  tingkat = '',
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  if (!jurnalUrl) {
    return (
      <div className="bg-[#FAF0ED] border border-[#E8BCB0] text-[#8A2F1B] rounded-xl p-6 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-[#8A2F1B] mx-auto" />
        <p className="font-bold">Tautan Jurnal Pembahasan Belum Dikonfigurasi</p>
        <p className="text-xs text-[#8A2F1B]/80 max-w-md mx-auto">
          Silakan hubungi administrator atau atur URL Google Docs pada file konfigurasi WAKA II MMD.
        </p>
      </div>
    );
  }

  // Siapkan URL sematan Google Docs (menggunakan embedded=true)
  const embedUrl = jurnalUrl.includes('embedded=true')
    ? jurnalUrl
    : `${jurnalUrl}${jurnalUrl.includes('?') ? '&' : '?'}embedded=true`;

  const handleReload = () => {
    setIsLoading(true);
    setLoadError(false);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Kartu Header Kontrol Jurnal */}
      <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#DCE5E0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF3E6] text-[#8C6D23] border border-[#ECD8A5]">
              <Sparkles className="w-3 h-3" />
              Google Docs Terbitan Web
            </span>
            <span className="text-xs text-[#5C6E66]">Diperbarui berkala</span>
          </div>
          <h3 className="text-lg font-bold text-[#26332E] font-serif mt-1">
            Jurnal Pembahasan &amp; Notulensi Musyawarah
          </h3>
          <p className="text-xs text-[#5C6E66] mt-0.5">
            Dokumentasi kajian, ibarot kitab, dan hasil keputusan bahtsul masail internal {programName}
          </p>
        </div>

        {/* Tombol Aksi Buka di Tab Baru & Muat Ulang */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReload}
            title="Muat Ulang Tampilan Jurnal"
            className="p-2 rounded-lg border border-[#DCE5E0] text-[#5C6E66] hover:text-[#1D7A6F] hover:bg-[#F7F5EF] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href={jurnalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D7A6F] text-white hover:bg-[#165E55] text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Buka Jurnal Pembahasan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Penampil Dokumen Sematan */}
      <div className="relative bg-white rounded-xl border border-[#DCE5E0] shadow-xs overflow-hidden min-h-[600px] flex flex-col">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-2xs z-10 flex flex-col items-center justify-center p-6 space-y-3">
            <Loader2 className="w-8 h-8 text-[#1D7A6F] animate-spin" />
            <p className="text-xs font-semibold text-[#26332E]">
              Memuat lembar Jurnal Pembahasan dari Google Docs...
            </p>
            <p className="text-[11px] text-[#5C6E66]">
              Harap tunggu beberapa saat hingga konten tersinkronkan
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {loadError ? (
          <div className="p-8 text-center space-y-3 my-auto">
            <AlertCircle className="w-10 h-10 text-[#8C6D23] mx-auto" />
            <h4 className="font-bold text-[#26332E]">Tampilan Sematan Membutuhkan Pembukaan Langsung</h4>
            <p className="text-xs text-[#5C6E66] max-w-md mx-auto">
              Beberapa peramban membatasi tampilan Google Docs dalam frame. Anda dapat langsung membuka dokumen resmi melalui tombol di bawah ini.
            </p>
            <a
              href={jurnalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D7A6F] text-white font-bold text-xs"
            >
              <span>Buka Dokumen di Tab Baru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={`Jurnal Pembahasan ${programName}`}
            className="w-full flex-1 border-0 min-h-[650px] lg:min-h-[800px]"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        )}

        {/* Footer Sematan */}
        <div className="p-3 bg-[#F7F5EF]/60 border-t border-[#DCE5E0] flex items-center justify-between text-xs text-[#5C6E66]">
          <span>Format: Dokumen Google Docs Resmi yang telah dipublikasikan</span>
          <a
            href={jurnalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1D7A6F] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Buka Tampilan Penuh</span>
            <Maximize2 className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
