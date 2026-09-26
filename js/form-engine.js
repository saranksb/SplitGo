// เครื่องมือฟอร์มกลาง (sheet) ที่ทุกฟอร์มใช้ร่วมกัน + จัดการรูป/ตัวเลือกสนามบิน
/* =================================================
   ฟอร์มกลาง
================================================= */
let FORM = null;
function openForm(cfg) {
  if (!$('#sheetBg').classList.contains('show')) { navPush(); $('#sheet').classList.remove('noanim'); }
  FORM = cfg;
  if (cfg.fields.some(f => f.type === 'airport')) loadAirports();
  const d = cfg.data || {};
  $('#sheet').innerHTML = `<div class="shh"><button data-act="fclose">${t('ยกเลิก')}</button><b>${esc(cfg.title)}</b>
    <button class="strong" data-act="fsave">${t('บันทึก')}</button></div>
    <div class="shb">${cfg.fields.map(f => fieldHTML(f, d[f.k])).join('')}
    ${cfg.extra || ''}
    ${cfg.onDelete ? `<button class="danger" data-act="fdel">${esc(cfg.delLabel || t('ลบรายการนี้'))}</button>` : ''}</div>`;
  if (cfg.fields.some(f => f.type === 'split')) renderSplit(d);
  applyWhen(); cfg.onChange && cfg.onChange(); updateFxHint();
  fillThumbs($('#sheet'));
  requestAnimationFrame(() => $$('#sheet textarea').forEach(growTa));
  $('#sheetBg').classList.add('show'); lockScroll(true); renderFab();
}
$('#sheet').addEventListener('animationend', () => $('#sheet').classList.add('noanim'));
function closeForm(fromNav) {
  const was = $('#sheetBg').classList.contains('show');
  $('#sheet').style.transform = ''; $('#sheet').style.transition = ''; $('#sheet').classList.remove('noanim');
  $('#sheetBg').classList.remove('show'); FORM = null; lockScroll(false); renderFab();
  if (was && fromNav !== true) navPop();
}
const opts = a => a.map(o => Array.isArray(o) ? o : [o, o]);
// ช่องที่แสดงเฉพาะบางกรณี เช่น ยอดบาทจริง เฉพาะตอนจ่ายด้วยบัตรเครดิต
function fieldHTML(f, v) {
  const h = fieldInner(f, v);
  if (!f.when) return h;
  const alts = f.when.any || [typeof f.when[0] === 'string' ? [f.when] : f.when];
  return `<div class="when" data-when="${esc(JSON.stringify(alts))}">${h}</div>`;
}
function formVal(k) {
  const root = $('#sheet'), seg = $(`.seg[data-k="${k}"] .on`, root);
  if (seg) return seg.dataset.v;
  const el = root.querySelector(`[name="${k}"]`); return el ? el.value : '';
}
function applyWhen() {
  $$('#sheet .when').forEach(w => w.hidden = !JSON.parse(w.dataset.when)
    .some(conds => conds.every(([k, v]) => v.split('|').includes(formVal(k)))));
}
function fieldInner(f, v) {
  const val = v ?? f.def ?? '';
  const lab = f.label ? `<label class="fl">${esc(f.label)}</label>` : '';
  const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : '';
  switch (f.type) {
    case 'seg': {
      const o = opts(f.options), cur = val || o[0][0];
      return `<div class="fld">${lab}<div class="seg" data-k="${f.k}">${o.map(([k, l]) =>
        `<button type="button" data-v="${esc(k)}" class="${k === cur ? 'on' : ''}">${esc(t(l))}</button>`).join('')}</div></div>`;
    }
    case 'select':
      return `<div class="fld">${lab}<select name="${f.k}">${opts(f.options).map(([k, l]) =>
        `<option value="${esc(k)}" ${String(k) === String(val) ? 'selected' : ''}>${esc(f.raw ? l : t(l))}</option>`).join('')}</select></div>`;
    case 'checks': {
      const sel = Array.isArray(val) && val.length ? val : f.options;
      return `<div class="fld">${lab}<div class="checks" data-k="${f.k}">${f.options.map(o =>
        `<button type="button" class="chip ${sel.includes(o) ? 'on' : ''}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`;
    }
    case 'textarea': return `<div class="fld">${lab}<textarea name="${f.k}"${ph}>${esc(val)}</textarea></div>`;
    case 'photo':
      return `<div class="fld">${lab}<div class="ph" data-k="${f.k}" data-v="${esc(val)}">
        <div class="phimg">${val ? (T.thumbs[val] ? `<img data-thumb="${esc(val)}" data-act="viewp" data-id="${esc(val)}" alt="">` : `<button type="button" class="ghost" data-act="viewp" data-id="${esc(val)}">${ico('camera', 16)}${t('ดูรูป')}</button>`) : ''}</div>
        <label class="phbtn">${ico('camera', 18)}${t(val ? 'เปลี่ยนรูป' : 'เลือกรูป')}<input type="file" accept="image/*" hidden></label>
        ${val ? `<button type="button" class="ghost" data-act="phclear">${t('เอารูปออก')}</button>` : ''}</div></div>`;
    case 'maps':
      return `<div class="fld">${lab}<div class="mrow"><input name="${f.k}" type="url" value="${esc(val)}" placeholder="${esc(t('วางลิงก์จาก Google Maps'))}">
        <button type="button" data-act="fetchName" data-target="${f.target}">${t('ดึงชื่อ')}</button></div></div>`;
    case 'split': return '<div class="fld" id="split"></div>';
    case 'note': return `<div class="tiny" style="margin:-6px 0 14px">${esc(f.text)}</div>`;
    case 'catchips': {
      const list = catList(f.scope, f.base), cur = val || f.base[0];
      if (!list.includes(cur)) list.splice(list.length - 1, 0, cur);
      return `<div class="fld">${lab}<div class="catpick" data-k="${f.k}" data-scope="${esc(f.scope)}">${list.map(c => catChip(f.scope, c, c === cur)).join('')}</div>
        <div class="othbox" ${cur === 'อื่นๆ' ? '' : 'hidden'}><input class="othr" name="__other" placeholder="${esc(t('ค่าอะไร? เช่น ซักผ้า (ไม่ใส่ก็ได้)'))}" autocomplete="off">
        <div class="tiny">${t('ชื่อที่พิมพ์จะกลายเป็นปุ่มหมวดใหม่ (กดค้างที่ปุ่มเพื่อแก้หรือลบ)')}</div></div></div>`;
    }
    case 'money':
      return `<div class="fld">${lab}<input class="amtin num" name="${f.k}" inputmode="decimal" value="${val === '' || val === 0 ? '' : esc(val)}" placeholder="0"><div class="hint num" id="fxHint"></div></div>`;
    case 'number':
      return `<div class="fld">${lab}<input name="${f.k}" inputmode="decimal" value="${val === '' || val === 0 ? '' : esc(val)}"${ph || ' placeholder="0"'}></div>`;
    case 'airport':
      return `<div class="fld"><label class="fl">${esc(f.label)}</label><div class="ap-wrap"><input name="${f.k}" value="${esc(val)}"${ph} autocomplete="off" data-airport="1"><div class="ap-sug" hidden></div></div></div>`;
    default:
      return `<div class="fld">${lab}<input name="${f.k}" type="${f.type || 'text'}" value="${esc(val)}"${ph} autocomplete="off"></div>`;
  }
}
function readForm() {
  const o = { ...(FORM.data || {}) }, root = $('#sheet');
  FORM.fields.forEach(f => {
    if (f.type === 'seg') o[f.k] = $(`.seg[data-k="${f.k}"] .on`, root)?.dataset.v || '';
    else if (f.type === 'checks') o[f.k] = $$(`.checks[data-k="${f.k}"] .on`, root).map(b => b.dataset.v);
    else if (f.type === 'photo') o[f.k] = $(`.ph[data-k="${f.k}"]`, root).dataset.v || '';
    else if (f.type === 'split') Object.assign(o, readSplit());
    else if (f.type === 'catchips') {
      const sel = $(`.catpick[data-k="${f.k}"] .on`, root)?.dataset.v || 'อื่นๆ';
      const other = (root.querySelector('[name="__other"]')?.value || '').trim().slice(0, 40);
      o[f.k] = sel === 'อื่นๆ' && other ? other : sel;
    }
    else if (f.type === 'money') o[f.k] = num(root.querySelector(`[name="${f.k}"]`).value);
    else { const el = root.querySelector(`[name="${f.k}"]`); if (el) o[f.k] = f.type === 'number' ? num(el.value) : el.value.trim(); }
  });
  return o;
}
$('#sheet').addEventListener('click', async e => {
  const apOpt = e.target.closest('.ap-sug button');
  if (apOpt) { const inp = apOpt.closest('.ap-wrap').querySelector('input'); inp.value = apOpt.dataset.full; apHide(inp); return; }
  if (!e.target.closest('.ap-wrap')) $$('.ap-sug').forEach(el => el.hidden = true);
  const segB = e.target.closest('.seg[data-k] button');
  if (segB) {
    $$('button', segB.parentNode).forEach(b => b.classList.toggle('on', b === segB));
    if (FORM && segB.parentNode.dataset.k === 'tcMode') FORM.tcTouched = true;
    applyWhen(); FORM && FORM.onChange && FORM.onChange(); updateFxHint(); return;
  }
  const cp = e.target.closest('.catpick .chip');
  if (cp) {
    $$('.chip', cp.parentNode).forEach(x => x.classList.toggle('on', x === cp));
    const ob = $('.othbox', cp.closest('.fld')); ob.hidden = cp.dataset.v !== 'อื่นๆ';
    if (!ob.hidden) $('input', ob).focus();
    return;
  }
  const chip = e.target.closest('.checks .chip');
  if (chip) { chip.classList.toggle('on'); updateSplitHint(); return; }
  const sm = e.target.closest('#splitMode button');
  if (sm) { const cur = readSplit(); $$('#splitMode button').forEach(b => b.classList.toggle('on', b === sm)); drawSplitBody(sm.dataset.m, cur); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'fclose') closeForm();
  else if (act === 'fsave') {
    if (FORM.uploads && FORM.uploads.size) {
      const f = FORM; b.disabled = true; b.textContent = t('รอรูป…');
      await Promise.allSettled([...f.uploads]);
      b.disabled = false; b.textContent = t('บันทึก');
      if (FORM !== f) return;
    }
    const o = readForm();
    const err = FORM.validate && FORM.validate(o);
    if (err) return toast(err);
    b.disabled = true; b.textContent = t('รอสักครู่');
    try { await FORM.onSave(o); closeForm(); }
    catch (x) { toast(x.message || t('บันทึกไม่สำเร็จ')); b.disabled = false; b.textContent = t('บันทึก'); }
  }
  else if (act === 'fdel') { try { if (await FORM.onDelete() !== false) closeForm(); } catch (x) { toast(x.message); } }
  else if (act === 'dupTrip') { if (confirm(t('ทำสำเนาทริปนี้ เอาเที่ยวบิน ที่พัก และแผนไปวันไปยังทริปใหม่? (ไม่รวมค่าใช้จ่าย เงินสด และรูป)'))) dupTrip(FORM.data.id); }
  else if (act === 'phclear') { const box = b.closest('.ph'); box.dataset.v = ''; $('.phimg', box).innerHTML = ''; b.remove(); }
  else if (act === 'fetchName') {
    const url = b.parentNode.querySelector('input').value.trim();
    if (!url) return toast(t('วางลิงก์ก่อน'));
    b.disabled = true; b.textContent = t('กำลังดึง…');
    try {
      const r = await run('resolvePlace', url);
      if (r.name) { $(`[name="${b.dataset.target}"]`).value = r.name; toast(t('ได้ชื่อแล้ว แก้ไขเพิ่มได้')); }
      else toast(t('ดึงชื่อไม่ได้ พิมพ์ชื่อเองได้เลย'));
    } catch (x) { toast(t('ดึงชื่อไม่ได้ พิมพ์ชื่อเองได้เลย')); }
    b.disabled = false; b.textContent = t('ดึงชื่อ');
  }
  else if (act === 'copyApp') copyText(t('มาใช้ Split&Go ด้วยกัน เปิดลิงก์นี้แล้วสมัครบัญชีของตัวเองได้เลย') + '\n' + inviteLink());
  else if (act === 'chpw') {
    const o = $('#pwOld').value, n = $('#pwNew').value;
    if (!o || !n) return toast(t('ใส่รหัสผ่านเดิมและรหัสผ่านใหม่'));
    b.disabled = true;
    try { const r = await run('changePassword', o, n); setSession(r.token, ME.username); $('#pwOld').value = $('#pwNew').value = ''; toast(t('เปลี่ยนรหัสผ่านแล้ว')); }
    catch (x) { toast(x.message); }
    b.disabled = false;
  }
  else if (act === 'setEmail') {
    const email = $('#acEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast(t('ใส่อีเมลให้ถูกต้อง'));
    b.disabled = true;
    try { const r = await run('setEmail', email); ME.email = r.email; toast(t('บันทึกอีเมลแล้ว')); }
    catch (x) { toast(x.message); }
    b.disabled = false;
  }
  else if (act === 'logout') {
    if (!confirm(t('ออกจากระบบบนเครื่องนี้?\nข้อมูลของคุณยังอยู่ครบ เข้าสู่ระบบใหม่เมื่อไหร่ก็เห็นเหมือนเดิม'))) return;
    await run('logout').catch(() => {});
    LS.set(CK(), ''); setSession('', ME.username); resetState(); showGate('');
  }
  else if (act === 'copyTripInvite') copyText(tripInviteText());
  else if (act === 'newCode') {
    if (!confirm(t('สร้างโค้ดใหม่? โค้ดเดิมจะใช้ไม่ได้ทันที ส่วนคนที่อยู่ในทริปแล้วยังอยู่เหมือนเดิม'))) return;
    try { upsert(await run('newTripCode', T.id)); openShare(); toast(t('ได้โค้ดใหม่แล้ว')); } catch (x) { toast(x.message); }
  }
  else if (act === 'rmMember') {
    const m = b.dataset.m;
    if (!confirm(tf('เอา "{x}" ออกจากทริป?\nรายการที่หารเท่ากันจะหารกับคนที่เหลือแทน', { x: m }))) return;
    b.disabled = true;
    try {
      await run('removeMember', T.id, m);
      applyTrip(await run('getTrip', T.id)); cacheTrip();
      openShare(); renderTrips(); toast(t('เอาออกจากทริปแล้ว'));
    } catch (x) { toast(x.message); b.disabled = false; }
  }
  else if (act === 'viewp') viewPhoto(b.dataset.id);
  else if (act === 'detailEdit') { const r = rec(b.dataset.id); if (r) (b.dataset.o === 'leg' ? legForm : expForm)(r); }
  else if (act === 'leave') {
    if (!confirm(t('ออกจากทริปนี้? จะไม่เห็นทริปนี้อีก จนกว่าจะเข้าร่วมด้วยโค้ดใหม่'))) return;
    try { await run('leaveTrip', T.id); closeForm(); goList(); toast(t('ออกจากทริปแล้ว')); } catch (x) { toast(x.message); }
  }
  else if (act === 'joinNext') joinNext();
  else if (act === 'joinPick') { $$('#joinNames .chip').forEach(c => c.classList.toggle('on', c === b)); $('#joinNew').value = ''; }
  else if (act === 'joinGo') joinGo();
});
async function copyText(x) {
  try { await navigator.clipboard.writeText(x); toast(t('คัดลอกแล้ว วางส่งให้เพื่อนได้เลย')); }
  catch (e) { prompt(t('คัดลอกข้อความนี้ไปส่งให้เพื่อน:'), x); }
}
function growTa(el) { el.style.height = 'auto'; el.style.height = Math.max(76, el.scrollHeight + 2) + 'px'; }
function apSuggest(inp) {
  const box = inp.closest('.ap-wrap').querySelector('.ap-sug');
  const q = inp.value.trim().toLowerCase();
  if (!AIRPORTS || q.length < 2 || apCodeOf(inp.value)) { box.hidden = true; box.innerHTML = ''; return; }
  const isCode = /^[a-z]{1,3}$/.test(q);
  const hits = [];
  for (const code in AIRPORTS) {
    const name = AIRPORTS[code];
    if (code.toLowerCase().startsWith(q) || name.toLowerCase().includes(q)) hits.push([code, name]);
    if (hits.length >= 30) break;
  }
  hits.sort((a, b) => (a[0].toLowerCase() === q ? -1 : 0) - (b[0].toLowerCase() === q ? -1 : 0) || (isCode ? a[0].localeCompare(b[0]) : a[1].length - b[1].length));
  const top = hits.slice(0, 6);
  if (!top.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = top.map(([code, name]) => `<button type="button" data-full="${esc(apLabel(code, name))}"><b>${esc(code)}</b> — ${esc(name)}</button>`).join('');
  box.hidden = false;
}
function apHide(inp) { const box = inp.closest('.ap-wrap').querySelector('.ap-sug'); box.hidden = true; box.innerHTML = ''; }
function apExpand(inp) {
  apHide(inp);
  const code = apCodeOf(inp.value); if (!code || !AIRPORTS) return;
  const name = AIRPORTS[code]; if (name) inp.value = apLabel(code, name);
}
$('#sheet').addEventListener('input', e => {
  if (e.target.tagName === 'TEXTAREA') growTa(e.target);
  if (e.target.dataset.airport) apSuggest(e.target);
  if (e.target.name === 'amount' || e.target.name === 'cost' || e.target.dataset.p !== undefined) updateSplitHint();
  if (e.target.name === 'amount' || e.target.name === 'cost') autoTc();
  if (['amount', 'cost', 'thbActual'].includes(e.target.name)) updateFxHint();
  if (e.target.id === 'joinNew') $$('#joinNames .chip').forEach(c => c.classList.remove('on'));
});
$('#sheet').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'joinCode') { e.preventDefault(); joinNext(); }
  if (e.target.id === 'joinNew') { e.preventDefault(); joinGo(); }
});
$('#sheet').addEventListener('change', e => {
  if (e.target.type === 'file') handlePhoto(e.target);
  if (e.target.dataset.airport) apExpand(e.target);
  if (e.target.tagName === 'SELECT') { autoTc(); applyWhen(); FORM && FORM.onChange && FORM.onChange(); updateFxHint(); updateSplitHint(); }
});
// แสดงยอดเงินบาทใต้ช่องจำนวนเงิน
function updateFxHint() {
  const h = $('#fxHint'); if (!h || !FORM || !T.id || !isFx()) { if (h) h.textContent = ''; return; }
  const amt = num($('#sheet [name="amount"], #sheet [name="cost"]')?.value);
  const e = { amount: amt, method: formVal('method'), tcMode: formVal('tcMode'), thbActual: num(formVal('thbActual')), id: FORM.data && FORM.data.id,
    rate: FORM.data && FORM.data.rate || (T.rateCur === trip().currency ? T.rateToday : 0) };
  e.payer = formVal('payer') || myName();
  const r = rateInfo(e);
  let extra = '';
  if (e.method === 'Travel card') {
    const cs = cardState(e.id);
    extra = tcAuto(e) ? (cs.thbIn ? '\n' + tf('เงินบาทในบัตรเหลือ {x}', { x: baht(cs.thbLeft) }) : '')
      : '\n' + tf('ยอด {c} ในบัตรเหลือ {x}', { c: trip().currency, x: tm(cs.fxLeft) }) + (cs.fxLeft < amt ? t(' (ไม่พอ ลองเลือกตัดเงินบาท)') : '');
  }
  h.textContent = (!r.rate ? t('กำลังดึงเรทวันนี้…') : e.thbActual > 0 ? tf('ถูกตัดจริง {x} (1 = {r} บาท)', { x: baht(e.thbActual), r: fmtRate(r.rate) }) :
    tf('≈ {x}  ({s} 1 = {r} บาท)', { x: baht(amt * r.rate), s: t(r.src), r: fmtRate(r.rate) })) + extra;
}
// เลือกให้อัตโนมัติว่า Travel card จะตัดจากยอดที่แลกไว้ หรือตัดเงินบาท ตามยอดที่เหลือในบัตร
function autoTc() {
  if (!FORM || !FORM.autoTc || FORM.tcTouched || !T.id || !isFx() || formVal('method') !== 'Travel card') return;
  const amt = num($('#sheet [name="amount"], #sheet [name="cost"]')?.value);
  const left = cardState(FORM.data && FORM.data.id).fxLeft;
  const v = left > 0 && left >= amt ? TC_PRE : TC_AUTO;
  $$('#sheet .seg[data-k="tcMode"] button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  applyWhen();
}
$('#sheetBg').addEventListener('click', e => { if (e.target.id === 'sheetBg') closeForm(); });
// ปิดฟอร์มแล้ว ถ้ามีข้อมูลใหม่ค้างรอไว้ ดึงมาเลย
new MutationObserver(() => { if (!$('#sheetBg').classList.contains('show') && T.needReload && !SYNC) { T.needReload = false; setTimeout(reloadTrip, 200); } })
  .observe($('#sheetBg'), { attributes: true, attributeFilter: ['class'] });

/* ---------- รูป ---------- */
function loadImg(file) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(t('เปิดรูปไม่ได้'))); i.setAttribute('s' + 'rc', URL.createObjectURL(file)); });
}
// รูปจาก iPhone ใหญ่มาก (สูงสุด 48 ล้านพิกเซล) ต้องย่อเป็นขั้นๆ ไม่ให้เกินขนาดที่ Safari วาดได้ ไม่อย่างนั้นรูปจะออกมาแตกหรือว่างเปล่า
async function decodeImg(file) {
  if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch (e) {} }
  return loadImg(file);
}
function drawTo(src, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); // ภาพพื้นใสจะไม่กลายเป็นสีดำ
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
  return c;
}
function toJpeg(img, max, q) {
  let w = img.width, h = img.height, src = img;
  if (!w || !h) throw new Error('empty');
  const s = Math.min(1, max / Math.max(w, h)), tw = Math.max(1, Math.round(w * s)), th = Math.max(1, Math.round(h * s));
  if (Math.max(w, h) > 4096) { const k = 4096 / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); src = drawTo(src, w, h); }
  while (w / 2 > tw) { w = Math.round(w / 2); h = Math.round(h / 2); src = drawTo(src, w, h); }
  const out = drawTo(src, tw, th).toDataURL('image/jpeg', q);
  if (!/^data:image\/jpeg;base64,/.test(out) || out.length < 1200) throw new Error('bad');
  return out;
}
function handlePhoto(input) {
  const f = FORM, p = uploadPhoto(input);
  if (f) { f.uploads = f.uploads || new Set(); f.uploads.add(p); p.finally(() => f.uploads.delete(p)); }
  return p;
}
async function uploadPhoto(input) {
  const file = input.files[0]; if (!file) return;
  const box = input.closest('.ph'); input.value = '';
  let prep;
  try { prep = await preparePhoto(file); }
  catch (e) { return photoFail(box, e.message, null); }
  return sendPhoto(box, prep);
}
// ย่อรูปในเครื่องก่อน แล้วค่อยส่ง ถ้าส่งไม่ผ่านจะเก็บรูปที่ย่อแล้วไว้ให้กดลองใหม่ได้
async function preparePhoto(file) {
  let img;
  try {
    img = await decodeImg(file);
    const full = toJpeg(img, 1600, .8);
    let q = .7, th;
    do { th = toJpeg(img, 240, q); q -= .1; } while (th.length > 20000 && q > .2);
    return { full, th, name: file.name || 'photo.jpg' };
  } catch (x) { throw new Error(t('อ่านรูปนี้ไม่ได้ ลองเลือกรูปอื่น หรือแคปหน้าจอแล้วแนบแทน')); }
  finally { if (img && img.close) img.close(); }
}
async function sendPhoto(box, prep) {
  const holder = $('.phimg', box);
  if (!('before0' in box)) box.before0 = holder.innerHTML;
  box.classList.add('busy'); $('.pherr', box)?.remove();
  holder.innerHTML = `<span class="uping">${t('กำลังอัปโหลดรูป…')}</span>`;
  let r, err;
  for (let i = 0; i < 2 && !r; i++) {
    try { r = await run('savePhoto', T.id || '', prep.th, prep.full, prep.name); }
    catch (e) { err = e; if (e.code === 'AUTH') break; if (i === 0) await new Promise(ok => setTimeout(ok, 1500)); }
  }
  box.classList.remove('busy');
  if (!r) return photoFail(box, err && err.message, prep);
  T.thumbs[r.id] = prep.th; if (T.id) T.thumbCache[T.id] = T.thumbs;
  box.dataset.v = r.id; delete box.before0;
  holder.innerHTML = `<img data-thumb="${esc(r.id)}" data-act="viewp" data-id="${esc(r.id)}" alt="">`; fillThumbs(box);
  if (!$('[data-act="phclear"]', box)) box.insertAdjacentHTML('beforeend', `<button type="button" class="ghost" data-act="phclear">${t('เอารูปออก')}</button>`);
  toast(t('อัปโหลดรูปแล้ว'));
}
// แสดงข้อความค้างไว้ในช่องรูป (ไม่ใช่แค่แจ้งเตือนแวบเดียว) พร้อมปุ่มลองใหม่
function photoFail(box, msg, prep) {
  const holder = $('.phimg', box);
  if ('before0' in box) { holder.innerHTML = box.before0; delete box.before0; fillThumbs(box); }
  $('.pherr', box)?.remove();
  box.insertAdjacentHTML('beforeend', `<div class="pherr">${esc(t('อัปโหลดรูปไม่สำเร็จ') + (msg ? ': ' + msg : ''))}${prep ? `<button type="button" class="ghost">${t('ลองอีกครั้ง')}</button>` : ''}</div>`);
  const btn = $('.pherr button', box);
  if (btn) btn.onclick = () => { const p = sendPhoto(box, prep); if (FORM) { FORM.uploads = FORM.uploads || new Set(); FORM.uploads.add(p); p.finally(() => FORM && FORM.uploads && FORM.uploads.delete(p)); } };
}
async function viewPhoto(id) {
  const v = $('#viewer');
  v.innerHTML = `<button class="vx" aria-label="${t('ปิด')}">${ico('x', 22)}</button><img data-thumb="${esc(id)}"><div class="vh">${t('กำลังโหลดรูปเต็ม · แตะเพื่อปิด')}</div>`; fillThumbs(v);
  v.classList.add('show'); navPush();
  try { const full = await run('getPhoto', id); if (v.classList.contains('show')) { const im = $('img', v); if (im) im.setAttribute('s' + 'rc', full); const h = $('.vh', v); if (h) h.textContent = t('แตะเพื่อปิด'); } }
  catch (e) { const h = $('.vh', v); if (h) h.textContent = t('โหลดรูปเต็มไม่ได้'); }
}
function closeViewer(fromNav) {
  const v = $('#viewer'); if (!v.classList.contains('show')) return;
  v.classList.remove('show'); v.style.transform = ''; v.style.opacity = '';
  if (fromNav !== true) navPop();
}
$('#viewer').onclick = () => closeViewer();
const thumb = id => id && T.thumbs[id] ? `<img class="th" data-thumb="${esc(id)}" data-act="view" data-id="${esc(id)}" alt="">` : '';
function fillThumbs(root) { $$('img[data-thumb]', root || document).forEach(im => { const x = T.thumbs[im.dataset.thumb]; if (x && im.getAttribute('s' + 'rc') !== x) im.setAttribute('s' + 'rc', x); }); }
const apCls = s => (s || '').length > 26 ? 'long' : (s || '').length > 15 ? 'mid' : '';
const extLink = (href, icon, text) => `<a class="ghost" target="_blank" rel="noopener" href="${esc(href)}">${ico(icon, 16)}${text}</a>`;
