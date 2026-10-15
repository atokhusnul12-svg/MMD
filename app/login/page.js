'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  LogOut,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { isAdmin, login, logout, isLoaded } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const ok = login(username, password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 800);
    } else {
      setError('Username atau password salah! Silakan periksa kembali.');
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto py-8 sm:py-14">
      
      {/* Jika Admin Sudah Login */}
      {isAdmin ? (
        <div className="bg-white rounded-2xl p-8 shadow-xs border border-[#DCE5E0] text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center mx-auto border border-[#1D7A6F]/15">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1D7A6F]">
              Anda Sedang Login sebagai Admin
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6D66] mt-2">
              Tombol <strong className="text-[#1D7A6F]">"Edit Data di Google Sheets"</strong> dan fitur penyiaran pesan khusus admin kini aktif.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DCE5E0] text-xs text-left text-[#26332E] space-y-2">
            <p className="font-bold text-[#1D7A6F]">Hak Akses Administrator:</p>
            <ul className="list-disc list-inside space-y-1 text-[#5C6D66]">
              <li>Membuka lembar kerja Google Sheets untuk edit data santri</li>
              <li>Membuka spreadsheet rekapitulasi keuangan RAB & LPJ</li>
              <li>Membuat dan mengirim penyiaran (broadcast) notifikasi resmi</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-[#1D7A6F] hover:bg-[#1A453B] transition-colors shadow-xs"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[#8A2F1B] bg-[#FAF0ED] hover:bg-[#F5E2DC] border border-[#F1D3CC] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form Login */
        <div className="bg-white rounded-2xl p-8 shadow-xs border border-[#DCE5E0]">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5F3] text-[#1D7A6F] flex items-center justify-center mx-auto mb-3.5 border border-[#1D7A6F]/15">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#1D7A6F]">
              Login Administrator
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6D66] mt-1">
              Masuk untuk memunculkan tautan kelola Google Sheets dan Broadcast
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#FAF0ED] border border-[#F1D3CC] text-[#8A2F1B] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#E8F5F3] border border-[#DCE5E0] text-[#1D7A6F] text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1D7A6F]" />
              <span>Login berhasil! Mengalihkan ke dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6D66] mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#5C6D66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-2 focus:ring-[#1D7A6F]/20 text-[#26332E] bg-white"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6D66] mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#5C6D66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE5E0] text-sm focus:outline-hidden focus:border-[#1D7A6F] focus:ring-2 focus:ring-[#1D7A6F]/20 text-[#26332E] bg-white"
                />
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-white bg-[#1D7A6F] hover:bg-[#1A453B] transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Masuk sebagai Admin</span>
            </button>

          </form>

        </div>
      )}

    </div>
  );
}
