// ปุ่มย้อนกลับของเบราว์เซอร์/มือถือ: ปิดสิ่งที่เปิดอยู่ชั้นบนสุด
/* ---------- ย้อนกลับ: ปัดขอบซ้าย / ปุ่มย้อนกลับ ปิดสิ่งที่เปิดอยู่ชั้นบนสุด ---------- */
const NAV = { depth: 0, skip: 0, pend: 0 };
function navPush() {
  NAV.depth++;
  if (NAV.skip) NAV.pend++; else try { history.pushState({ sg: 1 }, ''); } catch (e) {}
}
function navPop() {
  if (NAV.depth <= 0) return;
  NAV.depth--; NAV.skip++;
  try { history.back(); } catch (e) { NAV.skip--; }
}
window.addEventListener('popstate', () => {
  if (NAV.skip) {
    NAV.skip--;
    if (!NAV.skip) while (NAV.pend) { NAV.pend--; try { history.pushState({ sg: 1 }, ''); } catch (e) {} }
    return;
  }
  NAV.depth = Math.max(0, NAV.depth - 1);
  if ($('#viewer').classList.contains('show')) closeViewer(true);
  else if ($('#sheetBg').classList.contains('show')) closeForm(true);
  else if (T.id) goList(true);
});
function goList(fromNav) {
  if (!T.id) return;
  T.id = null; T.recs = []; renderTrips(); loadTrips(); window.scrollTo(0, 0);
  if (!fromNav) navPop();
}
