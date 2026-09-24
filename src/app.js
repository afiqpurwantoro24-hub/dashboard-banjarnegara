// ===================================================================
// Dashboard Kecamatan Dalam Angka (KCDA) Kabupaten Banjarnegara
// Production Application Core
// ===================================================================

const BAB_DEFINITIONS = [
  {
    id: 1,
    title: 'Geografi dan Iklim',
    shortTitle: 'Geografi',
    icon: 'globe',
    unit: 'km²',
    primaryMetric: 'luasWilayah',
    subTopics: [],
  },
  {
    id: 2,
    title: 'Pemerintahan',
    shortTitle: 'Pemerintahan',
    icon: 'landmark',
    unit: 'Orang',
    primaryMetric: 'totalPns',
    subTopics: [],
  },
  {
    id: 3,
    title: 'Kependudukan',
    shortTitle: 'Penduduk',
    icon: 'users',
    unit: 'Jiwa',
    primaryMetric: 'totalPenduduk',
    subTopics: [],
  },
  {
    id: 4,
    title: 'Sosial dan Kesejahteraan Rakyat',
    shortTitle: 'Sosial',
    icon: 'graduation-cap',
    subTopics: [
      { id: 'pendidikan', label: 'Sarana Pendidikan', unit: 'Unit', primaryMetric: 'totalSekolah' },
      { id: 'listrik', label: 'Pengguna Listrik PLN', unit: 'Keluarga', primaryMetric: 'jumlahKeluargaPLN' },
    ],
  },
  {
    id: 5,
    title: 'Pariwisata, Transportasi & Komunikasi',
    shortTitle: 'Komunikasi',
    icon: 'radio',
    subTopics: [
      { id: 'menara', label: 'Menara Telekomunikasi', unit: 'Menara', primaryMetric: 'jumlahMenara' },
      { id: 'sinyal', label: 'Kekuatan Sinyal Desa', unit: '% Desa Kuat', primaryMetric: 'persenSinyalKuat' },
    ],
  },
  {
    id: 6,
    title: 'Pertanian',
    shortTitle: 'Pertanian',
    icon: 'wheat',
    unit: 'Kuintal',
    primaryMetric: 'produksiSayuranBuah',
    subTopics: [],
  },
  {
    id: 7,
    title: 'Perbankan, Koperasi & Perdagangan',
    shortTitle: 'Perdagangan',
    icon: 'store',
    subTopics: [
      { id: 'bank', label: 'Lembaga Keuangan Bank', unit: 'Kantor', primaryMetric: 'totalBank' },
      { id: 'perdagangan', label: 'Sarana Perdagangan', unit: 'Unit Sarana', primaryMetric: 'totalSarana' },
    ],
  },
];

// App State
const state = {
  bab: 1,
  subTopic: null,
  tahun: 2025,
  selectedKecamatan: 'ALL', // 'ALL' or kode
  compareList: [], // array of kodes (max 5)
  isCompareMode: false,
  searchKeyword: '',
  sortCol: '',
  sortDir: 'desc',
  barSort: 'desc',
};

// Global Chart Instances
let trendLineChartInstance = null;
let comparisonBarChartInstance = null;
let secondaryChartInstance = null;

// ===================================================================
// INITIALIZATION & URL SYNC
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  readUrlParams();
  initSidebar();
  initHeaderFilters();
  initEventListeners();
  renderApp();
  lucide.createIcons();
});

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('bab')) state.bab = parseInt(params.get('bab'), 10);
  if (params.get('sub')) state.subTopic = params.get('sub');
  if (params.get('tahun')) state.tahun = parseInt(params.get('tahun'), 10);
  if (params.get('kec')) state.selectedKecamatan = params.get('kec');
  if (params.get('cmp') === '1') {
    state.isCompareMode = true;
    if (params.get('list')) {
      state.compareList = params.get('list').split(',').slice(0, 5);
    }
  }

  // Ensure valid subtopic for bab
  const curBabDef = BAB_DEFINITIONS.find((b) => b.id === state.bab);
  if (curBabDef && curBabDef.subTopics.length > 0 && !state.subTopic) {
    state.subTopic = curBabDef.subTopics[0].id;
  }
}

