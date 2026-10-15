'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Smartphone,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useNotification } from './NotificationProvider';
import NotificationBroadcastModal from './NotificationBroadcastModal';

/**
 * ==============================================================================
 * KOMPONEN: TOMBOL & STATUS PUSH NOTIFIKASI MANDIRI (WAKA III)
 * ==============================================================================
 * Tidak memerlukan OneSignal atau akun pihak ketiga.
 * 100% mandiri dan langsung berfungsi.
 */
export default function NotificationButton({ variant = 'header', showBroadcastButton = true }) {
  const {
    isSupported,
    permission,
    isSubscribed,
    subscriberCount,
    isLoading,
    subscribe,
    unsubscribe,
  } = useNotification();

  const [menuOpen, setMenuOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const menuRef = useRef(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSubscribe = async () => {
    setFeedback(null);
    try {
      if (isSubscribed) {
        await unsubscribe();
        setFeedback({ type: 'info', text: 'Notifikasi dinonaktifkan di perangkat ini.' });
      } else {
        await subscribe();
        setFeedback({ type: 'success', text: 'Notifikasi berhasil diaktifkan!' });
      }
      setMenuOpen(false);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengubah pengaturan notifikasi' });
    }
  };

  // ============================================================================
  // VARIAN 1: HEADER / NAVBAR (DESKTOP & MOBILE)
  // ============================================================================
  if (variant === 'header') {
    return (
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          onClick={() => {
            if (!isSubscribed && permission !== 'denied') {
              handleToggleSubscribe();
            } else {
              setMenuOpen(!menuOpen);
            }
          }}
          disabled={isLoading}
          aria-label="Pengaturan Notifikasi"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
            isSubscribed
              ? 'bg-[#E8F5F3] text-[#1D7A6F] border border-[#2A9D8F]/30 hover:bg-[#2A9D8F] hover:text-white'
              : permission === 'denied'
              ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
              : 'text-[#2D3436] hover:text-[#2A9D8F] hover:bg-[#FDF6E3]'
          }`}
          title={
            isSubscribed
              ? 'Notifikasi aktif. Klik untuk opsi.'
              : permission === 'denied'
              ? 'Notifikasi diblokir di browser. Klik untuk petunjuk.'
              : 'Klik untuk mengaktifkan notifikasi sistem'
          }
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#2A9D8F]" />
          ) : isSubscribed ? (
            <div className="relative flex items-center">
              <BellRing className="w-4 h-4 text-[#2A9D8F]" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          ) : permission === 'denied' ? (
            <BellOff className="w-4 h-4 text-amber-600" />
          ) : (
            <Bell className="w-4 h-4" />
          )}

          <span className="hidden md:inline text-xs font-semibold">
            {isLoading
              ? 'Memproses...'
              : isSubscribed
              ? 'Notifikasi Aktif'
              : permission === 'denied'
              ? 'Notif Diblokir'
              : 'Aktifkan Notifikasi'}
          </span>

          {isSubscribed && (
            <ChevronDown className="w-3 h-3 text-[#1D7A6F] hidden md:inline ml-0.5" />
          )}
        </button>

        {/* Dropdown Menu Opsi Notifikasi */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-xl border border-gray-100 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-[#2D3436] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#2A9D8F]" />
                Status Notifikasi Sistem
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSubscribed
                    ? 'bg-emerald-100 text-emerald-800'
                    : permission === 'denied'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isSubscribed ? '● Terdaftar' : permission === 'denied' ? 'Diblokir' : 'Belum Aktif'}
              </span>
            </div>

            {/* Info Jumlah Pengguna Terdaftar */}
            <div className="flex items-center justify-between text-[11px] text-[#636E72] mb-3 px-1">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#2A9D8F]" />
                Total Perangkat Terhubung:
              </span>
              <span className="font-bold text-[#2D3436] bg-[#E8F5F3] px-2 py-0.5 rounded-md text-[10px] text-[#1D7A6F]">
                {subscriberCount} HP/Laptop
              </span>
            </div>

            {/* Panduan jika diblokir oleh browser */}
            {permission === 'denied' && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Izin Notifikasi Diblokir di Browser
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Untuk mengaktifkannya: klik ikon gembok / setelan di bilah URL browser Anda, lalu ubah <strong>Notifikasi</strong> menjadi <strong>Izinkan (Allow)</strong>.
                </p>
              </div>
            )}

            <div className="space-y-1 text-xs">
              {/* Tombol Utama Aktifkan / Matikan */}
              <button
                onClick={handleToggleSubscribe}
                disabled={isLoading}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors font-medium text-left ${
                  isSubscribed
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'bg-[#2A9D8F] text-white hover:bg-[#238276]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isSubscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  {isSubscribed ? 'Nonaktifkan Notifikasi' : 'Aktifkan Sekarang'}
                </span>
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </button>

              {/* Tombol Kirim Uji Coba Broadcast */}
              {showBroadcastButton && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setBroadcastOpen(true);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-[#1D7A6F] hover:bg-[#E8F5F3] transition-colors font-medium text-left"
                >
                  <Send className="w-4 h-4 text-[#2A9D8F]" />
                  <span>Kirim Broadcast Notifikasi...</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Broadcast Notifikasi */}
        <NotificationBroadcastModal
          isOpen={broadcastOpen}
          onClose={() => setBroadcastOpen(false)}
        />
      </div>
    );
  }

  // ============================================================================
  // VARIAN 2: KARTU DASHBOARD (PROMINENT & ELEGAN)
  // ============================================================================
  return (
    <>
      <div className="bg-gradient-to-br from-white to-[#E8F5F3]/50 rounded-3xl p-6 sm:p-7 shadow-xs border border-[#2A9D8F]/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Sisi Kiri: Deskripsi & Keuntungan Push Notification */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center border border-[#2A9D8F]/30 shadow-xs">
              {isSubscribed ? (
                <>
                  <BellRing className="w-6 h-6 text-[#2A9D8F]" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </>
              ) : permission === 'denied' ? (
                <BellOff className="w-6 h-6 text-amber-600" />
              ) : (
                <Bell className="w-6 h-6 text-[#2A9D8F]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#2D3436]">
                  Notifikasi Sistem WAKA III MMD
                </h3>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    isSubscribed
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : permission === 'denied'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Aktif di Perangkat Ini
                    </>
                  ) : permission === 'denied' ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Izin Diblokir
                    </>
                  ) : (
                    'Belum Diaktifkan'
                  )}
                </span>
                
                {subscriberCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#1D7A6F] bg-white border border-[#2A9D8F]/30 px-2 py-0.5 rounded-full font-medium">
                    <Users className="w-3 h-3 text-[#2A9D8F]" />
                    {subscriberCount} Terhubung
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#636E72] mt-1.5 leading-relaxed max-w-2xl">
                Dapatkan pemberitahuan otomatis di layar HP (Android &amp; iOS) dan Laptop saat ada agenda Bahtsul Masail terdekat, kegiatan tahunan Kalender Kerja MMD, maupun pembaruan data keuangan santri.
              </p>

              {/* Feedback Pesan */}
              {feedback && (
                <p
                  className={`mt-2 text-xs font-semibold ${
                    feedback.type === 'success'
                      ? 'text-emerald-700'
                      : feedback.type === 'error'
                      ? 'text-rose-600'
                      : 'text-[#1D7A6F]'
                  }`}
                >
                  {feedback.text}
                </p>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Tombol Aksi */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isSubscribed ? (
              <>
                <button
                  onClick={() => setBroadcastOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#2A9D8F]/30 text-[#1D7A6F] hover:bg-[#E8F5F3] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                  title="Kirim notifikasi broadcast ke seluruh santri"
                >
                  <Send className="w-4 h-4 text-[#2A9D8F]" />
                  <span>Kirim Broadcast</span>
                </button>

                <button
                  onClick={handleToggleSubscribe}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                  title="Matikan notifikasi di perangkat ini"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                  <span>Nonaktifkan</span>
                </button>
              </>
            ) : permission === 'denied' ? (
              <div className="text-left text-xs bg-amber-50 border border-amber-200 p-3 rounded-xl max-w-xs">
                <span className="font-bold text-amber-900 block mb-1">
                  Cara Mengizinkan:
                </span>
                <span className="text-amber-800 text-[11px] block">
                  Klik ikon gembok di sebelah kiri alamat web browser Anda, lalu ubah <strong>Notifikasi</strong> menjadi <strong>Izinkan</strong>.
                </span>
              </div>
            ) : (
              <button
                onClick={handleToggleSubscribe}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#2A9D8F] hover:bg-[#238276] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#2A9D8F]/25 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Meminta Izin...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Aktifkan Notifikasi di Perangkat Ini</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Modal Broadcast Notifikasi */}
      <NotificationBroadcastModal
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
      />
    </>
  );
}
