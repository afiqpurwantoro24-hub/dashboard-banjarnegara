// ===================================================================
// Dashboard Kecamatan Dalam Angka Kabupaten Banjarnegara
// Admin Authentication Module (Google Sheets Sync Protection)
// ===================================================================

(function () {
  // Kredensial Default Admin BPS:
  // Username: admin
  // Password Default: adminbps2026
  // Password disimpan dalam bentuk Hash SHA-256 agar tidak terbaca dalam kode sumber
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD_HASH = '4b30c22d3b224bdade814284b9b4f289fac859e4acf726037c3c50bcc48227a3'; // SHA-256 dari "adminbps2026"

  const AUTH_STORAGE_KEY = 'KCDA_ADMIN_AUTHENTICATED';

  // Helper fungsi SHA-256 bawaan peramban (Web Crypto API)
  async function computeSHA256(text) {
    const buffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Cek apakah Admin sedang login dalam sesi browser saat ini
  window.isAdminAuthenticated = function () {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  };

  // Handler klik tombol Sync di header
  window.handleSyncClick = function () {
    if (window.isAdminAuthenticated()) {
      if (typeof window.syncWithGoogleSheets === 'function') {
        window.syncWithGoogleSheets(true);
      }
    } else {
      window.openAdminAuthModal();
    }
  };

  // Buka Modal Login Admin
  window.openAdminAuthModal = function () {
    const modal = document.getElementById('adminAuthModal');
    const errorBox = document.getElementById('adminAuthError');
    const userInput = document.getElementById('adminUsernameInput');
    const passInput = document.getElementById('adminPasswordInput');

    if (!modal) return;

    if (errorBox) errorBox.classList.add('hidden');
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';

    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');

    const card = modal.querySelector('div');
    if (card) {
      card.classList.remove('scale-95');
      card.classList.add('scale-100');
    }

    if (userInput) {
      setTimeout(() => userInput.focus(), 150);
    }
    if (window.lucide) window.lucide.createIcons();
  };

  // Tutup Modal Login Admin
  window.closeAdminAuthModal = function () {
    const modal = document.getElementById('adminAuthModal');
    if (!modal) return;

    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');

    const card = modal.querySelector('div');
    if (card) {
      card.classList.remove('scale-100');
      card.classList.add('scale-95');
    }

    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  };

  // Toggle lihat password (ikon mata)
  window.toggleAdminPasswordVisibility = function () {
    const passInput = document.getElementById('adminPasswordInput');
    const eyeIcon = document.getElementById('adminPasswordEyeIcon');
    if (!passInput || !eyeIcon) return;

    if (passInput.type === 'password') {
      passInput.type = 'text';
      eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      passInput.type = 'password';
      eyeIcon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) window.lucide.createIcons();
  };

  // Submit Form Login Admin
  window.submitAdminAuth = async function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const userInput = document.getElementById('adminUsernameInput');
    const passInput = document.getElementById('adminPasswordInput');
    const errorBox = document.getElementById('adminAuthError');
    const submitBtn = document.getElementById('btnAdminSubmit');

    const username = userInput ? userInput.value.trim() : '';
    const password = passInput ? passInput.value : '';

    if (!username || !password) {
      if (errorBox) {
        errorBox.textContent = 'Harap isi username dan password!';
        errorBox.classList.remove('hidden');
      }
      return;
    }

    // Set status tombol loading
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
        <span>Memeriksa...</span>
      `;
    }

    try {
      const inputHash = await computeSHA256(password);

      if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && inputHash === ADMIN_PASSWORD_HASH) {
        // Berhasil login
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        window.updateAdminUI();
        window.closeAdminAuthModal();

        if (typeof window.showToast === 'function') {
          window.showToast('Login Admin Berhasil!');
        }

        // Jika ada aksi tertunda (misal buka form edit data)
        if (window._adminPendingAction === 'open_editor') {
          window._adminPendingAction = null;
          setTimeout(() => {
            if (typeof window.openAdminEditorModal === 'function') {
              window.openAdminEditorModal();
            }
          }, 250);
        } else if (typeof window.syncWithGoogleSheets === 'function') {
          setTimeout(() => {
            window.syncWithGoogleSheets(true);
          }, 300);
        }
      } else {
        // Gagal login
        if (errorBox) {
          errorBox.innerHTML = `
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
            <span>Username atau Password salah!</span>
          `;
          errorBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
        if (passInput) {
          passInput.value = '';
          passInput.focus();
        }
      }
    } catch (err) {
      console.error('Error saat verifikasi password admin:', err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
          <span>Masuk & Sync</span>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  };

  // Keluar dari mode Admin (Logout)
  window.adminLogout = function () {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.updateAdminUI();
    if (typeof window.showToast === 'function') {
      window.showToast('Berhasil keluar dari Mode Admin.');
    }
  };

  // Perbarui tampilan status Admin pada antarmuka (Header Sync Button)
  window.updateAdminUI = function () {
    const isAuth = window.isAdminAuthenticated();
    const btnSync = document.getElementById('sheetsSyncIndicator');
    const lockIcon = document.getElementById('syncLockIcon');
    const syncDot = document.getElementById('syncDot');
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');
    const btnLogout = document.getElementById('btnAdminLogout');

    if (!btnSync) return;

    if (isAuth) {
      // Mode Admin Aktif
      btnSync.title = 'Mode Admin Aktif. Klik untuk menyinkronkan data dari Google Spreadsheet.';
      btnSync.className =
        'flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all bg-emerald-50/95 border-emerald-400 text-emerald-900 hover:bg-emerald-100 shadow-sm ring-1 ring-emerald-400/40';

      if (lockIcon) lockIcon.classList.add('hidden');
      if (syncDot) syncDot.classList.remove('hidden');
      if (syncIcon) syncIcon.classList.remove('hidden');
      if (syncText) syncText.textContent = 'Update Data (Live)';

      if (btnLogout) {
        btnLogout.classList.remove('hidden');
        btnLogout.classList.add('flex');
      }
    } else {
      // Mode Pengunjung Terkunci
      btnSync.title = 'Hanya Admin: Masukkan username & password untuk memperbarui data Google Spreadsheet.';
      btnSync.className =
        'flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all bg-white/95 border-amber-200 text-[#0F172A] hover:bg-amber-100 shadow-sm';

      if (lockIcon) lockIcon.classList.remove('hidden');
      if (syncDot) syncDot.classList.add('hidden');
      if (syncIcon) syncIcon.classList.add('hidden');
      if (syncText) syncText.textContent = 'Update Data';

      if (btnLogout) {
        btnLogout.classList.add('hidden');
        btnLogout.classList.remove('flex');
      }
    }

    const btnEdit = document.getElementById('btnHeaderEditData');
    if (btnEdit) {
      if (isAuth) {
        btnEdit.className =
          'flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all bg-amber-100/90 border-amber-400 text-amber-950 hover:bg-amber-200 shadow-sm ring-1 ring-amber-400/40';
        btnEdit.title = 'Edit Data Indikator ke Google Spreadsheet (Admin Aktif)';
      } else {
        btnEdit.className =
          'flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all bg-white/95 border-amber-200 text-[#0F172A] hover:bg-amber-100 shadow-sm';
        btnEdit.title = 'Edit Data Indikator ke Google Spreadsheet (Perlu Login Admin)';
      }
    }

    if (window.lucide) window.lucide.createIcons();
  };

  // Pasang keyboard shortcut Escape untuk menutup modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeAdminAuthModal();
    }
  });

  // Inisialisasi status UI saat DOM siap
  document.addEventListener('DOMContentLoaded', () => {
    window.updateAdminUI();
  });
})();
