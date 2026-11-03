import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { loadPekerja, post, todayISO } from '../api.js'

const MAX = 3 * 1024 * 1024
const empty = { pn: '', nama: '', jabatan: '', mulai: '', selesai: '', perihal: '', detail: '' }

export default function Input() {
  const [list, setList] = useState([])
  const [manual, setManual] = useState(false)
  const [f, setF] = useState(empty)
  const [foto, setFoto] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { loadPekerja().then(setList) }, [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const pick = (e) => {
    const v = e.target.value
    if (v === '__manual') { setManual(true); setF({ ...f, pn: '', nama: '', jabatan: '' }); return }
    setManual(false)
    const p = list.find((x) => x.PN === v)
    setF({ ...f, pn: v, nama: p?.Nama || '', jabatan: p?.Jabatan || '' })
  }
  const onFile = (e) => {
    const file = e.target.files[0]
    if (!file) return setFoto(null)
    if (file.size > MAX) { setMsg({ t: 'err', m: 'Ukuran foto maksimal 3 MB' }); e.target.value = ''; return }
    setMsg(null); setFoto(file)
  }
  const toB64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file) })

  const submit = async (e) => {
    e.preventDefault()
    const form = e.target
    if (!f.pn || !f.nama) return setMsg({ t: 'err', m: 'PN dan Nama wajib diisi' })
    if (f.mulai >= f.selesai) return setMsg({ t: 'err', m: 'Jam sesudah harus lebih besar dari jam sebelum' })
    setBusy(true); setMsg(null)
    try {
      await post({
        action: 'report', manual, tanggal: todayISO(), pn: f.pn, nama: f.nama, jabatan: f.jabatan,
        mulai: f.mulai, selesai: f.selesai, perihal: f.perihal, detail: f.detail,
        foto: foto ? { name: foto.name, type: foto.type, data: await toB64(foto) } : null,
      })
      setMsg({ t: 'ok', m: 'Berhasil dikirim ke spreadsheet Monitoring_Pegawai ✓' })
      setF({ ...empty, pn: f.pn, nama: f.nama, jabatan: f.jabatan }); setFoto(null)
      const fi = form.querySelector('input[type=file]'); if (fi) fi.value = ''
    } catch (err) { setMsg({ t: 'err', m: err.message }) }
    setBusy(false)
  }

  return (
    <>
      <h2 className="title">Input Aktivitas Pekerja</h2>
      <p className="sub">Catat aktivitas pekerjaan hari ini.</p>
      <form className="card form" onSubmit={submit}>
        <label>PN - Nama Pekerja
          <select value={manual ? '__manual' : f.pn} onChange={pick} required>
            <option value="">Pilih pekerja…</option>
            {list.map((p) => <option key={p.PN} value={p.PN}>{p.PN} - {p.Nama}</option>)}
            <option value="__manual">+ Input manual (tidak ada di daftar)</option>
          </select>
        </label>
        {manual && (
          <motion.div className="row3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <input placeholder="PN" value={f.pn} onChange={set('pn')} required />
            <input placeholder="Nama" value={f.nama} onChange={set('nama')} required />
            <input placeholder="Jabatan" value={f.jabatan} onChange={set('jabatan')} />
          </motion.div>
        )}
        {!manual && f.jabatan && <small className="chip">{f.jabatan}</small>}
        <label>Tanggal (otomatis)<input value={todayISO()} readOnly /></label>
        <div className="row2">
          <label>Jam Sebelum<input type="time" value={f.mulai} onChange={set('mulai')} required /></label>
          <label>Jam Sesudah<input type="time" value={f.selesai} onChange={set('selesai')} required /></label>
        </div>
        <label><span>Perihal Pekerjaan <b className="req">*</b></span><input value={f.perihal} onChange={set('perihal')} required /></label>
        <label><span>Penjelasan Detail Pekerjaan <b className="req">*</b></span><textarea rows={4} value={f.detail} onChange={set('detail')} required /></label>
        <label>Bukti Foto (opsional, maks. 3 MB)<input type="file" accept="image/*" onChange={onFile} /></label>
        {msg && <motion.p className={'msg ' + msg.t} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{msg.m}</motion.p>}
        <motion.button className="btn primary full" whileTap={{ scale: 0.97 }} disabled={busy}>{busy ? 'Mengirim…' : 'Submit'}</motion.button>
      </form>
    </>
  )
}
