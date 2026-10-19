'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  Wallet,
  ArrowLeft,
  Layers,
} from 'lucide-react';

export default function Waka3SubNav() {
  const pathname = usePathname();

  const waka3Routes = ['/waka-iii', '/anggota', '/bahsu', '/kalender', '/keuangan'];
  const isInsideWaka3 = waka3Routes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  if (!isInsideWaka3) return null;

  const tabs = [
    { name: 'Ringkasan WAKA III', href: '/waka-iii', icon: LayoutDashboard },
    { name: 'Anggota LBM', href: '/anggota', icon: Users },
    { name: 'Delegasi Bahsu', href: '/bahsu', icon: BookOpen },
    { name: 'Kalender Kerja', href: '/kalender', icon: CalendarDays },
    { name: 'Keuangan RAB/LPJ', href: '/keuangan', icon: Wallet },
  ];

  const isTabActive = (href) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="bg-white border-b border-[#DCE5E0] shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-5">
        <div className="flex items-center justify-between gap-3 py-2 overflow-x-auto scrollbar-thin">
          {/* Label WAKA III & Tombol Kembali ke Portal */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-[#1D7A6F] bg-[#E8F5F3] hover:bg-[#1D7A6F] hover:text-white transition-colors"
              title="Kembali ke HOME MMD"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">HOME</span>
            </Link>
            <div className="h-4 w-px bg-[#DCE5E0] hidden sm:block" />
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#26332E] uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#C6A66B]" />
              <span>WAKA III</span>
            </div>
          </div>

          {/* Tab Navigasi Internal WAKA III */}
          <div className="flex items-center gap-1 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isTabActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#1D7A6F] text-white font-semibold shadow-2xs'
                      : 'text-[#5C6E66] hover:text-[#1D7A6F] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
