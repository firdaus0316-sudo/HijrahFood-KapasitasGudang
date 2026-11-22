# Hijrah Food WMS — Dashboard Lokal & Sinkronisasi Google Sheets

Aplikasi dashboard lokal (berjalan langsung di browser tanpa perlu install server atau database) untuk memantau dan menginput kapasitas **7 Chamber Cold Storage** & **4 Reefer SKBM**, terhubung langsung dengan Google Spreadsheet Anda (`19VtFGdWJTiLpAtILp7zcELe6LzWgw1zUtUOzTS_zGr8`).

## File dalam Proyek Ini
- `index.html` — Aplikasi Dashboard, Sidebar Interaktif, Form Input Harian, dan Database Explorer.
- `start_local.bat` — Klik 2x untuk langsung membuka `index.html` di browser Windows Anda.
- `google_apps_script_Code.gs` — Kode jembatan (API) untuk menghubungkan aplikasi lokal secara **2-arah (Baca & Tulis langsung)** ke Google Sheets Anda.

## Cara Menghubungkan ke Google Sheets (2 Menit, 1x Setup)
1. Buka Google Spreadsheet Anda (`Summary`, `DB_Chamber`, `DB_Reefer`, `Master_Gudang`).
2. Klik menu **Extensions (Ekstensi) -> Apps Script**.
3. Hapus kode bawaan, lalu copy-paste seluruh isi file `google_apps_script_Code.gs`, lalu tekan **Ctrl+S**.
4. Klik **Deploy -> New deployment** -> pilih tipe **Web app**.
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
5. Klik **Deploy**, izinkan akses (*Authorize access*), lalu salin **Web app URL** (yang berakhiran `/exec`).
6. Buka `index.html` (klik 2x `start_local.bat`), klik tombol **Atur Sync Google Sheet** di sidebar kiri, tempelkan URL tersebut, lalu klik **Simpan & Tarik Data Live**.

Setelah terhubung:
- Setiap kali Anda membuka `index.html` di komputer lokal, aplikasi otomatis menarik data terbaru dari tab `DB_Chamber`, `DB_Reefer`, dan `Master_Gudang`.
- Setiap kali Anda mengisi **Form Input Harian** di `index.html`, data langsung tersimpan ke baris Google Sheets Anda dan seluruh rumus `Summary` ikut terupdate otomatis.
