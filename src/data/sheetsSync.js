// ===================================================================
// Dashboard Kecamatan Dalam Angka Kabupaten Banjarnegara
// Live Google Sheets Synchronization Module
// ===================================================================

(function () {
  const SPREADSHEET_ID = '1ImaBSH_R1IrgOe5DnvaeHq3Q3P5K7QeHtmVyCQaa7lg';
  const CACHE_KEY = 'KCDA_SHEETS_CACHE_V3';
  const CACHE_TIME_KEY = 'KCDA_SHEETS_LAST_SYNC';

  const SHEET_TABS = [
    { name: 'Geografi dan Iklim', key: 'geografi' },
    { name: 'Pemerintahan', key: 'pemerintahan' },
    { name: 'Penduduk', key: 'penduduk' },
    { name: 'Sosial dan Kesejahteraan Rakyat', key: 'sosial' },
    { name: 'Pariwisata, Transportasi, dan Komunikasi', key: 'komunikasi' },
    { name: 'Pertanian', key: 'pertanian' },
    { name: 'Perbankan, Koperasi, dan Perdagangan', key: 'perdagangan' }
  ];

  function findKecamatanKode(name) {
    if (!name) return '3304999';
    const clean = String(name).trim().toLowerCase();
    const master = window.MASTER_KECAMATAN || [];
    for (const k of master) {
      if (k.nama.toLowerCase() === clean) return k.kode;
      if (k.nama.toLowerCase().replace(/\s+/g, '') === clean.replace(/\s+/g, '')) return k.kode;
    }
    return '3304999';
  }

  function parseCellNum(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    const str = String(val).trim();
    if (!str || str === '-' || str.toLowerCase() === 'na') return null;
    const clean = str.replace(/\s+/g, '').replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }

  /**
   * Fetch single sheet via JSONP to bypass all CORS limitations
   */
  function fetchSheetGviz(tabName) {
    return new Promise((resolve, reject) => {
      const callbackName = 'gviz_cb_' + Math.random().toString(36).substring(2, 9);
      const enc = encodeURIComponent(tabName);
      // Append timestamp &t= to prevent Google and CDN/browser from caching stale sheet data
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${enc}&t=${Date.now()}`;

      const script = document.createElement('script');
      script.src = url;
      script.async = true;

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout fetching ${tabName}`));
      }, 12000);

      function cleanup() {
        clearTimeout(timeout);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (response) {
        cleanup();
        if (response && response.table && response.table.rows) {
          const grid = response.table.rows.map((r) => {
            if (!r.c) return [];
            return r.c.map((cell) => (cell && cell.v !== undefined ? cell.v : null));
          });
          resolve({ tabName, grid });
        } else {
          reject(new Error(`Invalid response for ${tabName}`));
        }
      };

      script.onerror = function () {
        cleanup();
        reject(new Error(`Network error fetching ${tabName}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Parse 7 sheets into standard KCDA_DATA structure
   */
  function parseAllGrids(gridsMap) {
    const data = {
      geografi: [],
      pemerintahan: [],
      penduduk: [],
      sekolah: [],
      listrik: [],
      menara: [],
      sinyal: [],
      pertanian: [],
      bank: [],
      perdagangan: []
    };

    // Helper to dynamically filter rows that belong to official 20 kecamatans (ignoring any number of header rows)
    function getKecRows(grid) {
      if (!grid || !Array.isArray(grid)) return [];
      const list = [];
      for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        if (!row || !row[0]) continue;
        const kode = findKecamatanKode(row[0]);
        if (kode !== '3304999') {
          list.push({ row, kode, nama: String(row[0]).trim() });
        }
      }
      return list;
    }

    // 1. Geografi dan Iklim
    getKecRows(gridsMap['Geografi dan Iklim']).forEach(({ row, kode, nama }) => {
      const luas = parseCellNum(row[1]);
      for (let th = 2021; th <= 2025; th++) {
        data.geografi.push({ tahun: th, kodeKecamatan: kode, namaKecamatan: nama, luasWilayah: luas });
      }
    });

    // 2. Pemerintahan
    getKecRows(gridsMap['Pemerintahan']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 5; i++) {
        const th = 2021 + i;
        const valL = parseCellNum(row[1 + i * 2]);
        const valP = parseCellNum(row[2 + i * 2]);
        data.pemerintahan.push({ tahun: th, kodeKecamatan: kode, namaKecamatan: nama, pnsLakiLaki: valL, pnsPerempuan: valP });
      }
    });

    // 3. Penduduk
    getKecRows(gridsMap['Penduduk']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 5; i++) {
        const th = 2021 + i;
        const valL = parseCellNum(row[1 + i * 2]);
        const valP = parseCellNum(row[2 + i * 2]);
        data.penduduk.push({ tahun: th, kodeKecamatan: kode, namaKecamatan: nama, pendudukLakiLaki: valL, pendudukPerempuan: valP });
      }
    });

    // 4. Sosial dan Kesejahteraan Rakyat (Sekolah & Listrik)
    getKecRows(gridsMap['Sosial dan Kesejahteraan Rakyat']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 5; i++) {
        const th = 2021 + i;
        const b = 1 + i * 4;
        data.sekolah.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          sdMi: parseCellNum(row[b]),
          smpMts: parseCellNum(row[b + 1]),
          smaSmkMa: parseCellNum(row[b + 2]),
          perguruanTinggi: parseCellNum(row[b + 3])
        });
        data.listrik.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          jumlahKeluargaPLN: parseCellNum(row[21 + i])
        });
      }
    });

    // 5. Pariwisata, Transportasi, dan Komunikasi (Menara & Sinyal)
    getKecRows(gridsMap['Pariwisata, Transportasi, dan Komunikasi']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 5; i++) {
        const th = 2021 + i;
        data.menara.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          jumlahMenara: parseCellNum(row[1 + i])
        });
        data.sinyal.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          persenSinyalLemah: parseCellNum(row[6 + i * 2]),
          persenSinyalKuat: parseCellNum(row[7 + i * 2])
        });
      }
    });

    // 6. Pertanian
    getKecRows(gridsMap['Pertanian']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 5; i++) {
        const th = 2021 + i;
        data.pertanian.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          produksiSayuranBuah: parseCellNum(row[1 + i])
        });
      }
    });

    // 7. Perbankan, Koperasi, dan Perdagangan (Bank & Perdagangan)
    getKecRows(gridsMap['Perbankan, Koperasi, dan Perdagangan']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 5; i++) {
        const th = 2021 + i;
        const bIdx = 1 + i * 3;
        data.bank.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          bankPemerintah: parseCellNum(row[bIdx]),
          bankSwasta: parseCellNum(row[bIdx + 1]),
          bpr: parseCellNum(row[bIdx + 2])
        });
        const pIdx = 16 + i * 4;
        data.perdagangan.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          pertokoan: parseCellNum(row[pIdx]),
          pasarPermanen: parseCellNum(row[pIdx + 1]),
          pasarSemiPermanen: 0,
          pasarTanpaBangunan: 0,
          minimarket: parseCellNum(row[pIdx + 2]),
          restoranRumahMakan: parseCellNum(row[pIdx + 3])
        });
      }
    });

    return data;
  }

  function updateSyncUI(status, message) {
    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncText');
    const icon = document.getElementById('syncIcon');
    const container = document.getElementById('sheetsSyncIndicator');
    if (!dot || !text) return;

    if (status === 'syncing') {
      dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      text.textContent = 'Menyinkronkan...';
      if (icon) icon.classList.add('animate-spin');
    } else if (status === 'success') {
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
      text.textContent = 'Google Sheets (Live)';
      if (icon) icon.classList.remove('animate-spin');
      if (container) container.title = `Data tersinkron otomatis dari Google Spreadsheet\nTerakhir disinkron: ${message || 'baru saja'}`;
    } else if (status === 'offline') {
      dot.className = 'w-2 h-2 rounded-full bg-slate-400';
      text.textContent = 'Data Lokal (Offline)';
      if (icon) icon.classList.remove('animate-spin');
      if (container) container.title = 'Koneksi ke Google Sheets tidak tersedia. Menggunakan data tersimpan.';
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  window.syncWithGoogleSheets = async function (isManual = false) {
    updateSyncUI('syncing');

    try {
      // Fetch all 7 sheets concurrently via JSONP
      const promises = SHEET_TABS.map((tab) => fetchSheetGviz(tab.name));
      const results = await Promise.all(promises);

      const gridsMap = {};
      results.forEach((res) => {
        gridsMap[res.tabName] = res.grid;
      });

      const parsedData = parseAllGrids(gridsMap);

      // Verify data completeness before swapping
      if (parsedData.geografi && parsedData.geografi.length > 0) {
        window.KCDA_DATA = parsedData;

        // Cache in localStorage
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(parsedData));
          const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          localStorage.setItem(CACHE_TIME_KEY, timeStr);
          updateSyncUI('success', timeStr);
        } catch (e) {
          updateSyncUI('success', 'Live');
        }

        // Re-render dashboard active views
        if (typeof window.renderApp === 'function') {
          window.renderApp();
        }

        if (isManual && typeof window.showToast === 'function') {
          window.showToast('Data berhasil disinkronkan dari Google Spreadsheet!');
        }
      }
    } catch (err) {
      console.warn('Google Sheets sync error (falling back to cached/embedded data):', err);
      // Try restoring from localStorage if available
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          window.KCDA_DATA = JSON.parse(cached);
          const timeStr = localStorage.getItem(CACHE_TIME_KEY);
          updateSyncUI('success', timeStr ? `Tersimpan ${timeStr}` : 'Cache');
          if (typeof window.renderApp === 'function') window.renderApp();
          return;
        }
      } catch (e) {}

      updateSyncUI('offline');
      if (isManual && typeof window.showToast === 'function') {
        window.showToast('Gagal menghubungi Google Sheets. Menampilkan data lokal.');
      }
    }
  };

  // Restore cached data on boot if available, then sync in background
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        window.KCDA_DATA = JSON.parse(cached);
      }
    } catch (e) {}

    // Auto-sync after 400ms delay so initial paint is instant
    setTimeout(() => {
      window.syncWithGoogleSheets(false);
    }, 400);
  });
})();
