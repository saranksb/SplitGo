// ===== Split&Go : Code.gs (ตัวเก็บข้อมูล / API) =====
// ไม่ต้องตั้งรหัสในไฟล์นี้แล้ว ทุกคนสมัครบัญชีของตัวเองในแอป
// บัญชีแรกที่สมัคร จะได้ข้อมูลเดิมทั้งหมดที่มีอยู่ในชีต (รายการ บ้านเช่า ทริป)
const ALLOW_SIGNUP = true;  // ถ้าไม่อยากให้ใครสมัครเพิ่ม เปลี่ยนเป็น false แล้ว Deploy เวอร์ชันใหม่
const MAX_USERS = 50;

const S_LEDGER = 'รายการ';
const S_PROP   = 'บ้านเช่า';
const S_TRIP   = 'ทริป';
const S_PHOTO  = 'รูป';
const S_SET    = 'ตั้งค่า';
const S_USER   = 'บัญชีผู้ใช้';

const HEAD = {
  'รายการ':      ['ID','วันที่','ประเภท','หมวด','จำนวนเงิน','หมายเหตุ','บันทึกเมื่อ','บ้านเช่า','ผู้ใช้'],
  'บ้านเช่า':     ['ID','ชื่อ','ที่ตั้ง','ลิงก์แผนที่','หมายเหตุ','ผู้ใช้'],
  'ทริป':        ['ID','TripID','ชนิด','ข้อมูล (JSON)','อัปเดต'],
  'รูป':         ['ID','TripID','รูปย่อ','DriveFileID','ผู้ใช้'],
  'ตั้งค่า':      ['Key','ข้อมูล (JSON)'],
  'บัญชีผู้ใช้':  ['ชื่อผู้ใช้','Hash','Salt','สร้างเมื่อ']
};

// คำสั่งที่เรียกได้โดยไม่ต้องล็อกอิน
const PUBLIC = { ping: () => 'ok', login, register };
// คำสั่งที่ต้องล็อกอิน (ได้รับผู้ใช้ "u" เป็นตัวแรกเสมอ)
const API = {
  me, logout, changePassword,
  addEntry, deleteEntry, getMonth, listProps, saveProp, getSettings, saveSettings,
  listTrips, getTrip, saveRec, deleteRec, joinTrip, leaveTrip, removeFromTrip, removeMember, newTripCode,
  savePhoto, getPhoto, resolvePlace, getRate, duplicateTrip
};
// คำสั่งที่เขียนข้อมูล ให้ทำทีละคำสั่ง กันข้อมูลชนกันตอนหลายคนบันทึกพร้อมกัน
const WRITES = ['register', 'changePassword', 'addEntry', 'deleteEntry', 'saveProp', 'saveSettings',
  'saveRec', 'deleteRec', 'joinTrip', 'leaveTrip', 'removeFromTrip', 'removeMember', 'newTripCode', 'savePhoto', 'duplicateTrip'];

function doGet() {
  return ContentService.createTextOutput('Split&Go API ทำงานอยู่ เปิดแอปจากลิงก์ GitHub Pages ของคุณ');
}

