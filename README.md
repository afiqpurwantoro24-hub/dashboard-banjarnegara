# Dashboard Kecamatan Dalam Angka (KCDA) Kabupaten Banjarnegara

Transformasi Data Statistik BPS Kabupaten Banjarnegara Menjadi Dashboard Interaktif Berbasis Web (Periode 2021–2025, 20 Kecamatan).

---

## 🌟 Fitur Utama

1. **Header & Filter Global Terpadu**:
   - Filter Tahun (2021 – 2025).
   - Filter Kecamatan (Semua Kecamatan / Profil 1 Kecamatan / Komparasi Multi-Kecamatan hingga 5 wilayah).
   - Indikator Status Data (notifikasi cerdas jika indikator belum diinput pada Google Spreadsheet).
   - Tombol Bagikan Tautan (Shareable URL dengan query params otomatis).
   - Ekspor Data ke format CSV/Excel.
   - Mode Cetak / Unduh Laporan PDF.

2. **Cakupan Lengkap 7 Bab Tematik**:
   - **Bab 1 - Geografi**: Luas Wilayah ($km^2$).
   - **Bab 2 - Pemerintahan**: Jumlah PNS Pemda menurut Jenis Kelamin (Laki-laki & Perempuan).
   - **Bab 3 - Kependudukan**: Jumlah Penduduk menurut Jenis Kelamin.
   - **Bab 4 - Sosial & Kesejahteraan Rakyat**: 
     - Sub-tab 1: Sarana Pendidikan per Jenjang (SD/MI, SMP/MTs, SMA/SMK/MA, Perguruan Tinggi).
     - Sub-tab 2: Keluarga Pengguna Listrik PLN.
   - **Bab 5 - Pertanian**: Total Produksi Tanaman Sayuran dan Buah-buahan Semusim (Kuintal, dengan penyesuaian skala logaritmik).
   - **Bab 6 - Komunikasi**:
     - Sub-tab 1: Jumlah Menara Telekomunikasi.
     - Sub-tab 2: Persentase Desa menurut Kekuatan Sinyal Telepon Seluler.
   - **Bab 7 - Perbankan & Perdagangan**:
     - Sub-tab 1: Lembaga Keuangan Bank (Bank Pemerintah, Bank Swasta, BPR).
     - Sub-tab 2: Sarana Perdagangan (Pertokoan, Pasar, Minimarket, Restoran/Rumah Makan).

3. **Komponen Visualisasi Interaktif**:
   - **Card KPI**: Ringkasan Total/Rata-rata, Nilai Tertinggi, dan Pertumbuhan YoY (%) dari tahun sebelumnya.
   - **Peta Tematik Spasial (Choropleth GIS Map)**: Visualisasi warna gradasi 20 kecamatan, hover tooltip detail (nilai + peringkat), dan fitur klik wilayah untuk filter instan.
   - **Grafik Tren Garis (Line Chart)**: Tren perkembangan indikator 2021–2025 dengan dukungan multi-series overlay saat mode komparasi aktif.
   - **Grafik Batang Komparasi (Bar Chart)**: Peringkat nilai 20 kecamatan (sortable descending/ascending) dengan highlight warna oranye untuk kecamatan yang sedang aktif.
   - **Grafik Komposisi (Doughnut Chart)**: Distribusi kategori dan komposisi sub-indikator.
   - **Tabel Data Interaktif**: Pencarian nama kecamatan real-time, sorting klik judul kolom, dan tombol unduh CSV langsung.

---

## 🚀 Cara Menjalankan

### Cara 1: Buka Langsung di Browser (Tanpa Instalasi)
Cukup buka file `index.html` menggunakan browser apapun (Google Chrome, Microsoft Edge, Mozilla Firefox, dsb.):
```text
E:\Afiq\dashboard-banjarnegara\index.html
```

### Cara 2: Jalankan via Local Web Server
Jika menggunakan Node.js / Python / Live Server:
```bash
# Opsi A: Node npx serve
npx serve E:\Afiq\dashboard-banjarnegara

# Opsi B: Python HTTP Server
python -m http.server 8000 --directory E:\Afiq\dashboard-banjarnegara
```
Kemudian buka browser di `http://localhost:8000` atau `http://localhost:3000`.

---

## 📁 Struktur Berkas

```
dashboard-banjarnegara/
├── index.html                 # Halaman utama aplikasi web dashboard
├── package.json               # Konfigurasi metadata proyek
├── README.md                  # Dokumentasi panduan penggunaan
└── src/
    ├── app.js                 # Logika aplikasi, state reactive, charts & table renderer
    ├── data/
    │   ├── dataset.js         # Dataset siap pakai untuk web browser
    │   ├── kcdaData.json      # Dataset lengkap 7 bab hasil ekstraksi ETL
    │   ├── kcdaData.ts        # TypeScript data model
    │   ├── masterKecamatan.ts # Master data 20 kecamatan
    │   ├── banjarnegaraMapGeo.ts # Path SVG peta spasial 20 kecamatan
    │   └── appData.ts         # TypeScript unified bundle
    └── lib/
        ├── colors.ts          # Skema warna BPS & token desain UI
        ├── types.ts           # Definisi interface TypeScript
        └── dataUtils.ts       # Fungsi kalkulasi statistik, YoY, format angka & export CSV
```
