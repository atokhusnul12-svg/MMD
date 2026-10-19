'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PortalHeader from './PortalHeader';
import PortalJamIstiwaCard from './PortalJamIstiwaCard';
import PortalWakaCards from './PortalWakaCards';

export default function PortalClient() {
  const [isIntroAnimating, setIsIntroAnimating] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadySeen = sessionStorage.getItem('mmd_intro_seen');
      if (!alreadySeen && !shouldReduceMotion) {
        setIsIntroAnimating(true);
        const timer = setTimeout(() => {
          sessionStorage.setItem('mmd_intro_seen', '1');
          setIsIntroAnimating(false);
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [shouldReduceMotion]);

  const handleSkipIntro = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mmd_intro_seen', '1');
    }
    setIsIntroAnimating(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {/* Tombol Lewati Animasi (Hanya muncul saat animasi intro berlangsung) */}
      {isIntroAnimating && (
        <div className="flex justify-end no-print">
          <button
            onClick={handleSkipIntro}
            className="text-[11px] font-semibold text-[#5C6E66] hover:text-[#1D7A6F] bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-[#DCE5E0] shadow-2xs transition-colors cursor-pointer"
          >
            Lewati Animasi ✕
          </button>
        </div>
      )}

      {/* 1. Header Identitas HOME MMD */}
      <PortalHeader isAnimating={isIntroAnimating} />

      {/* 2. Kartu Jam Istiwa' (WIS) Real-Time */}
      <motion.div
        initial={isIntroAnimating ? { opacity: 0, y: 18 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: isIntroAnimating ? 1.15 : 0, ease: 'easeOut' }}
      >
        <PortalJamIstiwaCard />
      </motion.div>

      {/* 3. Lima Kartu Navigasi Utama WAKA, Keuangan & Kalender MMD */}
      <motion.div
        initial={isIntroAnimating ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: isIntroAnimating ? 1.45 : 0, ease: 'easeOut' }}
      >
        <PortalWakaCards />
      </motion.div>
    </div>
  );
}
