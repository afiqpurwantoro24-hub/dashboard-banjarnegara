// ===================================================================
// Dashboard Kecamatan Dalam Angka (KCDA) Kabupaten Banjarnegara
// Production Application Core
// ===================================================================

const BAB_DEFINITIONS = [
  {
    id: 1,
    title: 'Geografi',
    titleEn: 'Geography',
    shortTitle: 'Geografi',
    icon: 'globe',
    unit: 'km²',
    primaryMetric: 'luasWilayah',
    subTopics: [],
  },
  {
    id: 2,
    title: 'Pemerintahan',
    titleEn: 'Government',
    shortTitle: 'Pemerintahan',
    icon: 'landmark',
    unit: 'Orang',
    primaryMetric: 'totalPns',
    subTopics: [],
  },
  {
    id: 3,
    title: 'Kependudukan',
    titleEn: 'Population',
    shortTitle: 'Penduduk',
    icon: 'users',
    unit: 'Jiwa',
    primaryMetric: 'totalPenduduk',
    subTopics: [],
  },
  {
    id: 4,
    title: 'Sosial dan Kesejahteraan Rakyat',
    titleEn: "Social and People's Welfare",
    shortTitle: 'Sosial',
    icon: 'graduation-cap',
    subTopics: [
      { id: 'pendidikan', label: 'Sarana Pendidikan', unit: 'Unit', primaryMetric: 'totalSekolah' },
      { id: 'listrik', label: 'Pengguna Listrik PLN', unit: 'Keluarga', primaryMetric: 'jumlahKeluargaPLN' },
    ],
  },
  {
    id: 5,
    title: 'Pertanian',
    titleEn: 'Agriculture',
    shortTitle: 'Pertanian',
    icon: 'wheat',
    unit: 'Kuintal',
    primaryMetric: 'produksiSayuranBuah',
    subTopics: [],
  },
  {
    id: 6,
    title: 'Komunikasi',
    titleEn: 'Communication',
    shortTitle: 'Komunikasi',
    icon: 'radio',
    subTopics: [
      { id: 'menara', label: 'Menara Telekomunikasi', unit: 'Menara', primaryMetric: 'jumlahMenara' },
      { id: 'sinyal', label: 'Kekuatan Sinyal Desa', unit: '% Desa Kuat', primaryMetric: 'persenSinyalKuat' },
    ],
  },
  {
    id: 7,
    title: 'Perbankan dan Perdagangan',
    titleEn: 'Banking and Trade',
    shortTitle: 'Perbankan & Perdagangan',
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
  secondaryChartMode: 'kecamatan',
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
  initMobileBabDrawer();
  updateMobileBabLabels();
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
    btn.className = `w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-start justify-between gap-2 transition-all cursor-pointer ${
      isActive
        ? 'bg-[#F59E0B] text-white font-extrabold shadow-md'
        : 'text-[#64748B] hover:bg-amber-50 hover:text-[#0F172A]'
    }`;
    btn.innerHTML = `
      <div class="flex items-start gap-2.5 flex-1 min-w-0">
        <i data-lucide="${b.icon}" class="w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-slate-400'}"></i>
        <div class="flex-1 leading-snug">
          <div class="font-bold text-[12px] break-words">Bab ${b.id}: ${b.title}</div>
          <div class="text-[10px] italic ${isActive ? 'text-amber-100' : 'text-slate-400'} font-normal break-words mt-0.5">${b.titleEn}</div>
        </div>
      </div>
      <i data-lucide="chevron-right" class="w-3.5 h-3.5 shrink-0 mt-1 ${isActive ? 'text-white' : 'opacity-40'}"></i>
    `;
    btn.onclick = () => {
      state.bab = b.id;
      state.subTopic = b.subTopics.length > 0 ? b.subTopics[0].id : null;
      renderApp();
      updateUrlParams();
      initSidebar();
      initMobileBabDrawer();
      updateMobileBabLabels();
      lucide.createIcons();
    };
    container.appendChild(btn);
  });
}

