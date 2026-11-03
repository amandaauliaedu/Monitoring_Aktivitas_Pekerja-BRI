import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { loadPekerja, loadFeedback, loadLogs, fbWorker, fbCatatan, post, todayISO, toDec, pnKey } from '../api.js'

const HOURS = Array.from({ length: 10 }, (_, i) => 7 + i) // 07:00 - 17:00
const pad = (n) => String(n).padStart(2, '0')
const hhmm = (t) => { const m = String(t || '').match(/(\d{1,2})[:.](\d{2})/); return m ? `${pad(+m[1])}:${m[2]}` : t }

export default function Monitoring() {
  const [date, setDate] = useState(todayISO())
  const [who, setWho] = useState('')
  const [pekerja, setPekerja] = useState([])
  const [logs, setLogs] = useState([])
  const [fb, setFb] = useState({ head: [], body: [] })
  const [saved, setSaved] = useState({})
  const [open, setOpen] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      const [p, l, f] = await Promise.all([loadPekerja(), loadLogs(), loadFeedback()])
      setPekerja(p); setLogs(l); setFb(f); setErr('')
    } catch (e) { setErr(e.message) }
  }, [])
  useEffect(() => { load() }, [load])

  const day = useMemo(() => logs.filter((l) => l.Tanggal === date), [logs, date])
  const has = (p) => day.some((l) => l.PN === pnKey(p.PN))
  const sudah = pekerja.filter(has).length
  const shown = pekerja.filter((p) => !who || p.PN === who)
  const val = (p) => saved[date + '|' + p.PN] ?? fbWorker(fb, date, p)
  const cat = saved[date + '|ALL'] ?? fbCatatan(fb, date)
  const send = (pn, nama) => async (comment) => {
    const r = await post({ action: 'comment', tanggal: date, pn, nama, comment })
    setSaved((s) => ({ ...s, [date + '|' + pn]: r.value }))
  }

  return (
    <>
      <h2 className="title">Monitoring Pekerja</h2>
      <p className="sub">Klik nama pekerja untuk melihat aktivitas per jam (07:00 – 17:00).</p>
      <div className="card filters">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">Semua pekerja</option>
          {pekerja.map((p) => <option key={p.PN} value={p.PN}>{p.Nama}</option>)}
        </select>
        <button className="btn" onClick={() => { setSaved({}); load() }}>↻ Refresh</button>
      </div>
      <div className="legend"><b>Keterangan</b>
        <span><i className="lg g">✓</i> Sudah input</span><span><i className="lg y">!</i> Belum diinput</span><span><i className="lg b">✎</i> Comment DH</span></div>
      <div className="grid4">
        {[['Total Pekerja', pekerja.length, '', ''], ['Sudah Input', sudah, 'good', 'pekerja'], ['Belum Input', pekerja.length - sudah, 'bad', 'pekerja'], ['Total Aktivitas', day.length, '', 'tercatat']].map(([t, v, c, u]) => (
          <div className="card" key={t}><small className="mono">{t.toUpperCase()}</small><div className={'num ' + c}>{v}</div><small>{u || ' '}</small></div>
        ))}
      </div>
      {err && <p className="msg err">{err}</p>}

      {shown.map((p) => {
        const mine = day.filter((l) => l.PN === pnKey(p.PN))
        const isOpen = open === p.PN
        return (
          <motion.div layout key={p.PN} className="card worker">
            <div className="whead" onClick={() => setOpen(isOpen ? null : p.PN)}>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>⌄</motion.span>
              <b>{p.Nama}</b><small>{p.PN} • {p.Jabatan}</small>
              <span className={'pill ' + (mine.length ? 'good' : 'warn')}>{mine.length ? `Sudah input : ${mine.length} aktivitas` : 'Belum diinput'}</span>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <div className="slots">
                    {HOURS.map((h) => {
                      const acts = mine.filter((l) => toDec(l.mulai) < h + 1 && toDec(l.selesai) > h)
                      return (
                        <div className="slot" key={h}>
                          <span className="hr">{pad(h)}:00 – {pad(h + 1)}:00</span>
                          {acts.length ? (
                            <div className="acts">
                              {acts.map((a, i) => (
                                <div className="act2" key={i}>
                                  <div className="fld"><small>Perihal Pekerjaan</small><b>{a.Perihal}</b><em>{hhmm(a.mulai)} – {hhmm(a.selesai)}</em></div>
                                  <div className="fld"><small>Penjelasan Detail Pekerjaan</small><p>{a.Detail}</p></div>
                                  {a.Foto && <div className="fld"><small>Bukti Foto</small><Foto url={a.Foto} /></div>}
                                </div>
                              ))}
                            </div>
                          ) : <small className="muted">—</small>}
                        </div>
                      )
                    })}
                  </div>
                  <CommentBox key={p.PN + date} label="Comment Departement Head" tone="blue" saved={val(p)} onSave={send(p.PN, p.Nama)} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      <div className="card">
        <CommentBox key={'all' + date} label="Catatan Departemen Head untuk Semua Pegawai" tone="red" saved={cat} onSave={send('ALL', '')} />
      </div>
    </>
  )
}

function CommentBox({ label, saved, tone, onSave }) {
  const [t, setT] = useState('')
  const [s, setS] = useState('')
  const save = async () => {
    if (!t.trim()) return
    setS('Menyimpan…')
    try { await onSave(t.trim()); setT(''); setS('Tersimpan ke spreadsheet ✓') } catch (e) { setS(e.message) }
  }
  return (
    <div className="cbox">
      <AnimatePresence>
        {saved && (
          <motion.div key={saved} className={'saved ' + tone} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <b>{label}</b><p>{saved}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <label>{saved ? 'Tambah: ' : ''}{label}<textarea rows={3} value={t} onChange={(e) => setT(e.target.value)} placeholder="Tulis komentar…" /></label>
      <div className="crow"><button className="btn primary" onClick={save}>Simpan</button><small>{s}</small></div>
    </div>
  )
}

const driveId = (u) => (String(u).match(/\/d\/([\w-]+)/) || String(u).match(/[?&]id=([\w-]+)/) || [])[1]
function Foto({ url }) {
  const id = driveId(url)
  const [bad, setBad] = useState(false)
  if (!id || bad) return <a href={url} target="_blank" rel="noreferrer">Buka foto ↗</a>
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img className="foto" src={`https://drive.google.com/thumbnail?id=${id}&sz=w800`} alt="Bukti foto" loading="lazy" onError={() => setBad(true)} />
    </a>
  )
}