function doPost(e) {
  let out, lock = null;
  try {
    const req = JSON.parse(e.postData.contents);
    if (WRITES.indexOf(req.fn) >= 0) { lock = LockService.getScriptLock(); lock.waitLock(20000); }
    if (PUBLIC[req.fn]) {
      out = { ok: true, data: PUBLIC[req.fn].apply(null, req.args || []) };
    } else {
      const u = session_(req.t);
      if (!u) out = { ok: false, code: 'AUTH', error: 'กรุณาเข้าสู่ระบบใหม่' };
      else {
        const fn = API[req.fn];
        if (!fn) throw new Error('ไม่รู้จักคำสั่ง ' + req.fn);
        out = { ok: true, data: fn.apply(null, [u].concat(req.args || [])) };
      }
    }
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  } finally {
    if (lock) try { lock.releaseLock(); } catch (x) {}
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// กดรันฟังก์ชันนี้ 1 ครั้งในหน้า Apps Script เพื่อสร้างชีตและอนุญาตสิทธิ์ทั้งหมด
function setup() {
  ledger_(); sheet_(S_PROP); sheet_(S_TRIP); photos_(); sheet_(S_SET); sheet_(S_USER); folder_();
  Logger.log('เรทเยนวันนี้: 1 JPY = ' + getRate(null, 'JPY').rate + ' บาท');
  const L = legacy_();
  Logger.log(L ? 'ข้อมูลเดิมเป็นของบัญชี: ' + L : 'พร้อมใช้งาน เปิดแอปแล้วกด "สมัครใหม่" บัญชีแรกจะได้ข้อมูลเดิมทั้งหมด');
}

// ---------- ชีต ----------
function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEAD[name]);
    sh.setFrozenRows(1);
  }
  return sh;
}
function ensureHead_(sh, name) { // อัปเกรดหัวตารางจากเวอร์ชันเก่า
  const h = HEAD[name];
  if (sh.getLastColumn() < h.length || sh.getRange(1, h.length).getValue() === '') sh.getRange(1, 1, 1, h.length).setValues([h]);
  return sh;
}
function ledger_() {
  const sh = ensureHead_(sheet_(S_LEDGER), S_LEDGER);
  sh.getRange('B:B').setNumberFormat('yyyy-mm-dd');
  sh.getRange('E:E').setNumberFormat('#,##0.00');
  return sh;
}
function props_() { return ensureHead_(sheet_(S_PROP), S_PROP); }
function photos_() { return ensureHead_(sheet_(S_PHOTO), S_PHOTO); }
function rows_(sh, cols) {
  const n = sh.getLastRow() - 1;
  return n < 1 ? [] : sh.getRange(2, 1, n, cols).getValues();
}
function findRow_(sh, id) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return -1;
  const ids = sh.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}
const SP = () => PropertiesService.getScriptProperties();
function legacy_() { return SP().getProperty('LEGACY_OWNER') || ''; }
const ownerOf_ = v => String(v || '') || legacy_(); // แถวเก่าที่ไม่มีชื่อผู้ใช้ เป็นของบัญชีแรก

// ---------- บัญชีผู้ใช้ ----------
function hex_(bytes) { return bytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join(''); }
function sha_(s) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)); }
function hashPw_(pw, salt) { // รหัสผ่านไม่ถูกเก็บตรงๆ เก็บเฉพาะค่าที่แปลงแล้ว
  let h = sha_(salt + ':' + pw);
  for (let i = 0; i < 300; i++) h = sha_(h + salt);
  return h;
}
function normUser_(s) { return String(s || '').trim().toLowerCase(); }
function findUser_(name) {
  const r = rows_(sheet_(S_USER), 3);
  const i = r.findIndex(x => x[0] === name);
  return i < 0 ? null : { row: i + 2, username: r[i][0], hash: r[i][1], salt: r[i][2] };
}
function userSalt_(name) {
  const c = CacheService.getScriptCache(), k = 'U:' + sha_(name);
  let s = c.get(k);
  if (s === null) { const u = findUser_(name); s = u ? u.salt : ''; c.put(k, s, 600); }
  return s;
}
function newSession_(name, salt) {
  const tok = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  SP().setProperty('S_' + sha_(tok), JSON.stringify({ u: name, s: salt.slice(0, 8), e: Date.now() + 180 * 864e5 }));
  return tok;
}
function session_(tok) {
  if (typeof tok !== 'string' || tok.length < 32) return null;
  const key = 'S_' + sha_(tok), raw = SP().getProperty(key);
  if (!raw) return null;
  const s = JSON.parse(raw);
  if (s.e < Date.now()) { SP().deleteProperty(key); return null; }
  const salt = userSalt_(s.u); // เปลี่ยนรหัสผ่านแล้ว เครื่องที่ล็อกอินค้างไว้จะหลุดทั้งหมด
  if (!salt || salt.slice(0, 8) !== s.s) return null;
  return { username: s.u, key: key };
}

function register(username, password) {
  if (!ALLOW_SIGNUP) throw new Error('ปิดรับสมัครบัญชีใหม่อยู่ ติดต่อเจ้าของแอป');
  const name = normUser_(username);
  if (!/^[a-z0-9฀-๿_.-]{3,20}$/.test(name)) throw new Error('ชื่อผู้ใช้ยาว 3-20 ตัว ใช้ได้เฉพาะตัวอักษร ตัวเลข _ . -');
  if (String(password || '').length < 6) throw new Error('รหัสผ่านอย่างน้อย 6 ตัว');
  const c = CacheService.getScriptCache(), reg = Number(c.get('REG') || 0);
  if (reg >= 10) throw new Error('มีการสมัครบ่อยเกินไป ลองใหม่ในอีก 10 นาที');
  const sh = sheet_(S_USER);
  if (findUser_(name)) throw new Error('ชื่อผู้ใช้นี้มีคนใช้แล้ว ลองชื่ออื่น');
  if (sh.getLastRow() - 1 >= MAX_USERS) throw new Error('จำนวนบัญชีเต็มแล้ว');
  const salt = Utilities.getUuid();
  sh.appendRow([name, hashPw_(password, salt), salt, new Date()]);
  c.put('REG', String(reg + 1), 600);
  c.remove('U:' + sha_(name));
  if (!legacy_()) SP().setProperty('LEGACY_OWNER', name);
  return { token: newSession_(name, salt), username: name };
}

