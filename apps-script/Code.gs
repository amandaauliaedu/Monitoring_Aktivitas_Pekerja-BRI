// Tempel di Extensions > Apps Script pada spreadsheet. Jalankan setup() sekali, lalu
// Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone). Salin URL /exec ke src/config.js.
// Setiap mengubah kode: Deploy > Manage deployments > Edit > New version.
const SS = SpreadsheetApp.getActiveSpreadsheet();
const TZ = SS.getSpreadsheetTimeZone();
const FB_GID = 622076906;
const CATATAN_COL = 19; // kolom S
const HEAD = ['Timestamp','Tanggal','PN','Nama','Jabatan','Jam Mulai','Jam Selesai','Perihal','Detail','Foto'];
const DEFAULT = [['71436','I Gede Bayu Kurniawan','Departement Head'],['59911','Nugroho Budi Setia','Team Member'],['57535','Moch. Hendrayanto','Section Head'],['61225','I G Agung Setiawan','Section Head'],['87903','Hayya Arfa Arfiansyah','Section Head'],['87916','Fakhrurrozi Al Farisi','Section Head'],['209314','Ifan Pradhana','Assistant'],['250220','Mea Mewandari','Brismate'],['252554','Puri Sandiyarti','Brismate'],['324941','Danny Kurniawan','Assistant'],['359093','Ahmad Zulfikar Rizaldi','Brismate'],['364283','Audita Rahma Agustin','Brismate'],['90126213','Santi Maya Sari','Assistant'],['90173875','Falah Andhika Dwi Irawan','Brismate'],['90193461','Adella Laurensia Agatha','Brismate'],['24366','Hadi Priyo Purwanto','Penugasan OSE'],['21210','Yuni Biwantoro','Penugasan OSE']];

function sh(name, head) {
  let s = SS.getSheetByName(name);
  if (!s) { s = SS.insertSheet(name); if (head) s.appendRow(head); }
  return s;
}
function fbSheet() {
  return SS.getSheets().find(function (s) { return s.getSheetId() === FB_GID; }) || SS.getSheetByName('Feedback_DepartmenHead') || sh('Feedback_DepartmenHead');
}
function setup() {
  sh('Monitoring_Pegawai', HEAD);
  const db = sh('Database_Pekerja', ['PN','Nama','Jabatan']);
  if (db.getLastRow() < 2) db.getRange(2, 1, DEFAULT.length, 3).setNumberFormat('@').setValues(DEFAULT);
  const fb = fbSheet();
  if (!fb.getRange(1, 1).getValue()) { // header: Tanggal | 17 nama | Catatan (kolom S)
    const names = db.getRange(2, 2, db.getLastRow() - 1, 1).getValues().flat();
    const h = ['Tanggal'].concat(names); while (h.length < CATATAN_COL - 1) h.push('');
    h.push('Catatan Departement Head');
    fb.getRange(1, 1, 1, h.length).setValues([h]);
  }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function normDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const s = String(v).trim(); let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  return m ? m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : s;
}

// Pastikan baris untuk tanggal ada; sel kosong diisi "-"
function ensureRow(s, tanggal) {
  const last = s.getLastRow(), cols = Math.max(s.getLastColumn(), CATATAN_COL);
  if (last >= 2) {
    const d = s.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < d.length; i++) if (normDate(d[i][0]) === tanggal) return i + 2;
  }
  const r = Math.max(last, 1) + 1;
  s.getRange(r, 1, 1, cols).setNumberFormat('@').setValues([[tanggal].concat(Array(cols - 1).fill('-'))]);
  return r;
}
function isiHariIni() { ensureRow(fbSheet(), Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd')); } // pasang Trigger harian
function isiBulanIni() {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth(), s = fbSheet();
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) ensureRow(s, Utilities.formatDate(new Date(y, m, d), TZ, 'yyyy-MM-dd'));
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action === 'report') return out(report(d));
    if (d.action === 'comment') return out(comment(d));
    return out({ ok: false, error: 'Aksi tidak dikenal' });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}

function report(d) {
  if (!d.perihal || !d.detail) throw new Error('Perihal & detail wajib');
  let url = '';
  if (d.foto) {
    if (d.foto.data.length > 4.2 * 1024 * 1024) throw new Error('Foto > 3 MB');
    const it = DriveApp.getFoldersByName('Bukti_Foto_Monitoring');
    const folder = it.hasNext() ? it.next() : DriveApp.createFolder('Bukti_Foto_Monitoring');
    const f = folder.createFile(Utilities.newBlob(Utilities.base64Decode(d.foto.data), d.foto.type, d.pn + '_' + d.tanggal + '_' + d.foto.name));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    url = f.getUrl();
  }
  if (d.manual) {
    const db = sh('Database_Pekerja', ['PN','Nama','Jabatan']);
    const pns = db.getRange(2, 1, Math.max(db.getLastRow() - 1, 1), 1).getValues().flat().map(String);
    if (pns.indexOf(String(d.pn)) < 0) db.getRange(db.getLastRow() + 1, 1, 1, 3).setNumberFormat('@').setValues([[d.pn, d.nama, d.jabatan]]);
  }
  const s = sh('Monitoring_Pegawai', HEAD), r = s.getLastRow() + 1;
  s.getRange(r, 1, 1, 10).setNumberFormat('@').setValues([[new Date().toISOString(), d.tanggal, d.pn, d.nama, d.jabatan, d.mulai, d.selesai, d.perihal, d.detail, url]]);
  ensureRow(fbSheet(), d.tanggal);
  return { ok: true };
}

// Comment DH -> kolom nama pekerja; pn = 'ALL' -> kolom Catatan (S). Input baru ditambahkan setelah koma.
function comment(d) {
  const s = fbSheet();
  const head = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), CATATAN_COL)).getValues()[0].map(function (x) { return String(x).trim().toLowerCase(); });
  let col;
  if (d.pn === 'ALL') { col = head.findIndex(function (h) { return h.indexOf('catatan') >= 0; }) + 1 || CATATAN_COL; }
  else {
    col = head.findIndex(function (h) { return h === String(d.nama).trim().toLowerCase() || h === String(d.pn); }) + 1;
    if (!col) throw new Error('Nama "' + d.nama + '" tidak ada di header sheet Feedback_DepartmenHead');
  }
  const row = ensureRow(s, d.tanggal), cell = s.getRange(row, col);
  const old = String(cell.getValue()).trim();
  const v = (old && old !== '-') ? old + ', ' + d.comment : d.comment;
  cell.setNumberFormat('@').setValue(v);
  return { ok: true, value: v };
}
