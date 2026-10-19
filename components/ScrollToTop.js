'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { scrollToTop } from '@/lib/scrollTo';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 no-print">
      <button
        onClick={() => scrollToTop()}
        aria-label="Kembali ke atas"
        title="Kembali ke atas"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#1D7A6F] border border-[#DCE5E0] shadow-md hover:bg-[#1D7A6F] hover:text-white hover:scale-105 transition-all cursor-pointer"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}