function login(username, password) {
  const name = normUser_(username);
  const c = CacheService.getScriptCache(), fk = 'F:' + sha_(name), fails = Number(c.get(fk) || 0);
  if (fails >= 8) throw new Error('ใส่รหัสผิดหลายครั้ง รอ 15 นาทีแล้วลองใหม่');
  const u = findUser_(name);
  if (!u || hashPw_(String(password || ''), u.salt) !== u.hash) {
    Utilities.sleep(1000);
    c.put(fk, String(fails + 1), 900);
    throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }
  c.remove(fk);
  return { token: newSession_(name, u.salt), username: name };
}

function logout(u) { SP().deleteProperty(u.key); return true; }

function me(u) { return { username: u.username }; }

function changePassword(u, oldPw, newPw) {
  const x = findUser_(u.username);
  if (!x || hashPw_(String(oldPw || ''), x.salt) !== x.hash) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
  if (String(newPw || '').length < 6) throw new Error('รหัสผ่านใหม่อย่างน้อย 6 ตัว');
  const salt = Utilities.getUuid();
  sheet_(S_USER).getRange(x.row, 2, 1, 2).setValues([[hashPw_(newPw, salt), salt]]);
  CacheService.getScriptCache().remove('U:' + sha_(u.username));
  return { token: newSession_(u.username, salt) };
}

// ---------- บัญชีรายรับรายจ่าย (แต่ละคนเห็นของตัวเอง) ----------
function addEntry(u, e) {
  const amount = Number(e.amount);
  if (!(amount > 0)) throw new Error('จำนวนเงินต้องมากกว่า 0');
  if (e.type !== 'รายรับ' && e.type !== 'รายจ่าย') throw new Error('ประเภทไม่ถูกต้อง');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) throw new Error('วันที่ไม่ถูกต้อง');
  const [y, m, d] = e.date.split('-').map(Number);
  const id = Utilities.getUuid();
  ledger_().appendRow([id, new Date(y, m - 1, d), e.type, String(e.category || 'อื่นๆ'),
    amount, String(e.note || ''), new Date(), String(e.property || ''), u.username]);
  return id;
}

function deleteEntry(u, id) {
  const sh = ledger_();
  const r = findRow_(sh, id);
  if (r < 0) return false;
  if (ownerOf_(sh.getRange(r, 9).getValue()) !== u.username) throw new Error('ลบได้เฉพาะรายการของตัวเอง');
  sh.deleteRow(r);
  return true;
}

