/**
 * Tipe Data dan Interface Anggota LBM Madrasah Islamiyah Darussalamah
 */

export interface AnggotaLBM {
  id: number | string;
  urutan: number;
  noOriginal: number | string;
  nama: string;
  kelas: string;
  status: string; // Perkembangan / status santri
  perkembangan: string; // Status perkembangan santri di LBM
  ttl: string; // Tempat, Tanggal Lahir
  alamat: string; // Alamat asal
  domisili: string; // Domisili asrama / komplek santri di pesantren
  ayahIbu: string; // Nama Orang Tua (Ayah / Ibu)
  bahtsuList: string[]; // Daftar Bahtsul Masail yang pernah dihadiri
}

export interface AnggotaDataResponse {
  anggota: AnggotaLBM[];
  total: number;
  statusCounts: Record<string, number>;
}
