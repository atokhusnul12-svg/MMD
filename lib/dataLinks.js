/**
 * PUSAT PENGATURAN LINK DATA GOOGLE SHEETS
 * ========================================
 * Tautan terhubung langsung ke Google Drive WAKA III:
 * Folder: https://drive.google.com/drive/folders/1TFHA1d_I1asuhwvuEkEG6BuRNzADsEe9?usp=sharing
 * 
 * Menggunakan endpoint /export?format=csv langsung dari Google Drive
 * sehingga perubahan langsung tersinkron seketika saat disimpan!
 */

export const DATA_LINKS = {
  // 1. Data Anggota LBM (Tab PERKEMBANGAN)
  anggota: {
    title: "Data Anggota LBM",
    fileId: "1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS",
    csvUrl: "https://docs.google.com/spreadsheets/d/1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS/export?format=csv&gid=211010401",
    pubUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTekbg4Pjk2FTcq8UHHu3zPTHKZUMyhoyIPW8bHQhyUulp2Q2Bruy-E1CzJqHDjQ/pub?output=csv",
    editUrl: "https://docs.google.com/spreadsheets/d/1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS/edit#gid=211010401",
  },

  // 2. Data Pemberangkatan & Delegasi Bahtsul Masail (Tab DAFTAR PEMBERANGKATAN BAHSU)
  // File: statistik new 2.xlsx (Sheet 2)
  bahsu: {
    title: "Daftar Pemberangkatan & Delegasi Bahtsul Masail",
    fileId: "1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS",
    csvUrl: "https://docs.google.com/spreadsheets/d/1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS/export?format=csv&gid=1165916830",
    pubUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTekbg4Pjk2FTcq8UHHu3zPTHKZUMyhoyIPW8bHQhyUulp2Q2Bruy-E1CzJqHDjQ/pub?output=csv&gid=1165916830",
    editUrl: "https://docs.google.com/spreadsheets/d/1QHHc20jWFW3jTZUUIlsCvVCO7Qi6wLcS/edit#gid=1165916830",
  },

  // 3. Kalender Kerja MMD (Jadwal Kegiatan Lengkap 1 Tahun)
  // File: KALENDER.xlsx
  kalender: {
    title: "Kalender Kerja MMD Darussalamah",
    fileId: "1W8esndDx5uyjaKmrGpnwV6t56jTM_Gnt",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTssIohT9n46MGtnmqjSvbeJ6TJSYbd5O-14cs1rGRDAU6BFBhG0qine2z5J6BdyQ/pub?output=csv",
    editUrl: "https://docs.google.com/spreadsheets/d/1W8esndDx5uyjaKmrGpnwV6t56jTM_Gnt/edit",
  },

  // 4. Data Keuangan (Ringkasan RAB & LPJ)
  // File: RAB_LPJ_MMD_Rapi.xlsx
  keuangan: {
    title: "Ringkasan RAB & LPJ",
    fileId: "1aiOhu-06XW4U2WYQWl0WKuIqyiFG5CE6",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv",
    editUrl: "https://docs.google.com/spreadsheets/d/1aiOhu-06XW4U2WYQWl0WKuIqyiFG5CE6/edit#gid=2108096053",
    rawwalUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=1269501839",
    rtsaniUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=1807267650",
    
    // Sheet detail rincian belanja & anggaran per periode
    detailSheets: [
      {
        id: "rawwal",
        name: "Rabiul Awal (RAB & LPJ)",
        type: "RAB_LPJ",
        csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=1269501839",
      },
      {
        id: "rtsani",
        name: "Rabiul Tsani (RAB & LPJ)",
        type: "RAB_LPJ",
        csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=1807267650",
      },
      {
        id: "dzulqadah_rab",
        name: "Dzulqo'dah (RAB Detail)",
        type: "RAB",
        csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=1964400659",
      },
      {
        id: "dzulqadah_lpj",
        name: "Dzulqo'dah (LPJ Realisasi)",
        type: "LPJ",
        csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=641880896",
      },
      {
        id: "dzulhijjah_rab",
        name: "Dzulhijjah (RAB Detail)",
        type: "RAB",
        csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=272874659",
      },
      {
        id: "dzulhijjah_lpj",
        name: "Dzulhijjah (LPJ Realisasi)",
        type: "LPJ",
        csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=1148796307",
      },
      {
        id: "muharrom_rab",
        name: "Muharrom (RAB Detail)",
        type: "RAB",
        csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWsyJOblj1xA0YbUcp8re6fc1vBmNj_5HE7f6AV2xkwGnS4YPBD8O-67KOMChaZw/pub?output=csv&gid=933774264",
      },
    ],
  },
};