function getMonth(u, ym) {
  const tz = Session.getScriptTimeZone();
  return rows_(ledger_(), 9)
    .filter(r => r[0] && r[1] && ownerOf_(r[8]) === u.username)
    .map(r => ({
      id: String(r[0]),
      date: Utilities.formatDate(new Date(r[1]), tz, 'yyyy-MM-dd'),
      type: String(r[2]), category: String(r[3]),
      amount: Number(r[4]) || 0, note: String(r[5] || ''), property: String(r[7] || '')
    }))
    .filter(r => r.date.indexOf(ym) === 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function listProps(u) {
  return rows_(props_(), 6).filter(r => r[0] && ownerOf_(r[5]) === u.username)
    .map(r => ({ id: String(r[0]), name: String(r[1]), location: String(r[2]), maps: String(r[3]), note: String(r[4]) }));
}

function saveProp(u, p) {
  if (!p.name) throw new Error('ใส่ชื่อบ้านเช่า');
  const sh = props_();
  const row = [p.id || Utilities.getUuid(), p.name, p.location || '', p.maps || '', p.note || '', u.username];
  const r = p.id ? findRow_(sh, p.id) : -1;
  if (r > 0) {
    if (ownerOf_(sh.getRange(r, 6).getValue()) !== u.username) throw new Error('แก้ได้เฉพาะของตัวเอง');
    sh.getRange(r, 1, 1, 6).setValues([row]);
  } else sh.appendRow(row);
  return row[0];
}

// ---------- ตั้งค่าส่วนตัว เช่น หมวดที่เพิ่มเอง ----------
function getSettings(u) {
  const all = {};
  rows_(sheet_(S_SET), 2).forEach(r => { if (r[0]) try { all[r[0]] = JSON.parse(r[1]); } catch (e) {} });
  const o = {}, pre = u.username + '|';
  Object.keys(all).forEach(k => { if (k.indexOf(pre) === 0) o[k.slice(pre.length)] = all[k]; });
  if (!o.cats && all.cats && legacy_() === u.username) o.cats = all.cats; // ข้อมูลจากเวอร์ชันเก่า
  return o;
}

function saveSettings(u, key, value) {
  if (!/^[a-z]{1,20}$/.test(key)) throw new Error('ชื่อการตั้งค่าไม่ถูกต้อง');
  const json = JSON.stringify(value);
  if (json.length > 45000) throw new Error('ข้อมูลตั้งค่ายาวเกินไป');
  const sh = sheet_(S_SET), k = u.username + '|' + key;
  const r = findRow_(sh, k);
  if (r > 0) sh.getRange(r, 2).setValue(json); else sh.appendRow([k, json]);
  return true;
}

// ---------- ทริปและการแชร์ ----------
// ทริปเก็บ owner (คนสร้าง), access {ชื่อผู้ใช้: ชื่อในทริป} และ code (โค้ดเชิญ)
// รายการแลกเงิน และค่าใช้จ่ายแบบ "ส่วนตัว" เห็นเฉพาะคนที่บันทึก
const KINDS = ['flight', 'stay', 'stop', 'leg', 'exp', 'settle', 'topup', 'check', 'contact', 'budget'];
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function tripRows_() {
  return rows_(sheet_(S_TRIP), 4).map((r, i) => {
    let o = null; try { o = JSON.parse(r[3]); } catch (e) {}
    return { row: i + 2, id: r[0], tripId: r[1], kind: r[2], o: o };
  }).filter(x => x.o);
}
function norm_(t) { // ทริปจากเวอร์ชันเก่ายังไม่มีเจ้าของ ให้เป็นของบัญชีแรก
  if (!t.owner) t.owner = legacy_();
  if (!t.access || !Object.keys(t.access).length) { t.access = {}; if (t.owner) t.access[t.owner] = (t.members || [])[0] || 'ฉัน'; }
  return t;
}
const inTrip_ = (u, t) => !!t && Object.prototype.hasOwnProperty.call(t.access || {}, u.username);
function tripOf_(all, tripId) { const x = all.find(r => r.kind === 'trip' && r.id === tripId); return x ? norm_(x.o) : null; }
function needTrip_(u, all, tripId) {
  const t = tripOf_(all, tripId);
  if (!inTrip_(u, t)) throw new Error('ไม่มีสิทธิ์เข้าถึงทริปนี้');
  return t;
}
const privateRec_ = r => r.kind === 'topup' || r.kind === 'budget' || (r.kind === 'exp' && r.mode === 'self');
const byOf_ = (r, t) => r.by || t.owner;
function writeRec_(rec, row) {
  const json = JSON.stringify(rec);
  if (json.length > 45000) throw new Error('ข้อความยาวเกินไป');
  const vals = [rec.id, rec.tripId, rec.kind, json, new Date()];
  const sh = sheet_(S_TRIP);
  if (row > 0) sh.getRange(row, 1, 1, 5).setValues([vals]); else sh.appendRow(vals);
}
function newCode_(all) {
  const used = {};
  all.forEach(r => { if (r.kind === 'trip' && r.o.code) used[r.o.code] = 1; });
  for (let k = 0; k < 20; k++) {
    const h = sha_(Utilities.getUuid());
    let c = '';
    for (let i = 0; i < 6; i++) c += CODE_CHARS[parseInt(h.substr(i * 4, 4), 16) % CODE_CHARS.length];
    if (!used[c]) return c;
  }
  throw new Error('สร้างโค้ดไม่สำเร็จ ลองใหม่');
}

function listTrips(u) {
  return tripRows_().filter(r => r.kind === 'trip').map(r => norm_(r.o))
    .filter(t => inTrip_(u, t))
    .sort((a, b) => String(b.start || '').localeCompare(String(a.start || '')));
}

// ฟิลด์ที่เก็บ id รูป (ใช้กรองว่ารูปไหน "มองเห็นได้" ตามรายการที่กรองสิทธิ์แล้ว)
const PHOTO_FIELDS = ['photo', 'pass'];
function getTrip(u, tripId) {
  const all = tripRows_(), t = needTrip_(u, all, tripId);
  const recs = [t], rates = {}, visiblePhotos = {};
  all.forEach(r => {
    if (r.tripId !== tripId || r.kind === 'trip') return;
    const o = r.o, by = byOf_(o, t);
    if (o.kind === 'topup') { // เรทเฉลี่ยที่แต่ละคนแลกมา ใช้แปลงเงินให้ทุกคนเห็นยอดบาทเท่ากัน
      const cur = o.cur || t.currency;
      if (cur === t.currency && o.amount > 0 && o.thb > 0) {
        const w = o.wallet === 'เงินสด' ? 'cash' : 'card';
        const x = rates[by] = rates[by] || { cash: [0, 0], card: [0, 0] };
        x[w][0] += Number(o.amount); x[w][1] += Number(o.thb);
      }
    }
    if (privateRec_(o) && by !== u.username) return;
    PHOTO_FIELDS.forEach(f => { if (o[f]) visiblePhotos[o[f]] = 1; });
    recs.push(o);
  });
  const avg = {};
  Object.keys(rates).forEach(k => avg[k] = {
    cash: rates[k].cash[0] ? rates[k].cash[1] / rates[k].cash[0] : 0,
    card: rates[k].card[0] ? rates[k].card[1] / rates[k].card[0] : 0 });
  // รูปย่อคืนให้เฉพาะรูปที่ผูกกับรายการที่คนนี้มีสิทธิ์เห็น (กันรูปของรายการส่วนตัวคนอื่นหลุด)
  const thumbs = {};
  rows_(photos_(), 3).forEach(r => { if (r[1] === tripId && visiblePhotos[r[0]]) thumbs[r[0]] = r[2]; });
  return { recs: recs, thumbs: thumbs, rates: avg };
}

function saveRec(u, rec) {
  if (!rec || !rec.kind) throw new Error('ข้อมูลไม่ครบ');
  const all = tripRows_();
  if (rec.kind === 'trip') {
    const members = [];
    (rec.members || []).forEach(m => { m = String(m).trim().slice(0, 30); if (m && members.indexOf(m) < 0) members.push(m); });
    if (!members.length) members.push('ฉัน');
    rec.members = members;
    if (rec.id) {
      const x = all.find(r => r.kind === 'trip' && r.id === rec.id);
      if (!x) throw new Error('ไม่พบทริป');
      const t = norm_(x.o);
      if (t.owner !== u.username) throw new Error('แก้ข้อมูลทริปได้เฉพาะคนสร้างทริป');
      Object.keys(t.access).forEach(k => {
        if (members.indexOf(t.access[k]) < 0) throw new Error('ลบชื่อ "' + t.access[k] + '" ไม่ได้ เพราะผูกกับบัญชี ' + k + ' อยู่');
      });
      rec.owner = t.owner; rec.access = t.access; rec.code = t.code || newCode_(all); rec.tripId = rec.id;
      writeRec_(rec, x.row);
    } else {
      rec.id = Utilities.getUuid(); rec.tripId = rec.id;
      rec.owner = u.username; rec.access = {}; rec.access[u.username] = members[0]; rec.code = newCode_(all);
      writeRec_(rec, -1);
    }
    return rec;
  }
  if (KINDS.indexOf(rec.kind) < 0) throw new Error('ชนิดข้อมูลไม่ถูกต้อง');
  const t = needTrip_(u, all, rec.tripId);
  if (rec.id) {
    const x = all.find(r => r.id === rec.id);
    if (!x || x.tripId !== rec.tripId || x.kind !== rec.kind) throw new Error('ไม่พบรายการนี้');
    const by = byOf_(x.o, t);
    if (privateRec_(x.o) && by !== u.username) throw new Error('แก้ได้เฉพาะคนที่บันทึก');
    rec.by = by;
    if (privateRec_(rec) && by !== u.username) throw new Error('รายการส่วนตัวต้องเป็นของคนที่บันทึก');
    writeRec_(rec, x.row);
  } else {
    // กันสร้างซ้ำ ถ้าเคยส่งคำขอนี้มาแล้วแต่ตอบกลับมาไม่ทัน (เช่น ปิด/สลับแอปกลางคัน แล้วแอปลองส่งซ้ำให้เองตอนเปิดใหม่)
    if (rec.cid) {
      const dup = all.find(r => r.tripId === rec.tripId && r.kind === rec.kind && r.o && r.o.cid === rec.cid);
      if (dup) return dup.o;
    }
    rec.id = Utilities.getUuid(); rec.by = u.username;
    writeRec_(rec, -1);
  }
  return rec;
}

function deleteRec(u, id) {
  const all = tripRows_(), x = all.find(r => r.id === id);
  if (!x) return true;
  const sh = sheet_(S_TRIP);
  if (x.kind === 'trip') {
    const t = norm_(x.o);
    if (t.owner !== u.username) throw new Error('ลบทริปได้เฉพาะคนสร้างทริป');
    all.filter(r => r.id === id || r.tripId === id).map(r => r.row).sort((a, b) => b - a).forEach(r => sh.deleteRow(r));
    const ph = photos_(), p = rows_(ph, 4);
    for (let i = p.length - 1; i >= 0; i--) {
      if (p[i][1] === id) { try { DriveApp.getFileById(p[i][3]).setTrashed(true); } catch (e) {} ph.deleteRow(i + 2); }
    }
    return true;
  }
  const t = needTrip_(u, all, x.tripId);
  if (privateRec_(x.o) && byOf_(x.o, t) !== u.username) throw new Error('ลบได้เฉพาะคนที่บันทึก');
  sh.deleteRow(x.row);
  return true;
}

// เข้าร่วมทริปด้วยโค้ด: เรียกครั้งแรกไม่ส่งชื่อ จะได้รายชื่อคนในทริปกลับมาให้เลือกว่าเราคือใคร
function joinTrip(u, code, member) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const c = CacheService.getScriptCache(), fk = 'J:' + sha_(u.username), fails = Number(c.get(fk) || 0);
  if (fails >= 10) throw new Error('ใส่โค้ดผิดหลายครั้ง รอ 15 นาทีแล้วลองใหม่');
  const all = tripRows_();
  const x = code.length === 6 ? all.find(r => r.kind === 'trip' && r.o.code === code) : null;
  if (!x) { Utilities.sleep(800); c.put(fk, String(fails + 1), 900); throw new Error('ไม่พบทริปจากโค้ดนี้ เช็คตัวอักษรอีกครั้ง'); }
  const t = norm_(x.o);
  if (inTrip_(u, t)) return { id: t.id, joined: true };
  const taken = Object.keys(t.access).map(k => t.access[k]);
  member = String(member || '').trim().slice(0, 30);
  if (!member) return { id: t.id, name: t.name, start: t.start, end: t.end, members: t.members, taken: taken };
  if (taken.indexOf(member) >= 0) throw new Error('ชื่อ "' + member + '" มีเพื่อนเลือกไปแล้ว');
  if (t.members.indexOf(member) < 0) t.members.push(member);
  t.access[u.username] = member;
  writeRec_(t, x.row);
  return { id: t.id, joined: true };
}

function leaveTrip(u, tripId) {
  const all = tripRows_(), x = all.find(r => r.kind === 'trip' && r.id === tripId);
  if (!x) return true;
  const t = norm_(x.o);
  if (t.owner === u.username) throw new Error('คนสร้างทริปออกไม่ได้ ถ้าไม่ใช้แล้วให้ลบทริปแทน');
  delete t.access[u.username];
  writeRec_(t, x.row);
  return true;
}

function removeFromTrip(u, tripId, username) {
  const all = tripRows_(), x = all.find(r => r.kind === 'trip' && r.id === tripId);
  if (!x) throw new Error('ไม่พบทริป');
  const t = norm_(x.o);
  if (t.owner !== u.username) throw new Error('เฉพาะคนสร้างทริปเท่านั้น');
  if (username === t.owner) throw new Error('เอาคนสร้างทริปออกไม่ได้');
  delete t.access[username];
  writeRec_(t, x.row);
  return t;
}

// ทำสำเนาทริป: เอาไว้ใช้แผนเดิมไปทริปใหม่ ไม่ลอกค่าใช้จ่าย/เงินสดที่ลงไว้ และไม่ลอกรูป (รูปผูกสิทธิ์กับทริปเดิม)
const DUP_KINDS = ['flight', 'stay', 'stop', 'leg', 'check', 'contact'];
function duplicateTrip(u, tripId) {
  const all = tripRows_(), t = needTrip_(u, all, tripId);
  const newId = Utilities.getUuid();
  const nt = JSON.parse(JSON.stringify(t));
  nt.id = newId; nt.tripId = newId; nt.kind = 'trip';
  nt.name = tf_('{x} (สำเนา)', { x: t.name });
  nt.owner = u.username;
  nt.access = {}; nt.access[u.username] = t.access[u.username] || (t.members || [])[0] || u.username;
  nt.members = [nt.access[u.username]];
  nt.code = newCode_(all);
  writeRec_(nt, -1);
  all.filter(r => r.tripId === tripId && DUP_KINDS.indexOf(r.kind) >= 0).forEach(r => {
    const c = JSON.parse(JSON.stringify(r.o));
    c.id = Utilities.getUuid(); c.tripId = newId;
    delete c.photo; delete c.pass; delete c.cid;
    if (c.kind === 'check') c.done = false;
    writeRec_(c, -1);
  });
  return nt;
}
const tf_ = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);