function updateUrlParams() {
  const query = new URLSearchParams();
  query.set('bab', state.bab.toString());
  if (state.subTopic) query.set('sub', state.subTopic);
  query.set('tahun', state.tahun.toString());
  if (state.selectedKecamatan !== 'ALL') query.set('kec', state.selectedKecamatan);
  if (state.isCompareMode) {
    query.set('cmp', '1');
    if (state.compareList.length) query.set('list', state.compareList.join(','));
  }
  const newUrl = `${window.location.pathname}?${query.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

// ===================================================================
// UI INITIALIZERS
// ===================================================================

function initSidebar() {
  const container = document.getElementById('navBabContainer');
  container.innerHTML = '';

  BAB_DEFINITIONS.forEach((b) => {
    const isActive = state.bab === b.id;
    const btn = document.createElement('button');
    btn.className = `w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
      isActive
        ? 'bg-[#F59E0B] text-white font-extrabold shadow-md'
        : 'text-[#64748B] hover:bg-amber-50 hover:text-[#0F172A]'
    }`;
    btn.innerHTML = `
      <div class="flex items-center gap-2.5">
        <i data-lucide="${b.icon}" class="w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}"></i>
        <span>Bab ${b.id}: ${b.shortTitle}</span>
      </div>
      <i data-lucide="chevron-right" class="w-3.5 h-3.5 ${isActive ? 'text-white' : 'opacity-40'}"></i>
    `;
    btn.onclick = () => {
      state.bab = b.id;
      state.subTopic = b.subTopics.length > 0 ? b.subTopics[0].id : null;
      renderApp();
      updateUrlParams();
      initSidebar();
      lucide.createIcons();
    };
    container.appendChild(btn);
  });
}

function initHeaderFilters() {
  // Populate Kecamatan Dropdown
  const selectKec = document.getElementById('filterKecamatan');
  selectKec.innerHTML = '<option value="ALL" class="text-slate-900">Semua Kecamatan (Kabupaten)</option>';

  const sortedKec = [...window.MASTER_KECAMATAN].sort((a, b) => a.nama.localeCompare(b.nama));
  sortedKec.forEach((k) => {
    const opt = document.createElement('option');
    opt.value = k.kode;
    opt.className = 'text-slate-900';
    opt.textContent = `${k.nama} (${k.kode})`;
    selectKec.appendChild(opt);
  });

  selectKec.value = state.selectedKecamatan;
  document.getElementById('filterTahun').value = state.tahun.toString();

  // Populate Comparison Checkboxes
  const compareBox = document.getElementById('compareCheckboxes');
  compareBox.innerHTML = '';
  sortedKec.forEach((k) => {
    const isChecked = state.compareList.includes(k.kode);
    const label = document.createElement('label');
    label.className = 'flex items-center gap-1.5 text-xs text-blue-100 bg-blue-900/60 hover:bg-blue-900 px-2 py-1 rounded cursor-pointer';
    label.innerHTML = `
      <input type="checkbox" value="${k.kode}" ${isChecked ? 'checked' : ''} class="compare-chk rounded border-blue-600 text-amber-500 focus:ring-0" />
      <span class="truncate">${k.nama}</span>
    `;
    compareBox.appendChild(label);
  });
}

function initEventListeners() {
  // Tahun Change
  document.getElementById('filterTahun').addEventListener('change', (e) => {
    state.tahun = parseInt(e.target.value, 10);
    renderApp();
    updateUrlParams();
  });

  // Kecamatan Change
  document.getElementById('filterKecamatan').addEventListener('change', (e) => {
    state.selectedKecamatan = e.target.value;
    renderApp();
    updateUrlParams();
  });

  // Compare Mode Toggle
  const btnToggleCompare = document.getElementById('btnToggleCompare');
  const drawer = document.getElementById('compareDrawer');
  btnToggleCompare.addEventListener('click', () => {
    state.isCompareMode = !state.isCompareMode;
    if (state.isCompareMode) {
      drawer.classList.remove('hidden');
      btnToggleCompare.className = 'flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all bg-[#F59E0B] border-amber-400 text-white shadow-sm ring-2 ring-white/60';
      if (state.compareList.length === 0 && state.selectedKecamatan !== 'ALL') {
        state.compareList.push(state.selectedKecamatan);
      }
    } else {
      drawer.classList.add('hidden');
      btnToggleCompare.className = 'flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all bg-white/95 border-amber-200 text-[#0F172A] hover:text-white hover:bg-[#F59E0B] shadow-sm';
    }
    updateCompareCheckboxes();
    renderApp();
    updateUrlParams();
  });

  // Compare Checkboxes Change
  document.getElementById('compareCheckboxes').addEventListener('change', (e) => {
    if (e.target.classList.contains('compare-chk')) {
      const kode = e.target.value;
      if (e.target.checked) {
        if (state.compareList.length >= 5) {
          e.target.checked = false;
          showToast('Maksimal 5 kecamatan untuk mode komparasi');
          return;
        }
        state.compareList.push(kode);
      } else {
        state.compareList = state.compareList.filter((k) => k !== kode);
      }
      updateCompareCheckboxes();
      renderApp();
      updateUrlParams();
    }
  });

  document.getElementById('btnClearCompare').addEventListener('click', () => {
    state.compareList = [];
    updateCompareCheckboxes();
    renderApp();
    updateUrlParams();
  });

  // Bar chart sort order
  document.getElementById('barSortOrder').addEventListener('change', (e) => {
    state.barSort = e.target.value;
    renderCharts(getCurrentMetrics());
  });

  // Search Input in Table
  document.getElementById('tableSearchInput').addEventListener('input', (e) => {
    state.searchKeyword = e.target.value.toLowerCase();
    renderTable(getCurrentMetrics());
  });

  // Share Link
  document.getElementById('btnShare').addEventListener('click', () => {
    updateUrlParams();
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Tautan tampilan aktif disalin ke clipboard!');
    });
  });

  // Export CSV
  document.getElementById('btnExportCSV').addEventListener('click', () => {
    exportCurrentDataCSV();
  });
  document.getElementById('btnTableExport').addEventListener('click', () => {
    exportCurrentDataCSV();
  });
}

function updateCompareCheckboxes() {
  document.getElementById('compareCount').textContent = `${state.compareList.length}/5`;
  const chks = document.querySelectorAll('.compare-chk');
  chks.forEach((chk) => {
    chk.checked = state.compareList.includes(chk.value);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');
  toastMsg.textContent = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

// ===================================================================
// DATA COMPUTATION & AGGREGATION ENGINE
// ===================================================================

function getCurrentMetrics() {
  const bab = state.bab;
  const sub = state.subTopic;
  const th = state.tahun;

  let records = [];
  let unit = 'Satuan';
  let title = '';
  let extractFn = (r) => 0;
  let breakdownFn = null;

  if (bab === 1) {
    // Geografi
    records = window.KCDA_DATA.geografi.filter((r) => r.tahun === th);
    unit = 'km²';
    title = 'Luas Wilayah';
    extractFn = (r) => r.luasWilayah;
  } else if (bab === 2) {
    // Pemerintahan (PNS)
    records = window.KCDA_DATA.pemerintahan.filter((r) => r.tahun === th).map((r) => ({
      ...r,
      totalPns: (r.pnsLakiLaki || 0) + (r.pnsPerempuan || 0),
    }));
    unit = 'Orang PNS';
    title = 'Jumlah PNS Pemda';
    extractFn = (r) => r.totalPns;
    breakdownFn = (r) => ({
      'Laki-laki': r.pnsLakiLaki || 0,
      Perempuan: r.pnsPerempuan || 0,
    });
  } else if (bab === 3) {
    // Penduduk
    records = window.KCDA_DATA.penduduk.filter((r) => r.tahun === th).map((r) => ({
      ...r,
      totalPenduduk: (r.pendudukLakiLaki || 0) + (r.pendudukPerempuan || 0),
    }));
    unit = 'Jiwa';
    title = 'Jumlah Penduduk';
    extractFn = (r) => r.totalPenduduk;
    breakdownFn = (r) => ({
      'Laki-laki': r.pendudukLakiLaki || 0,
      Perempuan: r.pendudukPerempuan || 0,
    });
  } else if (bab === 4) {
    if (sub === 'listrik') {
      records = window.KCDA_DATA.listrik.filter((r) => r.tahun === th);
      unit = 'Keluarga';
      title = 'Pengguna Listrik PLN';
      extractFn = (r) => r.jumlahKeluargaPLN;
    } else {
      // Pendidikan
      records = window.KCDA_DATA.sekolah.filter((r) => r.tahun === th).map((r) => ({
        ...r,
        totalSekolah: (r.sdMi || 0) + (r.smpMts || 0) + (r.smaSmkMa || 0) + (r.perguruanTinggi || 0),
      }));
      unit = 'Unit Sekolah';
      title = 'Sarana Pendidikan';
      extractFn = (r) => r.totalSekolah;
      breakdownFn = (r) => ({
        'SD/MI': r.sdMi || 0,
        'SMP/MTs': r.smpMts || 0,
        'SMA/SMK/MA': r.smaSmkMa || 0,
        'Perguruan Tinggi': r.perguruanTinggi || 0,
      });
    }
  } else if (bab === 5) {
    if (sub === 'sinyal') {
      records = window.KCDA_DATA.sinyal.filter((r) => r.tahun === th);
      unit = '% Desa Sinyal Kuat';
      title = 'Kekuatan Sinyal Desa';
      extractFn = (r) => r.persenSinyalKuat;
      breakdownFn = (r) => ({
        'Sangat Kuat / Kuat (%)': r.persenSinyalKuat || 0,
        'Lemah / Lainnya (%)': r.persenSinyalLemah || 0,
      });
    } else {
      records = window.KCDA_DATA.menara.filter((r) => r.tahun === th);
      unit = 'Menara';
      title = 'Menara Telekomunikasi';
      extractFn = (r) => r.jumlahMenara;
    }
  } else if (bab === 6) {
    records = window.KCDA_DATA.pertanian.filter((r) => r.tahun === th);
    unit = 'Kuintal';
    title = 'Produksi Sayuran & Buah Semusim';
    extractFn = (r) => r.produksiSayuranBuah;
  } else if (bab === 7) {
    if (sub === 'perdagangan') {
      records = window.KCDA_DATA.perdagangan.filter((r) => r.tahun === th).map((r) => ({
        ...r,
        totalSarana: (r.pertokoan || 0) + (r.pasarPermanen || 0) + (r.minimarket || 0) + (r.restoranRumahMakan || 0),
      }));
      unit = 'Unit Sarana';
      title = 'Sarana Perdagangan';
      extractFn = (r) => r.totalSarana;
      breakdownFn = (r) => ({
        Pertokoan: r.pertokoan || 0,
        Pasar: r.pasarPermanen || 0,
        Minimarket: r.minimarket || 0,
        'Restoran/Rumah Makan': r.restoranRumahMakan || 0,
      });
    } else {
      records = window.KCDA_DATA.bank.filter((r) => r.tahun === th).map((r) => ({
        ...r,
        totalBank: (r.bankPemerintah || 0) + (r.bankSwasta || 0) + (r.bpr || 0),
      }));
      unit = 'Kantor Bank';
      title = 'Lembaga Keuangan Bank';
      extractFn = (r) => r.totalBank;
      breakdownFn = (r) => ({
        'Bank Pemerintah': r.bankPemerintah || 0,
        'Bank Swasta': r.bankSwasta || 0,
        'BPR': r.bpr || 0,
      });
    }
  }

  return { bab, sub, tahun: th, records, unit, title, extractFn, breakdownFn };
}

// ===================================================================
// RENDER MAIN APPLICATION
// ===================================================================

function renderApp() {
  const curBabDef = BAB_DEFINITIONS.find((b) => b.id === state.bab);
  if (!curBabDef) return;

  // Header Titles
  const pubYear = state.tahun + 1;
  const pubHeading = document.getElementById('publicationYearHeading');
  if (pubHeading) {
    pubHeading.textContent = `KECAMATAN DALAM ANGKA ${pubYear}`;
  }

  const curBadge = document.getElementById('currentBabBadge');
  curBadge.textContent = `Bab ${curBabDef.id}`;
  curBadge.className = 'bg-[#F59E0B] text-white font-extrabold text-xs px-2.5 py-0.5 rounded-md shadow-sm';
  document.getElementById('currentBabTitle').textContent = curBabDef.title;
  
  let targetKecName = 'Kabupaten Banjarnegara (Seluruh Kecamatan)';
  if (state.isCompareMode && state.compareList.length > 0) {
    targetKecName = `Mode Komparasi: ${state.compareList.length} Kecamatan`;
  } else if (state.selectedKecamatan !== 'ALL') {
    const k = window.MASTER_KECAMATAN.find((m) => m.kode === state.selectedKecamatan);
    if (k) targetKecName = `Kecamatan ${k.nama}`;
  }
  document.getElementById('currentFilterInfo').textContent = `${targetKecName} • Data Tahun ${state.tahun}`;

  // Subtopics switcher
  const subContainer = document.getElementById('subTopicContainer');
  if (curBabDef.subTopics && curBabDef.subTopics.length > 0) {
    subContainer.classList.remove('hidden');
    subContainer.innerHTML = '';
    curBabDef.subTopics.forEach((st) => {
      const isSel = state.subTopic === st.id;
      const btn = document.createElement('button');
      btn.className = `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        isSel
          ? 'bg-[#F59E0B] text-white font-extrabold shadow-sm'
          : 'text-[#64748B] hover:text-[#0F172A]'
      }`;
      btn.textContent = st.label;
      btn.onclick = () => {
        state.subTopic = st.id;
        renderApp();
        updateUrlParams();
      };
      subContainer.appendChild(btn);
    });
  } else {
    subContainer.classList.add('hidden');
  }

  // Show/hide 2025 banner
  const banner2025 = document.getElementById('bannerDisclaimer2025');
  if (state.tahun === 2025) {
    banner2025.classList.remove('hidden');
  } else {
    banner2025.classList.add('hidden');
  }

  const metricInfo = getCurrentMetrics();
  renderKPIs(metricInfo);
  renderMapChoropleth(metricInfo);
  renderCharts(metricInfo);
  renderTable(metricInfo);
}

// ===================================================================
// 1. RENDER 4 CARD KPIS
// ===================================================================

function renderKPIs(metricInfo) {
  const container = document.getElementById('kpiGrid');
  container.innerHTML = '';

  const { records, unit, title, extractFn } = metricInfo;
  const isKecSelected = state.selectedKecamatan !== 'ALL';
  const targetKec = isKecSelected
    ? window.MASTER_KECAMATAN.find((k) => k.kode === state.selectedKecamatan)
    : null;

  // Compute values
  let valPrimary = 0;
  let valAvg = 0;
  let maxKec = null;
  let maxVal = -Infinity;
  let hasValidData = false;

  const validRecords = records.filter((r) => {
    const val = extractFn(r);
    return val !== null && val !== undefined;
  });

  if (isKecSelected && targetKec) {
    const r = records.find((x) => x.kodeKecamatan === targetKec.kode);
    valPrimary = r ? extractFn(r) : null;
    hasValidData = valPrimary !== null && valPrimary !== undefined;
  } else {
    // Total Kabupaten
    if (metricInfo.unit.includes('%')) {
      // Average percentage
      const sum = validRecords.reduce((acc, r) => acc + extractFn(r), 0);
      valPrimary = validRecords.length ? sum / validRecords.length : null;
    } else {
      valPrimary = validRecords.reduce((acc, r) => acc + extractFn(r), 0);
    }
    hasValidData = validRecords.length > 0;
  }

  if (validRecords.length > 0) {
    const sum = validRecords.reduce((acc, r) => acc + extractFn(r), 0);
    valAvg = sum / validRecords.length;

    validRecords.forEach((r) => {
      const v = extractFn(r);
      if (v > maxVal) {
        maxVal = v;
        maxKec = r.namaKecamatan;
      }
    });
  }

  // YoY Calculation
  const prevTahun = state.tahun - 1;
  let prevVal = null;
  if (prevTahun >= 2021) {
    const prevMetrics = getHistoricalRecords(state.bab, state.subTopic, prevTahun);
    if (isKecSelected && targetKec) {
      const pr = prevMetrics.find((x) => x.kodeKecamatan === targetKec.kode);
      if (pr) prevVal = metricInfo.extractFn(pr);
    } else {
      const prevValid = prevMetrics.filter((r) => metricInfo.extractFn(r) !== null);
      if (metricInfo.unit.includes('%')) {
        const sum = prevValid.reduce((acc, r) => acc + metricInfo.extractFn(r), 0);
        prevVal = prevValid.length ? sum / prevValid.length : null;
      } else {
        prevVal = prevValid.reduce((acc, r) => acc + metricInfo.extractFn(r), 0);
      }
    }
  }

  let yoyPct = null;
  if (hasValidData && prevVal !== null && prevVal !== undefined && prevVal !== 0 && valPrimary !== null) {
    yoyPct = ((valPrimary - prevVal) / prevVal) * 100;
  }

  const formatId = (v, dec = 0) => {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
  };

  const kpis = [
    {
      label: isKecSelected ? `Nilai ${targetKec.nama}` : `Total Kabupaten`,
      val: hasValidData ? formatId(valPrimary, metricInfo.unit.includes('%') ? 1 : 0) : 'Belum Tersedia',
      unit: unit,
      sub: `Tahun ${state.tahun}`,
      icon: 'activity',
      color: 'bg-blue-50 text-[#1E3A8A] border border-blue-100',
    },
    {
      label: 'Rata-rata per Kecamatan',
      val: validRecords.length ? formatId(valAvg, 1) : '—',
      unit: unit,
      sub: `Dari 20 kecamatan`,
      icon: 'bar-chart',
      color: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    },
    {
      label: 'Nilai Tertinggi (Kecamatan)',
      val: maxKec ? `${formatId(maxVal, metricInfo.unit.includes('%') ? 1 : 0)}` : '—',
      unit: unit,
      sub: maxKec ? `Kec. ${maxKec}` : 'Tidak ada data',
      icon: 'award',
      color: 'bg-amber-50 text-amber-700 border border-amber-100',
    },
  ];

  // Di Bab 1 (Geografi / Luas Wilayah bernilai tetap), kartu ke-4 Pertumbuhan Tahunan dihilangkan
  if (state.bab !== 1) {
    kpis.push({
      label: 'Pertumbuhan Tahunan (vs Th. Sebelumnya)',
      val: yoyPct !== null ? `${yoyPct > 0 ? '+' : ''}${yoyPct.toFixed(1)}%` : '—',
      unit: prevTahun >= 2021 ? `Dibanding ${prevTahun}` : 'Tahun dasar',
      sub: yoyPct !== null ? (yoyPct >= 0 ? 'Tren Meningkat' : 'Tren Menurun') : 'Data dasar 2021',
      icon: 'trending-up',
      color: yoyPct !== null ? (yoyPct >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100') : 'bg-slate-50 text-slate-600 border border-slate-100',
    });
  }

  container.className = state.bab === 1
    ? 'grid grid-cols-1 sm:grid-cols-3 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4';

  kpis.forEach((k) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200';
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">${k.label}</span>
        <div class="p-2.5 rounded-xl ${k.color} shadow-xs">
          <i data-lucide="${k.icon}" class="w-4 h-4"></i>
        </div>
      </div>
      <div>
        <div class="flex items-baseline gap-1.5">
          <span class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight tabular-nums">${k.val}</span>
          <span class="text-xs font-bold text-slate-400">${k.unit}</span>
        </div>
        <div class="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span>${k.sub}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();
}

function getHistoricalRecords(bab, sub, th) {
  if (bab === 1) return window.KCDA_DATA.geografi.filter((r) => r.tahun === th);
  if (bab === 2) {
    return window.KCDA_DATA.pemerintahan.filter((r) => r.tahun === th).map((r) => ({
      ...r,
      totalPns: (r.pnsLakiLaki || 0) + (r.pnsPerempuan || 0),
    }));
  }
  if (bab === 3) {
    return window.KCDA_DATA.penduduk.filter((r) => r.tahun === th).map((r) => ({
      ...r,
      totalPenduduk: (r.pendudukLakiLaki || 0) + (r.pendudukPerempuan || 0),
    }));
  }
  if (bab === 4) {
    if (sub === 'listrik') return window.KCDA_DATA.listrik.filter((r) => r.tahun === th);
    return window.KCDA_DATA.sekolah.filter((r) => r.tahun === th).map((r) => ({
      ...r,
      totalSekolah: (r.sdMi || 0) + (r.smpMts || 0) + (r.smaSmkMa || 0) + (r.perguruanTinggi || 0),
    }));
  }
  if (bab === 5) {
    if (sub === 'sinyal') return window.KCDA_DATA.sinyal.filter((r) => r.tahun === th);
    return window.KCDA_DATA.menara.filter((r) => r.tahun === th);
  }
  if (bab === 6) return window.KCDA_DATA.pertanian.filter((r) => r.tahun === th);
  if (bab === 7) {
    if (sub === 'perdagangan') {
      return window.KCDA_DATA.perdagangan.filter((r) => r.tahun === th).map((r) => ({
        ...r,
        totalSarana: (r.pertokoan || 0) + (r.pasarPermanen || 0) + (r.minimarket || 0) + (r.restoranRumahMakan || 0),
      }));
    }
    return window.KCDA_DATA.bank.filter((r) => r.tahun === th).map((r) => ({
      ...r,
      totalBank: (r.bankPemerintah || 0) + (r.bankSwasta || 0) + (r.bpr || 0),
    }));
  }
  return [];
}

// ===================================================================
// 2. RENDER THEMATIC CHOROPLETH GIS MAP (EXACT SVG VECTOR MAP)
// ===================================================================

function renderMapChoropleth(metricInfo) {
  const svg = document.getElementById('banjarnegaraMapSvg');
  if (!svg) return;
  svg.innerHTML = '';

  document.getElementById('mapSelectedIndicatorLabel').textContent = `${metricInfo.title} (${metricInfo.unit})`;

  const { records, extractFn, unit } = metricInfo;
  const values = records.map((r) => extractFn(r)).filter((v) => v !== null && v !== undefined);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 100;
  const sorted = [...records].sort((a, b) => (extractFn(b) || 0) - (extractFn(a) || 0));

  const palette = ['#E0F2FE', '#BAE6FD', '#38BDF8', '#0284C7', '#1E3A8A'];
  const mapPaths = window.BANJARNEGARA_MAP_PATHS || [];

  // Separate Layer Groups: Polygons below, Labels ALWAYS on top so they are NEVER covered
  const polygonsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  polygonsGroup.setAttribute('id', 'mapPolygonsLayer');

  const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelsGroup.setAttribute('id', 'mapLabelsLayer');

  mapPaths.forEach((mp) => {
    const r = records.find((x) => x.kodeKecamatan === mp.kode);
    const val = r ? extractFn(r) : null;
    const rank = r ? sorted.findIndex((x) => x.kodeKecamatan === mp.kode) + 1 : '-';

    let fillColor = '#E2E8F0'; // Default missing
    if (val !== null && val !== undefined) {
      const ratio = maxVal > minVal ? Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal))) : 0.5;
      const colorIdx = Math.min(4, Math.floor(ratio * 5));
      fillColor = palette[colorIdx];
    }

    const isSelected = state.selectedKecamatan === mp.kode || state.compareList.includes(mp.kode);
    if (isSelected) {
      fillColor = '#F59E0B'; // Highlight active Oranye
    }

    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', mp.path);
    pathEl.setAttribute('fill', fillColor);
    pathEl.setAttribute('stroke', isSelected ? '#F59E0B' : '#0F172A');
    pathEl.setAttribute('stroke-width', isSelected ? '3.5' : '1.2');
    pathEl.setAttribute('stroke-linejoin', 'round');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('class', `map-polygon ${isSelected ? 'selected' : ''}`);
    pathEl.setAttribute('data-kode', mp.kode);
    pathEl.setAttribute('data-nama', mp.nama);

    // Tooltip Events
    pathEl.addEventListener('mouseenter', (e) => {
      const tooltip = document.getElementById('mapTooltip');
      const formatVal = val !== null && val !== undefined ? new Intl.NumberFormat('id-ID').format(val) : 'Data Sementara';
      tooltip.innerHTML = `
        <div class="font-extrabold text-amber-300 text-sm">Kec. ${mp.nama}</div>
        <div class="text-[11px] text-slate-300 mt-0.5">Peringkat: <span class="text-white font-bold">#${rank} dari 20</span></div>
        <div class="text-[11px] text-slate-300">Nilai: <span class="text-white font-bold">${formatVal} ${unit}</span></div>
      `;
      tooltip.classList.remove('hidden');
    });

    pathEl.addEventListener('mousemove', (e) => {
      const tooltip = document.getElementById('mapTooltip');
      const containerRect = svg.parentElement.getBoundingClientRect();
      tooltip.style.left = `${e.clientX - containerRect.left + 15}px`;
      tooltip.style.top = `${e.clientY - containerRect.top + 15}px`;
    });

    pathEl.addEventListener('mouseleave', () => {
      document.getElementById('mapTooltip').classList.add('hidden');
    });

    // Click to select / filter
    pathEl.addEventListener('click', () => {
      if (state.selectedKecamatan === mp.kode) {
        state.selectedKecamatan = 'ALL';
      } else {
        state.selectedKecamatan = mp.kode;
      }
      document.getElementById('filterKecamatan').value = state.selectedKecamatan;
      renderApp();
      updateUrlParams();
    });

    polygonsGroup.appendChild(pathEl);

    // Kecamatan Label (ALWAYS layered on top of all polygons)
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', mp.center[0]);
    textEl.setAttribute('y', mp.center[1]);
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('font-size', mp.nama === 'Purwareja Klampok' ? '8.5' : (mp.nama.length > 11 ? '9.5' : '10.5'));
    textEl.setAttribute('font-weight', '800');
    textEl.setAttribute('fill', isSelected ? '#FFFFFF' : '#0F172A');
    textEl.setAttribute('pointer-events', 'none');
    textEl.setAttribute('paint-order', 'stroke fill');
    textEl.setAttribute('stroke', isSelected ? '#D97706' : '#FFFFFF');
    textEl.setAttribute('stroke-width', '4');
    textEl.setAttribute('stroke-linecap', 'round');
    textEl.setAttribute('stroke-linejoin', 'round');

    if (mp.nama === 'Purwareja Klampok') {
      textEl.innerHTML = `<tspan x="${mp.center[0]}" dy="-5">Purwareja</tspan><tspan x="${mp.center[0]}" dy="11">Klampok</tspan>`;
    } else {
      textEl.textContent = mp.nama;
    }

    labelsGroup.appendChild(textEl);
  });

  svg.appendChild(polygonsGroup);
  svg.appendChild(labelsGroup);
}


// ===================================================================
// 3. RENDER INTERACTIVE CHARTS (LINE, BAR, COMPOSITION)
// ===================================================================

function renderCharts(metricInfo) {
  renderTrendLineChart(metricInfo);
  renderComparisonBarChart(metricInfo);
  renderSecondaryChart(metricInfo);
}

function renderTrendLineChart(metricInfo) {
  const ctx = document.getElementById('trendLineChart').getContext('2d');
  if (trendLineChartInstance) trendLineChartInstance.destroy();

  const years = [2021, 2022, 2023, 2024, 2025];
  let datasets = [];

  const paletteColors = [
    '#1E3A8A', '#F59E0B', '#0D9488', '#38BDF8', '#64748B',
    '#7C3AED', '#EC4899', '#10B981', '#F97316', '#0284C7'
  ];

  if (state.isCompareMode && state.compareList.length > 0) {
    // Multi-series for each compared kecamatan
    state.compareList.forEach((kode, idx) => {
      const kec = window.MASTER_KECAMATAN.find((k) => k.kode === kode);
      const dataPoints = years.map((th) => {
        const hist = getHistoricalRecords(state.bab, state.subTopic, th);
        const r = hist.find((x) => x.kodeKecamatan === kode);
        return r ? metricInfo.extractFn(r) : null;
      });

      datasets.push({
        label: kec ? kec.nama : kode,
        data: dataPoints,
        borderColor: paletteColors[idx % paletteColors.length],
        backgroundColor: paletteColors[idx % paletteColors.length] + '20',
        pointBackgroundColor: paletteColors[idx % paletteColors.length],
        fill: false,
        tension: 0.3,
        borderWidth: 2.5,
        pointRadius: 4,
        segment: {
          borderDash: (ctx) => (ctx.p1DataIndex === 4 ? [6, 6] : undefined),
        },
      });
    });
  } else if (state.selectedKecamatan !== 'ALL') {
    // Single selected Kecamatan (Orange Highlight #F59E0B)
    const kec = window.MASTER_KECAMATAN.find((k) => k.kode === state.selectedKecamatan);
    const dataPoints = years.map((th) => {
      const hist = getHistoricalRecords(state.bab, state.subTopic, th);
      const r = hist.find((x) => x.kodeKecamatan === state.selectedKecamatan);
      return r ? metricInfo.extractFn(r) : null;
    });

    datasets.push({
      label: `Kec. ${kec ? kec.nama : ''}`,
      data: dataPoints,
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      pointBackgroundColor: '#F59E0B',
      fill: true,
      tension: 0.3,
      borderWidth: 3,
      pointRadius: 5,
      segment: {
        borderDash: (ctx) => (ctx.p1DataIndex === 4 ? [6, 6] : undefined),
      },
    });
  } else {
    // Total Kabupaten (Navy #1E3A8A)
    const dataPoints = years.map((th) => {
      const hist = getHistoricalRecords(state.bab, state.subTopic, th);
      const valid = hist.filter((r) => metricInfo.extractFn(r) !== null);
      if (!valid.length) return null;
      if (metricInfo.unit.includes('%')) {
        return valid.reduce((acc, r) => acc + metricInfo.extractFn(r), 0) / valid.length;
      }
      return valid.reduce((acc, r) => acc + metricInfo.extractFn(r), 0);
    });

    datasets.push({
      label: 'Total / Rata-rata Kabupaten',
      data: dataPoints,
      borderColor: '#1E3A8A',
      backgroundColor: 'rgba(30, 58, 138, 0.12)',
      pointBackgroundColor: '#1E3A8A',
      fill: true,
      tension: 0.3,
      borderWidth: 3,
      pointRadius: 5,
      segment: {
        borderDash: (ctx) => (ctx.p1DataIndex === 4 ? [6, 6] : undefined),
      },
    });
  }

  trendLineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['2021', '2022', '2023', '2024', '2025 (Sem.)'],
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' } },
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.dataset.label}: ${item.raw !== null ? new Intl.NumberFormat('id-ID').format(item.raw) : 'Belum Tersedia'} ${metricInfo.unit}`,
          },
        },
      },
      scales: {
        y: {
          grid: { color: '#F1F5F9' },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } },
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' } },
        },
      },
    },
  });
}

