// ===================================================================
// Dashboard Kecamatan Dalam Angka Kabupaten Banjarnegara
// Admin Data Editor Module (Edit Data & Simpan ke Google Spreadsheet)
// ===================================================================

(function () {
  const SPREADSHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzLeRLYZjvgb3uYJUzelxPdTHPjA7SQUQpNgBaiVn74wEbPYbs3zE3BpImZ4rXCNlDx/exec';
  const ADMIN_SECRET_KEY = 'adminbps2026';

  // Skema Indikator untuk Setiap Bab Statistik
  const BAB_EDITOR_SCHEMAS = {
    1: {
      id: 1,
      title: 'Bab 1: Geografi dan Iklim',
      tabName: 'Geografi dan Iklim',
      subTopics: [],
      fields: [
        { key: 'luasWilayah', label: 'Luas Wilayah', unit: 'km²', step: '0.01', min: 0 }
      ]
    },
    2: {
      id: 2,
      title: 'Bab 2: Pemerintahan (PNS)',
      tabName: 'Pemerintahan',
      subTopics: [],
      fields: [
        { key: 'pnsLakiLaki', label: 'PNS Laki-laki', unit: 'Orang', step: '1', min: 0 },
        { key: 'pnsPerempuan', label: 'PNS Perempuan', unit: 'Orang', step: '1', min: 0 }
      ]
    },
    3: {
      id: 3,
      title: 'Bab 3: Kependudukan',
      tabName: 'Penduduk',
      subTopics: [],
      fields: [
        { key: 'pendudukLakiLaki', label: 'Penduduk Laki-laki', unit: 'Jiwa', step: '1', min: 0 },
        { key: 'pendudukPerempuan', label: 'Penduduk Perempuan', unit: 'Jiwa', step: '1', min: 0 }
      ]
    },
    4: {
      id: 4,
      title: 'Bab 4: Sosial dan Kesejahteraan Rakyat',
      tabName: 'Sosial dan Kesejahteraan Rakyat',
      subTopics: [
        { id: 'pendidikan', label: 'Sarana Pendidikan' },
        { id: 'listrik', label: 'Pengguna Listrik PLN' }
      ],
      fieldsBySubTopic: {
        pendidikan: [
          { key: 'sdMi', label: 'SD / MI', unit: 'Unit', step: '1', min: 0 },
          { key: 'smpMts', label: 'SMP / MTs', unit: 'Unit', step: '1', min: 0 },
          { key: 'smaSmkMa', label: 'SMA / SMK / MA', unit: 'Unit', step: '1', min: 0 },
          { key: 'perguruanTinggi', label: 'Perguruan Tinggi / Akademi', unit: 'Unit', step: '1', min: 0 }
        ],
        listrik: [
          { key: 'jumlahKeluargaPLN', label: 'Keluarga Pelanggan Listrik PLN', unit: 'Keluarga', step: '1', min: 0 }
        ]
      }
    },
    5: {
      id: 5,
      title: 'Bab 5: Pertanian',
      tabName: 'Pertanian',
      subTopics: [],
      fields: [
        { key: 'produksiSayuranBuah', label: 'Produksi Sayuran & Buah Semusim', unit: 'Kuintal', step: '0.1', min: 0 }
      ]
    },
    6: {
      id: 6,
      title: 'Bab 6: Komunikasi & Transportasi',
      tabName: 'Pariwisata, Transportasi, dan Komunikasi',
      subTopics: [
        { id: 'menara', label: 'Menara Telekomunikasi' },
        { id: 'sinyal', label: 'Kekuatan Sinyal Seluler' }
      ],
      fieldsBySubTopic: {
        menara: [
          { key: 'jumlahMenara', label: 'Jumlah Menara BTS', unit: 'Menara', step: '1', min: 0 }
        ],
        sinyal: [
          { key: 'persenSinyalKuat', label: 'Sinyal Sangat Kuat / Kuat', unit: '%', step: '0.1', min: 0, max: 100 },
          { key: 'persenSinyalLemah', label: 'Sinyal Lemah / Tidak Ada', unit: '%', step: '0.1', min: 0, max: 100 }
        ]
      }
    },
    7: {
      id: 7,
      title: 'Bab 7: Perbankan, Koperasi, dan Perdagangan',
      tabName: 'Perbankan, Koperasi, dan Perdagangan',
      subTopics: [
        { id: 'bank', label: 'Lembaga Perbankan' },
        { id: 'perdagangan', label: 'Sarana Perdagangan' }
      ],
      fieldsBySubTopic: {
        bank: [
          { key: 'bankPemerintah', label: 'Kantor Bank Pemerintah', unit: 'Kantor', step: '1', min: 0 },
          { key: 'bankSwasta', label: 'Kantor Bank Swasta', unit: 'Kantor', step: '1', min: 0 },
          { key: 'bpr', label: 'Kantor BPR', unit: 'Kantor', step: '1', min: 0 }
        ],
        perdagangan: [
          { key: 'pertokoan', label: 'Kelompok Pertokoan', unit: 'Unit', step: '1', min: 0 },
          { key: 'pasarPermanen', label: 'Pasar dengan Bangunan', unit: 'Unit', step: '1', min: 0 },
          { key: 'minimarket', label: 'Minimarket / Swalayan', unit: 'Unit', step: '1', min: 0 },
          { key: 'restoranRumahMakan', label: 'Restoran / Rumah Makan', unit: 'Unit', step: '1', min: 0 }
        ]
      }
    }
  };

  // Helper mendapatkan fields aktif berdasarkan bab & subTopic
  function getActiveFields(babId, subTopicId) {
    const schema = BAB_EDITOR_SCHEMAS[babId];
    if (!schema) return [];
    if (schema.fieldsBySubTopic) {
      const sub = subTopicId || (schema.subTopics[0] ? schema.subTopics[0].id : '');
      return schema.fieldsBySubTopic[sub] || [];
    }
    return schema.fields || [];
  }

  // Buka Modal Form Edit Data
  window.openAdminEditorModal = function () {
    // 1. Cek autentikasi admin terlebih dahulu
    if (typeof window.isAdminAuthenticated === 'function' && !window.isAdminAuthenticated()) {
      if (typeof window.openAdminAuthModal === 'function') {
        window.openAdminAuthModal();
      }
      return;
    }

    const modal = document.getElementById('adminEditorModal');
    if (!modal) return;

    // Inisialisasi dropdown bab, tahun, dan kecamatan sesuai tampilan dashboard aktif
    const selBab = document.getElementById('editorBabSelect');
    const selTahun = document.getElementById('editorTahunSelect');
    const selKec = document.getElementById('editorKecamatanSelect');

    if (selBab && window.state) selBab.value = window.state.bab || 1;
    if (selTahun && window.state) selTahun.value = window.state.tahun || 2025;

    // Populate Kecamatan
    if (selKec && window.MASTER_KECAMATAN) {
      selKec.innerHTML = '';
      const sorted = [...window.MASTER_KECAMATAN].sort((a, b) => a.nama.localeCompare(b.nama));
      sorted.forEach((k) => {
        const opt = document.createElement('option');
        opt.value = k.kode;
        opt.textContent = `${k.nama} (${k.kode})`;
        selKec.appendChild(opt);
      });
      if (window.state && window.state.selectedKecamatan && window.state.selectedKecamatan !== 'ALL') {
        selKec.value = window.state.selectedKecamatan;
      } else {
        selKec.value = sorted[0].kode;
      }
    }

    window.updateEditorSubTopicsUI();
    window.populateEditorFieldValues();

    // Tampilkan modal dengan animasi
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');

    const card = modal.querySelector('.modal-card');
    if (card) {
      card.classList.remove('scale-95');
      card.classList.add('scale-100');
    }

    if (window.lucide) window.lucide.createIcons();
  };

  // Tutup Modal Form Edit Data
  window.closeAdminEditorModal = function () {
    const modal = document.getElementById('adminEditorModal');
    if (!modal) return;

    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');

    const card = modal.querySelector('.modal-card');
    if (card) {
      card.classList.remove('scale-100');
      card.classList.add('scale-95');
    }

    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  };

  // Perbarui UI Sub-Topik (jika bab memiliki sub-topik)
  window.updateEditorSubTopicsUI = function () {
    const selBab = document.getElementById('editorBabSelect');
    const subContainer = document.getElementById('editorSubTopicContainer');
    const selSub = document.getElementById('editorSubTopicSelect');

    if (!selBab || !subContainer || !selSub) return;

    const babId = parseInt(selBab.value, 10);
    const schema = BAB_EDITOR_SCHEMAS[babId];

    if (schema && schema.subTopics && schema.subTopics.length > 0) {
      selSub.innerHTML = '';
      schema.subTopics.forEach((st) => {
        const opt = document.createElement('option');
        opt.value = st.id;
        opt.textContent = st.label;
        selSub.appendChild(opt);
      });
      if (window.state && window.state.bab === babId && window.state.subTopic) {
        selSub.value = window.state.subTopic;
      }
      subContainer.classList.remove('hidden');
    } else {
      subContainer.classList.add('hidden');
    }
  };

  // Isi form input dengan nilai saat ini dari window.KCDA_DATA
  window.populateEditorFieldValues = function () {
    const selBab = document.getElementById('editorBabSelect');
    const selSub = document.getElementById('editorSubTopicSelect');
    const selTahun = document.getElementById('editorTahunSelect');
    const selKec = document.getElementById('editorKecamatanSelect');
    const fieldsContainer = document.getElementById('editorFieldsContainer');

    if (!selBab || !selTahun || !selKec || !fieldsContainer) return;

    const babId = parseInt(selBab.value, 10);
    const subTopicId = selSub ? selSub.value : null;
    const tahun = parseInt(selTahun.value, 10);
    const kodeKec = selKec.value;

    const schema = BAB_EDITOR_SCHEMAS[babId];
    if (!schema) return;

    const fields = getActiveFields(babId, subTopicId);

    // Cari record data saat ini di window.KCDA_DATA
    let currentRecord = null;
    if (window.KCDA_DATA) {
      let arrayName = '';
      if (babId === 1) arrayName = 'geografi';
      else if (babId === 2) arrayName = 'pemerintahan';
      else if (babId === 3) arrayName = 'penduduk';
      else if (babId === 4) arrayName = subTopicId === 'listrik' ? 'listrik' : 'sekolah';
      else if (babId === 5) arrayName = 'pertanian';
      else if (babId === 6) arrayName = subTopicId === 'sinyal' ? 'sinyal' : 'menara';
      else if (babId === 7) arrayName = subTopicId === 'perdagangan' ? 'perdagangan' : 'bank';

      if (window.KCDA_DATA[arrayName]) {
        currentRecord = window.KCDA_DATA[arrayName].find(
          (r) => r.kodeKecamatan === kodeKec && r.tahun === tahun
        );
      }
    }

    fieldsContainer.innerHTML = '';

    fields.forEach((f) => {
      const curVal = currentRecord && currentRecord[f.key] !== undefined && currentRecord[f.key] !== null
        ? currentRecord[f.key]
        : '';

      const colDiv = document.createElement('div');
      colDiv.className = 'bg-slate-50 p-3 rounded-xl border border-slate-200/80 hover:border-amber-300 transition-colors';
      colDiv.innerHTML = `
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-bold text-slate-800">${f.label}</label>
          <span class="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">${f.unit}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex-1 relative">
            <input type="number" 
              id="field_${f.key}" 
              data-key="${f.key}" 
              step="${f.step || '1'}" 
              min="${f.min !== undefined ? f.min : ''}" 
              max="${f.max !== undefined ? f.max : ''}" 
              value="${curVal}" 
              placeholder="Masukkan nilai baru..." 
              required
              class="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 tabular-nums" />
          </div>
          <div class="text-[11px] text-slate-500 shrink-0 font-medium text-right min-w-[70px]">
            <span class="text-[10px] block text-slate-400">Saat ini:</span>
            <span class="font-bold tabular-nums text-slate-700">${curVal !== '' ? curVal : '—'}</span>
          </div>
        </div>
      `;
      fieldsContainer.appendChild(colDiv);
    });

    if (window.lucide) window.lucide.createIcons();
  };

  // Submit Form Pengeditan Data ke Google Apps Script Web App
  window.submitAdminDataUpdate = async function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const selBab = document.getElementById('editorBabSelect');
    const selSub = document.getElementById('editorSubTopicSelect');
    const selTahun = document.getElementById('editorTahunSelect');
    const selKec = document.getElementById('editorKecamatanSelect');
    const submitBtn = document.getElementById('btnEditorSubmit');
    const errorBox = document.getElementById('editorErrorBox');

    if (!selBab || !selTahun || !selKec) return;

    const babId = parseInt(selBab.value, 10);
    const subTopicId = selSub ? selSub.value : null;
    const tahun = parseInt(selTahun.value, 10);
    const kodeKec = selKec.value;
    const kecObj = window.MASTER_KECAMATAN ? window.MASTER_KECAMATAN.find((k) => k.kode === kodeKec) : null;
    const namaKec = kecObj ? kecObj.nama : kodeKec;

    const schema = BAB_EDITOR_SCHEMAS[babId];
    if (!schema) return;

    const fields = getActiveFields(babId, subTopicId);
    const updates = {};
    let hasEmpty = false;

    fields.forEach((f) => {
      const input = document.getElementById(`field_${f.key}`);
      if (input) {
        const valStr = input.value.trim();
        if (valStr === '') {
          hasEmpty = true;
        } else {
          updates[f.key] = parseFloat(valStr);
        }
      }
    });

    if (hasEmpty) {
      if (errorBox) {
        errorBox.textContent = 'Harap isi semua kolom nilai sebelum menyimpan!';
        errorBox.classList.remove('hidden');
      }
      return;
    }

    if (errorBox) errorBox.classList.add('hidden');

    // UI Loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
        <span>Menyimpan ke Google Sheets...</span>
      `;
    }

    const payload = {
      action: 'update_data',
      secretKey: ADMIN_SECRET_KEY,
      babId: babId,
      subTopic: subTopicId,
      tabName: schema.tabName,
      tahun: tahun,
      kodeKecamatan: kodeKec,
      namaKecamatan: namaKec,
      updates: updates
    };

    try {
      // Kirim ke Google Apps Script Web App
      await fetch(SPREADSHEET_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      // Perbarui memori lokal KCDA_DATA seketika
      updateLocalDataMemory(babId, subTopicId, tahun, kodeKec, namaKec, updates);

      // Simpan ke localStorage agar tidak hilang saat reload
      try {
        localStorage.setItem('KCDA_SHEETS_CACHE_V3', JSON.stringify(window.KCDA_DATA));
      } catch (e) {}

      // Re-render dashboard seketika
      if (typeof window.renderApp === 'function') {
        window.renderApp();
      }

      window.closeAdminEditorModal();

      if (typeof window.showToast === 'function') {
        window.showToast(`Data Kecamatan ${namaKec} (${tahun}) berhasil disimpan ke Google Spreadsheet!`);
      }
    } catch (err) {
      console.error('Gagal mengirim pembaruan data ke Google Sheets:', err);
      if (errorBox) {
        errorBox.textContent = 'Gagal menyimpan ke Google Spreadsheet. Silakan coba lagi.';
        errorBox.classList.remove('hidden');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <i data-lucide="save" class="w-3.5 h-3.5"></i>
          <span>Simpan ke Google Spreadsheet</span>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  };

  // Helper memperbarui data di memori aplikasi secara langsung
  function updateLocalDataMemory(babId, subTopicId, tahun, kodeKec, namaKec, updates) {
    if (!window.KCDA_DATA) return;

    let arrayName = '';
    if (babId === 1) arrayName = 'geografi';
    else if (babId === 2) arrayName = 'pemerintahan';
    else if (babId === 3) arrayName = 'penduduk';
    else if (babId === 4) arrayName = subTopicId === 'listrik' ? 'listrik' : 'sekolah';
    else if (babId === 5) arrayName = 'pertanian';
    else if (babId === 6) arrayName = subTopicId === 'sinyal' ? 'sinyal' : 'menara';
    else if (babId === 7) arrayName = subTopicId === 'perdagangan' ? 'perdagangan' : 'bank';

    if (!window.KCDA_DATA[arrayName]) return;

    let record = window.KCDA_DATA[arrayName].find(
      (r) => r.kodeKecamatan === kodeKec && r.tahun === tahun
    );

    if (record) {
      Object.keys(updates).forEach((k) => {
        record[k] = updates[k];
      });
    } else {
      const newRec = { tahun, kodeKecamatan: kodeKec, namaKecamatan: namaKec, ...updates };
      window.KCDA_DATA[arrayName].push(newRec);
    }
  }

  // Pasang event listener saat DOM siap
  document.addEventListener('DOMContentLoaded', () => {
    const selBab = document.getElementById('editorBabSelect');
    const selSub = document.getElementById('editorSubTopicSelect');
    const selTahun = document.getElementById('editorTahunSelect');
    const selKec = document.getElementById('editorKecamatanSelect');

    if (selBab) {
      selBab.addEventListener('change', () => {
        window.updateEditorSubTopicsUI();
        window.populateEditorFieldValues();
      });
    }
    if (selSub) {
      selSub.addEventListener('change', () => {
        window.populateEditorFieldValues();
      });
    }
    if (selTahun) {
      selTahun.addEventListener('change', () => {
        window.populateEditorFieldValues();
      });
    }
    if (selKec) {
      selKec.addEventListener('change', () => {
        window.populateEditorFieldValues();
      });
    }
  });
})();
