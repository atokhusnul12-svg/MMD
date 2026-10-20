'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Users,
  BookOpen,
  CalendarDays,
  Wallet,
  LogIn,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  Layers,
  Home,
} from 'lucide-react';
import JamIstiwaTopBar from '@/components/JamIstiwaTopBar';
import Waka3SubNav from '@/components/waka3/Waka3SubNav';

export default function Navbar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems = [
    { name: 'HOME', href: '/', icon: Home },
    { name: 'WAKA I', href: '/waka-i', icon: UserCheck },
    { name: 'WAKA II', href: '/waka-ii', icon: GraduationCap },
    { name: 'WAKA III', href: '/waka-iii', icon: Layers },
    { name: 'Keuangan', href: '/keuangan', icon: Wallet },
    { name: 'Kalender MMD', href: '/kalender-mmd', icon: CalendarDays },
  ];

  const waka3SubItems = [
    { name: 'Ringkasan WAKA III', href: '/waka-iii', icon: Layers },
    { name: 'Anggota LBM', href: '/anggota', icon: Users },
    { name: 'Delegasi Bahsu', href: '/bahsu', icon: BookOpen },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    if (href === '/waka-i') return pathname === '/waka-i' || pathname.startsWith('/waka-i/');
    if (href === '/waka-ii') return pathname === '/waka-ii' || pathname.startsWith('/waka-ii/');
    if (href === '/waka-iii') {
      return (
        pathname === '/waka-iii' ||
        pathname.startsWith('/waka-iii/') ||
        pathname === '/anggota' ||
        pathname.startsWith('/anggota/') ||
        pathname === '/bahsu' ||
        pathname.startsWith('/bahsu/')
      );
    }
    if (href === '/keuangan') return pathname === '/keuangan' || pathname.startsWith('/keuangan/');
    if (href === '/kalender-mmd') {
      return (
        pathname === '/kalender-mmd' ||
        pathname.startsWith('/kalender-mmd/') ||
        pathname === '/kalender' ||
        pathname.startsWith('/kalender/')
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#DCE5E0] shadow-xs no-print">
      {/* TopBar Jam Istiwa' Real-Time Tampil di Semua Halaman */}
      <JamIstiwaTopBar />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Judul Organisasi (Kiri) */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF6EF] p-1 flex items-center justify-center border border-[#DCE5E0] shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Logo MIDA Sumbersari Kediri"
                width={40}
                height={40}
                priority
                className="w-full h-full object-contain filter drop-shadow-2xs shrink-0"
              />
            </div>
            <div className="min-w-0 max-w-[130px] sm:max-w-[180px] lg:max-w-[150px] xl:max-w-[240px] 2xl:max-w-none">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base xl:text-lg text-[#1D7A6F] tracking-tight transition-colors whitespace-nowrap">
                  MMD
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-[#8C6D23] bg-[#FAF3E6] border border-[#ECD8A5]/40 px-1.5 py-0.5 rounded">
                  HOME
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-xs bg-[#FAF3E6] text-[#8C6D23] border border-[#C6A66B]/30 shrink-0 whitespace-nowrap">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C6A66B] shrink-0" />
                    Admin
                  </span>
                )}
              </div>
              <p
                className="text-[11px] xl:text-xs text-[#5C6B64] hidden sm:block truncate leading-tight mt-0.5"
                title="Majlis Musyawaroh Darussalam • Madrasah Islamiyah Darussalamah"
              >
                <span>Majlis Musyawaroh Darussalam</span>
              </p>
            </div>
          </Link>

          {/* Navigasi Desktop (Tengah & Kanan) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-[#1D7A6F] text-white shadow-2xs font-semibold'
                      : 'text-[#26332E] hover:text-[#1D7A6F] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Menu Login / Logout Desktop */}
            <div className="ml-1 pl-2.5 border-l border-[#DCE5E0] flex items-center shrink-0">
              {isAdmin ? (
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 text-rose-700 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  title="Keluar dari mode admin"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 border border-[#1D7A6F]/30 text-[#1D7A6F] hover:bg-[#1D7A6F] hover:text-white transition-colors ${
                    pathname === '/login' ? 'bg-[#1D7A6F] text-white' : 'bg-transparent'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Tombol Hamburger Mobile (di bawah lg) */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
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

      {/* Sub-Navigasi Khusus Internal WAKA III (Hanya Muncul di Rute WAKA III) */}
      <Waka3SubNav />

      {/* Menu Dropdown Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCE5E0] bg-[#FFFFFF] px-4 pt-3 pb-5 space-y-1 shadow-lg animate-in fade-in duration-150">
          <div className="text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider px-3 py-1">
            MENU UTAMA (HOME)
          </div>
          {mainNavItems.map((item) => {
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

          {/* Sub-Menu WAKA III di Mobile Drawer */}
          <div className="pt-2 border-t border-[#DCE5E0] mt-2">
            <div className="text-[11px] font-bold text-[#5C6E66] uppercase tracking-wider px-3 py-1 flex items-center justify-between">
              <span>Internal WAKA III (LBM)</span>
              <Layers className="w-3 h-3 text-[#C6A66B]" />
            </div>
            {waka3SubItems.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = pathname === sub.href;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                    isSubActive
                      ? 'bg-[#E8F5F3] text-[#1D7A6F] font-semibold'
                      : 'text-[#5C6E66] hover:bg-[#F7F5EF] hover:text-[#26332E]'
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{sub.name}</span>
                </Link>
              );
            })}
          </div>

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