function renderComparisonBarChart(metricInfo) {
  const ctx = document.getElementById('comparisonBarChart').getContext('2d');
  if (comparisonBarChartInstance) comparisonBarChartInstance.destroy();

  const { records, extractFn, unit } = metricInfo;

  let sorted = [...records];
  if (state.barSort === 'desc') {
    sorted.sort((a, b) => (extractFn(b) || 0) - (extractFn(a) || 0));
  } else if (state.barSort === 'asc') {
    sorted.sort((a, b) => (extractFn(a) || 0) - (extractFn(b) || 0));
  } else {
    sorted.sort((a, b) => a.namaKecamatan.localeCompare(b.namaKecamatan));
  }

  const labels = sorted.map((r) => r.namaKecamatan);
  const data = sorted.map((r) => extractFn(r));

  // Navy (#1E3A8A) for normal bars, Orange (#F59E0B) for active user selection
  const backgroundColors = sorted.map((r) => {
    if (state.selectedKecamatan === r.kodeKecamatan || state.compareList.includes(r.kodeKecamatan)) {
      return '#F59E0B'; // Highlight active selection Oranye
    }
    return '#1E3A8A'; // Biru Navy
  });

  comparisonBarChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: metricInfo.title,
          data: data,
          backgroundColor: backgroundColors,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `${item.raw !== null ? new Intl.NumberFormat('id-ID').format(item.raw) : 'Belum Tersedia'} ${unit}`,
          },
        },
      },
      scales: {
        y: {
          type: state.bab === 6 ? 'logarithmic' : 'linear', // Skala log untuk pertanian Bab 6 sesuai PRD
          grid: { color: '#F1F5F9' },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } },
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 9 }, maxRotation: 45, minRotation: 45 },
        },
      },
    },
  });
}