// เอาคนที่ไม่ได้ไปออกจากทริปทั้งชื่อและบัญชี (เฉพาะคนสร้างทริป)
// ถ้าเขาเป็นคนจ่าย หรือมียอดแยกเฉพาะของเขาอยู่ ต้องแก้รายการนั้นก่อน ส่วนรายการที่หารเท่ากัน จะตัดชื่อเขาออกแล้วหารกับคนที่เหลือ
function removeMember(u, tripId, member) {
  const all = tripRows_(), x = all.find(r => r.kind === 'trip' && r.id === tripId);
  if (!x) throw new Error('ไม่พบทริป');
  const t = norm_(x.o);
  if (t.owner !== u.username) throw new Error('เฉพาะคนสร้างทริปเท่านั้น');
  if (t.access[t.owner] === member) throw new Error('เอาคนสร้างทริปออกไม่ได้');
  if (t.members.indexOf(member) < 0) return t;
  const recs = all.filter(r => r.tripId === tripId && r.kind !== 'trip');
  const blocking = recs.filter(r => {
    const o = r.o, m = Array.isArray(o.members) ? o.members : null;
    return o.payer === member || o.from === member || o.to === member ||
      (o.parts && Number(o.parts[member]) > 0) || (m && m.length === 1 && m[0] === member);
  });
  if (blocking.length) throw new Error('เอา "' + member + '" ออกไม่ได้ เพราะมี ' + blocking.length + ' รายการที่เขาจ่ายหรือมียอดของเขาอยู่ แก้หรือลบรายการเหล่านั้นก่อน');
  recs.forEach(r => {
    if (Array.isArray(r.o.members) && r.o.members.indexOf(member) >= 0) {
      r.o.members = r.o.members.filter(m => m !== member);
      writeRec_(r.o, r.row);
    }
  });
  Object.keys(t.access).forEach(k => { if (t.access[k] === member) delete t.access[k]; });
  t.members = t.members.filter(m => m !== member);
  writeRec_(t, x.row);
  return t;
}

