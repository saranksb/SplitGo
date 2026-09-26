// ไอคอน SVG และตารางจับคู่หมวด/วิธีจ่าย/การเดินทางกับไอคอน
/* ---------- ไอคอน (เส้นบาง) ---------- */
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M7 7l10 10M17 7L7 17"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7.5a3.5 3.5 0 000-7h-7a3.5 3.5 0 010-7H16"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  wallet: '<path d="M4 7h14a2 2 0 012 2v9a2 2 0 01-2 2H4z"/><path d="M4 7V6a2 2 0 012-2h10"/><path d="M16 13.5h.01"/>',
  plane: '<path d="M21 3L3 10.5l7 2.5 2.5 7L21 3z"/><path d="M10 13l4.5-4.5"/>',
  air: '<path d="M2 12h20M16 6l6 6-6 6"/>',
  bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 00-3-3h-7v6"/><circle cx="7" cy="11.5" r="1.5"/>',
  ext: '<path d="M14 5h5v5M19 5l-8 8M10 5H5v14h14v-5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7M21.5 20a6.5 6.5 0 00-4-5.9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  map: '<path d="M9 4L3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  pie: '<path d="M12 3a9 9 0 109 9h-9z"/><path d="M15 3.5A9 9 0 0120.5 9H15z"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
  food: '<path d="M7 3v8a2 2 0 002 2v8M5 3v5M9 3v5M16 21V3c2.5 1.5 3.5 4 3.5 7s-1.5 4-3.5 4"/>',
  train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/>',
  ticket: '<path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  bag: '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
  gift: '<rect x="3.5" y="9" width="17" height="4" rx="1"/><path d="M5 13v7.5h14V13M12 9v11.5M12 9c-1.5-3-5.5-3.5-5.5-1S10 9 12 9zm0 0c1.5-3 5.5-3.5 5.5-1S14 9 12 9z"/>',
  dots: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
  tag: '<path d="M3 12V4h8l9.5 9.5-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6-2.5-2.5 1-5L14 10l3 1.5M9.5 7.5L7 11M12 15l2.5 6"/>',
  bus: '<rect x="4" y="3.5" width="16" height="14" rx="3"/><path d="M4 11h16M7 21v-3.5M17 21v-3.5"/><circle cx="8" cy="14.3" r=".8"/><circle cx="16" cy="14.3" r=".8"/>',
  car: '<path d="M4 16v-4l2-5h12l2 5v4z"/><path d="M4 12h16M6 16v2.5M18 16v2.5"/><circle cx="8" cy="14" r=".8"/><circle cx="16" cy="14" r=".8"/>',
  boat: '<path d="M3 16l2.5 4h13L21 16z"/><path d="M12 16V4l6 9H12"/>',
  idcard: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8" cy="12" r="2"/><path d="M13 10h6M13 14h4"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  pill: '<rect x="4" y="9" width="16" height="8" rx="4" transform="rotate(-35 12 13)"/><path d="M11 10l3 5"/>',
  plug: '<path d="M9 3v6M15 3v6M7 9h10v3a5 5 0 01-10 0z"/><path d="M12 17v4"/>',
  sim: '<path d="M8 3h9l3 3v15H8z"/><path d="M11 11h6M11 15h6M11 19h3"/>',
  phone: '<path d="M5 4h4l1.5 5-2.3 1.7a12 12 0 006.1 6.1L16 15l5 1.5v4A2 2 0 0119 22 17 17 0 013 6a2 2 0 012-2z"/>',
  siren: '<path d="M12 2v3M4.5 6l2 2M19.5 6l-2 2"/><path d="M6 21v-6a6 6 0 1112 0v6z"/><path d="M4 21h16"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/>',
  checksq: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12l3 3 5-6"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>'
};
const ico = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || IC.dots}</svg>`;
const CATI = { 'อาหาร': 'food', 'เดินทาง': 'train', 'ที่พัก': 'bed', 'ตั๋ว/กิจกรรม': 'ticket', 'ช้อปปิ้ง': 'bag', 'ของฝาก': 'gift', 'อื่นๆ': 'dots' };
const catIco = c => CATI[c] || 'tag';
const METHI = { 'เงินสด': 'cash', 'บัตรเครดิต': 'card', 'Travel card': 'globe', 'โอน/QR': 'qr' };
const MODEI = { '🚶 เดิน': 'walk', '🚌 รถเมล์': 'bus', '🚆 รถไฟ': 'train', '🚇 รถไฟใต้ดิน': 'train', '🚄 ชินคันเซ็น/รถไฟความเร็วสูง': 'train', '🚕 แท็กซี่': 'car',
  '🚗 รถเช่า/รถส่วนตัว': 'car', '⛴ เรือ': 'boat', '✈️ เครื่องบิน': 'plane', 'อื่นๆ': 'route' };
const modeLabel = m => t(String(m || 'เดินทาง').replace(/^[^฀-๿a-zA-Z]+\s*/, ''));
// สีประจำวันแบบไทย (อาทิตย์ถึงเสาร์) ปรับให้นุ่มเข้ากับโทนแอป
const DAYC = ['#C0605A', '#D4AF4C', '#D58FA3', '#7E9B75', '#D08A55', '#7FA6C4', '#9A82B5'];
const dayColor = d => DAYC[new Date(d + 'T00:00').getDay()];
const head = (icon, title, sub, action) => `<div class="bh"><span class="badge">${ico(icon, 18)}</span><div class="bt"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${action || ''}</div>`;
