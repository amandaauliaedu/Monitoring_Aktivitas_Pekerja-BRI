import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HomeIcon, PencilLine, LayoutDashboard, Download, Wifi, WifiOff } from './Icons.jsx'
import Home from './pages/Home.jsx'
import Input from './pages/Input.jsx'
import Monitoring from './pages/Monitoring.jsx'
import { SCRIPT_URL, EXPORT_URL } from './api.js'

export default function App() {
  const loc = useLocation()
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return (
    <>
      <header className="nav"><div className="wrap navin">
        <div className="brand"><img className="logo" src="/logo-bri.png" alt="BRI" />
          <div><b>BRI Region 12 Surabaya</b><small>OPERATION, SERVICE, AND E-CHANNEL (OSE)</small></div></div>
        <nav>
          <NavLink to="/" end><HomeIcon size={16} />Home</NavLink>
          <NavLink to="/input"><PencilLine size={16} />Input Pekerja</NavLink>
          <NavLink to="/monitoring"><LayoutDashboard size={16} />Monitoring Pekerja</NavLink>
        </nav>
        <span className={'live ' + (online ? '' : 'off')}>{online ? <Wifi size={14} /> : <WifiOff size={14} />} {online ? 'LIVE' : 'OFFLINE'}</span>
        <a className="iconbtn" href={EXPORT_URL} title="Unduh data Excel"><Download size={16} /></a>
      </div></header>
      {!SCRIPT_URL && <div className="banner">⚠ Penyimpanan ke Google Sheet belum aktif. Isi URL Apps Script di file .env (VITE_SCRIPT_URL) atau src/config.js, lalu jalankan ulang npm run dev.</div>}
      <main className="wrap">
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <Routes location={loc}>
              <Route path="/" element={<Home />} />
              <Route path="/input" element={<Input />} />
              <Route path="/monitoring" element={<Monitoring />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="foot">© 2026 Amanda Aulia | PT. Bank Rakyat Indonesia (Persero) Tbk</footer>
    </>
  )
}