function updateMobileBabLabels() {
  const curBabDef = BAB_DEFINITIONS.find((b) => b.id === state.bab);
  if (!curBabDef) return;

  const floatingLabel = document.getElementById('floatingBabLabel');
  if (floatingLabel) {
    floatingLabel.textContent = `Bab ${curBabDef.id}: ${curBabDef.shortTitle}`;
  }

  const headerLabel = document.getElementById('headerBabMobileLabel');
  if (headerLabel) {
    headerLabel.textContent = `Bab ${curBabDef.id}`;
  }
}

function openMobileBabDrawer() {
  const backdrop = document.getElementById('mobileBabBackdrop');
  const drawer = document.getElementById('mobileBabDrawer');
  if (!backdrop || !drawer) return;

  initMobileBabDrawer();
  backdrop.classList.remove('hidden');
  void backdrop.offsetWidth;
  backdrop.classList.remove('opacity-0');
  backdrop.classList.add('opacity-100');

  drawer.classList.remove('translate-y-full');
  drawer.classList.add('translate-y-0');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeMobileBabDrawer() {
  const backdrop = document.getElementById('mobileBabBackdrop');
  const drawer = document.getElementById('mobileBabDrawer');
  if (!backdrop || !drawer) return;

  drawer.classList.remove('translate-y-0');
  drawer.classList.add('translate-y-full');

  backdrop.classList.remove('opacity-100');
  backdrop.classList.add('opacity-0');
  setTimeout(() => {
    backdrop.classList.add('hidden');
  }, 300);

  document.body.style.overflow = '';
}

function initMobileBabDrawer() {
  const container = document.getElementById('mobileBabList');
  if (!container) return;
  container.innerHTML = '';

  BAB_DEFINITIONS.forEach((b) => {
    const isActive = state.bab === b.id;
    const item = document.createElement('button');
    item.className = `w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 border transition-all cursor-pointer ${
      isActive
        ? 'bg-gradient-to-r from-[#002B6A] to-[#1E3A8A] text-white border-amber-400 shadow-md ring-2 ring-amber-400/30'
        : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200'
    }`;
    item.innerHTML = `
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="p-2 rounded-xl shrink-0 ${isActive ? 'bg-amber-400 text-blue-950 font-bold' : 'bg-slate-100 text-slate-600'}">
          <i data-lucide="${b.icon}" class="w-4 h-4"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-900'}">Bab ${b.id}: ${b.title}</div>
          <div class="text-[10px] italic truncate mt-0.5 ${isActive ? 'text-amber-200' : 'text-slate-400'}">${b.titleEn}</div>
        </div>
      </div>
      ${
        isActive
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-blue-950 shrink-0">Aktif</span>'
          : '<i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 shrink-0"></i>'
      }
    `;

    item.onclick = () => {
      state.bab = b.id;
      state.subTopic = b.subTopics.length > 0 ? b.subTopics[0].id : null;
      renderApp();
      updateUrlParams();
      initSidebar();
      initMobileBabDrawer();
      updateMobileBabLabels();
      closeMobileBabDrawer();
      lucide.createIcons();

      // Smooth scroll back to top of dashboard content
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    container.appendChild(item);
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

  // Responsive window resize for comparison bar chart orientation switch
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      renderComparisonBarChart(getCurrentMetrics());
    }, 250);
  });

  // Mobile Floating Bab Navigation & Bottom Sheet Drawer
  const btnOpenMobileBab = document.getElementById('btnOpenMobileBab');
  if (btnOpenMobileBab) {
    btnOpenMobileBab.addEventListener('click', openMobileBabDrawer);
  }

  const btnHeaderBabMobile = document.getElementById('btnHeaderBabMobile');
  if (btnHeaderBabMobile) {
    btnHeaderBabMobile.addEventListener('click', openMobileBabDrawer);
  }

  const btnCloseMobileBab = document.getElementById('btnCloseMobileBab');
  if (btnCloseMobileBab) {
    btnCloseMobileBab.addEventListener('click', closeMobileBabDrawer);
  }

  const mobileBabBackdrop = document.getElementById('mobileBabBackdrop');
  if (mobileBabBackdrop) {
    mobileBabBackdrop.addEventListener('click', closeMobileBabDrawer);
  }

  const mobileBabHandle = document.getElementById('mobileBabHandle');
  if (mobileBabHandle) {
    mobileBabHandle.addEventListener('click', closeMobileBabDrawer);
  }

  // Mobile Scroll-to-Top buttons
  const btnMobileScrollTop = document.getElementById('btnMobileScrollTop');
  if (btnMobileScrollTop) {
    btnMobileScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const btnDrawerScrollTop = document.getElementById('btnDrawerScrollTop');
  if (btnDrawerScrollTop) {
    btnDrawerScrollTop.addEventListener('click', () => {
      closeMobileBabDrawer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Circular Chart Mode Toggle (20 Kecamatan vs Kategori)
  const btnDoughnutKec = document.getElementById('btnDoughnutKec');
  if (btnDoughnutKec) {
    btnDoughnutKec.addEventListener('click', () => {
      state.secondaryChartMode = 'kecamatan';
      renderSecondaryChart(getCurrentMetrics());
    });
  }

  const btnDoughnutCat = document.getElementById('btnDoughnutCat');
  if (btnDoughnutCat) {
    btnDoughnutCat.addEventListener('click', () => {
      state.secondaryChartMode = 'category';
      renderSecondaryChart(getCurrentMetrics());
    });
  }
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
    records = window.KCDA_DATA.pertanian.filter((r) => r.tahun === th);
    unit = 'Kuintal';
    title = 'Produksi Sayuran & Buah Semusim';
    extractFn = (r) => r.produksiSayuranBuah;
  } else if (bab === 6) {
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

  updateMobileBabLabels();
  initMobileBabDrawer();

  // Header Titles
  const pubYear = state.tahun + 1;
  const pubHeading = document.getElementById('publicationYearHeading');
  if (pubHeading) {
    pubHeading.textContent = `KECAMATAN DALAM ANGKA ${pubYear}`;
  }

  const curBadge = document.getElementById('currentBabBadge');
  curBadge.textContent = `Bab ${curBabDef.id}`;
  curBadge.className = 'bg-[#F59E0B] text-white font-extrabold text-xs px-2.5 py-0.5 rounded-md shadow-sm';
  document.getElementById('currentBabTitle').innerHTML = `${curBabDef.title} <span class="italic font-normal text-slate-500 text-sm sm:text-base font-sans ml-1.5">/ ${curBabDef.titleEn}</span>`;
  
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

  const metricInfo = getCurrentMetrics();

  // Show banner only if data is not yet inputted
  const banner2025 = document.getElementById('bannerDisclaimer2025');
  if (banner2025) {
    const hasAnyData = metricInfo.records.some((r) => {
      const v = metricInfo.extractFn(r);
      return v !== null && v !== undefined;
    });

    if (!hasAnyData) {
      banner2025.className = 'mt-4 p-3.5 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-start gap-2.5 text-amber-950 text-xs shadow-xs';
      banner2025.innerHTML = `
        <i data-lucide="alert-circle" class="w-5 h-5 shrink-0 text-amber-600 mt-0.5"></i>
        <div>
          <span class="font-bold text-amber-950">Data Indikator "${metricInfo.title}" Tahun ${state.tahun} Belum Diinput:</span>
          <p class="mt-1 text-amber-800 leading-relaxed font-medium">
            Pada Google Spreadsheet BPS, kolom data tahun <strong>${state.tahun}</strong> untuk bab/indikator ini belum diisi oleh BPS Banjarnegara. 
            Silakan pilih <strong>Tahun 2021 s.d. 2024</strong> pada filter tahun di atas untuk melihat data yang sudah terisi lengkap, atau isi angka pada Google Spreadsheet agar otomatis muncul di sini.
          </p>
        </div>
      `;
      banner2025.classList.remove('hidden');
    } else {
      banner2025.classList.add('hidden');
    }
  }
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
  let minKec = null;
  let minVal = Infinity;
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
      if (v < minVal) {
        minVal = v;
        minKec = r.namaKecamatan;
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

  // Build YoY badge or description for Card 1
  let card1Badge = '';
  if (state.bab === 1) {
    card1Badge = '<span class="text-slate-500 font-semibold text-[10px] sm:text-[11px]">Kabupaten Banjarnegara</span>';
  } else if (yoyPct !== null) {
    const isUp = yoyPct >= 0;
    card1Badge = `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold ${isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${isUp ? '▲ +' : '▼ '}${Math.abs(yoyPct).toFixed(1)}% vs ${prevTahun}</span>`;
  } else if (prevTahun < 2021) {
    card1Badge = '<span class="text-slate-400 font-semibold text-[10px] sm:text-[11px]">Tahun Dasar 2021</span>';
  } else {
    card1Badge = `<span class="text-slate-400 font-semibold text-[10px] sm:text-[11px]">Data Tahun ${state.tahun}</span>`;
  }

  // Calculate share of max/min
  let maxShareStr = '';
  let minShareStr = '';
  if (valPrimary && valPrimary > 0 && !metricInfo.unit.includes('%')) {
    if (maxVal > -Infinity) maxShareStr = ` • ${((maxVal / valPrimary) * 100).toFixed(1)}%`;
    if (minVal < Infinity) minShareStr = ` • ${((minVal / valPrimary) * 100).toFixed(1)}%`;
  }

  const kpis = [
    {
      label: isKecSelected ? `Nilai ${targetKec.nama}` : `Total Kabupaten`,
      val: hasValidData ? formatId(valPrimary, metricInfo.unit.includes('%') ? 1 : 0) : 'Belum Tersedia',
      unit: unit,
      sub: card1Badge,
      icon: 'activity',
      color: 'bg-blue-50 text-[#1E3A8A] border border-blue-100',
    },
    {
      label: 'Rata-rata Kecamatan',
      val: validRecords.length ? formatId(valAvg, 1) : '—',
      unit: unit,
      sub: `<span class="text-slate-500 font-medium text-[10px] sm:text-[11px]">Dari ${validRecords.length} kecamatan</span>`,
      icon: 'bar-chart-2',
      color: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    },
    {
      label: state.bab === 1 ? 'Kecamatan Terluas' : 'Nilai Tertinggi',
      val: maxKec && maxVal > -Infinity ? formatId(maxVal, metricInfo.unit.includes('%') ? 1 : 0) : '—',
      unit: unit,
      sub: maxKec ? `<span class="font-bold text-amber-900 text-[10px] sm:text-[11px]">Kec. ${maxKec}</span><span class="text-slate-400 text-[10px]">${maxShareStr}</span>` : '<span class="text-slate-400 text-[10px]">Tidak ada data</span>',
      icon: 'award',
      color: 'bg-amber-50 text-amber-700 border border-amber-100',
    },
    {
      label: state.bab === 1 ? 'Kecamatan Terkecil' : 'Nilai Terendah',
      val: minKec && minVal < Infinity ? formatId(minVal, metricInfo.unit.includes('%') ? 1 : 0) : '—',
      unit: unit,
      sub: minKec ? `<span class="font-bold text-purple-900 text-[10px] sm:text-[11px]">Kec. ${minKec}</span><span class="text-slate-400 text-[10px]">${minShareStr}</span>` : '<span class="text-slate-400 text-[10px]">Tidak ada data</span>',
      icon: 'trending-down',
      color: 'bg-purple-50 text-purple-700 border border-purple-100',
    },
  ];

  container.className = 'grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4';

  kpis.forEach((k) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 lg:p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[105px] sm:min-h-[125px]';
    card.innerHTML = `
      <div class="flex items-center justify-between gap-1.5 mb-1 sm:mb-2">
        <span class="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">${k.label}</span>
        <div class="p-1 sm:p-2 rounded-lg sm:rounded-xl ${k.color} shrink-0 shadow-2xs">
          <i data-lucide="${k.icon}" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
        </div>
      </div>
      <div>
        <div class="flex flex-wrap items-baseline gap-1">
          <span class="text-lg sm:text-2xl lg:text-3xl font-black text-[#0F172A] tracking-tight tabular-nums">${k.val}</span>
          <span class="text-[10px] sm:text-xs font-bold text-slate-400">${k.unit}</span>
        </div>
        <div class="mt-1 truncate">
          ${k.sub}
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
  if (bab === 5) return window.KCDA_DATA.pertanian.filter((r) => r.tahun === th);
  if (bab === 6) {
    if (sub === 'sinyal') return window.KCDA_DATA.sinyal.filter((r) => r.tahun === th);
    return window.KCDA_DATA.menara.filter((r) => r.tahun === th);
  }
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
  const mapTitleEl = document.getElementById('mapCardTitle');
  if (mapTitleEl) mapTitleEl.textContent = `Peta Tematik: ${metricInfo.title}`;
  const mapSubEl = document.getElementById('mapCardSubtitle');
  if (mapSubEl) mapSubEl.textContent = `Distribusi Spasial Wilayah (Satuan: ${metricInfo.unit})`;

  const svg = document.getElementById('banjarnegaraMapSvg');
  if (!svg) return;
  svg.innerHTML = '';

  const mapIndicatorEl = document.getElementById('mapSelectedIndicatorLabel');
  if (mapIndicatorEl) mapIndicatorEl.textContent = `${metricInfo.title} (${metricInfo.unit})`;

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
      const formatVal = val !== null && val !== undefined ? new Intl.NumberFormat('id-ID').format(val) : 'Belum Tersedia';
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
  const lineTitleEl = document.getElementById('lineChartTitle');
  if (lineTitleEl) lineTitleEl.textContent = `Tren Perkembangan: ${metricInfo.title}`;
  const lineSubEl = document.getElementById('lineChartSubtitle');
  if (lineSubEl) lineSubEl.textContent = `Seri Data 2021–2025 (Satuan: ${metricInfo.unit})`;

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
    });
  }

  trendLineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['2021', '2022', '2023', '2024', '2025'],
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
          title: {
            display: true,
            text: metricInfo.unit,
            font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
            color: '#64748B',
          },
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
  const barTitleEl = document.getElementById('barChartTitle');
  if (barTitleEl) barTitleEl.textContent = 'Perbandingan 20 Kecamatan';
  const barSubEl = document.getElementById('barChartSubtitle');
  if (barSubEl) barSubEl.textContent = `${metricInfo.title} (Satuan: ${metricInfo.unit})`;

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

  const isMobile = window.innerWidth < 768;
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
          borderRadius: isMobile ? 4 : 6,
        },
      ],
    },
    options: {
      indexAxis: isMobile ? 'y' : 'x',
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
      scales: isMobile
        ? {
            y: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }, autoSkip: false },
            },
            x: {
              type: state.bab === 5 ? 'logarithmic' : 'linear',
              title: {
                display: true,
                text: unit,
                font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
                color: '#64748B',
              },
              grid: { color: '#F1F5F9' },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } },
            },
          }
        : {
            y: {
              type: state.bab === 5 ? 'logarithmic' : 'linear',
              title: {
                display: true,
                text: unit,
                font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
                color: '#64748B',
              },
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
  const secTitleEl = document.getElementById('secondaryChartTitle');
  const secSubEl = document.getElementById('secondaryChartSubtitle');
  const toggleContainer = document.getElementById('secondaryChartToggleContainer');
  const btnKec = document.getElementById('btnDoughnutKec');
  const btnCat = document.getElementById('btnDoughnutCat');

  const ctx = document.getElementById('secondaryChart').getContext('2d');
  if (secondaryChartInstance) secondaryChartInstance.destroy();

  const { records, breakdownFn, extractFn, unit, title } = metricInfo;

  // 20 Harmony Colors Palette for All 20 Kecamatan
  const palette20 = [
    '#1E3A8A', '#0284C7', '#0D9488', '#10B981', '#F59E0B',
    '#EA580C', '#DC2626', '#9333EA', '#4F46E5', '#06B6D4',
    '#14B8A6', '#84CC16', '#EAB308', '#F97316', '#F43F5E',
    '#A855F7', '#6366F1', '#38BDF8', '#475569', '#64748B'
  ];

  // 5 Category Palette
  const categoryPalette = ['#1E3A8A', '#0D9488', '#F59E0B', '#06B6D4', '#94A3B8'];

  // Toggle button visibility if category breakdown is available
  if (breakdownFn) {
    if (toggleContainer) toggleContainer.classList.remove('hidden');
    if (btnKec && btnCat) {
      if (state.secondaryChartMode === 'category') {
        btnCat.className = 'text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-900 shadow-xs transition-all cursor-pointer';
        btnKec.className = 'text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md text-slate-500 hover:text-slate-900 transition-all cursor-pointer';
      } else {
        btnKec.className = 'text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-900 shadow-xs transition-all cursor-pointer';
        btnCat.className = 'text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md text-slate-500 hover:text-slate-900 transition-all cursor-pointer';
      }
    }
  } else {
    if (toggleContainer) toggleContainer.classList.add('hidden');
    state.secondaryChartMode = 'kecamatan';
  }

  // MODE 1: Category Breakdown (only if selected by user on chapters with sub-categories)
  if (state.secondaryChartMode === 'category' && breakdownFn) {
    if (secTitleEl) secTitleEl.textContent = `Komposisi: ${title}`;
    if (secSubEl) secSubEl.textContent = `Proporsi Kategori Sektoral (${unit})`;

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
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }, boxWidth: 12, padding: 10 },
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const val = item.raw || 0;
                const total = item.dataset.data.reduce((a, b) => a + (b || 0), 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                const formatVal = new Intl.NumberFormat('id-ID').format(val);
                return ` ${item.label}: ${formatVal} ${unit} (${pct}%)`;
              },
            },
          },
        },
      },
    });
    return;
  }

  // MODE 2 (DEFAULT): ALL 20 KECAMATAN DISTRIBUTION
  if (secTitleEl) secTitleEl.textContent = 'Pangsa Kontribusi 20 Kecamatan';
  if (secSubEl) secSubEl.textContent = `${title} (Satuan: ${unit})`;

  const sorted = [...records].sort((a, b) => (extractFn(b) || 0) - (extractFn(a) || 0));
  const labels = sorted.map((r) => r.namaKecamatan);
  const data = sorted.map((r) => extractFn(r) || 0);

  // Highlight slice if a specific kecamatan is selected in header filter
  const offsets = sorted.map((r) => (state.selectedKecamatan === r.kodeKecamatan ? 14 : 0));
  const borderWidths = sorted.map((r) => (state.selectedKecamatan === r.kodeKecamatan ? 3 : 1));
  const borderColors = sorted.map((r) => (state.selectedKecamatan === r.kodeKecamatan ? '#F59E0B' : '#FFFFFF'));

  secondaryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: palette20,
          offset: offsets,
          borderWidth: borderWidths,
          borderColor: borderColors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Plus Jakarta Sans', size: 9, weight: '600' },
            boxWidth: 8,
            boxHeight: 8,
            padding: 5,
          },
          maxHeight: 125,
        },
        tooltip: {
          callbacks: {
            label: (item) => {
              const val = item.raw || 0;
              const total = item.dataset.data.reduce((a, b) => a + (b || 0), 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              const formatVal = new Intl.NumberFormat('id-ID').format(val);
              return ` Kec. ${item.label}: ${formatVal} ${unit} (${pct}%)`;
            },
          },
        },
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

  const formatId = (v) => (v !== null && v !== undefined ? new Intl.NumberFormat('id-ID').format(v) : '<span class="text-slate-400 font-semibold">—</span>');

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
