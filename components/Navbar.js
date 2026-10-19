'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  Wallet,
  LogIn,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import JamIstiwaTopBar from '@/components/JamIstiwaTopBar';
import NotificationButton from '@/components/NotificationButton';

export default function Navbar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Anggota LBM', href: '/anggota', icon: Users },
    { name: 'Pemberangkatan Bahsu', href: '/bahsu', icon: BookOpen },
    { name: 'Kalender Kerja', href: '/kalender', icon: CalendarDays },
    { name: 'Keuangan', href: '/keuangan', icon: Wallet },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/98 backdrop-blur-md border-b border-[#DCE5E0] shadow-2xs">
      {/* TopBar Jam Istiwa' Real-Time Tampil di Semua Halaman */}
      <JamIstiwaTopBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 xl:gap-6">
          
          {/* Logo & Judul Organisasi (Kiri) */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 xl:w-11 xl:h-11 rounded-lg bg-[#FAF6EF] p-1 flex items-center justify-center border border-[#DCE5E0] shadow-2xs group-hover:border-[#1D7A6F] transition-colors shrink-0">
              <img
                src="/logo.png"
                alt="Logo MIDA Sumbersari Kediri"
                className="w-full h-full object-contain filter drop-shadow-2xs shrink-0"
              />
            </div>
            <div className="min-w-0 max-w-[170px] sm:max-w-[220px] lg:max-w-[195px] xl:max-w-[280px] 2xl:max-w-none">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base xl:text-lg text-[#1D7A6F] tracking-tight transition-colors whitespace-nowrap">
                  WAKA III MMD
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-xs bg-[#FAF3E6] text-[#8C6D23] border border-[#C6A66B]/30 shrink-0 whitespace-nowrap">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C6A66B] shrink-0" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] xl:text-xs text-[#5C6B64] hidden sm:block truncate leading-tight mt-0.5" title="Madrasah Islamiyah Darussalamah • Pondok Pesantren Darussalam Sumbersari">
                <span>Madrasah Islamiyah Darussalamah</span>
                <span className="hidden 2xl:inline"> • Pondok Pesantren Darussalam Sumbersari</span>
              </p>
            </div>
          </Link>

          {/* Navigasi Desktop (Tengah & Kanan) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 xl:gap-2 px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-md text-xs xl:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-[#1D7A6F] text-white shadow-2xs font-semibold'
                      : 'text-[#26332E] hover:text-[#1D7A6F] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Tombol Notifikasi & Menu Login / Logout Desktop */}
            <div className="ml-1 xl:ml-2 pl-2 xl:pl-3 border-l border-[#DCE5E0] flex items-center gap-1.5 xl:gap-2 shrink-0">
              <NotificationButton variant="header" />

              {isAdmin ? (
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 xl:gap-2 px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-md text-xs xl:text-sm font-medium whitespace-nowrap shrink-0 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Keluar dari mode admin"
                >
                  <LogOut className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`flex items-center gap-1.5 xl:gap-2 px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-md text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 border border-[#1D7A6F]/30 text-[#1D7A6F] hover:bg-[#1D7A6F] hover:text-white transition-colors ${
                    pathname === '/login' ? 'bg-[#1D7A6F] text-white' : 'bg-transparent'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Tombol Hamburger & Notifikasi Menu Mobile (di bawah lg) */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-1.5 shrink-0">
            <NotificationButton variant="header" />
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-xs bg-[#FAF3E6] text-[#8C6D23] border border-[#C6A66B]/30 whitespace-nowrap">
                Admin
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
              className="p-1.5 sm:p-2 rounded-md text-[#26332E] hover:bg-[#F7F5EF] focus:outline-hidden cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCE5E0] bg-[#FFFFFF] px-4 pt-3 pb-5 space-y-1 shadow-lg animate-in fade-in duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#1D7A6F] text-white font-semibold'
                    : 'text-[#26332E] hover:bg-[#F7F5EF]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[#DCE5E0] mt-2">
            {isAdmin ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout (Keluar Admin)</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap text-[#1D7A6F] bg-[#E8F5F3] hover:bg-[#1D7A6F] hover:text-white transition-colors"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Login Admin</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
