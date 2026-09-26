// หน้าบัญชีของฉัน + หมวดค่าใช้จ่ายที่เพิ่มเอง
/* ---------- บัญชีของฉัน ---------- */
function openPanel(title, html) {
  if (!$('#sheetBg').classList.contains('show')) { navPush(); $('#sheet').classList.remove('noanim'); }
  FORM = null;
  $('#sheet').innerHTML = `<div class="shh"><button data-act="fclose">${t('ปิด')}</button><b>${esc(title)}</b><span></span></div>
    <div class="shb" id="panelBody">${html}</div>`;
  $('#sheetBg').classList.add('show'); lockScroll(true); renderFab();
}
function openAccount() {
  openPanel(t('บัญชีของฉัน'), `
  <div class="block"><div class="lbl">${t('เข้าสู่ระบบเป็น')}</div><div class="uname">${esc(ME.username)}</div>
    <div class="tiny">${t('ทริปของคุณ ค่าใช้จ่ายส่วนตัว และกระเป๋าเงินในทริป เห็นเฉพาะบัญชีนี้')}</div></div>
  <div class="block">${head('globe', t('ภาษา'), '', `<div class="lang">${langSwitch()}</div>`)}</div>
  <div class="block">${head('key', t('อีเมลกู้คืนรหัสผ่าน'), t('ใช้ตอนลืมรหัสผ่าน เก็บเฉพาะบัญชีนี้'))}
    <div class="fld"><label class="fl" for="acEmail">${t('อีเมล')}</label><input type="email" id="acEmail" value="${esc(ME.email)}" autocomplete="email" placeholder="${esc(t('ยังไม่ได้ตั้งอีเมล'))}"></div>
    <button class="ghost" data-act="setEmail">${t('บันทึกอีเมล')}</button></div>
  <div class="block">${head('users', t('ชวนเพื่อนมาใช้แอป'), t('เพื่อนสมัครบัญชีของตัวเอง ข้อมูลแยกกันคนละบัญชี'))}
    <button class="ghost" data-act="copyApp">${ico('copy', 16)}${t('คัดลอกลิงก์แอป')}</button>
    <div class="tiny">${t('ถ้าจะชวนเข้าทริป ให้กดปุ่มแชร์ในหน้าทริปแทน')}</div></div>
  <div class="block">${head('lock', t('เปลี่ยนรหัสผ่าน'), t('ปลอดภัยไว้ก่อน'))}
    <div class="fld"><label class="fl" for="pwOld">${t('รหัสผ่านเดิม')}</label><input type="password" id="pwOld" autocomplete="current-password"></div>
    <div class="fld"><label class="fl" for="pwNew">${t('รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)')}</label><input type="password" id="pwNew" autocomplete="new-password"></div>
    <button class="ghost" data-act="chpw">${t('เปลี่ยนรหัสผ่าน')}</button>
    <div class="tiny">${t('เครื่องอื่นที่ล็อกอินบัญชีนี้ค้างไว้ จะต้องเข้าสู่ระบบใหม่')}</div></div>
  <button class="danger" data-act="logout">${t('ออกจากระบบ')}</button>`);
}

/* ---------- หมวดที่เพิ่มเอง (เก็บใน Google Sheet ใช้ได้ทุกเครื่อง) ---------- */
const S = { cats: {} };
function catList(scope, base) {
  const own = S.cats[scope] || {};
  const extra = Object.keys(own).filter(c => !base.includes(c)).sort((a, b) => own[b] - own[a]);
  return [...base.filter(c => c !== 'อื่นๆ'), ...extra, 'อื่นๆ'];
}
const isCustom = (scope, c) => !!(S.cats[scope] && c in S.cats[scope]);
function saveCats() { run('saveSettings', 'cats', S.cats).catch(() => toast(t('บันทึกหมวดไม่สำเร็จ'))); }
function bumpCat(scope, base, c) {
  if (!c || base.includes(c)) return;
  const o = S.cats[scope] = S.cats[scope] || {};
  o[c] = (o[c] || 0) + 1; saveCats();
}
function catChip(scope, c, on) {
  return `<button type="button" class="chip${on ? ' on' : ''}" data-c="${esc(c)}" data-v="${esc(c)}"${isCustom(scope, c) ? ` data-custom data-scope="${esc(scope)}"` : ''}>${ico(catIco(c), 17)}${esc(t(c))}</button>`;
}
function catMenu(scope, name) {
  const v = prompt(tf('แก้ชื่อหมวด "{x}"\nลบข้อความทั้งหมดแล้วกด OK = ลบหมวดนี้\n(รายการเก่ายังใช้ชื่อเดิม)', { x: name }), name);
  if (v === null) return;
  const o = S.cats[scope] || {}, n = v.trim();
  if (!n) { if (!confirm(tf('ลบปุ่มหมวด "{x}"?', { x: name }))) return; delete o[name]; }
  else if (n !== name) { o[n] = (o[n] || 0) + (o[name] || 0); delete o[name]; }
  else return;
  saveCats();
  const cp = $('#sheet .catpick');
  if (cp) { const on = $('.on', cp)?.dataset.v; cp.innerHTML = catList(cp.dataset.scope, ECATS).map(c => catChip(cp.dataset.scope, c, c === on)).join(''); }
  toast(t(n ? 'เปลี่ยนชื่อแล้ว' : 'ลบหมวดแล้ว'));
}
// กดค้างที่ปุ่มหมวดที่เพิ่มเอง เพื่อแก้ชื่อหรือลบ
const LP = { t: 0, fired: false, x: 0, y: 0 };
document.addEventListener('pointerdown', e => {
  const c = e.target.closest('.chip[data-custom]'); if (!c) return;
  LP.fired = false; LP.x = e.clientX; LP.y = e.clientY; clearTimeout(LP.t);
  LP.t = setTimeout(() => { LP.fired = true; catMenu(c.dataset.scope, c.dataset.v); }, 550);
});
document.addEventListener('pointermove', e => { if (Math.abs(e.clientX - LP.x) + Math.abs(e.clientY - LP.y) > 10) clearTimeout(LP.t); });
['pointerup', 'pointercancel'].forEach(x => document.addEventListener(x, () => clearTimeout(LP.t)));
document.addEventListener('click', e => { if (LP.fired) { LP.fired = false; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', e => { if (e.target.closest('.chip[data-custom]')) e.preventDefault(); });
