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
import { useAuth } from '@/lib/auth';
import NotificationBroadcastModal from './NotificationBroadcastModal';

/**
 * ==============================================================================
 * KOMPONEN: TOMBOL & STATUS PUSH NOTIFIKASI MANDIRI (WAKA III)
 * ==============================================================================
 * Tidak memerlukan OneSignal atau akun pihak ketiga.
 * 100% mandiri dan langsung berfungsi.
 */
export default function NotificationButton({ variant = 'header', showBroadcastButton = true }) {
  const { isAdmin } = useAuth();
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
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            isSubscribed
              ? 'bg-[#E8F5F3] text-[#1D7A6F] border border-[#1D7A6F]/20 hover:bg-[#1D7A6F] hover:text-white'
              : permission === 'denied'
              ? 'bg-[#FAF0ED] text-[#8A2F1B] border border-[#F1D3CC] hover:bg-[#F5E2DC]'
              : 'text-[#26332E] hover:text-[#1D7A6F] hover:bg-[#FAF8F5]'
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
            <Loader2 className="w-4 h-4 animate-spin text-[#1D7A6F]" />
          ) : isSubscribed ? (
            <div className="relative flex items-center">
              <BellRing className="w-4 h-4 text-[#1D7A6F]" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A66B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C6A66B]"></span>
              </span>
            </div>
          ) : permission === 'denied' ? (
            <BellOff className="w-4 h-4 text-[#8A2F1B]" />
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
          <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-xl border border-[#DCE5E0] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#DCE5E0]">
              <span className="text-xs font-bold font-serif text-[#1D7A6F] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#1D7A6F]" />
                Status Notifikasi Sistem
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isSubscribed
                    ? 'bg-[#E8F5F3] text-[#1D7A6F] border-[#1D7A6F]/20'
                    : permission === 'denied'
                    ? 'bg-[#FAF0ED] text-[#8A2F1B] border-[#F1D3CC]'
                    : 'bg-[#F7F5EF] text-[#5C6D66] border-[#DCE5E0]'
                }`}
              >
                {isSubscribed ? '● Terdaftar' : permission === 'denied' ? 'Diblokir' : 'Belum Aktif'}
              </span>
            </div>

            {/* Info Jumlah Pengguna Terdaftar */}
            <div className="flex items-center justify-between text-[11px] text-[#5C6D66] mb-3 px-1">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#1D7A6F]" />
                Total Perangkat Terhubung:
              </span>
              <span className="font-bold text-[#1D7A6F] bg-[#E8F5F3] border border-[#1D7A6F]/15 px-2 py-0.5 rounded-md text-[10px]">
                {subscriberCount} HP/Laptop
              </span>
            </div>

            {/* Panduan jika diblokir oleh browser */}
            {permission === 'denied' && (
              <div className="mb-3 p-2.5 rounded-xl bg-[#FAF0ED] border border-[#F1D3CC] text-xs text-[#8A2F1B] space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-[#8A2F1B]" />
                  Izin Notifikasi Diblokir di Browser
                </p>
                <p className="text-[11px] leading-relaxed text-[#8A2F1B]/90">
                  Untuk mengaktifkannya: klik ikon gembok / setelan di bilah URL browser Anda, lalu ubah <strong>Notifikasi</strong> menjadi <strong>Izinkan (Allow)</strong>.
                </p>
              </div>
            )}

            <div className="space-y-1 text-xs">
              {/* Tombol Utama Aktifkan / Matikan */}
              <button
                onClick={handleToggleSubscribe}
                disabled={isLoading}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors font-medium text-left cursor-pointer ${
                  isSubscribed
                    ? 'text-[#8A2F1B] hover:bg-[#FAF0ED]'
                    : 'bg-[#1D7A6F] text-white hover:bg-[#1A453B]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isSubscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  {isSubscribed ? 'Nonaktifkan Notifikasi' : 'Aktifkan Sekarang'}
                </span>
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </button>

              {/* Tombol Kirim Uji Coba Broadcast (Hanya Admin) */}
              {showBroadcastButton && isAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setBroadcastOpen(true);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-[#1D7A6F] hover:bg-[#E8F5F3] transition-colors font-medium text-left cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#1D7A6F]" />
                  <span>Kirim Broadcast Notifikasi...</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Broadcast Notifikasi (Hanya Admin) */}
        {isAdmin && (
          <NotificationBroadcastModal
            isOpen={broadcastOpen}
            onClose={() => setBroadcastOpen(false)}
          />
        )}
      </div>
    );
  }

  // ============================================================================
  // VARIAN 2: KARTU DASHBOARD (PROMINENT & ELEGAN)
  // ============================================================================
  return (
    <>
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#DCE5E0] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#1D7A6F]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Sisi Kiri: Deskripsi & Keuntungan Push Notification */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center border border-[#1D7A6F]/15 shadow-xs">
              {isSubscribed ? (
                <>
                  <BellRing className="w-6 h-6 text-[#1D7A6F]" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A66B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C6A66B]"></span>
                  </span>
                </>
              ) : permission === 'denied' ? (
                <BellOff className="w-6 h-6 text-[#8A2F1B]" />
              ) : (
                <Bell className="w-6 h-6 text-[#1D7A6F]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#1D7A6F]">
                  Notifikasi Sistem WAKA III MMD
                </h3>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                    isSubscribed
                      ? 'bg-[#E8F5F3] text-[#1D7A6F] border-[#1D7A6F]/20'
                      : permission === 'denied'
                      ? 'bg-[#FAF0ED] text-[#8A2F1B] border-[#F1D3CC]'
                      : 'bg-[#F7F5EF] text-[#5C6D66] border-[#DCE5E0]'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#1D7A6F]" />
                      Aktif di Perangkat Ini
                    </>
                  ) : permission === 'denied' ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-[#8A2F1B]" />
                      Izin Diblokir
                    </>
                  ) : (
                    'Belum Diaktifkan'
                  )}
                </span>
                
                {subscriberCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#1D7A6F] bg-[#E8F5F3] border border-[#1D7A6F]/20 px-2 py-0.5 rounded-md font-medium">
                    <Users className="w-3 h-3 text-[#1D7A6F]" />
                    {subscriberCount} Terhubung
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#5C6D66] mt-1.5 leading-relaxed max-w-2xl">
                Dapatkan pemberitahuan otomatis di layar HP (Android &amp; iOS) dan Laptop saat ada agenda Bahtsul Masail terdekat, kegiatan tahunan Kalender Kerja MMD, maupun pembaruan data keuangan santri.
              </p>

              {/* Feedback Pesan */}
              {feedback && (
                <p
                  className={`mt-2 text-xs font-semibold ${
                    feedback.type === 'success'
                      ? 'text-[#1D7A6F]'
                      : feedback.type === 'error'
                      ? 'text-[#8A2F1B]'
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
                {/* Tombol Kirim Broadcast (Hanya Admin) */}
                {isAdmin && (
                  <button
                    onClick={() => setBroadcastOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#DCE5E0] text-[#1D7A6F] hover:bg-[#E8F5F3] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                    title="Kirim notifikasi broadcast ke seluruh santri"
                  >
                    <Send className="w-4 h-4 text-[#1D7A6F]" />
                    <span>Kirim Broadcast</span>
                  </button>
                )}

                <button
                  onClick={handleToggleSubscribe}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#F1D3CC] bg-white text-[#8A2F1B] hover:bg-[#FAF0ED] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
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
              <div className="text-left text-xs bg-[#FAF0ED] border border-[#F1D3CC] p-3 rounded-xl max-w-xs">
                <span className="font-bold text-[#8A2F1B] block mb-1">
                  Cara Mengizinkan:
                </span>
                <span className="text-[#8A2F1B]/90 text-[11px] block">
                  Klik ikon gembok di sebelah kiri alamat web browser Anda, lalu ubah <strong>Notifikasi</strong> menjadi <strong>Izinkan</strong>.
                </span>
              </div>
            ) : (
              <button
                onClick={handleToggleSubscribe}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1D7A6F] hover:bg-[#1A453B] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
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

      {/* Modal Broadcast Notifikasi (Hanya Admin) */}
      {isAdmin && (
        <NotificationBroadcastModal
          isOpen={broadcastOpen}
          onClose={() => setBroadcastOpen(false)}
        />
      )}
    </>
  );
}
