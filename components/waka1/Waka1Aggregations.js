'use client';

import React from 'react';
import { ShieldCheck, BarChart3 } from 'lucide-react';
import { useInViewOnce } from '@/lib/useInViewOnce';
import CountUp from '@/components/motion/CountUp';

/**
 * Waka1Aggregations — 2 Blok Agregasi Bawah (Tingkat Madrasah & Tren Bulanan)
 * Spesifikasi Motion:
 * - Progress bar tumbuh dari kiri: transform scaleX, origin-left, durasi 750ms, ease-out, stagger 80ms
 * - Threshold: 0.3 (useInViewOnce)
 * - Count-up angka tenang pada metrik siswa & takziran
 * - Menghormati prefers-reduced-motion (instan tanpa gerak)
 */
export default function Waka1Aggregations({
  tingkatStats = {},
  monthlyCounts = {},
  bulanList = [],
}) {
  const [tingkatRef, isTingkatInView] = useInViewOnce({ threshold: 0.3 });
  const [bulanRef, isBulanInView] = useInViewOnce({ threshold: 0.3 });

  // Cari angka tertinggi untuk rasio skala progress bar tren bulanan
  const maxMonthlyCount = Math.max(
    ...bulanList.map((b) => monthlyCounts[b.id] || 0),
    1
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
      {/* ============================================================== */}
      {/* 1. REKAPITULASI TINGKAT MADRASAH                               */}
      {/* ============================================================== */}
      <div
        ref={tingkatRef}
        className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DCE5E0] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-250 ease-out motion-reduce:hover:translate-y-0 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#26332E] font-serif flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1D7A6F]" />
            <span>Kedisiplinan per Tingkat Madrasah</span>
          </h3>
          <span className="text-xs text-[#5C6E66]">MI, MTs, MA</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {['MI', 'MTs', 'MA'].map((t, idx) => {
            const stat = tingkatStats[t] || { total: 0, bebas: 0, takzir: 0 };
            const persenBebas =
              stat.total > 0 ? Math.round((stat.bebas / stat.total) * 100) : 0;
            const progressRatio = Math.min(Math.max(persenBebas / 100, 0), 1);

            return (
              <div
                key={t}
                className="p-3.5 rounded-xl bg-[#F7F5EF]/70 border border-[#DCE5E0] space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-black text-[#1D7A6F] block tracking-wide">
                    {t}
                  </span>
                  <span className="text-lg font-black text-[#26332E] font-serif block mt-0.5">
                    <CountUp target={stat.total} duration={1000} threshold={0.3} formatThousand={false} />{' '}
                    <span className="text-xs font-sans font-normal text-[#5C6E66]">Siswa</span>
                  </span>
                </div>

                {/* Progress Bar Persentase Bebas Takziran */}
                <div className="py-1">
                  <div className="text-[11px] font-semibold text-[#1D7A6F] flex items-center justify-center gap-1">
                    <CountUp target={persenBebas} suffix="%" duration={1000} threshold={0.3} />
                    <span>Tertib</span>
                  </div>

                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-[#1D7A6F] rounded-full transition-transform duration-750 ease-out origin-left motion-reduce:transition-none print:!transform-none print:!w-full"
                      style={{
                        transform: isTingkatInView ? `scaleX(${progressRatio})` : 'scaleX(0)',
                        transformOrigin: 'left',
                        transitionDelay: `${idx * 80}ms`,
                      }}
                    />
                  </div>
                </div>

                <span className="text-[10px] text-[#8A2F1B] font-medium block">
                  <CountUp target={stat.takzir} duration={1000} threshold={0.3} formatThousand={false} /> Kena Takzir
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TREN TAKZIRAN PER BULAN                                     */}
      {/* ============================================================== */}
      <div
        ref={bulanRef}
        className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DCE5E0] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-250 ease-out motion-reduce:hover:translate-y-0 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#26332E] font-serif flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#8C6D23]" />
            <span>Jumlah Santri Takzir per Bulan</span>
          </h3>
          <span className="text-xs text-[#5C6E66]">6 Periode Terdata</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {bulanList.map((b, idx) => {
            const count = monthlyCounts[b.id] || 0;
            const progressRatio = Math.min(Math.max(count / maxMonthlyCount, 0), 1);

            return (
              <div
                key={b.id}
                className="p-2.5 rounded-xl bg-[#F7F5EF]/70 border border-[#DCE5E0] space-y-1 flex flex-col justify-between"
              >
                <span className="text-[10px] font-bold text-[#5C6E66] block truncate" title={b.name}>
                  {b.name}
                </span>

                <div>
                  <span className="text-base font-black text-[#8A2F1B] font-serif block">
                    <CountUp target={count} duration={1000} threshold={0.3} formatThousand={false} />
                  </span>
                  <span className="text-[9px] text-[#5C6E66]/80 block">santri</span>
                </div>

                {/* Progress Bar Rasio Takzir Bulanan */}
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#8A2F1B] rounded-full transition-transform duration-750 ease-out origin-left motion-reduce:transition-none print:!transform-none print:!w-full"
                    style={{
                      transform: isBulanInView ? `scaleX(${progressRatio})` : 'scaleX(0)',
                      transformOrigin: 'left',
                      transitionDelay: `${idx * 80}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
