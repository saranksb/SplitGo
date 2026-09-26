'use strict';
// รันไฟล์ index.html จริงใน jsdom แล้วดึงฟังก์ชัน/ตัวแปรที่ใช้คำนวณเงินออกมาทดสอบ
// ไม่ต้องแก้ index.html เลย - แค่แปะสคริปต์เล็กๆ ต่อท้ายในหน้าเพื่ออ่านค่าจาก scope เดียวกัน
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const EXPORT_NAMES = [
  'thbOf', 'shares', 'balances', 'suggestPay', 'settleThb', 'rateInfo', 'walletRate',
  'catStats', 'tcAuto', 'estimated', 'isFx', 'tcur', 'expenseItems', 'tripDays',
  'T', 'ME', 'trip', 'of', 'money', 'baht', 'tm', 'fmtRate', 'num', 'cardState'
];

function loadApp() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const errors = [];
  const dom = new JSDOM(html, {
    url: 'https://split-and-go.test/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(win) {
      // jsdom ไม่มี matchMedia ให้ ใส่ stub กันสคริปต์หลักพังตอนเช็คธีมมืด/สว่าง
      win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    }
  });
  dom.window.onerror = (msg, src, line, col, err) => errors.push(err || msg);

  const bridge = dom.window.document.createElement('script');
  bridge.textContent = `window.__T__ = { ${EXPORT_NAMES.join(', ')} };`;
  dom.window.document.body.appendChild(bridge);

  const api = dom.window.__T__;
  if (!api || !api.thbOf) {
    throw new Error('โหลด index.html ใน jsdom ไม่สำเร็จ: ' + (errors[0] ? (errors[0].stack || errors[0]) : 'ไม่รู้จักปัญหา (ฟังก์ชันคำนวณเงินไม่ถูกสร้างขึ้น)'));
  }
  return { dom, window: dom.window, api, errors };
}

module.exports = { loadApp };
