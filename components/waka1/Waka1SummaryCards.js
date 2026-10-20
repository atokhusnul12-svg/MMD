'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Users, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Waka1SummaryCards({
  summary = {},
  statusFilter = 'ALL',
  onSelectStatusFilter,
}) {
  const shouldReduceMotion = useReducedMotion();
  const {
    totalSiswa = 0,
    totalBebasTakziran = 0,
    totalKenaTakziran = 0,
    totalPerhatianKhusus = 0,
    persenDisiplin = '0%',
  } = summary;

  const cards = [
    {
      id: 'ALL',
      title: 'Total Siswa MIDA',
      value: totalSiswa,
      subtext: 'Gabungan MI, MTs, & MA',
      icon: Users,
      bgActive: 'border-[#1D7A6F] ring-2 ring-[#1D7A6F]/20',
      bgNormal: 'bg-white border-[#DCE5E0]',
      iconWrap: 'bg-[#F7F5EF] text-[#1D7A6F] border-[#DCE5E0]',
      valColor: 'text-[#26332E]',
      labelColor: 'text-[#5C6E66]',
    },
    {
      id: 'BEBAS',
      title: 'Bebas Takziran',
      value: totalBebasTakziran,
      subtext: `${persenDisiplin} berstatus tertib`,
      icon: CheckCircle2,
      bgActive: 'border-[#1D7A6F] ring-2 ring-[#1D7A6F]/20',
      bgNormal: 'bg-[#E8F5F3] border-[#C8E3DC]',
      iconWrap: 'bg-white text-[#1D7A6F] border-[#C8E3DC]',
      valColor: 'text-[#1D7A6F]',
      labelColor: 'text-[#1D7A6F]',
    },
    {
      id: 'TAKZIR',
      title: 'Kena Takziran',
      value: totalKenaTakziran,
      subtext: 'Pernah takzir (1 bulan+)',
      icon: AlertTriangle,
      bgActive: 'border-[#8C6D23] ring-2 ring-[#8C6D23]/20',
      bgNormal: 'bg-[#FAF3E6] border-[#ECD8A5]',
      iconWrap: 'bg-white text-[#8C6D23] border-[#ECD8A5]',
      valColor: 'text-[#8C6D23]',
      labelColor: 'text-[#8C6D23]',
    },
    {
      id: 'KHUSUS',
      title: 'Perhatian Khusus',
      value: totalPerhatianKhusus,
      subtext: 'Takziran 3 bulan atau lebih',
      icon: ShieldAlert,
      bgActive: 'border-[#8A2F1B] ring-2 ring-[#8A2F1B]/20',
      bgNormal: 'bg-[#FAF0ED] border-[#E8BCB0]',
      iconWrap: 'bg-white text-[#8A2F1B] border-[#E8BCB0]',
      valColor: 'text-[#8A2F1B]',
      labelColor: 'text-[#8A2F1B]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 no-print">
      {cards.map((c, idx) => {
        const IconComponent = c.icon;
        const isActive = statusFilter === c.id;

        return (
          <motion.div
            key={c.id}
            role="button"
            tabIndex={0}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }
            }
            whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            onClick={() => onSelectStatusFilter && onSelectStatusFilter(c.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onSelectStatusFilter) onSelectStatusFilter(c.id);
              }
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-shadow duration-200 cursor-pointer shadow-xs hover:shadow-md group select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F] ${
              c.bgNormal
            } ${isActive ? c.bgActive : ''}`}
            title={`Filter status: ${c.title}`}
            aria-label={`${c.title}: ${c.value}. ${c.subtext}.`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${c.labelColor}`}>
                {c.title}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border group-hover:scale-108 transition-transform duration-200 ${c.iconWrap}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black mt-2 font-serif ${c.valColor}`}>
              {c.value}
            </div>
            <p className="text-xs text-[#5C6E66] mt-0.5">{c.subtext}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
