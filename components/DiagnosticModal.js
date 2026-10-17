'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
} from 'lucide-react';

export default function DiagnosticModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/sheets?action=diagnose', {
        headers: {
          'x-admin-auth': 'true',
        },
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        checks: {
          adminSession: true,
          urlConfigured: false,
          tokenConfigured: false,
          scriptReachable: false,
          scriptTokenConfigured: false,
          statusMessage: `Gagal menjalankan pemeriksaan: ${err.message}`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      runDiagnostic();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const checks = result?.checks;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-print">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DCE5E0] overflow-hidden my-auto z-10"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#F7F5EF] border-b border-[#DCE5E0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center border border-[#C8E3DC]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#26332E] font-serif">
                  Diagnostik Koneksi Google Sheets
                </h3>
                <p className="text-[11px] text-[#5C6E66]">Pemeriksaan kesiapan sinkronisasi data</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-stone-100 text-[#5C6E66] border border-[#DCE5E0] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Konten Status */}
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="py-10 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1D7A6F]" />
                <p className="text-xs font-medium text-[#5C6E66]">
                  Sedang memeriksa koneksi server ke Google Sheets...
                </p>
              </div>
            ) : checks ? (
              <div className="space-y-3">
                {/* 1. Sesi Admin */}
                <div className="p-3 rounded-xl border border-[#DCE5E0] bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#1D7A6F]" />
                    <span className="text-xs font-semibold text-[#26332E]">Sesi Login Admin</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded border border-[#C8E3DC]">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                </div>

                {/* 2. URL Apps Script di Server */}
                <div className="p-3 rounded-xl border border-[#DCE5E0] bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-[#1D7A6F]" />
                    <span className="text-xs font-semibold text-[#26332E]">URL Google Apps Script</span>
                  </div>
                  {checks.urlConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded border border-[#C8E3DC]">
                      <CheckCircle2 className="w-3 h-3" /> Terkonfigurasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8A2F1B] bg-[#FAF0ED] px-2 py-0.5 rounded border border-[#E8BCB0]">
                      <AlertCircle className="w-3 h-3" /> Belum Diatur
                    </span>
                  )}
                </div>

                {/* 3. Token Keamanan di Server */}
                <div className="p-3 rounded-xl border border-[#DCE5E0] bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#1D7A6F]" />
                    <span className="text-xs font-semibold text-[#26332E]">Token Keamanan Server</span>
                  </div>
                  {checks.tokenConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded border border-[#C8E3DC]">
                      <CheckCircle2 className="w-3 h-3" /> Tersedia
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8A2F1B] bg-[#FAF0ED] px-2 py-0.5 rounded border border-[#E8BCB0]">
                      <AlertCircle className="w-3 h-3" /> Belum Diatur
                    </span>
                  )}
                </div>

                {/* 4. Respon Google Apps Script */}
                <div className="p-3 rounded-xl border border-[#DCE5E0] bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-[#1D7A6F]" />
                    <span className="text-xs font-semibold text-[#26332E]">Respon Web App Google</span>
                  </div>
                  {checks.scriptReachable && checks.scriptTokenConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded border border-[#C8E3DC]">
                      <CheckCircle2 className="w-3 h-3" /> Online &amp; Cocok
                    </span>
                  ) : checks.scriptReachable ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C6D23] bg-[#FAF3E6] px-2 py-0.5 rounded border border-[#E8D5A7]">
                      <AlertCircle className="w-3 h-3" /> Token Belum Ada di Sheets
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8A2F1B] bg-[#FAF0ED] px-2 py-0.5 rounded border border-[#E8BCB0]">
                      <AlertCircle className="w-3 h-3" /> Tidak Terjangkau
                    </span>
                  )}
                </div>

                {/* Ringkasan Pesan Ramah */}
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    result?.success
                      ? 'bg-[#E8F5F3] border-[#C8E3DC] text-[#1D7A6F] font-semibold'
                      : 'bg-[#FAF3E6] border-[#E8D5A7] text-[#8C6D23]'
                  }`}
                >
                  <p className="font-bold mb-0.5">
                    {result?.success ? '✓ Sistem Siap Digunakan' : '⚠️ Perlu Pengaturan'}
                  </p>
                  <p>{checks.statusMessage}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#F7F5EF] border-t border-[#DCE5E0] flex items-center justify-between">
            <button
              type="button"
              disabled={loading}
              onClick={runDiagnostic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE5E0] bg-white text-[#26332E] hover:bg-stone-50 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Uji Ulang</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#1D7A6F] text-white text-xs font-semibold hover:bg-[#155D54] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
