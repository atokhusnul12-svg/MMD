'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { scrollToTop } from '@/lib/scrollTo';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 no-print transition-all duration-300 ease-out motion-reduce:transition-none ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        onClick={() => scrollToTop()}
        aria-label="Kembali ke atas"
        title="Kembali ke atas"
        className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#1D7A6F] border border-[#DCE5E0] shadow-md hover:bg-[#1D7A6F] hover:text-white hover:border-[#1D7A6F] transition-all duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1D7A6F]"
      >
        <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}