function newTripCode(u, tripId) { // โค้ดเก่าใช้ไม่ได้ทันที คนที่เข้าร่วมแล้วยังอยู่ในทริป
  const all = tripRows_(), x = all.find(r => r.kind === 'trip' && r.id === tripId);
  if (!x) throw new Error('ไม่พบทริป');
  const t = norm_(x.o);
  if (t.owner !== u.username) throw new Error('เฉพาะคนสร้างทริปเท่านั้น');
  t.code = newCode_(all);
  writeRec_(t, x.row);
  return t;
}

// ---------- รูป (รูปเต็มเก็บใน Google Drive แบบส่วนตัว, รูปย่อเก็บในชีต) ----------
function folder_() {
  const fid = SP().getProperty('FOLDER');
  if (fid) { try { return DriveApp.getFolderById(fid); } catch (e) {} }
  const f = DriveApp.createFolder('Split&Go - รูป');
  SP().setProperty('FOLDER', f.getId());
  return f;
}

function savePhoto(u, tripId, thumb, full, name) {
  if (tripId) needTrip_(u, tripRows_(), tripId);
  const m = String(full).match(/^data:(.+?);base64,(.*)$/);
  if (!m) throw new Error('ไฟล์รูปไม่ถูกต้อง');
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name || 'photo.jpg');
  const file = folder_().createFile(blob);
  const id = Utilities.getUuid();
  photos_().appendRow([id, tripId || '', thumb, file.getId(), u.username]);
  return { id: id };
}

