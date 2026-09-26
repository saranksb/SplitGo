// ตัวช่วยทั่วไป: DOM, วันที่, ตัวเลข, เงิน, toast
/* ---------- ตัวช่วย ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc = encodeURIComponent;
const num = v => parseFloat(String(v ?? '').replace(/,/g, '')) || 0;
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '#';
function mapSearchLink(q) { return trip().mapProvider === 'Apple Maps' ? 'https://maps.apple.com/?q=' + enc(q) : 'https://www.google.com/maps/search/?api=1&query=' + enc(q); }
function mapDirLink(o, d) { return trip().mapProvider === 'Apple Maps' ? `https://maps.apple.com/?saddr=${enc(o)}&daddr=${enc(d)}&dirflg=r` : `https://www.google.com/maps/dir/?api=1&origin=${enc(o)}&destination=${enc(d)}&travelmode=transit`; }
// สถานะเที่ยวบินจริง (ดีเลย์/เกท) ต้องดูในเบราว์เซอร์ปกติเท่านั้น เพราะหน้านี้โหลดข้อมูลผ่าน JavaScript
// (ทดสอบแล้วว่าดึงมาแสดงในแอปโดยตรงไม่ได้ ข้อมูลที่ได้เป็นแค่ข้อความของหน้าเว็บ ไม่ใช่ของเที่ยวบินจริง)
const flightStatusLink = flightNo => 'https://flightaware.com/live/flight/' + enc(String(flightNo || '').replace(/\s+/g, ''));
const baht = n => (n < 0 ? '−' : '') + '฿' + Math.abs(+n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });
const fmtD = d => d ? new Date(d + 'T00:00').toLocaleDateString(LOC(), { day: 'numeric', month: 'short' }) : '';
const wday = (d, long) => new Date(d + 'T00:00').toLocaleDateString(LOC(), { weekday: long ? 'long' : 'short' });
function money(n, cur) {
  cur = cur || 'THB';
  try { return (+n || 0).toLocaleString('th-TH', { style: 'currency', currency: cur, minimumFractionDigits: 0,
    maximumFractionDigits: ['JPY','KRW','VND','LAK','TWD'].includes(cur) ? 0 : 2 }); }
  catch (e) { return cur + ' ' + (+n || 0).toLocaleString(); }
}
function toast(msg) {
  const x = $('#toast'); x.textContent = msg; x.classList.add('show');
  clearTimeout(x._h); x._h = setTimeout(() => { x.classList.remove('show'); x._h = setTimeout(() => { x.textContent = ''; }, 300); }, 2400);
}
const lockScroll = on => document.body.classList.toggle('lock', on);
