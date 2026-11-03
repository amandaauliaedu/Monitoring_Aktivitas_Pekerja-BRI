import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download } from '../Icons.jsx'
import { loadPekerja, loadLogs, todayISO, EXPORT_URL } from '../api.js'

export default function Home() {
  const [d, setD] = useState(null)
  useEffect(() => {
    (async () => {
      const [p, l] = await Promise.all([loadPekerja(), loadLogs().catch(() => [])])
      const t = l.filter((r) => r.Tanggal === todayISO())
      setD({ total: l.length, today: t.length, aktif: new Set(t.map((r) => r.PN)).size, pekerja: p.length })
    })()
  }, [])
  const cards = d && [
    ['Total Laporan', d.total, 'semua data', ''],
    ['Pekerja Sudah Lapor', d.aktif, `dari ${d.pekerja} pekerja hari ini`, 'good'],
    ['Laporan Hari Ini', d.today, 'aktivitas tercatat', ''],
    ['Belum Lapor', Math.max(d.pekerja - d.aktif, 0), 'pekerja hari ini', 'bad'],
  ]
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">© OPERATION, SERVICE, AND E-CHANNEL (OSE)</p>
          <h1>MONITORING<br /><span>AKTIVITAS PEKERJA</span></h1>
          <p className="sub strong">BRI Region 12 Surabaya</p>
          <div className="btns">
            <Link className="btn primary" to="/input">Input Aktivitas ↗</Link>
            <a className="btn" href={EXPORT_URL}><Download size={15} /> Unduh Data Excel</a>
            <Link className="btn" to="/monitoring">Buka Monitoring</Link>
          </div>
        </div>
        <motion.img className="bigLogo" src="/logo-bri.png" alt="Logo BRI" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
      </section>
      <p className="eyebrow">RINGKASAN CEPAT</p>
      <h2>Status Monitoring Terkini</h2>
      {!d ? <p className="sub">Memuat data…</p> : (
        <div className="grid4">
          {cards.map(([t, v, s, c], i) => (
            <motion.div key={t} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}>
              <small className="mono">{t.toUpperCase()}</small>
              <div className={'num ' + c}>{v}</div><small>{s}</small>
            </motion.div>
          ))}
        </div>
      )}
    </>
  )
}
