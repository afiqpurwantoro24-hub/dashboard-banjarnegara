// ===================================================================
// Dashboard Kecamatan Dalam Angka Kabupaten Banjarnegara
// Background Device & Visitor Logger Module
// Data dikirim secara otomatis ke Google Spreadsheet (tanpa tampil di dashboard)
// ===================================================================

(function () {
  // Masukkan URL Google Apps Script Web App di bawah ini setelah dideploy:
  const GOOGLE_SCRIPT_WEBAPP_URL = window.VISITOR_LOG_WEBAPP_URL || '';

  // Mencegah duplikasi log jika pengguna merefresh/berpindah tab dalam sesi yang sama (opsional)
  const LOG_ONCE_PER_SESSION = true;

  function getDeviceDetails() {
    const ua = navigator.userAgent || '';
    let tipe = 'Desktop';
    let os = 'Lainnya';
    let browser = 'Lainnya';

    // 1. Deteksi Tipe Perangkat
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));

    if (isTablet) {
      tipe = 'Tablet';
    } else if (isMobile) {
      tipe = 'Mobile (HP)';
    } else if (window.innerWidth <= 768 && navigator.maxTouchPoints > 0) {
      tipe = 'Mobile (HP)';
    }

    // 2. Deteksi Sistem Operasi (OS)
    if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
    else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
    else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Android/i.test(ua)) {
      const match = ua.match(/Android\s([0-9\.]+)/i);
      os = match ? `Android ${match[1]}` : 'Android';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      const match = ua.match(/OS\s([0-9_]+)/i);
      os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
    } else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/CrOS/i.test(ua)) os = 'Chrome OS';

    // 3. Deteksi Browser
    if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
    else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
    else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
    else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
    else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';

    // 4. Format Waktu WIB
    let waktuWIB = '';
    try {
      waktuWIB = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date());
    } catch (e) {
      waktuWIB = new Date().toLocaleString('id-ID');
    }

    return {
      waktu: waktuWIB + ' WIB',
      tipePerangkat: tipe,
      os: os,
      browser: browser,
      resolusi: `${window.screen.width} x ${window.screen.height}`,
      viewport: `${window.innerWidth} x ${window.innerHeight}`,
      bahasa: navigator.language || navigator.userLanguage || '-',
      koneksi: navigator.connection ? (navigator.connection.effectiveType || '-') : '-',
      referrer: document.referrer ? document.referrer : 'Langsung (Direct / WhatsApp / Bookmark)',
      halaman: window.location.href,
      userAgent: ua
    };
  }

  function sendLog() {
    if (LOG_ONCE_PER_SESSION) {
      if (sessionStorage.getItem('KCDA_VISITOR_LOGGED')) {
        return; // Sudah tercatat dalam sesi ini
      }
    }

    const payload = getDeviceDetails();

    if (!GOOGLE_SCRIPT_WEBAPP_URL || GOOGLE_SCRIPT_WEBAPP_URL.trim() === '') {
      console.log('[Visitor Logger] Siap. URL Web App belum diset. Data log perangkat:', payload);
      return;
    }

    try {
      // Mengirimkan log secara senyap (silent background)
      fetch(GOOGLE_SCRIPT_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors', // Penting untuk bypass CORS Google Apps Script
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      })
        .then(() => {
          if (LOG_ONCE_PER_SESSION) {
            sessionStorage.setItem('KCDA_VISITOR_LOGGED', 'true');
          }
        })
        .catch(() => {
          // Gagal secara senyap, jangan pernah ganggu tampilan pengguna
        });
    } catch (err) {
      // Abaikan error agar dashboard tetap berjalan mulus
    }
  }

  // Jalankan logger 1,5 detik setelah halaman selesai dimuat agar tidak memperlambat render dashboard
  if (document.readyState === 'complete') {
    setTimeout(sendLog, 1500);
  } else {
    window.addEventListener('load', function () {
      setTimeout(sendLog, 1500);
    });
  }

  // Buat fungsi global agar bisa dipanggil / diset secara dinamis
  window.setVisitorLogEndpoint = function (url) {
    window.VISITOR_LOG_WEBAPP_URL = url;
    sendLog();
  };
})();