function getPhoto(u, id) {
  const ph = photos_(), r = findRow_(ph, id);
  if (r < 0) throw new Error('ไม่พบรูป');
  const row = ph.getRange(r, 1, 1, 5).getValues()[0];
  const tripId = row[1];
  if (tripId) {
    const all = tripRows_(), t = needTrip_(u, all, tripId);
    // รูปนี้อาจผูกกับรายการ "ส่วนตัว" (เช่นค่าใช้จ่าย mode:self) ของคนอื่น ถ้าใช่ ต้องเป็นคนเดียวกับที่บันทึกเท่านั้นถึงจะดูได้
    const owner = all.find(x => x.tripId === tripId && x.kind !== 'trip' && PHOTO_FIELDS.some(f => x.o[f] === id));
    if (owner && privateRec_(owner.o) && byOf_(owner.o, t) !== u.username) throw new Error('ไม่มีสิทธิ์ดูรูปนี้');
  }
  else if (ownerOf_(row[4]) !== u.username) throw new Error('ไม่มีสิทธิ์ดูรูปนี้');
  const blob = DriveApp.getFileById(row[3]).getBlob();
  return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
}

// ---------- ดึงชื่อสถานที่จากลิงก์แผนที่ (Google Maps หรือ Apple Maps) ----------
function resolvePlace(u, url) {
  let x = String(url || '').trim();
  if (!/^https?:\/\//i.test(x)) throw new Error('ลิงก์ไม่ถูกต้อง');
  for (let i = 0; i < 6; i++) {
    const name = nameFromUrl_(x);
    if (name) return { name: name, url: x };
    if (/consent\.google/.test(x)) {
      const c = x.match(/[?&]continue=([^&]+)/);
      if (c) { x = decodeURIComponent(c[1]); continue; }
    }
    const res = UrlFetchApp.fetch(x, { followRedirects: false, muteHttpExceptions: true,
      headers: { 'Accept-Language': 'th,en;q=0.8' } });
    const code = res.getResponseCode();
    const h = res.getAllHeaders();
    const loc = h.Location || h.location;
    if (code >= 300 && code < 400 && loc) { x = Array.isArray(loc) ? loc[0] : loc; continue; }
    return { name: nameFromHtml_(res.getContentText()), url: x };
  }
  return { name: nameFromUrl_(x), url: x };
}

function nameFromUrl_(u) {
  let m = u.match(/\/maps\/place\/([^\/?]+)/);
  if (m) return decodeURIComponent(m[1].replace(/\+/g, ' '));
  m = u.match(/[?&]q=([^&]+)/);
  if (m) return decodeURIComponent(m[1].replace(/\+/g, ' '));
  return '';
}

function nameFromHtml_(html) {
  const m = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/) ||
            html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/);
  if (!m) return '';
  return m[1].replace(/\s*[-·]\s*(Google Maps|Apple Maps)\s*$/i, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
}

// ---------- เรทแลกเงินวันนี้ (1 หน่วย = กี่บาท) ดึงจาก open.er-api.com เก็บไว้ 6 ชั่วโมง ----------
function getRate(u, cur) {
  cur = String(cur || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(cur)) throw new Error('สกุลเงินไม่ถูกต้อง');
  if (cur === 'THB') return { rate: 1, date: '' };
  const cache = CacheService.getScriptCache();
  let data = cache.get('fx');
  if (!data) {
    const res = UrlFetchApp.fetch('https://open.er-api.com/v6/latest/THB', { muteHttpExceptions: true });
    const j = res.getResponseCode() === 200 ? JSON.parse(res.getContentText()) : {};
    if (j.result !== 'success') throw new Error('ดึงเรทแลกเงินไม่ได้ ลองใหม่ภายหลัง');
    data = JSON.stringify({ rates: j.rates, date: j.time_last_update_utc || '' });
    cache.put('fx', data, 21600);
  }
  const d = JSON.parse(data), r = d.rates[cur];
  if (!r) throw new Error('ไม่มีเรทของ ' + cur);
  return { rate: Math.round(1e6 / r) / 1e6, date: d.date };
}