function renderSecondaryChart(metricInfo) {
  const ctx = document.getElementById('secondaryChart').getContext('2d');
  if (secondaryChartInstance) secondaryChartInstance.destroy();

  const { records, breakdownFn } = metricInfo;

  // Exact 5 Category Doughnut Palette: Navy (#1E3A8A), Teal (#0D9488), Oranye (#F59E0B), Biru Muda (#06B6D4), Abu-Abu (#94A3B8)
  const categoryPalette = ['#1E3A8A', '#0D9488', '#F59E0B', '#06B6D4', '#94A3B8'];

  if (!breakdownFn) {
    // If no breakdown available (e.g. Geografi / Pertanian), show top 5 vs other distribution
    const sorted = [...records].sort((a, b) => (metricInfo.extractFn(b) || 0) - (metricInfo.extractFn(a) || 0));
    const top5 = sorted.slice(0, 5);
    const othersVal = sorted.slice(5).reduce((acc, r) => acc + (metricInfo.extractFn(r) || 0), 0);

    const labels = [...top5.map((r) => r.namaKecamatan), 'Kecamatan Lainnya'];
    const data = [...top5.map((r) => metricInfo.extractFn(r) || 0), othersVal];

    secondaryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: categoryPalette,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }, boxWidth: 12, padding: 12 } },
        },
      },
    });
    return;
  }

  // Calculate aggregated categories
  let breakdownTotals = {};
  records.forEach((r) => {
    if (state.selectedKecamatan !== 'ALL' && r.kodeKecamatan !== state.selectedKecamatan) return;
    const cat = breakdownFn(r);
    Object.keys(cat).forEach((k) => {
      breakdownTotals[k] = (breakdownTotals[k] || 0) + (cat[k] || 0);
    });
  });

  const labels = Object.keys(breakdownTotals);
  const data = Object.values(breakdownTotals);

  secondaryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: categoryPalette,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }, boxWidth: 12, padding: 12 } },
      },
    },
  });
}

