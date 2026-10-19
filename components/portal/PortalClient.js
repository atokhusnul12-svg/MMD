'use client';

import React from 'react';
import PortalHeader from './PortalHeader';
import PortalJamIstiwaCard from './PortalJamIstiwaCard';
import PortalWakaCards from './PortalWakaCards';

export default function PortalClient() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header Identitas HOME MMD */}
      <PortalHeader />

      {/* 2. Kartu Jam Istiwa' (WIS) Real-Time */}
      <PortalJamIstiwaCard />

      {/* 3. Tiga Kartu Navigasi Utama WAKA (WAKA I, WAKA II, WAKA III) */}
      <PortalWakaCards />
    </div>
  );
}
