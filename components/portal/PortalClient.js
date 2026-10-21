'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PortalHeader from './PortalHeader';
import PortalJamIstiwaCard from './PortalJamIstiwaCard';
import PortalWakaCards from './PortalWakaCards';

export default function PortalClient() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-3.5 sm:space-y-4 relative">
      {/* 1. Header Identitas HOME MMD */}
      <PortalHeader />

      {/* 2. Kartu Jam Istiwa' (WIS) & Panel Jadwal Sholat Berdampingan */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <PortalJamIstiwaCard />
      </motion.div>

      {/* 3. Lima Kartu Navigasi Utama WAKA, Keuangan & Kalender MMD */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <PortalWakaCards />
      </motion.div>
    </div>
  );
}
