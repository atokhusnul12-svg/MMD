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
  ExternalLink,
} from 'lucide-react';
import { useOneSignal } from './OneSignalProvider';

export default function NotificationBroadcastModal({ isOpen, onClose }) {
  const { appIdConfigured, subscriptionId } = useOneSignal();

  const [title, setTitle] = useState('📅 Agenda WAKA III Terdekat');
  const [message, setMessage] = useState('Ada agenda kegiatan terdekat di Kalender Kerja MMD. Silakan cek detail agenda.');
  const [targetUrl, setTargetUrl] = useState('/kalender');
  const [notificationType, setNotificationType] = useState('agenda');
  const [targetMode, setTargetMode] = useState('all'); // 'all' | 'me'
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  // Preset Template Cepat
  const templates = [
    {
      id: 'agenda',
      label: 'Agenda / Kalender',
      icon: Calendar,
      title: '📅 Agenda WAKA III Terdekat',
      message: 'Pemberitahuan agenda terdekat di Kalender Kerja MMD Darussalamah. Silakan buka kalender.',
      url: '/kalender',
    },
    {
      id: 'keuangan',
      label: 'Data Keuangan',
      icon: Wallet,
      title: '💰 Update Laporan Keuangan LPJ/RAB',
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
      const payload = {
        title,
        message,
        url: targetUrl,
        type: notificationType,
        targetSubscriptionId: targetMode === 'me' ? subscriptionId : null,
      };

      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          type: 'success',
          text: `Notifikasi berhasil dikirim! (${data.recipients || 1} penerima tercatat di OneSignal)`,
        });
      } else {
        setResult({
          type: 'error',
          text: data.error || 'Gagal mengirim notifikasi',
          code: data.code,
        });
      }
    } catch (err) {
      setResult({
        type: 'error',
        text: err.message || 'Terjadi kesalahan jaringan',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#2A9D8F]/20 relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center border border-[#2A9D8F]/25 shadow-xs">
              <Send className="w-5 h-5 text-[#2A9D8F]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D3436]">
                Broadcast Push Notifikasi
              </h3>
              <p className="text-xs text-[#636E72]">
                Kirim notifikasi langsung ke layar HP &amp; laptop santri/pengurus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1">
          
          {/* Pilihan Template Cepat */}
          <div>
            <label className="block text-xs font-semibold text-[#2D3436] mb-2 uppercase tracking-wider">
              Pilih Template Notifikasi:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = notificationType === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#2A9D8F] text-white border-[#2A9D8F] shadow-xs'
                        : 'bg-[#FDF6E3]/60 text-[#2D3436] border-gray-200 hover:border-[#2A9D8F]/50 hover:bg-[#E8F5F3]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#2A9D8F]'}`} />
                    <span className="truncate">{tpl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form id="broadcast-form" onSubmit={handleSend} className="space-y-4">
            
            {/* Input Judul */}
            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                Judul Notifikasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Contoh: 📅 Agenda WAKA III Terdekat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#2A9D8F]/40 focus:border-[#2A9D8F] text-sm text-[#2D3436]"
              />
            </div>

            {/* Input Pesan */}
            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                Isi Pesan Notifikasi <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                placeholder="Tulis pesan singkat yang akan muncul di pop-up layar HP/desktop..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#2A9D8F]/40 focus:border-[#2A9D8F] text-sm text-[#2D3436] resize-none"
              />
            </div>

            {/* Input Tautan Target URL */}
            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1">
                Tautan Halaman saat Notifikasi Diklik
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="/kalender atau /keuangan"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#2A9D8F]/40 focus:border-[#2A9D8F] text-xs font-mono text-[#2D3436]"
              />
              <span className="text-[11px] text-[#636E72] mt-1 block">
                Pengguna yang mengeklik notifikasi akan langsung diarahkan ke halaman ini.
              </span>
            </div>

            {/* Target Penerima */}
            <div>
              <label className="block text-xs font-semibold text-[#2D3436] mb-1.5">
                Target Pengiriman:
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="targetMode"
                    value="all"
                    checked={targetMode === 'all'}
                    onChange={() => setTargetMode('all')}
                    className="text-[#2A9D8F] focus:ring-[#2A9D8F]"
                  />
                  <span>Semua Pengguna Terdaftar</span>
                </label>

                {subscriptionId && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      value="me"
                      checked={targetMode === 'me'}
                      onChange={() => setTargetMode('me')}
                      className="text-[#2A9D8F] focus:ring-[#2A9D8F]"
                    />
                    <span>Hanya Perangkat Saya Sendiri (Test)</span>
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
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {result.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{result.text}</p>
                {result.code === 'MISSING_API_KEY' && (
                  <p className="mt-1 text-[11px] text-rose-700">
                    💡 <em>Petunjuk:</em> Tambahkan <code>ONESIGNAL_REST_API_KEY</code> di pengaturan Environment Variables Vercel atau file <code>.env.local</code>.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Tombol Aksi */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>

          <button
            form="broadcast-form"
            type="submit"
            disabled={isSending || !title || !message}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] text-white text-xs font-bold transition-all shadow-md shadow-[#2A9D8F]/25 disabled:opacity-50 cursor-pointer"
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
