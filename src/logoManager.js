// ===================================================================
// Dashboard Kecamatan Dalam Angka Kabupaten Banjarnegara
// Dynamic Logo & Banner Manager Module
// ===================================================================

(function () {
  const LOGOS_STORAGE_KEY = 'KCDA_HEADER_LOGOS';

  const DEFAULT_LOGOS = [
    {
      id: 'bps',
      title: 'Badan Pusat Statistik',
      src: 'src/assets/logo-bps.png',
      enabled: true,
      heightClass: 'h-7 sm:h-8 md:h-9 lg:h-10',
      responsiveClass: '',
      isDefault: true
    },
    {
      id: 'berakhlak',
      title: 'Core Values ASN BerAKHLAK',
      src: 'src/assets/logo-berakhlak.png',
      enabled: true,
      heightClass: 'h-6 sm:h-7 md:h-8',
      responsiveClass: 'hidden sm:block',
      isDefault: true
    },
    {
      id: 'sensus_ekonomi',
      title: 'Menyongsong Sensus Ekonomi 2026',
      src: 'src/assets/logo-sensus-ekonomi.webp',
      enabled: true,
      heightClass: 'h-7 sm:h-8 md:h-9 lg:h-10',
      responsiveClass: 'hidden sm:block',
      isDefault: true
    }
  ];

  // Ambil daftar logo (dari localStorage atau default)
  window.getHeaderLogos = function () {
    try {
      const stored = localStorage.getItem(LOGOS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Gagal membaca storage logo:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_LOGOS));
  };

  // Simpan daftar logo ke localStorage dan render ulang
  function saveLogos(logos) {
    try {
      localStorage.setItem(LOGOS_STORAGE_KEY, JSON.stringify(logos));
    } catch (e) {
      console.error('Gagal menyimpan logo ke storage:', e);
      if (typeof window.showToast === 'function') {
        window.showToast('Gagal menyimpan logo: Kapasitas memori penuh.');
      }
    }
    window.renderHeaderLogos();
    window.renderLogoManagerUI();
  }

  // Render logo ke barisan header dashboard
  window.renderHeaderLogos = function () {
    const container = document.getElementById('headerLogosContainer');
    if (!container) return;

    const logos = window.getHeaderLogos();
    const enabledLogos = logos.filter((l) => l.enabled);

    if (enabledLogos.length === 0) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');

    let html = '';
    enabledLogos.forEach((logo, idx) => {
      if (idx > 0) {
        html += `<div class="hidden sm:block h-6 sm:h-7 w-px bg-slate-200 shrink-0"></div>`;
      }
      const hClass = logo.heightClass || 'h-7 sm:h-8 md:h-9 lg:h-10';
      const rClass = logo.responsiveClass !== undefined ? logo.responsiveClass : '';
      html += `
        <img src="${logo.src}" alt="${logo.title}" 
          class="${hClass} ${rClass} w-auto object-contain shrink-0 transition-transform duration-200 hover:scale-105" 
          title="${logo.title}" />
      `;
    });

    container.innerHTML = html;
  };

  // Toggle status aktif/nonaktif logo
  window.toggleHeaderLogo = function (id) {
    const logos = window.getHeaderLogos();
    const target = logos.find((l) => l.id === id);
    if (!target) return;

    target.enabled = !target.enabled;
    saveLogos(logos);

    if (typeof window.showToast === 'function') {
      window.showToast(`Logo "${target.title}" ${target.enabled ? 'ditampilkan' : 'disembunyikan'}.`);
    }
  };

  // Hapus logo kustom atau sembunyikan permanen
  window.deleteHeaderLogo = function (id) {
    let logos = window.getHeaderLogos();
    const target = logos.find((l) => l.id === id);
    if (!target) return;

    if (!confirm(`Hapus logo "${target.title}" dari daftar?`)) return;

    logos = logos.filter((l) => l.id !== id);
    saveLogos(logos);

    if (typeof window.showToast === 'function') {
      window.showToast(`Logo "${target.title}" berhasil dihapus.`);
    }
  };

  // Reset logo ke default bawaan
  window.resetLogosToDefault = function () {
    if (!confirm('Kembalikan logo header ke setelan awal default (Logo BPS, BerAKHLAK, Sensus Ekonomi)?')) return;
    localStorage.removeItem(LOGOS_STORAGE_KEY);
    window.renderHeaderLogos();
    window.renderLogoManagerUI();
    if (typeof window.showToast === 'function') {
      window.showToast('Logo header telah di-reset ke setelan awal default.');
    }
  };

  // Kompresi gambar via canvas agar ukuran Base64 sangat hemat (max 150px)
  function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 160;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/png');
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Handle submit tambah logo baru
  window.submitAddNewLogo = function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const titleInput = document.getElementById('inputNewLogoTitle');
    const fileInput = document.getElementById('inputNewLogoFile');
    const urlInput = document.getElementById('inputNewLogoUrl');

    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) {
      alert('Harap masukkan nama / judul logo!');
      return;
    }

    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    const url = urlInput ? urlInput.value.trim() : '';

    if (!file && !url) {
      alert('Pilih file gambar dari komputer/HP atau masukkan tautan URL gambar!');
      return;
    }

    const saveNewLogoData = (src) => {
      const logos = window.getHeaderLogos();
      const newId = 'logo_' + Date.now();
      logos.push({
        id: newId,
        title: title,
        src: src,
        enabled: true,
        heightClass: 'h-7 sm:h-8 md:h-9 lg:h-10',
        responsiveClass: 'hidden sm:block',
        isDefault: false
      });

      saveLogos(logos);

      if (titleInput) titleInput.value = '';
      if (fileInput) fileInput.value = '';
      if (urlInput) urlInput.value = '';
      const preview = document.getElementById('previewNewLogoImage');
      if (preview) preview.classList.add('hidden');

      if (typeof window.showToast === 'function') {
        window.showToast(`Logo "${title}" berhasil ditambahkan ke header!`);
      }
    };

    if (file) {
      compressImage(file, (dataUrl) => {
        saveNewLogoData(dataUrl);
      });
    } else {
      saveNewLogoData(url);
    }
  };

  // Preview gambar saat dipilih di input file
  window.handleLogoFileSelect = function (e) {
    const file = e.target.files ? e.target.files[0] : null;
    const preview = document.getElementById('previewNewLogoImage');
    const imgEl = document.getElementById('previewNewLogoImgTag');

    if (!file || !preview || !imgEl) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      imgEl.src = evt.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  };

  // Render daftar logo di tab Kelola Logo modal
  window.renderLogoManagerUI = function () {
    const container = document.getElementById('logoItemsManagerContainer');
    if (!container) return;

    const logos = window.getHeaderLogos();
    let html = '';

    logos.forEach((logo) => {
      html += `
        <div class="flex items-center justify-between p-3 rounded-2xl border ${
          logo.enabled ? 'bg-amber-50/50 border-amber-300/80 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'
        } transition-all">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Thumbnail -->
            <div class="w-12 h-10 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
              <img src="${logo.src}" alt="${logo.title}" class="max-h-full max-w-full object-contain" />
            </div>

            <!-- Info -->
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <h5 class="text-xs font-bold text-slate-850 truncate text-slate-800">${logo.title}</h5>
                <span class="px-1.5 py-0.2 text-[9px] font-semibold ${
                  logo.isDefault ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-800'
                } rounded-md shrink-0">
                  ${logo.isDefault ? 'Default' : 'Kustom'}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5">${
                logo.enabled ? '✓ Ditampilkan di header' : '✕ Disembunyikan dari header'
              }</p>
            </div>
          </div>

          <!-- Controls (Toggle Switch & Delete) -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Switch Button -->
            <button type="button" onclick="window.toggleHeaderLogo('${logo.id}')"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                logo.enabled ? 'bg-emerald-500' : 'bg-slate-300'
              }" title="${logo.enabled ? 'Klik untuk sembunyikan' : 'Klik untuk tampilkan'}">
              <span class="sr-only">Toggle</span>
              <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                logo.enabled ? 'translate-x-4' : 'translate-x-0'
              }"></span>
            </button>

            <!-- Delete Button (untuk non-default) -->
            ${
              !logo.isDefault
                ? `<button type="button" onclick="window.deleteHeaderLogo('${logo.id}')" 
                    class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus logo ini">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>`
                : ''
            }
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  };

  // Salin kode array konfig logo untuk keperluan backup
  window.copyLogoConfigCode = function () {
    const logos = window.getHeaderLogos();
    const snippet = `const DEFAULT_LOGOS = ${JSON.stringify(logos, null, 2)};`;
    navigator.clipboard.writeText(snippet).then(() => {
      alert('Kode konfigurasi logo berhasil disalin ke clipboard!');
    });
  };

  // Inisialisasi render saat halaman dimuat
  document.addEventListener('DOMContentLoaded', () => {
    window.renderHeaderLogos();
  });
})();
