export const SHEET_ID = '1MlaFBDRv9stFXsV7s1rGcglhkpZrnVg5cbbn2GIBmQU'
import { SCRIPT_URL_CONFIG } from './config.js'
export const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || SCRIPT_URL_CONFIG
export const FEEDBACK_GID = 622076906
const csvUrl = (p) => `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&${p}`

function parseCSV(t) {
  const rows = []; let r = [], c = '', q = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++ } else q = false } else c += ch }
    else if (ch === '"') q = true
    else if (ch === ',') { r.push(c); c = '' }
    else if (ch === '\n') { r.push(c); rows.push(r); r = []; c = '' }
    else if (ch !== '\r') c += ch
  }
  if (c || r.length) { r.push(c); rows.push(r) }
  return rows
}

export async function readRaw(p) {
  const res = await fetch(csvUrl(p))
  if (!res.ok) throw new Error('Gagal membaca spreadsheet')
  return parseCSV(await res.text()).map((r) => r.map((c) => c.trim()))
}
export async function readSheet(name) {
  const [h, ...d] = await readRaw('sheet=' + encodeURIComponent(name))
  return d.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] || ''])))
}

export const normDate = (s) => {
  s = (s || '').trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return s
}

// Sheet Feedback_DepartmenHead: A=Tanggal, B..R=nama pekerja, S=Catatan semua pegawai, baris 2 dst = tanggal
export async function loadFeedback() {
  try { const rows = await readRaw('gid=' + FEEDBACK_GID); return { head: rows[0] || [], body: rows.slice(1) } }
  catch { return { head: [], body: [] } }
}
const cell = (fb, date, ci) => {
  const row = fb.body.find((r) => normDate(r[0]) === date)
  const v = ci > 0 && row ? row[ci] || '' : ''
  return v === '-' ? '' : v
}
export const fbWorker = (fb, date, p) =>
  cell(fb, date, fb.head.findIndex((h) => h && (h.toLowerCase() === p.Nama.toLowerCase() || h === p.PN)))
export const fbCatatan = (fb, date) => {
  let ci = fb.head.findIndex((h) => /catatan/i.test(h)); if (ci < 0) ci = 18
  return cell(fb, date, ci)
}

export async function post(payload) {
  if (!SCRIPT_URL) throw new Error('URL Apps Script belum diisi. Isi di src/config.js lalu simpan (lihat README).')
  const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) })
  const j = await r.json()
  if (!j.ok) throw new Error(j.error || 'Gagal menyimpan')
  return j
}

export const FALLBACK_PEKERJA = [
  ['71436','I Gede Bayu Kurniawan','Departement Head'],['59911','Nugroho Budi Setia','Team Member'],
  ['57535','Moch. Hendrayanto','Section Head'],['61225','I G Agung Setiawan','Section Head'],
  ['87903','Hayya Arfa Arfiansyah','Section Head'],['87916','Fakhrurrozi Al Farisi','Section Head'],
  ['209314','Ifan Pradhana','Assistant'],['250220','Mea Mewandari','Brismate'],
  ['252554','Puri Sandiyarti','Brismate'],['324941','Danny Kurniawan','Assistant'],
  ['359093','Ahmad Zulfikar Rizaldi','Brismate'],['364283','Audita Rahma Agustin','Brismate'],
  ['90126213','Santi Maya Sari','Assistant'],['90173875','Falah Andhika Dwi Irawan','Brismate'],
  ['90193461','Adella Laurensia Agatha','Brismate'],['24366','Hadi Priyo Purwanto','Penugasan OSE'],
  ['21210','Yuni Biwantoro','Penugasan OSE'],
].map(([PN, Nama, Jabatan]) => ({ PN, Nama, Jabatan }))

export async function loadPekerja() {
  try {
    const rows = await readSheet('Database_Pekerja')
    const ok = rows.filter((r) => r.PN && r.Nama)
    return ok.length ? ok : FALLBACK_PEKERJA
  } catch { return FALLBACK_PEKERJA }
}

export const todayISO = () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export const toDec = (t) => { const m = String(t || '').match(/(\d{1,2})[:.](\d{2})/); return m ? +m[1] + +m[2] / 60 : 0 }
export const pnKey = (v) => String(v || '').replace(/[^0-9A-Za-z]/g, '')
export const EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`

// Sheet Monitoring_Pegawai dibaca berdasarkan URUTAN KOLOM (nama header bebas):
// A Timestamp | B Tanggal | C PN | D Nama | E Jabatan | F Jam Sebelum | G Jam Sesudah | H Perihal | I Detail | J Foto
export async function loadLogs() {
  const rows = await readRaw('sheet=Monitoring_Pegawai')
  const isData = (r) => /^\d{4}-\d{1,2}-\d{1,2}|^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}/.test(r[1] || '')
  return rows.filter(isData).map((r) => ({
    Tanggal: normDate(r[1]), PN: pnKey(r[2]), Nama: r[3], Jabatan: r[4],
    mulai: r[5], selesai: r[6], Perihal: r[7], Detail: r[8], Foto: r[9] || '',
  }))
}
