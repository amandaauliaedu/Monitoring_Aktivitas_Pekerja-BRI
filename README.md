# Monitoring Pekerja – BRI Region 12 Surabaya
React + Vite + Framer Motion (font Inter; warna Nusantara/Cakrawala/Mentari Blue).

## Jalankan
```
npm install
npm run dev
```

## Hubungkan ke Google Sheet (agar tombol Submit/Simpan berfungsi)
1. Share spreadsheet: **Anyone with the link – Viewer**.
2. Spreadsheet > Extensions > Apps Script, tempel isi `apps-script/Code.gs`, simpan.
3. Jalankan fungsi `setup()` sekali (izinkan akses).
4. Deploy > New deployment > Web app > Execute as **Me**, Who has access **Anyone** > Deploy. Salin URL berakhiran `/exec`.
5. Tempel URL itu di `src/config.js` (`SCRIPT_URL_CONFIG`), simpan. (Alternatif: file `.env` berisi `VITE_SCRIPT_URL=...` lalu restart `npm run dev`.)
6. Jika kode Apps Script diubah: Deploy > Manage deployments > Edit > Version: New version > Deploy.

## Struktur sheet Feedback_DepartmenHead (gid 622076906)
Baris 1 = header: A `Tanggal`, B–R nama pekerja (harus sama persis dengan Database_Pekerja), S `Catatan Departement Head`.
Baris 2 dst = tanggal (dibuat otomatis, sel kosong diisi `-`). Comment baru ditambahkan setelah koma.
Fungsi `isiBulanIni()` mengisi baris tanggal sebulan penuh; `isiHariIni()` bisa dipasang Trigger harian.
