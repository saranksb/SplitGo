// เชื่อมต่อ Apps Script: session, call()/run(), ลิงก์เชิญ
/* ---------- เชื่อมต่อ Apps Script ---------- */
// ใส่ลิงก์ Apps Script ของคุณระหว่าง ' ' ตรงนี้ ทุกคนที่เปิดแอปจะไม่ต้องกรอกลิงก์เอง
const DEFAULT_API = 'https://script.google.com/macros/s/AKfycbzKJ83C2doztFFIoppAVQ1W4Ov4Vv-eNO49W9gihOVS6KUuQ-19bGXPG7zvYDXzoS0/exec';
// รายชื่อสนามบิน (โหลดครั้งเดียว แคชไว้ในเครื่อง) สำหรับเติมชื่อเต็มจากรหัส 3 ตัว
let AIRPORTS = null;
function loadAirports() {
  if (AIRPORTS) return Promise.resolve(AIRPORTS);
  try {
    const c = localStorage.getItem('ts_airports');
    if (c) { AIRPORTS = JSON.parse(c); setTimeout(fetchAirports, 0); return Promise.resolve(AIRPORTS); }
  } catch (e) {}
  return fetchAirports();
}
async function fetchAirports() {
  try {
    const r = await fetch('airports.json'); const j = await r.json();
    AIRPORTS = j; try { localStorage.setItem('ts_airports', JSON.stringify(j)); } catch (e) {}
  } catch (e) {}
  return AIRPORTS || {};
}
const apLabel = (code, name) => `${name} (${code})`;
// ถ้าเป็นชื่อเต็มที่ขยายไว้แล้ว (จบด้วย (XXX)) ให้ดึงเฉพาะรหัสออกมา
function apCodeOf(v) {
  const m = String(v || '').match(/\(([A-Za-z]{3})\)\s*$/); if (m) return m[1].toUpperCase();
  const m2 = String(v || '').trim().match(/^([A-Za-z]{3})$/); return m2 ? m2[1].toUpperCase() : '';
}

const QP = new URLSearchParams(location.search);
const QAPI = QP.get('api') || '';
let QJOIN = (QP.get('join') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const API = { url: QAPI || LS.get('ts_url') || DEFAULT_API, tok: LS.get('ts_tok') };
['ts_key', 'ts_pass'].forEach(k => LS.set(k, '')); // เวอร์ชันเก่าเคยเก็บรหัสไว้ในเครื่อง ลบทิ้ง
const ME = { username: LS.get('ts_user'), email: '' };
async function call(url, body) {
  let res;
  try {
    res = await fetch(url, { method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  } catch (e) { throw new Error(t('เชื่อมต่อไม่ได้ เช็คอินเทอร์เน็ต หรือตั้งค่า Apps Script ให้ "ทุกคน" เข้าถึงได้')); }
  let j;
  try { j = await res.json(); } catch (e) { throw new Error(t('Apps Script ตอบกลับผิดรูปแบบ เช็คว่าลิงก์ถูกและ Deploy เวอร์ชันล่าสุดแล้ว')); }
  if (!j.ok) { const err = new Error(terr(j.error || 'เกิดข้อผิดพลาด')); err.code = j.code; throw err; }
  return j.data;
}
async function run(fn, ...args) {
  try { return await call(API.url, { t: API.tok, fn, args }); }
  catch (e) { if (e.code === 'AUTH') { setSession('', ME.username); showGate(t('กรุณาเข้าสู่ระบบอีกครั้ง')); } throw e; }
}
function setSession(tok, user) { API.tok = tok; ME.username = user; LS.set('ts_tok', tok); LS.set('ts_user', user); }
const inviteLink = code => { // ถ้าฝังลิงก์ไว้ในแอปแล้ว ลิงก์เชิญจะสั้นลง
  const q = [API.url && API.url !== DEFAULT_API ? 'api=' + enc(API.url) : '', code ? 'join=' + code : ''].filter(Boolean).join('&');
  return location.origin + location.pathname + (q ? '?' + q : '');
};