// ===================================================================
// 4. RENDER INTERACTIVE DATA TABLE
// ===================================================================

function renderTable(metricInfo) {
  const table = document.getElementById('dataTable');
  table.innerHTML = '';

  const { records, extractFn, unit, breakdownFn } = metricInfo;

  // Filter records by search
  let filtered = records.filter((r) => {
    if (!state.searchKeyword) return true;
    return r.namaKecamatan.toLowerCase().includes(state.searchKeyword);
  });

  // Table Columns
  let columns = [
    { key: 'namaKecamatan', label: 'Nama Kecamatan', sortable: true },
    { key: 'primary', label: `${metricInfo.title} (${unit})`, sortable: true },
  ];

  if (breakdownFn && filtered.length > 0) {
    const sampleBreakdown = breakdownFn(filtered[0]);
    Object.keys(sampleBreakdown).forEach((k) => {
      columns.push({ key: `bd_${k}`, label: k, sortable: true });
    });
  }

  // Create Thead
  const thead = document.createElement('thead');
  thead.className = 'bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider';
  const trHead = document.createElement('tr');
  columns.forEach((col) => {
    const th = document.createElement('th');
    th.className = 'py-3 px-4 cursor-pointer hover:bg-slate-200 transition-colors';
    th.innerHTML = `<div class="flex items-center gap-1"><span>${col.label}</span><i data-lucide="arrow-up-down" class="w-3 h-3 text-slate-400"></i></div>`;
    th.onclick = () => {
      if (state.sortCol === col.key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortCol = col.key;
        state.sortDir = 'desc';
      }
      renderTable(metricInfo);
    };
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Sorting
  if (state.sortCol) {
    filtered.sort((a, b) => {
      let va = state.sortCol === 'namaKecamatan' ? a.namaKecamatan : state.sortCol === 'primary' ? extractFn(a) : (breakdownFn(a)[state.sortCol.replace('bd_', '')] || 0);
      let vb = state.sortCol === 'namaKecamatan' ? b.namaKecamatan : state.sortCol === 'primary' ? extractFn(b) : (breakdownFn(b)[state.sortCol.replace('bd_', '')] || 0);

      if (va === null || va === undefined) va = -Infinity;
      if (vb === null || vb === undefined) vb = -Infinity;

      if (typeof va === 'string') return state.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return state.sortDir === 'asc' ? va - vb : vb - va;
    });
  }

  // Create Tbody
  const tbody = document.createElement('tbody');
  tbody.className = 'divide-y divide-slate-100';

  const formatId = (v) => (v !== null && v !== undefined ? new Intl.NumberFormat('id-ID').format(v) : '<span class="text-amber-500 font-semibold italic">— (Data Sem.)</span>');

  // Compute maximum value for relative visual magnitude bar
  let maxTableVal = 0;
  filtered.forEach((r) => {
    const val = extractFn(r);
    if (val !== null && val !== undefined && val > maxTableVal) maxTableVal = val;
  });

  filtered.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.className = `hover:bg-amber-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`;

    const isHighlight = state.selectedKecamatan === r.kodeKecamatan || state.compareList.includes(r.kodeKecamatan);
    if (isHighlight) tr.classList.add('bg-amber-50/90', 'font-semibold', 'border-l-4', 'border-amber-500');

    const primaryVal = extractFn(r);
    const pct = (primaryVal !== null && primaryVal !== undefined && maxTableVal > 0)
      ? Math.min(100, Math.max(4, Math.round((primaryVal / maxTableVal) * 100)))
      : 0;

    // Rank medal for top 3 if sorted
    let rankBadge = '';
    if (state.sortCol === 'primary' && state.sortDir === 'desc' && primaryVal !== null) {
      if (idx === 0) rankBadge = '<span class="mr-1.5" title="Tertinggi #1">🥇</span>';
      else if (idx === 1) rankBadge = '<span class="mr-1.5" title="Tertinggi #2">🥈</span>';
      else if (idx === 2) rankBadge = '<span class="mr-1.5" title="Tertinggi #3">🥉</span>';
    }

    // Kecamatan Name
    let cellsHtml = `<td class="py-2.5 px-4 font-bold text-slate-900">${rankBadge}${r.namaKecamatan}</td>`;
    
    // Primary Value with Mini Relative Magnitude Bar
    cellsHtml += `
      <td class="py-2.5 px-4">
        <div class="flex items-center gap-2.5">
          <span class="font-bold text-[#1E3A8A] tabular-nums min-w-[55px]">${formatId(primaryVal)}</span>
          ${primaryVal !== null && !unit.includes('%') ? `
          <div class="hidden sm:block w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden shrink-0">
            <div class="${isHighlight ? 'bg-amber-500' : 'bg-[#1E3A8A]'} h-1.5 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
          </div>` : ''}
        </div>
      </td>`;

    // Breakdown columns
    if (breakdownFn) {
      const bd = breakdownFn(r);
      Object.keys(bd).forEach((k) => {
        cellsHtml += `<td class="py-2.5 px-4 text-slate-600 tabular-nums">${formatId(bd[k])}</td>`;
      });
    }

    tr.innerHTML = cellsHtml;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  document.getElementById('tableSummaryText').textContent = `Menampilkan ${filtered.length} dari 20 kecamatan`;
  lucide.createIcons();
}

// ===================================================================
// 5. EXPORT CSV GENERATOR
// ===================================================================

function exportCurrentDataCSV() {
  const metricInfo = getCurrentMetrics();
  const { records, extractFn, title, breakdownFn } = metricInfo;

  let rows = [];
  records.forEach((r) => {
    let row = {
      Tahun: state.tahun,
      Kode_Kecamatan: r.kodeKecamatan,
      Nama_Kecamatan: r.namaKecamatan,
      [title]: extractFn(r) !== null ? extractFn(r) : '',
    };
    if (breakdownFn) {
      const bd = breakdownFn(r);
      Object.keys(bd).forEach((k) => {
        row[k] = bd[k];
      });
    }
    rows.push(row);
  });

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
  link.setAttribute('download', `KCDA_Banjarnegara_Bab${state.bab}_${state.tahun}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('File CSV berhasil diunduh!');
}
