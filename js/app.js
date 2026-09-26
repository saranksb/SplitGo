// ปุ่มในหน้าทริป, ปัดหน้าจอ, และจุดเริ่มทำงานของแอป
/* ----- ปุ่มในหน้าทริป ----- */
$('#trips').addEventListener('click', e => {
  if (e.target.closest('a')) return;
  const b = e.target.closest('[data-act]'); if (!b) return;
  const id = b.dataset.id;
  const acts = {
    retry: () => loadTrips(), account: () => openAccount(),
    newTrip: () => tripForm(), openTrip: () => openTrip(id),
    back: () => goList(),
    editTrip: () => tripForm(trip()),
    sub: () => { T.sub = b.dataset.s; renderTrips(); window.scrollTo(0, 0); if (Date.now() - (T.loadedAt || 0) > 60000) reloadTrip(); },
    join: () => openJoin(''), share: () => openShare(),
    day: () => { T.day = +b.dataset.i; renderTrips(); },
    addFlight: () => flightForm(), editFlight: () => flightForm(rec(id)),
    addStay: () => stayForm(), editStay: () => stayForm(rec(id)),
    addStop: () => stopForm(), editStop: () => stopForm(rec(id)),
    addLeg: () => legForm(), editLeg: () => legForm(rec(id)),
    addExp: () => expForm(), editExp: () => expForm(rec(id)), detail: () => expDetail(id),
    doSettle: () => settleForm({ from: b.dataset.from, to: b.dataset.to, amount: +b.dataset.amt, cur: 'THB' }),
    who: () => { T.who = b.dataset.v; T.catAll = false; renderTrips(); },
    catAll: () => { T.catAll = !T.catAll; renderTrips(); },
    editSettle: () => settleForm(rec(id)),
    addTopup: () => topupForm(), editTopup: () => topupForm(rec(id)),
    addCheck: () => checkForm(), editCheck: () => checkForm(rec(id)), toggleCheck: () => toggleCheck(id),
    addContact: () => contactForm(), editContact: () => contactForm(rec(id)),
    shareSummary: () => shareSummary(),
    editBudget: () => budgetForm(),
    view: () => viewPhoto(id)
  };
  acts[b.dataset.act] && acts[b.dataset.act]();
});

/* ---------- ปัดเพื่อปิด / ปัดเพื่อย้อนกลับ ---------- */
(() => {
  const sheet = $('#sheet'), viewer = $('#viewer'), page = $('#trips');
  let g = null;
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  document.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { g = null; return; }
    const p = e.touches[0], tgt = e.target;
    if (viewer.classList.contains('show')) g = { kind: 'viewer', x: p.clientX, y: p.clientY, t: Date.now() };
    else if ($('#sheetBg').classList.contains('show') && sheet.contains(tgt)) {
      const body = $('.shb', sheet), onHead = !!tgt.closest('.shh');
      if (tgt.closest('input,textarea,select')) { g = null; return; }
      if (onHead || !body || body.scrollTop <= 0) g = { kind: 'sheet', x: p.clientX, y: p.clientY, t: Date.now(), head: onHead };
      else g = null;
    }
    // ปัดจากขอบซ้ายในหน้าทริป = กลับไปหน้ารายการทริป (ในเบราว์เซอร์ปกติ ใช้ปุ่มย้อนกลับของ Safari แทน)
    else if (standalone && T.id && p.clientX < 28) g = { kind: 'edge', x: p.clientX, y: p.clientY, t: Date.now() };
    else g = null;
    if (g) g.dx = g.dy = 0;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!g) return;
    const p = e.touches[0]; g.dx = p.clientX - g.x; g.dy = p.clientY - g.y;
    if (g.kind === 'sheet') {
      if (g.dy <= 0 || (!g.head && Math.abs(g.dx) > Math.abs(g.dy))) { sheet.style.transform = ''; return; }
      sheet.style.transition = 'none'; sheet.style.transform = `translateY(${g.dy}px)`;
      if (e.cancelable) e.preventDefault();
    } else if (g.kind === 'viewer') {
      viewer.style.transition = 'none'; viewer.style.transform = `translateY(${Math.max(0, g.dy)}px)`;
      viewer.style.opacity = String(Math.max(.4, 1 - Math.max(0, g.dy) / 500));
    } else if (g.kind === 'edge') {
      if (Math.abs(g.dy) > Math.abs(g.dx)) return;
      page.style.transition = 'none'; page.style.transform = `translateX(${Math.max(0, g.dx)}px)`;
    }
  }, { passive: false });
  document.addEventListener('touchend', () => {
    if (!g) return;
    const fast = Date.now() - g.t < 250, k = g.kind;
    const reset = el => { el.style.transition = 'transform .2s ease, opacity .2s ease'; el.style.transform = ''; el.style.opacity = ''; setTimeout(() => { el.style.transition = ''; }, 220); };
    if (k === 'sheet') { if (g.dy > 110 || (fast && g.dy > 40)) closeForm(); else reset(sheet); }
    else if (k === 'viewer') { if (g.dy > 120 || (fast && g.dy > 50)) closeViewer(); else reset(viewer); }
    else if (k === 'edge') { reset(page); if (g.dx > 90 || (fast && g.dx > 40)) goList(); }
    g = null;
  });
})();

/* ---------- เริ่ม ---------- */
function resetState() { NAV.depth = 0; T.id = null; T.recs = []; T.list = null; T.rates = {}; S.cats = {}; $('#trips').innerHTML = ''; renderFab(); }
async function start() {
  // ขอข้อมูลทุกอย่างพร้อมกัน ไม่ต้องรอทีละอย่าง
  const c = cacheGet(); if (c.cats) S.cats = c.cats;
  if (!T.id) loadTrips();
  run('getSettings').then(o => { S.cats = o.cats || {}; cacheSet(x => { x.cats = S.cats; }); }).catch(() => {});
  run('me').then(m => { if (m.username !== ME.username) { ME.username = m.username; LS.set('ts_user', m.username); } ME.email = m.email || ''; const el = $('#acEmail'); if (el && document.activeElement !== el) el.value = ME.email; }).catch(() => {});
  flushOutbox(); // ลองส่งซ้ำรายการที่ค้างจากตอนก่อนหน้า (เช่น ปิดแอปกลางคันตอนกำลังบันทึก)
  if (QJOIN) { const q = QJOIN; QJOIN = ''; openJoin(q); }
}
// เอาโค้ดเชิญออกจากลิงก์ ไม่ให้ติดไปกับไอคอนบนหน้าจอโฮม
if (QJOIN) try { history.replaceState(null, '', location.pathname + (QAPI ? '?api=' + enc(QAPI) : '')); } catch (e) {}
setLang(LANG);
if (API.url && API.tok) start(); else showGate('');
window.addEventListener('online', () => { if (API.tok) flushOutbox(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && API.tok) flushOutbox(); });
