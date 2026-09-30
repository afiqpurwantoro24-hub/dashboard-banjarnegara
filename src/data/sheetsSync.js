// ===================================================================
// Dashboard Kecamatan Dalam Angka Kabupaten Banjarnegara
// Live Google Sheets Synchronization Module
// ===================================================================

(function () {
  const SPREADSHEET_ID = '1ImaBSH_R1IrgOe5DnvaeHq3Q3P5K7QeHtmVyCQaa7lg';
  const CACHE_KEY = 'KCDA_SHEETS_CACHE_V4';
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

    // 1. Geografi dan Iklim (Berlaku untuk semua tahun 2021 hingga 2030)
    getKecRows(gridsMap['Geografi dan Iklim']).forEach(({ row, kode, nama }) => {
      const luas = parseCellNum(row[1]);
      for (let th = 2021; th <= 2030; th++) {
        data.geografi.push({ tahun: th, kodeKecamatan: kode, namaKecamatan: nama, luasWilayah: luas });
      }
    });

    // 2. Pemerintahan (Dukungan tahun 2021 - 2030: 2 kolom per tahun L & P)
    getKecRows(gridsMap['Pemerintahan']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 10; i++) {
        const th = 2021 + i;
        const valL = parseCellNum(row[1 + i * 2]);
        const valP = parseCellNum(row[2 + i * 2]);
        data.pemerintahan.push({ tahun: th, kodeKecamatan: kode, namaKecamatan: nama, pnsLakiLaki: valL, pnsPerempuan: valP });
      }
    });

    // 3. Penduduk (Dukungan tahun 2021 - 2030: 2 kolom per tahun L & P)
    getKecRows(gridsMap['Penduduk']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 10; i++) {
        const th = 2021 + i;
        const valL = parseCellNum(row[1 + i * 2]);
        const valP = parseCellNum(row[2 + i * 2]);
        data.penduduk.push({ tahun: th, kodeKecamatan: kode, namaKecamatan: nama, pendudukLakiLaki: valL, pendudukPerempuan: valP });
      }
    });

    // 4. Sosial dan Kesejahteraan Rakyat
    // Tahun 2021-2025: Sekolah kolom 1..20 (4 col/thn), Listrik kolom 21..25 (1 col/thn)
    // Tahun 2026+ (i >= 5): Menggunakan kolom 26 ke atas (hanya jika telah diinputkan), TIDAK boleh membaca kolom 21..25
    getKecRows(gridsMap['Sosial dan Kesejahteraan Rakyat']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 10; i++) {
        const th = 2021 + i;
        let sd = null, smp = null, sma = null, pt = null, pln = null;

        if (i < 5) {
          const b = 1 + i * 4;
          sd = parseCellNum(row[b]);
          smp = parseCellNum(row[b + 1]);
          sma = parseCellNum(row[b + 2]);
          pt = parseCellNum(row[b + 3]);
          pln = parseCellNum(row[21 + i]);
        } else {
          // Tahun 2026 ke atas (i >= 5)
          const offset = (i - 5) * 5;
          sd = parseCellNum(row[26 + offset]);
          smp = parseCellNum(row[27 + offset]);
          sma = parseCellNum(row[28 + offset]);
          pt = parseCellNum(row[29 + offset]);
          pln = parseCellNum(row[30 + offset]);
        }

        data.sekolah.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          sdMi: sd,
          smpMts: smp,
          smaSmkMa: sma,
          perguruanTinggi: pt
        });

        data.listrik.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          jumlahKeluargaPLN: pln
        });
      }
    });

    // 5. Pariwisata, Transportasi, dan Komunikasi
    // Tahun 2021-2025: Menara kolom 1..5 (1 col/thn), Sinyal kolom 6..15 (2 col/thn)
    // Tahun 2026+ (i >= 5): Menggunakan kolom 16 ke atas (Menara 16, Sinyal 17-18)
    getKecRows(gridsMap['Pariwisata, Transportasi, dan Komunikasi']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 10; i++) {
        const th = 2021 + i;
        let menaraVal = null, sLemah = null, sKuat = null;

        if (i < 5) {
          menaraVal = parseCellNum(row[1 + i]);
          sLemah = parseCellNum(row[6 + i * 2]);
          sKuat = parseCellNum(row[7 + i * 2]);
        } else {
          const offset = (i - 5) * 3;
          menaraVal = parseCellNum(row[16 + offset]);
          sLemah = parseCellNum(row[17 + offset]);
          sKuat = parseCellNum(row[18 + offset]);
        }

        data.menara.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          jumlahMenara: menaraVal
        });

        data.sinyal.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          persenSinyalLemah: sLemah,
          persenSinyalKuat: sKuat
        });
      }
    });

    // 6. Pertanian (Dukungan tahun 2021 - 2030: 1 kolom per tahun)
    getKecRows(gridsMap['Pertanian']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 10; i++) {
        const th = 2021 + i;
        const prodVal = parseCellNum(row[1 + i]);
        data.pertanian.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          produksiSayuranBuah: prodVal
        });
      }
    });

    // 7. Perbankan, Koperasi, dan Perdagangan
    // Tahun 2021-2025: Bank kolom 1..15 (3 col/thn), Perdagangan kolom 16..35 (4 col/thn)
    // Tahun 2026+ (i >= 5): Menggunakan kolom 36 ke atas (Bank 36-38, Perdagangan 39-42)
    getKecRows(gridsMap['Perbankan, Koperasi, dan Perdagangan']).forEach(({ row, kode, nama }) => {
      for (let i = 0; i < 10; i++) {
        const th = 2021 + i;
        let bp = null, bs = null, bprVal = null;
        let pToko = null, pPasar = null, pMini = null, pResto = null;

        if (i < 5) {
          const bIdx = 1 + i * 3;
          bp = parseCellNum(row[bIdx]);
          bs = parseCellNum(row[bIdx + 1]);
          bprVal = parseCellNum(row[bIdx + 2]);

          const pIdx = 16 + i * 4;
          pToko = parseCellNum(row[pIdx]);
          pPasar = parseCellNum(row[pIdx + 1]);
          pMini = parseCellNum(row[pIdx + 2]);
          pResto = parseCellNum(row[pIdx + 3]);
        } else {
          const offset = (i - 5) * 7;
          bp = parseCellNum(row[36 + offset]);
          bs = parseCellNum(row[37 + offset]);
          bprVal = parseCellNum(row[38 + offset]);

          pToko = parseCellNum(row[39 + offset]);
          pPasar = parseCellNum(row[40 + offset]);
          pMini = parseCellNum(row[41 + offset]);
          pResto = parseCellNum(row[42 + offset]);
        }

        data.bank.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          bankPemerintah: bp,
          bankSwasta: bs,
          bpr: bprVal
        });

        data.perdagangan.push({
          tahun: th,
          kodeKecamatan: kode,
          namaKecamatan: nama,
          pertokoan: pToko,
          pasarPermanen: pPasar,
          pasarSemiPermanen: 0,
          pasarTanpaBangunan: 0,
          minimarket: pMini,
          restoranRumahMakan: pResto
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
      text.textContent = 'Update Data (Live)';
      if (icon) icon.classList.remove('animate-spin');
      if (container) container.title = `Data terhubung langsung (Live)\nTerakhir diperbarui: ${message || 'baru saja'}`;
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
    // Pengamanan: Hanya Admin terautentikasi yang dapat memicu sinkronisasi manual dari Spreadsheet
    if (isManual) {
      if (typeof window.isAdminAuthenticated === 'function' && !window.isAdminAuthenticated()) {
        if (typeof window.openAdminAuthModal === 'function') {
          window.openAdminAuthModal();
        }
        return;
      }
    }

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

    // Auto-sync di latar belakang hanya jika Admin sedang aktif
    setTimeout(() => {
      if (typeof window.isAdminAuthenticated === 'function' && window.isAdminAuthenticated()) {
        window.syncWithGoogleSheets(false);
      }
    }, 400);
  });
})();
