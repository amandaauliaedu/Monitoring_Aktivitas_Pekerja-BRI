// Ikon SVG sederhana (tanpa paket tambahan)
const I = (d) => ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
export const HomeIcon = I(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>)
export const PencilLine = I(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></>)
export const LayoutDashboard = I(<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>)
export const Download = I(<><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></>)
export const Wifi = I(<><path d="M5 12a10 10 0 0114 0" /><path d="M8.5 15.5a5 5 0 017 0" /><path d="M12 19h.01" /></>)
export const WifiOff = I(<><path d="M2 2l20 20" /><path d="M5 12a10 10 0 015-2.7" /><path d="M8.5 15.5a5 5 0 017 0" /><path d="M12 19h.01" /></>)
export const Camera = I(<><path d="M3 8h4l2-3h6l2 3h4v12H3z" /><circle cx="12" cy="13" r="4" /></>)
export const Upload = I(<><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M5 20h14" /></>)
export const ImageIcon = I(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>)
export const XIcon = I(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>)
