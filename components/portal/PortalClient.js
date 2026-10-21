'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PortalHeader from './PortalHeader';
import PortalJamIstiwaCard from './PortalJamIstiwaCard';
import PortalWakaCards from './PortalWakaCards';

export default function PortalClient() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {/* 1. Header Identitas HOME MMD */}
      <PortalHeader />

      {/* 2. Kartu Jam Istiwa' (WIS) Real-Time */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <PortalJamIstiwaCard />
      </motion.div>

      {/* 3. Lima Kartu Navigasi Utama WAKA, Keuangan & Kalender MMD */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <PortalWakaCards />
      </motion.div>
    </div>
  );
}
