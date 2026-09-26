'use strict';
// เทสต์ตรรกะเงิน: หารบิล, แปลงสกุลเงินเป็นบาท, และคำนวณใครค้างใคร
// รันจริงกับ index.html ผ่าน jsdom (ดู test/harness.js) ไม่มี logic คัดลอกซ้ำที่นี่เลย
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

// ตั้งสถานะทริปจำลอง: T.recs[0] คือทริป ตามด้วยรายการ (exp/settle/topup ฯลฯ)
function setState(api, trip, recs, rates) {
  api.T.recs = [{ kind: 'trip', id: 'trip1', access: {}, ...trip }, ...(recs || [])];
  api.T.rates = rates || {};
}
function sumBal(bal) { return Object.values(bal).reduce((a, v) => a + v, 0); }
// ฟังก์ชันในแอปรันอยู่คนละ realm (jsdom) เทียบ object ตรงๆ ด้วย deepEqual จะเจี๊ยะเรื่อง prototype
// ไม่ตรงกันทั้งที่ค่าจริงเหมือนกันทุกอย่าง แปลงผ่าน JSON ก่อนเทียบเพื่อตัดปัญหานี้ทิ้ง
const plain = x => JSON.parse(JSON.stringify(x));

test('shares(): หารเท่ากันเฉพาะคนที่เลือก', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี', 'ซี'], currency: 'THB' });
  const s = api.shares({ mode: 'equal', amount: 300, members: ['เอ', 'บี'] });
  assert.deepEqual(plain(s), { เอ: 150, บี: 150 });
});

test('shares(): ไม่ระบุ members ให้หารกับทุกคนในทริป', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี', 'ซี'], currency: 'THB' });
  const s = api.shares({ mode: 'equal', amount: 300, members: [] });
  assert.deepEqual(plain(s), { เอ: 100, บี: 100, ซี: 100 });
});

test('shares(): โหมด custom ใช้ยอดที่แยกไว้ (parts) ตรงๆ', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี'], currency: 'THB' });
  const s = api.shares({ mode: 'custom', amount: 500, parts: { เอ: 200, บี: 300 } });
  assert.deepEqual(s, { เอ: 200, บี: 300 });
});

test('shares(): โหมด self เป็นของคนจ่ายคนเดียว ไม่หารใคร', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี'], currency: 'THB' });
  const s = api.shares({ mode: 'self', amount: 120, payer: 'เอ' });
  assert.deepEqual(plain(s), { เอ: 120 });
});

test('thbOf(): ทริปสกุลบาท ไม่แปลงอะไร ยอดเท่าเดิมเสมอ', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ'], currency: 'THB', rate: 0 });
  assert.equal(api.thbOf({ amount: 500, method: 'เงินสด' }), 500);
});

test('thbOf(): มียอดบาทที่ถูกตัดจริง (thbActual) ให้ใช้อันนั้นตรงๆ ไม่ใช้เรทอื่นเลย', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ'], currency: 'JPY', rate: 0.25 });
  const e = { amount: 1000, method: 'บัตรเครดิต', thbActual: 245, payer: 'เอ' };
  assert.equal(api.thbOf(e), 245);
});

test('thbOf(): จ่ายเงินสด ใช้เรทเฉลี่ยที่ตัวเองแลกมา (ไม่ใช่เรทประมาณของทริป)', () => {
  const { api } = loadApp();
  api.ME.username = 'acc-a';
  setState(api, { members: ['เอ'], currency: 'JPY', rate: 0.30, access: { 'acc-a': 'เอ' } }, [
    { kind: 'topup', wallet: 'เงินสด', amount: 10000, thb: 2500 }, // เรทจริงที่แลกมา 1 JPY = 0.25 บาท
  ]);
  const e = { amount: 1000, method: 'เงินสด', payer: 'เอ' };
  assert.equal(api.thbOf(e), 250); // ใช้ 0.25 ไม่ใช่ 0.30 ของทริป
});

