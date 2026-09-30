// ===================================================================
// Dashboard Kecamatan Dalam Angka Kabupaten Banjarnegara
// Admin Authentication Module (Google Sheets Sync Protection & Account Management)
// ===================================================================

(function () {
  // ===================================================================
  // 1. DAFTAR AKUN ADMIN BAWAAN (DEFAULT)
  // Untuk menambah akun admin baru atau mengganti password secara permanen di kode,
  // Anda cukup menambah/mengedit baris pada DEFAULT_ADMIN_ACCOUNTS di bawah ini.
  // Password disimpan dalam bentuk SHA-256 Hash demi keamanan.
  // Gunakan fungsi: window.generateAdminHash("passwordBaru") di console untuk membuat hash.
  // ===================================================================
  const DEFAULT_ADMIN_ACCOUNTS = [
    {
      username: 'admin',
      name: 'Administrator Utama (BPS)',
      // SHA-256 dari password default: "adminbps2026"
      passwordHash: '4b30c22d3b224bdade814284b9b4f289fac859e4acf726037c3c50bcc48227a3',
      isDefault: true
    }
  ];

  const AUTH_STORAGE_KEY = 'KCDA_ADMIN_AUTHENTICATED';
  const CURRENT_USER_KEY = 'KCDA_ADMIN_CURRENT_USER';
  const CUSTOM_ACCOUNTS_STORAGE_KEY = 'KCDA_CUSTOM_ADMIN_ACCOUNTS';
  const DELETED_ACCOUNTS_STORAGE_KEY = 'KCDA_DELETED_ADMIN_ACCOUNTS';

  // Helper fungsi SHA-256 bawaan peramban (Web Crypto API)
  async function computeSHA256(text) {
    const buffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Utility global untuk membuat SHA-256 hash (bisa dipanggil via Console F12)
  window.generateAdminHash = async function (plainPassword) {
    if (!plainPassword) {
      console.warn('Gunakan: window.generateAdminHash("kataSandiAnda")');
      return '';
    }
    const hash = await computeSHA256(plainPassword);
    console.log(`%cPassword:%c ${plainPassword}`, 'font-weight:bold;color:#f59e0b', 'color:#0f172a');
    console.log(`%cSHA-256 Hash:%c ${hash}`, 'font-weight:bold;color:#10b981', 'color:#047857;font-family:monospace');
    return hash;
  };

  // Mendapatkan seluruh daftar akun (gabungan default + custom di browser, tanpa yang telah dihapus)
  window.getAdminAccounts = function () {
    let custom = [];
    let deleted = [];
    try {
      const stored = localStorage.getItem(CUSTOM_ACCOUNTS_STORAGE_KEY);
      if (stored) custom = JSON.parse(stored);
      const storedDel = localStorage.getItem(DELETED_ACCOUNTS_STORAGE_KEY);
      if (storedDel) deleted = JSON.parse(storedDel);
    } catch (e) {
      console.warn('Gagal membaca admin accounts storage:', e);
    }

    // Merge: akun custom dapat menimpa (override) password akun default berdasarkan username
    const map = new Map();
    DEFAULT_ADMIN_ACCOUNTS.forEach((acc) => {
      map.set(acc.username.toLowerCase(), { ...acc });
    });
    custom.forEach((acc) => {
      map.set(acc.username.toLowerCase(), { ...acc });
    });

    // Filter akun yang tidak dihapus
    const active = Array.from(map.values()).filter(
      (acc) => !deleted.includes(acc.username.toLowerCase())
    );

    return active;
  };

  // Menyimpan daftar custom accounts ke localStorage
  function saveCustomAccounts(accounts) {
    try {
      localStorage.setItem(CUSTOM_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Gagal menyimpan custom accounts:', e);
    }
  }

  // Cek apakah Admin sedang login dalam sesi browser saat ini
  window.isAdminAuthenticated = function () {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  };

  // Mendapatkan info admin yang sedang aktif
  window.getCurrentAdmin = function () {
    const username = sessionStorage.getItem(CURRENT_USER_KEY) || 'admin';
    const accounts = window.getAdminAccounts();
    return accounts.find((a) => a.username.toLowerCase() === username.toLowerCase()) || {
      username: username,
      name: 'Administrator'
    };
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
  window.toggleAdminPasswordVisibility = function (inputId = 'adminPasswordInput', iconId = 'adminPasswordEyeIcon') {
    const passInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(iconId);
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
      const accounts = window.getAdminAccounts();
      const matched = accounts.find(
        (acc) => acc.username.toLowerCase() === username.toLowerCase() && acc.passwordHash === inputHash
      );

      if (matched) {
        // Berhasil login
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        sessionStorage.setItem(CURRENT_USER_KEY, matched.username);
        window.updateAdminUI();
        window.closeAdminAuthModal();

        if (typeof window.showToast === 'function') {
          window.showToast(`Login berhasil! Selamat datang, ${matched.name || matched.username}`);
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
    sessionStorage.removeItem(CURRENT_USER_KEY);
    window.updateAdminUI();
    if (typeof window.showToast === 'function') {
      window.showToast('Berhasil keluar dari Mode Admin.');
    }
  };

  // ===================================================================
  // MODAL KELOLA AKUN & GANTI PASSWORD
  // ===================================================================

  window.openAdminManageModal = function () {
    if (!window.isAdminAuthenticated()) {
      window.openAdminAuthModal();
      return;
    }

    const modal = document.getElementById('adminManageModal');
    if (!modal) return;

    window.refreshAdminAccountsList();

    // Reset input form
    const currentAdmin = window.getCurrentAdmin();
    const curUserLabel = document.getElementById('manageCurrentUsername');
    if (curUserLabel) curUserLabel.textContent = `${currentAdmin.username} (${currentAdmin.name || 'Admin'})`;

    const changePassForm = document.getElementById('formChangePassword');
    if (changePassForm) changePassForm.reset();

    const addAdminForm = document.getElementById('formAddAdmin');
    if (addAdminForm) addAdminForm.reset();

    const msgBox = document.getElementById('manageAccountsMessage');
    if (msgBox) msgBox.classList.add('hidden');

    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');

    const card = modal.querySelector('div');
    if (card) {
      card.classList.remove('scale-95');
      card.classList.add('scale-100');
    }

    if (window.lucide) window.lucide.createIcons();
  };

  window.closeAdminManageModal = function () {
    const modal = document.getElementById('adminManageModal');
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

  // Render daftar akun admin di modal
  // Render daftar akun admin di modal
  window.refreshAdminAccountsList = function () {
    const container = document.getElementById('adminAccountsListContainer');
    if (!container) return;

    const accounts = window.getAdminAccounts();
    const curUser = sessionStorage.getItem(CURRENT_USER_KEY) || 'admin';

    let html = '';
    accounts.forEach((acc) => {
      const isCur = acc.username.toLowerCase() === curUser.toLowerCase();
      html += `
        <div class="flex items-center justify-between p-2.5 rounded-xl border ${
          isCur ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
        } text-xs">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg ${isCur ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-slate-800">${acc.username}</span>
                ${
                  isCur
                    ? '<span class="px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-200 text-amber-900 rounded-md">Sedang Aktif</span>'
                    : ''
                }
              </div>
              <span class="text-[11px] text-slate-500">${acc.name || 'Admin'}</span>
            </div>
          </div>
          ${
            !isCur
              ? `<button type="button" onclick="window.deleteAdminAccount('${acc.username}')" class="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors border border-rose-200" title="Hapus akun admin ${acc.username}">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  <span class="text-[10px] font-bold">Hapus</span>
                </button>`
              : '<span class="text-[10px] text-amber-800 font-bold italic px-2 py-1">Akun Anda</span>'
          }
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  };

  // Submit Ubah Sandi
  window.submitChangePassword = async function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const newPass = document.getElementById('inputNewAdminPassword').value;
    const confirmPass = document.getElementById('inputConfirmAdminPassword').value;
    const msgBox = document.getElementById('manageAccountsMessage');

    if (!newPass || newPass.length < 6) {
      showManageMessage('Password baru minimal 6 karakter!', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      showManageMessage('Konfirmasi password baru tidak cocok!', 'error');
      return;
    }

    const currentAdmin = window.getCurrentAdmin();
    const newHash = await computeSHA256(newPass);

    // Dapatkan custom accounts
    let custom = [];
    try {
      const stored = localStorage.getItem(CUSTOM_ACCOUNTS_STORAGE_KEY);
      if (stored) custom = JSON.parse(stored);
    } catch (err) {}

    // Cari apakah sudah ada di custom
    const idx = custom.findIndex((a) => a.username.toLowerCase() === currentAdmin.username.toLowerCase());
    if (idx >= 0) {
      custom[idx].passwordHash = newHash;
    } else {
      custom.push({
        username: currentAdmin.username,
        name: currentAdmin.name,
        passwordHash: newHash,
        isDefault: false
      });
    }

    saveCustomAccounts(custom);
    document.getElementById('formChangePassword').reset();
    showManageMessage(`Password untuk akun "${currentAdmin.username}" berhasil diubah!`, 'success');
    window.refreshAdminAccountsList();
  };

  // Submit Tambah Akun Admin Baru
  window.submitAddNewAdmin = async function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const username = document.getElementById('inputNewAdminUsername').value.trim();
    const name = document.getElementById('inputNewAdminName').value.trim() || 'Admin';
    const pass = document.getElementById('inputNewAdminPass').value;

    if (!username || username.length < 3) {
      showManageMessage('Username minimal 3 karakter tanpa spasi!', 'error');
      return;
    }
    if (!pass || pass.length < 6) {
      showManageMessage('Password minimal 6 karakter!', 'error');
      return;
    }

    const existing = window.getAdminAccounts();
    if (existing.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
      showManageMessage(`Username "${username}" sudah digunakan! Gunakan username lain.`, 'error');
      return;
    }

    const hash = await computeSHA256(pass);

    let custom = [];
    let deleted = [];
    try {
      const stored = localStorage.getItem(CUSTOM_ACCOUNTS_STORAGE_KEY);
      if (stored) custom = JSON.parse(stored);
      const storedDel = localStorage.getItem(DELETED_ACCOUNTS_STORAGE_KEY);
      if (storedDel) deleted = JSON.parse(storedDel);
    } catch (err) {}

    // Hapus dari daftar deleted jika sebelumnya pernah dihapus
    if (deleted.includes(username.toLowerCase())) {
      deleted = deleted.filter((u) => u !== username.toLowerCase());
      try {
        localStorage.setItem(DELETED_ACCOUNTS_STORAGE_KEY, JSON.stringify(deleted));
      } catch (e) {}
    }

    // Tambah / Update di custom
    const cIdx = custom.findIndex((a) => a.username.toLowerCase() === username.toLowerCase());
    if (cIdx >= 0) {
      custom[cIdx] = { username, name, passwordHash: hash, isDefault: false };
    } else {
      custom.push({
        username: username,
        name: name,
        passwordHash: hash,
        isDefault: false
      });
    }

    saveCustomAccounts(custom);
    document.getElementById('formAddAdmin').reset();
    showManageMessage(`Akun admin baru "${username}" berhasil ditambahkan!`, 'success');
    window.refreshAdminAccountsList();
  };

  // Hapus akun admin (bisa menghapus admin manapun yang tidak sedang aktif)
  window.deleteAdminAccount = function (username) {
    const curUser = sessionStorage.getItem(CURRENT_USER_KEY) || 'admin';
    if (username.toLowerCase() === curUser.toLowerCase()) {
      showManageMessage('Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini!', 'error');
      return;
    }

    const accounts = window.getAdminAccounts();
    if (accounts.length <= 1) {
      showManageMessage('Harus menyisakan minimal 1 akun admin aktif!', 'error');
      return;
    }

    if (!confirm(`Hapus akun admin "${username}"? Akun ini tidak akan dapat login lagi.`)) return;

    let custom = [];
    let deleted = [];
    try {
      const stored = localStorage.getItem(CUSTOM_ACCOUNTS_STORAGE_KEY);
      if (stored) custom = JSON.parse(stored);
      const storedDel = localStorage.getItem(DELETED_ACCOUNTS_STORAGE_KEY);
      if (storedDel) deleted = JSON.parse(storedDel);
    } catch (err) {}

    // Hapus dari custom accounts jika ada
    custom = custom.filter((a) => a.username.toLowerCase() !== username.toLowerCase());
    saveCustomAccounts(custom);

    // Tandai sebagai deleted agar akun bawaan pun dinonaktifkan
    if (!deleted.includes(username.toLowerCase())) {
      deleted.push(username.toLowerCase());
      try {
        localStorage.setItem(DELETED_ACCOUNTS_STORAGE_KEY, JSON.stringify(deleted));
      } catch (e) {}
    }

    showManageMessage(`Akun admin "${username}" telah berhasil dihapus.`, 'info');
    window.refreshAdminAccountsList();
  };

  // Reset semua akun kembali ke bawaan
  window.resetAllAdminAccountsToDefault = function () {
    if (!confirm('Kembalikan semua akun admin dan password ke setelan awal pabrik (default)?')) return;
    localStorage.removeItem(CUSTOM_ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(DELETED_ACCOUNTS_STORAGE_KEY);
    showManageMessage('Semua akun telah di-reset ke setelan awal default.', 'info');
    window.refreshAdminAccountsList();
  };

  // Salin template kode untuk disimpan permanen di src/adminAuth.js
  window.copyAdminConfigCode = function () {
    const accounts = window.getAdminAccounts();
    const formatted = JSON.stringify(accounts, null, 2);
    const codeSnippet = `const DEFAULT_ADMIN_ACCOUNTS = ${formatted};`;

    navigator.clipboard.writeText(codeSnippet).then(() => {
      showManageMessage('Kode konfigurasi berhasil disalin ke clipboard! Siap di-paste ke src/adminAuth.js', 'success');
    }).catch(() => {
      prompt('Salin kode ini dan masukkan ke src/adminAuth.js:', codeSnippet);
    });
  };

  function showManageMessage(text, type = 'info') {
    const box = document.getElementById('manageAccountsMessage');
    if (!box) return;

    box.className = 'mb-3 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2';
    if (type === 'error') {
      box.className += ' bg-rose-50 border border-rose-200 text-rose-700';
    } else if (type === 'success') {
      box.className += ' bg-emerald-50 border border-emerald-200 text-emerald-800';
    } else {
      box.className += ' bg-blue-50 border border-blue-200 text-blue-800';
    }

    box.innerHTML = `
      <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle-2' : 'info'}" class="w-4 h-4 shrink-0"></i>
      <span>${text}</span>
    `;
    box.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  // Perbarui tampilan status Admin pada antarmuka (Header Sync Button)
  window.updateAdminUI = function () {
    const isAuth = window.isAdminAuthenticated();
    const btnSync = document.getElementById('sheetsSyncIndicator');
    const lockIcon = document.getElementById('syncLockIcon');
    const syncDot = document.getElementById('syncDot');
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');
    const btnLogout = document.getElementById('btnAdminLogout');
    const btnManage = document.getElementById('btnAdminManageUsers');

    if (!btnSync) return;

    if (isAuth) {
      const curAdmin = window.getCurrentAdmin();
      // Mode Admin Aktif
      btnSync.title = `Admin Aktif: ${curAdmin.name || curAdmin.username}. Klik untuk sinkronisasi data Google Spreadsheet.`;
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
      if (btnManage) {
        btnManage.classList.remove('hidden');
        btnManage.classList.add('flex');
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
      if (btnManage) {
        btnManage.classList.add('hidden');
        btnManage.classList.remove('flex');
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
      window.closeAdminManageModal();
    }
  });

  // Inisialisasi status UI saat DOM siap
  document.addEventListener('DOMContentLoaded', () => {
    window.updateAdminUI();
  });
})();

