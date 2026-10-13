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
    <div className="max-w-md mx-auto py-8 sm:py-12">
      
      {/* Jika Admin Sudah Login */}
      {isAdmin ? (
        <div className="bg-white rounded-3xl p-8 shadow-xs border border-[#2A9D8F]/20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5F3] text-[#2A9D8F] flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-[#2D3436]">
              Anda Sedang Login sebagai Admin
            </h1>
            <p className="text-xs sm:text-sm text-[#636E72] mt-2">
              Tombol <strong className="text-[#1D7A6F]">"Edit Data di Google Sheets"</strong> kini aktif di Dashboard, Halaman Anggota, dan Halaman Keuangan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FDF6E3] border border-[#2A9D8F]/20 text-xs text-left text-[#2D3436] space-y-2">
            <p className="font-semibold text-[#1D7A6F]">Hak Akses Admin:</p>
            <ul className="list-disc list-inside space-y-1 text-[#636E72]">
              <li>Membuka lembar kerja Google Sheets untuk edit santri</li>
              <li>Membuka spreadsheet rekapitulasi keuangan RAB & LPJ</li>
              <li>Perubahan otomatis tampil ke publik setelah disimpan</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#2A9D8F] hover:bg-[#1D7A6F] transition-colors shadow-xs"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form Login */
        <div className="bg-white rounded-3xl p-8 shadow-xs border border-[#2A9D8F]/20">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5F3] text-[#2A9D8F] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-[#2D3436]">
              Login Administrator
            </h1>
            <p className="text-xs sm:text-sm text-[#636E72] mt-1">
              Masuk untuk memunculkan tautan edit Google Sheets
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Login berhasil! Mengalihkan ke dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#636E72] mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436]"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#636E72] mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436]"
                />
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-[#2A9D8F] hover:bg-[#1D7A6F] transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
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
