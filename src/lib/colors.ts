// ===================================================================
// Dashboard Kecamatan Dalam Angka - Color Palette & Design Tokens
// ===================================================================

export const COLORS = {
  // Brand Colors (BPS/Pemerintah)
  primary: '#0B3C5D',
  primaryLight: '#1a5a8a',
  primaryDark: '#072a42',
  secondary: '#1D7A4D',
  secondaryLight: '#27a065',
  accent: '#F2A900',
  accentLight: '#f5c040',

  // Neutral
  neutralDark: '#1E293B',
  neutralMedium: '#64748B',
  neutralLight: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#94A3B8',

  // Gender
  male: '#3B82F6',
  female: '#EC4899',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Chart palette (20 distinct colors for 20 kecamatan)
  chartPalette: [
    '#0B3C5D', '#1D7A4D', '#F2A900', '#E74C3C', '#9B59B6',
    '#1ABC9C', '#E67E22', '#2ECC71', '#3498DB', '#F39C12',
    '#8E44AD', '#16A085', '#D35400', '#27AE60', '#2980B9',
    '#C0392B', '#7D3C98', '#138D75', '#CA6F1E', '#229954',
  ],

  // Choropleth scales
  choroplethGreen: ['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'],
  choroplethBlue: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
  choroplethOrange: ['#feedde', '#fdbe85', '#fd8d3c', '#e6550d', '#a63603'],
  choroplethPurple: ['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#54278f'],

  // Education levels
  education: {
    sd: '#3B82F6',
    smp: '#10B981',
    sma: '#F59E0B',
    pt: '#8B5CF6',
  },

  // Banking
  banking: {
    pemerintah: '#0B3C5D',
    swasta: '#F2A900',
    bpr: '#1D7A4D',
  },
};
