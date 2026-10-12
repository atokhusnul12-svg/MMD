'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  RotateCcw,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Hourglass,
} from 'lucide-react';
import AdminButton from './AdminButton';

export default function BahsuTable({ events = [], title, editUrl }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'BELUM' | 'SUDAH' | 'IZIN'

  // Filter pencarian dan status
  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        search === '' ||
        item.acara.toLowerCase().includes(q) ||
        item.tanggal.toLowerCase().includes(q) ||
        item.delegasi.some(d => d.toLowerCase().includes(q)) ||
        item.keterangan.toLowerCase().includes(q);

      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'BELUM' && item.statusKeberangkatan === 'BELUM_BERANGKAT') ||
        (filterStatus === 'SUDAH' && item.statusKeberangkatan === 'SUDAH_BERANGKAT') ||
        (filterStatus === 'IZIN' && item.statusKeberangkatan === 'IZIN');

      return matchSearch && matchStatus;
    });
  }, [events, search, filterStatus]);

  const totalBelumBerangkat = useMemo(() => {
    return events.filter(e => e.statusKeberangkatan === 'BELUM_BERANGKAT').length;
  }, [events]);

  const totalSudahBerangkat = useMemo(() => {
    return events.filter(e => e.statusKeberangkatan === 'SUDAH_BERANGKAT').length;
  }, [events]);

  const totalIzin = useMemo(() => {
    return events.filter(e => e.statusKeberangkatan === 'IZIN').length;
  }, [events]);

  return (
    <div className="space-y-6">
      
      {/* 4 Kartu Ringkasan Atas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-[#2A9D8F]/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#636E72]">
              Total Forum Bahsu
            </span>
            <div className="text-2xl font-black text-[#2D3436] mt-1">
              {events.length} Agenda
            </div>
            <p className="text-xs text-[#636E72] mt-0.5">Sepanjang tahun 2026</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F5F3] text-[#2A9D8F] flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'BELUM' ? 'ALL' : 'BELUM')}
          className={`cursor-pointer rounded-2xl p-5 border shadow-xs flex items-center justify-between transition-all ${
            filterStatus === 'BELUM'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400'
              : 'bg-white border-amber-200 hover:border-amber-400'
          }`}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Belum Berangkat
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {totalBelumBerangkat} Forum
            </div>
            <p className="text-xs text-amber-800 mt-0.5">Klik untuk filter</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Hourglass className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'SUDAH' ? 'ALL' : 'SUDAH')}
          className={`cursor-pointer rounded-2xl p-5 border shadow-xs flex items-center justify-between transition-all ${
            filterStatus === 'SUDAH'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400'
              : 'bg-white border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Sudah Berangkat
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {totalSudahBerangkat} Forum
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">Klik untuk filter</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'IZIN' ? 'ALL' : 'IZIN')}
          className={`cursor-pointer rounded-2xl p-5 border shadow-xs flex items-center justify-between transition-all ${
            filterStatus === 'IZIN'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400'
              : 'bg-white border-rose-200 hover:border-rose-400'
          }`}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              Izin / Batal
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {totalIzin} Forum
            </div>
            <p className="text-xs text-rose-700 mt-0.5">Surat mepet / ujian</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Kontainer Utama Tabel / List */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#2A9D8F]/15 overflow-hidden">
        
        {/* Header & Tombol Edit */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFCF5]">
          <div>
            <h2 className="text-xl font-bold text-[#2D3436] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2A9D8F]" />
              Daftar Pemberangkatan & Delegasi Bahtsul Masail
            </h2>
            <p className="text-xs text-[#636E72] mt-0.5">
              Jadwal pelaksanaan forum Bahtsul Masail, lokasi, serta utusan santri LBM Darussalamah
            </p>
          </div>

          <AdminButton editUrl={editUrl} title="Edit Bahsu di Sheets" />
        </div>

        {/* Baris Pencarian & Filter Status */}
        <div className="p-4 sm:p-6 bg-white border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Input Search */}
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama forum, lokasi (Lirboyo, Ploso, Tuban), atau nama santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436]"
              />
            </div>

            {/* Filter Status */}
            <div className="sm:col-span-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/20 text-[#2D3436] bg-white font-medium"
              >
                <option value="ALL">Semua Status ({events.length})</option>
                <option value="BELUM">★ Belum Berangkat ({totalBelumBerangkat})</option>
                <option value="SUDAH">Sudah Berangkat ({totalSudahBerangkat})</option>
                <option value="IZIN">Izin / Berhalangan ({totalIzin})</option>
              </select>
            </div>

            {/* Reset */}
            <div className="sm:col-span-1 flex items-center justify-center">
              {(search || filterStatus !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterStatus('ALL');
                  }}
                  title="Reset Filter"
                  className="w-full sm:w-auto p-2.5 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {(search || filterStatus !== 'ALL') && (
            <div className="text-xs text-[#636E72] flex items-center gap-2">
              <span>Menemukan <strong>{filteredEvents.length}</strong> dari {events.length} agenda</span>
            </div>
          )}
        </div>

        {/* Tabel Tampilan Desktop */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FDF6E3] border-b border-[#2A9D8F]/20 text-xs font-semibold text-[#636E72] uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-5 w-1/3">Forum Bahtsul Masail & Tempat</th>
                <th className="py-3.5 px-4 w-44">Tanggal Pelaksanaan</th>
                <th className="py-3.5 px-5">Delegasi Santri</th>
                <th className="py-3.5 px-4 w-44 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((item, idx) => {
                  const isBelum = item.statusKeberangkatan === 'BELUM_BERANGKAT';
                  const isIzin = item.statusKeberangkatan === 'IZIN';

                  return (
                    <tr key={item.id || idx} className="hover:bg-[#FFFCF5] transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-gray-400">
                        {item.no || idx + 1}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#2D3436] text-sm">
                          {item.acara}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D3436] bg-[#FDF6E3] px-2.5 py-1 rounded-lg border border-[#2A9D8F]/15">
                          <Clock className="w-3.5 h-3.5 text-[#2A9D8F]" />
                          {item.tanggal}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {item.delegasi && item.delegasi.length > 0 ? (
                          <div className="space-y-1">
                            {item.delegasi.map((del, dIdx) => {
                              const isKomisi = del.toUpperCase().startsWith('KOMISI') || del.toUpperCase().startsWith('KOM ');
                              return (
                                <div
                                  key={dIdx}
                                  className={`text-xs ${
                                    isKomisi
                                      ? 'font-bold text-[#1D7A6F] mt-1 pt-1 border-t border-gray-100'
                                      : 'text-[#2D3436] flex items-center gap-1.5'
                                  }`}
                                >
                                  {!isKomisi && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2A9D8F] shrink-0" />
                                  )}
                                  <span>{del}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isIzin ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            {item.keterangan}
                          </span>
                        ) : isBelum ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                            <Hourglass className="w-3.5 h-3.5" />
                            Belum Berangkat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#2A9D8F]/15 text-[#1D7A6F] border border-[#2A9D8F]/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {item.keterangan || 'Delegasi'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                    Tidak ada agenda Bahtsul Masail yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tampilan Kartu Khusus Mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((item, idx) => {
              const isBelum = item.statusKeberangkatan === 'BELUM_BERANGKAT';
              const isIzin = item.statusKeberangkatan === 'IZIN';

              return (
                <div key={item.id || idx} className="p-4 space-y-3 hover:bg-[#FFFCF5]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                      #{item.no || idx + 1}
                    </span>
                    {isIzin ? (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {item.keterangan}
                      </span>
                    ) : isBelum ? (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                        Belum Berangkat
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#2A9D8F]/15 text-[#1D7A6F]">
                        {item.keterangan || 'Delegasi'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-[#2D3436] text-sm">
                    {item.acara}
                  </h3>

                  <div className="text-xs text-[#636E72] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#2A9D8F]" />
                    <span>{item.tanggal}</span>
                  </div>

                  {item.delegasi && item.delegasi.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#FDF6E3] border border-[#2A9D8F]/15 text-xs space-y-1">
                      <span className="font-semibold text-[#1D7A6F] block mb-1">Delegasi:</span>
                      {item.delegasi.map((del, dIdx) => (
                        <p key={dIdx} className="text-[#2D3436]">
                          {del}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              Tidak ada agenda Bahtsul Masail yang cocok.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
