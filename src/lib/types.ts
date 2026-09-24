// ===================================================================
// Dashboard Kecamatan Dalam Angka Kabupaten Banjarnegara
// Core Type Definitions
// ===================================================================

// --- Master Data ---

export interface KecamatanInfo {
  kode: string;
  nama: string;
}

// --- Global Filter ---

export interface FilterState {
  selectedTahun: number;
  selectedKecamatan: string[]; // kode kecamatan array, empty = semua
  comparisonMode: boolean;
}

// --- UI Components ---

export interface KPICardData {
  title: string;
  value: string | number;
  unit?: string;
  change?: number; // YoY percentage change
  icon?: string; // emoji
  color?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  format?: (value: number | string) => string;
}

// ===================================================================
// BAB DATA INTERFACES
// ===================================================================

/** Bab 1: Geografi dan Iklim - Luas Wilayah */
export interface GeografiData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  luasWilayah: number; // km²
}

/** Bab 2: Pemerintahan - Jumlah PNS */
export interface PemerintahanData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  pnsLakiLaki: number;
  pnsPerempuan: number;
}

/** Bab 3: Kependudukan - Jumlah Penduduk */
export interface PendudukData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  pendudukLakiLaki: number;
  pendudukPerempuan: number;
}

/** Bab 4A: Sosial - Sarana Pendidikan */
export interface SekolahData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  sdMi: number;
  smpMts: number;
  smaSmkMa: number;
  perguruanTinggi: number;
}

/** Bab 4B: Sosial - Pengguna Listrik PLN */
export interface ListrikData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  jumlahKeluargaPLN: number;
}

/** Bab 5: Pertanian - Produksi Sayuran & Buah */
export interface PertanianData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  produksiSayuranBuah: number; // kuintal
}

/** Bab 6A: Komunikasi - Menara Telekomunikasi */
export interface MenaraData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  jumlahMenara: number;
}

/** Bab 6B: Komunikasi - Kualitas Sinyal */
export interface SinyalData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  persenSinyalKuat: number; // % desa sinyal Sangat Kuat/Kuat
  persenSinyalLemah: number; // % desa sinyal Lemah/Lainnya
}

/** Bab 7A: Perdagangan - Lembaga Keuangan Bank */
export interface BankData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  bankPemerintah: number;
  bankSwasta: number;
  bpr: number;
}

/** Bab 7B: Perdagangan - Sarana Perdagangan */
export interface PerdaganganData {
  tahun: number;
  kodeKecamatan: string;
  namaKecamatan: string;
  pertokoan: number;
  pasarPermanen: number;
  pasarSemiPermanen: number;
  pasarTanpaBangunan: number;
  minimarket: number;
  restoranRumahMakan: number;
}

// ===================================================================
// BAB CONFIGURATION
// ===================================================================

export interface BabSubTopic {
  id: string;
  label: string;
}

export interface BabConfig {
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  hasSubTopics: boolean;
  subTopics?: BabSubTopic[];
}

export const BAB_CONFIG: BabConfig[] = [
  {
    id: 1,
    title: 'Geografi dan Iklim',
    shortTitle: 'Geografi',
    icon: '🌍',
    hasSubTopics: false,
  },
  {
    id: 2,
    title: 'Pemerintahan',
    shortTitle: 'Pemerintahan',
    icon: '🏛️',
    hasSubTopics: false,
  },
  {
    id: 3,
    title: 'Kependudukan',
    shortTitle: 'Penduduk',
    icon: '👥',
    hasSubTopics: false,
  },
  {
    id: 4,
    title: 'Sosial dan Kesejahteraan Rakyat',
    shortTitle: 'Sosial',
    icon: '🎓',
    hasSubTopics: true,
    subTopics: [
      { id: 'pendidikan', label: 'Sarana Pendidikan' },
      { id: 'listrik', label: 'Pengguna Listrik PLN' },
    ],
  },
  {
    id: 5,
    title: 'Pariwisata, Transportasi, dan Komunikasi',
    shortTitle: 'Komunikasi',
    icon: '📡',
    hasSubTopics: true,
    subTopics: [
      { id: 'menara', label: 'Menara Telekomunikasi' },
      { id: 'sinyal', label: 'Kualitas Sinyal' },
    ],
  },
  {
    id: 6,
    title: 'Pertanian',
    shortTitle: 'Pertanian',
    icon: '🌾',
    hasSubTopics: false,
  },
  {
    id: 7,
    title: 'Perbankan, Koperasi, dan Perdagangan',
    shortTitle: 'Perdagangan',
    icon: '🏪',
    hasSubTopics: true,
    subTopics: [
      { id: 'bank', label: 'Lembaga Keuangan Bank' },
      { id: 'perdagangan', label: 'Sarana Perdagangan' },
    ],
  },
];

export const TAHUN_OPTIONS: number[] = [2021, 2022, 2023, 2024, 2025];