test('thbOf(): เพื่อนจ่ายเงินสด ใช้เรทที่เซิร์ฟเวอร์สรุปไว้ให้เพื่อนคนนั้น (T.rates)', () => {
  const { api } = loadApp();
  api.ME.username = 'acc-me';
  // T.rates เก็บด้วย "บัญชี" ไม่ใช่ชื่อในทริป (ดู getTrip() ฝั่ง backend: rates[by] โดย by คือ username)
  setState(api, { members: ['เอ', 'บี'], currency: 'JPY', rate: 0.30, access: { 'acc-me': 'เอ', 'acc-b': 'บี' } },
    [], { 'acc-b': { cash: 0.28, card: 0 } });
  const e = { amount: 1000, method: 'เงินสด', payer: 'บี' };
  assert.equal(api.thbOf(e), 280);
});

test('thbOf(): ไม่มีเรทเฉพาะ ใช้เรทวันที่บันทึกรายการ (e.rate) แทน', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ'], currency: 'JPY', rate: 0.30 });
  const e = { amount: 1000, method: 'โอน/QR', payer: 'เอ', rate: 0.27 };
  assert.equal(api.thbOf(e), 270);
});

test('thbOf(): ไม่มีอะไรเลย ใช้เรทประมาณของทริปเป็นทางเลือกสุดท้าย', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ'], currency: 'JPY', rate: 0.30 });
  const e = { amount: 1000, method: 'โอน/QR', payer: 'เอ' };
  assert.equal(api.thbOf(e), 300);
});

test('balances(): จ่ายให้เพื่อนหารเท่ากัน ยอดรวมทุกคนต้องเป็นศูนย์เสมอ (หลักการบัญชีคู่)', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี', 'ซี'], currency: 'THB' });
  const { bal, paid, used } = api.balances([
    { kind: 'exp', mode: 'equal', amount: 300, payer: 'เอ', members: ['เอ', 'บี', 'ซี'] },
  ]);
  assert.ok(Math.abs(sumBal(bal)) < 1e-9, 'ผลรวม balance ต้องเป็น 0');
  assert.equal(bal['เอ'], 200); // จ่าย 300 ใช้ส่วนตัว 100 เหลือได้คืน 200
  assert.equal(bal['บี'], -100);
  assert.equal(bal['ซี'], -100);
  assert.equal(paid['เอ'], 300);
  assert.equal(used['บี'], 100);
});

test('balances(): ค่าใช้จ่ายส่วนตัว (self) ไม่กระทบยอดหารกับใครเลย', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี'], currency: 'THB' });
  const { bal, paid } = api.balances([
    { kind: 'exp', mode: 'self', amount: 500, payer: 'เอ' },
  ]);
  assert.equal(bal['เอ'], 0);
  assert.equal(bal['บี'], 0);
  assert.equal(paid['เอ'], 500); // ยังนับเป็นยอดที่จ่ายไป แค่ไม่ทำให้ใครติดหนี้
});

test('balances(): รวมรายการคืนเงิน (settle) เข้ากับยอดหารบิลด้วย', () => {
  const { api } = loadApp();
  // settle ต้องมาจาก T.recs เท่านั้น (balances() อ่านผ่าน of('settle') เสมอ ไม่รับมาทาง list พารามิเตอร์)
  // ส่วน list พารามิเตอร์มีไว้ใส่เฉพาะรายการค่าใช้จ่าย (exp/leg) เท่านั้น ผสม kind อื่นเข้าไปจะเพี้ยน
  setState(api, { members: ['เอ', 'บี'], currency: 'THB' }, [
    { kind: 'exp', mode: 'equal', amount: 200, payer: 'เอ', members: ['เอ', 'บี'] },
    { kind: 'settle', from: 'บี', to: 'เอ', amount: 100, method: 'เงินสด' },
  ]);
  const { bal } = api.balances(); // ไม่ใส่ list เอง ให้ใช้ expenseItems() แบบที่แอปจริงเรียก
  assert.equal(bal['เอ'], 0); // ได้คืนไปแล้ว 100 จากที่ควรได้ 100
  assert.equal(bal['บี'], 0);
});

