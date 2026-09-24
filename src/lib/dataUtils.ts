// Utility functions for KCDA Data Processing, Calculations, Formatting & Export
import { KCDA_DATA } from '../data/kcdaData';
import { MASTER_KECAMATAN } from '../data/masterKecamatan';

/**
 * Format numbers with Indonesian locale standard (1.234.567,89)
 */
export function formatNumber(val: number | null | undefined, decimals: number = 0): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'Belum Tersedia';
  }
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Format percentages (e.g. 85.5% -> 85,5%)
 */
export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'Belum Tersedia';
  }
  return (
    new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(val) + '%'
  );
}

/**
 * Calculate Year-over-Year (YoY) percentage change
 */
export function calculateYoY(current: number | null | undefined, previous: number | null | undefined): number | undefined {
  if (current === null || current === undefined || previous === null || previous === undefined || previous === 0) {
    return undefined;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Get Kecamatan details by Kode or Name
 */
export function getKecamatanByKode(kode: string) {
  return MASTER_KECAMATAN.find((k) => k.kode === kode);
}

export function getKecamatanByName(name: string) {
  return MASTER_KECAMATAN.find((k) => k.nama.toLowerCase() === name.toLowerCase());
}

/**
 * Convert data array to CSV and trigger file download
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const header = keys.join(';');
  const lines = rows.map((row) =>
    keys
      .map((key) => {
        let val = row[key];
        if (val === null || val === undefined) return '';
        if (typeof val === 'number') return val.toString().replace('.', ',');
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(';')
  );

  const csvContent = '\uFEFF' + [header, ...lines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse and stringify query string for Shareable Links
 */
export interface UrlFilterParams {
  bab: number;
  sub?: string;
  tahun: number;
  kec?: string; // comma-separated kodes
  cmp?: boolean;
}

export function encodeFilterStateToUrl(params: UrlFilterParams): string {
  const query = new URLSearchParams();
  query.set('bab', params.bab.toString());
  if (params.sub) query.set('sub', params.sub);
  query.set('tahun', params.tahun.toString());
  if (params.kec && params.kec.length > 0) query.set('kec', params.kec);
  if (params.cmp) query.set('cmp', '1');
  return `${window.location.pathname}?${query.toString()}`;
}

export function decodeFilterStateFromUrl(): Partial<UrlFilterParams> {
  if (typeof window === 'undefined') return {};
  const query = new URLSearchParams(window.location.search);
  const bab = query.get('bab') ? parseInt(query.get('bab')!, 10) : undefined;
  const sub = query.get('sub') || undefined;
  const tahun = query.get('tahun') ? parseInt(query.get('tahun')!, 10) : undefined;
  const kec = query.get('kec') || undefined;
  const cmp = query.get('cmp') === '1';

  return { bab, sub, tahun, kec, cmp };
}
