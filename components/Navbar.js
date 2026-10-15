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
  Building2,
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
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Judul Organisasi */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-lg bg-[#FAF6EF] p-1 flex items-center justify-center border border-[#DCE5E0] shadow-2xs group-hover:border-[#1D7A6F] transition-colors">
              <img
                src="/logo.png"
                alt="Logo MIDA Sumbersari Kediri"
                className="w-full h-full object-contain filter drop-shadow-2xs"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-[#1D7A6F] tracking-tight transition-colors">
                  WAKA III MMD
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-xs bg-[#FAF3E6] text-[#8C6D23] border border-[#C6A66B]/30">
                    <ShieldCheck className="w-3 h-3 text-[#C6A66B]" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5C6B64] hidden sm:block">
                Madrasah Islamiyah Darussalamah • Pondok Pesantren Darussalam Sumbersari
              </p>
            </div>
          </Link>

          {/* Navigasi Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#1D7A6F] text-white shadow-2xs'
                      : 'text-[#26332E] hover:text-[#1D7A6F] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Tombol Notifikasi & Menu Login / Logout Desktop */}
            <div className="ml-2 pl-2 border-l border-[#DCE5E0] flex items-center gap-2">
              <NotificationButton variant="header" />

              {isAdmin ? (
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Keluar dari mode admin"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-semibold border border-[#1D7A6F]/30 text-[#1D7A6F] hover:bg-[#1D7A6F] hover:text-white transition-colors ${
                    pathname === '/login' ? 'bg-[#1D7A6F] text-white' : 'bg-transparent'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Tombol Hamburger & Notifikasi Menu Mobile */}
          <div className="flex lg:hidden items-center gap-1.5">
            <NotificationButton variant="header" />
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-xs bg-[#FAF3E6] text-[#8C6D23] border border-[#C6A66B]/30">
                Admin
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
              className="p-2 rounded-md text-[#26332E] hover:bg-[#F7F5EF] focus:outline-hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCE5E0] bg-[#FFFFFF] px-4 pt-3 pb-5 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                  active
                    ? 'bg-[#1D7A6F] text-white'
                    : 'text-[#26332E] hover:bg-[#F7F5EF]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout (Keluar Admin)</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-semibold text-[#1D7A6F] bg-[#E8F5F3] hover:bg-[#1D7A6F] hover:text-white transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span>Login Admin</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