test('suggestPay(): แนะนำโอนให้ครบ ไม่มีใครโอนหาตัวเอง และยอดรวมหลังโอนต้องเคลียร์หมด', () => {
  const { api } = loadApp();
  const bal = { เอ: 150, บี: -50, ซี: -100 };
  const sug = api.suggestPay(bal);
  sug.forEach(s => assert.notEqual(s.from, s.to));
  const after = { ...bal };
  sug.forEach(s => { after[s.from] += s.amount; after[s.to] -= s.amount; });
  Object.values(after).forEach(v => assert.ok(Math.abs(v) < 0.01, 'หลังโอนตามคำแนะนำ ทุกคนต้องเคลียร์'));
});

test('suggestPay(): ยอดเท่ากันพอดีอยู่แล้ว ไม่ต้องแนะนำให้โอนอะไร', () => {
  const { api } = loadApp();
  const sug = api.suggestPay({ เอ: 0.004, บี: -0.004 }); // เศษปัดเลขทศนิยม ไม่ใช่หนี้จริง
  assert.equal(sug.length, 0);
});

test('settleThb(): คืนเงินสกุลบาทอยู่แล้ว ใช้ยอดตรงๆ ไม่แปลง', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี'], currency: 'THB' });
  assert.equal(api.settleThb({ from: 'บี', to: 'เอ', amount: 500 }), 500);
});

test('settleThb(): คืนเป็นเงินสดต่างประเทศ ใช้เรทเฉลี่ยที่คนจ่าย(from)แลกมา', () => {
  const { api } = loadApp();
  api.ME.username = 'acc-a';
  setState(api, { members: ['เอ', 'บี'], currency: 'JPY', rate: 0.30, access: { 'acc-a': 'เอ' } }, [
    { kind: 'topup', wallet: 'เงินสด', amount: 10000, thb: 2500 },
  ]);
  assert.equal(api.settleThb({ from: 'เอ', to: 'บี', amount: 1000, method: 'เงินสด', cur: 'JPY' }), 250);
});

test('settleThb(): คืนผ่านโอน/QR ไม่ใช่เงินสด ตกไปใช้เรทประมาณของทริป (ไม่ละเอียดเท่าที่ควรได้)', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี'], currency: 'JPY', rate: 0.30 });
  // ข้อสังเกต: ต่างจาก thbOf()/rateInfo() ที่เช็คเรท Travel card ให้ด้วย settleThb() เช็คแค่ "เงินสด"
  // เป็นข้อจำกัดที่มีอยู่แล้วในโค้ดเดิม เทสต์นี้บันทึกพฤติกรรมปัจจุบันไว้ ไม่ใช่ยืนยันว่าถูกต้องที่สุด
  assert.equal(api.settleThb({ from: 'เอ', to: 'บี', amount: 1000, method: 'โอน/QR', cur: 'JPY' }), 300);
});

test('catStats(): ยอดรวมแยกตามหมวด ต้องเท่ากับยอดรวมทั้งหมด', () => {
  const { api } = loadApp();
  setState(api, { members: ['เอ', 'บี'], currency: 'THB' });
  const list = [
    { kind: 'exp', mode: 'equal', amount: 300, category: 'อาหาร', payer: 'เอ', members: ['เอ', 'บี'] },
    { kind: 'exp', mode: 'equal', amount: 200, category: 'เดินทาง', payer: 'บี', members: ['เอ', 'บี'] },
  ];
  const rows = api.catStats(null, list);
  const total = rows.reduce((a, r) => a + r[1], 0);
  assert.equal(total, 500);
});
