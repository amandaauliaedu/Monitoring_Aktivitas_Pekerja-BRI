import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Upload, ImageIcon, XIcon } from '../Icons.jsx'
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
  const [menu, setMenu] = useState(false)
  const [cam, setCam] = useState(false)
  const [preview, setPreview] = useState('')
  const wrapRef = useRef(), fileRef = useRef(), galRef = useRef(), camRef = useRef()
  useEffect(() => {
    if (!menu) return
    const h = (e) => { if (!wrapRef.current?.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [menu])
  useEffect(() => { loadPekerja().then(setList) }, [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const pick = (e) => {
    const v = e.target.value
    if (v === '__manual') { setManual(true); setF({ ...f, pn: '', nama: '', jabatan: '' }); return }
    setManual(false)
    const p = list.find((x) => x.PN === v)
    setF({ ...f, pn: v, nama: p?.Nama || '', jabatan: p?.Jabatan || '' })
  }
  const setPhoto = (file) => {
    if (!file) return
    if (file.size > MAX) { setMsg({ t: 'err', m: 'Ukuran file maksimal 3 MB' }); return }
    setMsg(null); setFoto(file)
    setPreview((old) => { if (old) URL.revokeObjectURL(old); return file.type.startsWith('image/') ? URL.createObjectURL(file) : '' })
  }
  const clearFoto = () => { setFoto(null); setPreview((old) => { if (old) URL.revokeObjectURL(old); return '' }) }
  const onFile = (e) => { setPhoto(e.target.files[0]); e.target.value = '' }
  const choose = (kind) => {
    setMenu(false)
    if (kind === 'cam') setCam(true)
    else (kind === 'file' ? fileRef : galRef).current.click()
  }
  const toB64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file) })

  const submit = async (e) => {
    e.preventDefault()
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
      setF({ ...empty, pn: f.pn, nama: f.nama, jabatan: f.jabatan }); clearFoto()
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
        <div className="photo">
          <span>Bukti Foto (opsional, maks. 3 MB)</span>
          <div className="pwrap" ref={wrapRef}>
            <button type="button" className="btn" onClick={() => setMenu(!menu)}><Upload size={16} /> {foto ? 'Ganti Bukti Foto' : 'Pilih Bukti Foto'} ▾</button>
            <AnimatePresence>
              {menu && (
                <motion.div className="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <button type="button" onClick={() => choose('cam')}><Camera /> Kamera</button>
                  <button type="button" onClick={() => choose('file')}><Upload /> Upload File</button>
                  <button type="button" onClick={() => choose('gal')}><ImageIcon /> Galeri</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" hidden onChange={onFile} />
          <input ref={galRef} type="file" accept="image/*" hidden onChange={onFile} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
          {foto && (
            <div className="pprev">
              {preview && <img src={preview} alt="Pratinjau" />}
              <div><b>{foto.name}</b><small>{(foto.size / 1024).toFixed(0)} KB</small></div>
              <button type="button" className="xbtn" onClick={clearFoto} title="Hapus"><XIcon /></button>
            </div>
          )}
        </div>
        {msg && <motion.p className={'msg ' + msg.t} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{msg.m}</motion.p>}
        <motion.button className="btn primary full" whileTap={{ scale: 0.97 }} disabled={busy}>{busy ? 'Mengirim…' : 'Submit'}</motion.button>
      </form>
      {cam && <CameraModal onClose={() => setCam(false)} onShot={(file) => { setCam(false); setPhoto(file) }} onFail={() => { setCam(false); camRef.current.click() }} />}
    </>
  )
}

function CameraModal({ onClose, onShot, onFail }) {
  const vref = useRef(), sref = useRef()
  useEffect(() => {
    let alive = true
    if (!navigator.mediaDevices?.getUserMedia) { onFail(); return }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((st) => {
        if (!alive) { st.getTracks().forEach((t) => t.stop()); return }
        sref.current = st; vref.current.srcObject = st; vref.current.play()
      })
      .catch(onFail)
    return () => { alive = false; sref.current?.getTracks().forEach((t) => t.stop()) }
  }, [])
  const shot = () => {
    const v = vref.current; if (!v.videoWidth) return
    const k = Math.min(1, 1600 / v.videoWidth)
    const c = document.createElement('canvas'); c.width = v.videoWidth * k; c.height = v.videoHeight * k
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
    c.toBlob((b) => onShot(new File([b], `kamera_${Date.now()}.jpg`, { type: 'image/jpeg' })), 'image/jpeg', 0.85)
  }
  return (
    <div className="modal" onClick={onClose}>
      <motion.div className="mbox" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <b>Ambil Foto</b>
        <video ref={vref} playsInline muted />
        <div className="crow"><button type="button" className="btn primary" onClick={shot}><Camera size={16} /> Ambil Foto</button><button type="button" className="btn" onClick={onClose}>Batal</button></div>
      </motion.div>
    </div>
  )
}
