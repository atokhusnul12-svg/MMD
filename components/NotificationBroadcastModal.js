'use client';

import React, { useState } from 'react';
import {
  X,
  Send,
  Bell,
  Calendar,
  Wallet,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { useNotification } from './NotificationProvider';
import { useAuth } from '@/lib/auth';

export default function NotificationBroadcastModal({ isOpen, onClose }) {
  const { isAdmin } = useAuth();
  const { isSubscribed, subscriberCount, sendNotification } = useNotification();

  const [title, setTitle] = useState('📅 Agenda WAKA III Terdekat');
  const [message, setMessage] = useState('Ada agenda kegiatan terdekat di Kalender Kerja MMD. Silakan buka kalender untuk detail lengkap.');
  const [targetUrl, setTargetUrl] = useState('/kalender');
  const [notificationType, setNotificationType] = useState('agenda');
  const [targetMode, setTargetMode] = useState('all'); // 'all' | 'me'
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  // Guard: Blokir jika user bukan admin
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#F1D3CC] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF0ED] text-[#8A2F1B] flex items-center justify-center mx-auto border border-[#F1D3CC]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-[#1D7A6F]">Akses Dibatasi</h3>
            <p className="text-xs text-[#8A2F1B] font-semibold mt-1">
              Hanya Admin yang dapat mengirim broadcast.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F0ECE1] text-xs font-semibold text-[#26332E] border border-[#DCE5E0] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Preset Template Notifikasi Siap Pakai
  const templates = [
    {
      id: 'agenda',
      label: 'Agenda / Kalender',
      icon: Calendar,
      title: '📅 Agenda WAKA III Terdekat',
      message: 'Ada agenda kegiatan penting terdekat di Kalender Kerja MMD Darussalamah. Silakan buka kalender.',
      url: '/kalender',
    },
    {
      id: 'keuangan',
      label: 'Data Keuangan',
      icon: Wallet,
      title: '💰 Update Laporan Keuangan LPJ & RAB',
      message: 'Rekapitulasi keuangan periode terbaru telah diperbarui. Silakan cek rincian saldo dan anggaran.',
      url: '/keuangan',
    },
    {
      id: 'lbm',
      label: 'Santri LBM',
      icon: BookOpen,
      title: '📖 Update Data Santri LBM & Delegasi',
      message: 'Data perkembangan santri LBM dan jadwal Bahtsul Masail terbaru telah diupdate.',
      url: '/bahsu',
    },
    {
      id: 'test',
      label: 'Uji Coba (Test)',
      icon: Bell,
      title: '🔔 Uji Coba Notifikasi WAKA III',
      message: 'Notifikasi sistem WAKA III MMD Darussalamah berhasil terhubung ke perangkat Anda!',
      url: '/',
    },
  ];

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setTargetUrl(tpl.url);
    setNotificationType(tpl.id);
    setResult(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setResult(null);

    try {
      const data = await sendNotification({
        title,
        message,
        url: targetUrl,
        type: notificationType,
        targetCurrentDevice: targetMode === 'me',
      });

      setResult({
        type: 'success',
        text: data.message || `Notifikasi berhasil dikirimkan ke ${data.sent || 1} perangkat!`,
      });
    } catch (err) {
      setResult({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat mengirim notifikasi.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-[#DCE5E0] relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-[#DCE5E0]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center border border-[#1D7A6F]/15 shadow-xs">
              <Send className="w-5 h-5 text-[#1D7A6F]" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-[#1D7A6F]">
                Broadcast Push Notifikasi Mandiri
              </h3>
              <p className="text-xs text-[#5C6D66] flex items-center gap-1.5 mt-0.5">
                <span>Notifikasi sistem langsung ke HP &amp; laptop</span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#1D7A6F]">
                  <Users className="w-3 h-3" />
                  {subscriberCount} perangkat terdaftar
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5C6D66] hover:text-[#26332E] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1">
          
          {/* Pilihan Template Cepat */}
          <div>
            <label className="block text-xs font-bold text-[#5C6D66] mb-2 uppercase tracking-wider">
              Pilih Template Notifikasi:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = notificationType === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1D7A6F] text-white border-[#1D7A6F] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#26332E] border-[#DCE5E0] hover:border-[#1D7A6F]/40 hover:bg-[#E8F5F3]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#1D7A6F]'}`} />
                    <span className="truncate">{tpl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form id="broadcast-form" onSubmit={handleSend} className="space-y-4">
            
            {/* Input Judul */}
            <div>
              <label className="block text-xs font-bold text-[#26332E] mb-1">
                Judul Notifikasi <span className="text-[#8A2F1B]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Contoh: 📅 Agenda WAKA III Terdekat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E0] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] text-sm text-[#26332E] bg-white"
              />
            </div>

            {/* Input Pesan */}
            <div>
              <label className="block text-xs font-bold text-[#26332E] mb-1">
                Isi Pesan Notifikasi <span className="text-[#8A2F1B]">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                placeholder="Tulis pesan singkat yang akan muncul di pop-up layar HP/desktop..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E0] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] text-sm text-[#26332E] bg-white resize-none"
              />
            </div>

            {/* Input Tautan Target URL */}
            <div>
              <label className="block text-xs font-bold text-[#26332E] mb-1">
                Tautan Halaman saat Notifikasi Diklik
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="/kalender atau /keuangan"
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE5E0] focus:outline-hidden focus:ring-2 focus:ring-[#1D7A6F]/20 focus:border-[#1D7A6F] text-xs font-mono text-[#26332E] bg-white"
              />
              <span className="text-[11px] text-[#5C6D66] mt-1 block">
                Pengguna yang mengeklik notifikasi akan langsung diarahkan ke halaman ini.
              </span>
            </div>

            {/* Target Penerima */}
            <div>
              <label className="block text-xs font-bold text-[#26332E] mb-1.5">
                Target Pengiriman:
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#26332E]">
                  <input
                    type="radio"
                    name="targetMode"
                    value="all"
                    checked={targetMode === 'all'}
                    onChange={() => setTargetMode('all')}
                    className="accent-[#1D7A6F]"
                  />
                  <span>Semua Pengguna Terdaftar ({subscriberCount} HP/PC)</span>
                </label>

                {isSubscribed && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#26332E]">
                    <input
                      type="radio"
                      name="targetMode"
                      value="me"
                      checked={targetMode === 'me'}
                      onChange={() => setTargetMode('me')}
                      className="accent-[#1D7A6F]"
                    />
                    <span>Hanya Perangkat Saya Sendiri (Uji Coba)</span>
                  </label>
                )}
              </div>
            </div>

          </form>

          {/* Feedback Hasil Kirim */}
          {result && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                result.type === 'success'
                  ? 'bg-[#E8F5F3] text-[#1D7A6F] border-[#1D7A6F]/20'
                  : 'bg-[#FAF0ED] text-[#8A2F1B] border-[#F1D3CC]'
              }`}
            >
              {result.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#1D7A6F] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#8A2F1B] shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{result.text}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Tombol Aksi */}
        <div className="pt-4 border-t border-[#DCE5E0] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#DCE5E0] text-[#5C6D66] hover:bg-[#FAF8F5] text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            form="broadcast-form"
            type="submit"
            disabled={isSending || !title || !message}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D7A6F] hover:bg-[#1A453B] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirim Notifikasi...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Notifikasi Sekarang</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
