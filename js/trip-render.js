// แสดงผลหน้าทริป: ภาพรวม/แผนรายวัน/หารเงิน/กระเป๋าเงิน
/* ----- ปุ่มลอย: เพิ่มค่าใช้จ่าย (หน้ากระเป๋าเงิน = แลกเงิน) ----- */
function renderFab() {
  const f = $('#fab'), show = !!(T.id && trip()) && !$('#sheetBg').classList.contains('show') && $('#gate').hidden;
  f.hidden = !show; if (!show) return;
  f.innerHTML = ico('plus', 22) + (T.sub === 'wallet' ? t('แลกเงิน') : t('ค่าใช้จ่ายใหม่'));
}
$('#fab').onclick = () => T.sub === 'wallet' ? topupForm() : expForm(null, null);

/* ----- หน้ารายการทริป และหน้าทริป ----- */
function renderTrips() {
  const el = $('#trips');
  renderFab();
  if (!T.id) {
    if (!T.list) return;
    el.innerHTML = `<header class="top"><h1>${t('ทริปของฉัน')}</h1><button class="ib" id="gear" data-act="account" aria-label="${t('บัญชีของฉัน')}">${ico('user', 19)}</button></header>
      <div class="hello">${tf('สวัสดี {u}', { u: esc(ME.username) })}</div>
      <div class="actions"><button class="ghost" data-act="join">${ico('key', 17)}${t('ใส่โค้ด')}</button>
        <button class="ghost primary" data-act="newTrip">${ico('plus', 17)}${t('ทริปใหม่')}</button></div>` +
      (T.list.length ? T.list.map(x => { const [cls, txt] = tripStatus(x), n = Object.keys(x.access || {}).length, days = tripDays(x);
        return `<button class="trip" data-act="openTrip" data-id="${esc(x.id)}">
          <div class="ribbon">${days.slice(0, 21).map(d => `<i style="--dc:${dayColor(d)}"></i>`).join('')}</div>
          <div class="n">${esc(x.name)}</div>
          ${x.dest ? `<div class="m">${ico('pin', 15)}${esc(x.dest)}</div>` : ''}
          <div class="m">${ico('cal', 15)}${fmtD(x.start)} – ${fmtD(x.end)}, ${tf('{n} วัน', { n: days.length })}</div>
          <div class="pills"><span class="pill ${cls}">${txt}</span>${n > 1 ? `<span class="pill">${ico('users', 13)}${tf('แชร์กัน {n} คน', { n })}</span>` : ''}
          ${x.owner && x.owner !== ME.username ? `<span class="pill">${tf('ทริปของ {u}', { u: esc(x.access[x.owner] || x.owner) })}</span>` : ''}</div></button>`; }).join('')
        : `<div class="block empty">${ico('plane', 30)}<br><b class="serif" style="font-size:18px;color:var(--ink)">${t('ยังไม่มีทริป')}</b><br>${t('สร้างทริปใหม่ หรือกด "ใส่โค้ด" เพื่อเข้าทริปที่เพื่อนชวน')}</div>`);
    return;
  }
  const x = trip(); if (!x) return;
  const subs = [['overview', 'ภาพรวม', 'compass'], ['plan', 'แผนรายวัน', 'map'], ['money', 'ค่าใช้จ่าย', 'receipt'], ['wallet', 'กระเป๋าเงิน', 'wallet']];
  el.innerHTML = `<div class="thead"><button class="ib" data-act="back" aria-label="${t('กลับ')}">${ico('left')}</button>
      <div class="mid"><h1>${esc(x.name)}</h1>
      <div class="m">${ico('cal', 15)}${fmtD(x.start)} – ${fmtD(x.end)}, ${tf('{n} วัน', { n: tripDays(x).length })}</div>
      <div class="m">${ico('users', 15)}<span>${x.members.map(m => esc(m) + (m === myName() && x.members.length > 1 ? ' ' + t('(คุณ)') : '')).join(', ')}</span></div></div>
      <button class="ib" data-act="share" aria-label="${t('แชร์ทริป')}">${ico('users', 18)}</button>
      ${isOwner(x) ? `<button class="ib" data-act="editTrip" aria-label="${t('แก้ไขทริป')}">${ico('edit', 18)}</button>` : ''}</div>
    <nav class="tabs">${subs.map(([k, l, i]) => `<button data-act="sub" data-s="${k}" class="${T.sub === k ? 'on' : ''}">${ico(i, 19)}${t(l)}</button>`).join('')}</nav>
    ${({ overview: viewOverview, plan: viewPlan, money: viewMoney, wallet: viewWallet })[T.sub](x)}`;
  fillThumbs(el);
}

/* ----- ภาพรวม ----- */
const nights = s => s.checkin && s.checkout ? Math.max(0, Math.round((new Date(s.checkout) - new Date(s.checkin)) / 864e5)) : 0;
function flightBanner(fl) {
  const now = new Date();
  const upcoming = fl.map(f => ({ f, dt: f.date ? new Date(f.date + 'T' + (f.dep || '00:00')) : null })).filter(x => x.dt && x.dt >= now).sort((a, b) => a.dt - b.dt)[0];
  if (!upcoming) return '';
  const { f, dt } = upcoming;
  const hrs = (dt - now) / 36e5;
  const canCheckin = hrs <= 48 && f.status !== 'เช็คอินแล้ว';
  const label = hrs < 20 ? t('บินวันนี้!') : tf('อีก {n} วันจะบิน ({dir})', { n: Math.ceil(hrs / 24), dir: t(f.dir) });
  return `<div class="callout${canCheckin ? ' urge' : ''}">
    <span class="co-ic">${ico(canCheckin ? 'siren' : 'clock', 20)}</span>
    <div class="co-tx"><b>${esc(label)}</b>${canCheckin ? `<div>${t('เปิดเช็คอินออนไลน์ได้แล้ว (ปกติเปิดก่อนบิน 24–48 ชม.)')}</div>` : ''}</div>
  </div>`;
}
// ป้ายชื่อ "เฉพาะ..." เมื่อเที่ยวบิน/ที่พักเป็นของบางคนในทริป ไม่ใช่ทุกคน
function whoTag(r, x) {
  if (!r.who || !r.who.length || r.who.length >= x.members.length) return '';
  return `<span class="pill">${esc(tf('เฉพาะ {x}', { x: r.who.join(', ') }))}</span>`;
}
function viewOverview(x) {
  const fl = of('flight').sort((a, b) => ((a.date || '') + (a.dep || '')).localeCompare((b.date || '') + (b.dep || '')));
  const st = of('stay').sort((a, b) => (a.checkin || '').localeCompare(b.checkin || ''));
  const chk = of('check');
  const contacts = of('contact');
  const pre = fl.reduce((a, f) => a + (+f.price || 0), 0) + st.reduce((a, s) => a + (+s.price || 0), 0);
  const okF = s => s === 'ซื้อตั๋วแล้ว' || s === 'เช็คอินแล้ว';
  const add = act => `<button class="link" data-act="${act}">${ico('plus', 16)}${t('เพิ่ม')}</button>`;
  return `
  ${flightBanner(fl)}
  <div class="block">${head('checksq', t('เช็คลิสต์ก่อนไป'), t('ติ๊กให้ครบก่อนออกเดินทาง'), add('addCheck'))}
  ${chk.length ? chk.map(c => `<div class="checkrow${c.done ? ' done' : ''} tap" data-act="toggleCheck" data-id="${esc(c.id)}">
      <span class="cbox">${c.done ? ico('checksq', 20) : ''}</span>
      <span class="cic">${ico(c.icon || 'dots', 18)}</span>
      <span class="ct">${esc(t(c.title))}</span>
      <button type="button" class="ib sm" data-act="editCheck" data-id="${esc(c.id)}" aria-label="${t('แก้ไข')}">${ico('edit', 15)}</button>
    </div>`).join('') : `<div class="empty">${t('ยังไม่มีรายการ')}</div>`}
  </div>
  <div class="block">${head('plane', t('เที่ยวบิน'), t('ตั๋ว เวลา และบอร์ดดิ้งพาส'), add('addFlight'))}
  ${fl.length ? fl.map(f => `<div class="ticket tap" data-act="editFlight" data-id="${esc(f.id)}">
      <div class="tk-top"><span>${esc(t(f.dir))}, ${wday(f.date)} ${fmtD(f.date)}</span><span class="pill ${okF(f.status) ? 'ok' : 'no'}">${esc(t(f.status))}</span>${whoTag(f, x)}</div>
      <div class="tk-route"><div><b class="${apCls(f.from)}">${esc(f.from || '—')}</b><small>${esc(f.dep || '')}</small></div>
        <div class="tk-line">${ico('air', 18)}</div>
        <div class="r"><b class="${apCls(f.to)}">${esc(f.to || '—')}</b><small>${esc(f.arr || '')}</small></div></div>
      <div class="meta">${[f.flightNo, f.airline, f.ref && tf('รหัสจอง {x}', { x: f.ref }), f.seat && tf('ที่นั่ง {x}', { x: f.seat })].filter(Boolean).map(y => `<span>${esc(y)}</span>`).join('')}</div>
      ${f.note ? `<div class="nt">${esc(f.note)}</div>` : ''}
      ${f.pass || f.flightNo ? `<div class="acts">${thumb(f.pass)}
        ${f.flightNo ? extLink(flightStatusLink(f.flightNo), 'ext', t('สถานะเที่ยวบิน')) : ''}</div>` : ''}
    </div>`).join('') : `<div class="empty">${t('ยังไม่มีเที่ยวบิน')}<br>${t('ถ้าเดินทางด้วยรถ ข้ามส่วนนี้ได้')}</div>`}
  </div>
  <div class="block">${head('bed', t('ที่พัก'), t('เช็คอิน เช็คเอาท์ และลิงก์แผนที่'), add('addStay'))}
  ${st.length ? st.map(s => `<div class="ticket tap" data-act="editStay" data-id="${esc(s.id)}">
      <div class="tk-top"><span>${fmtD(s.checkin)} – ${fmtD(s.checkout)}, ${tf('{n} คืน', { n: nights(s) })}</span><span class="pill ${s.status === 'จองแล้ว' ? 'ok' : 'no'}">${esc(t(s.status))}</span>${whoTag(s, x)}</div>
      <div class="tt serif" style="margin-top:4px;font-size:18px">${esc(s.name || t('ที่พัก'))}</div>
      ${s.price ? `<div class="meta"><span>${baht(s.price)}</span></div>` : ''}
      ${s.note ? `<div class="nt">${esc(s.note)}</div>` : ''}
      ${s.photo || s.maps || s.name ? `<div class="acts">${thumb(s.photo)}${extLink(s.maps ? safeUrl(s.maps) : mapSearchLink(s.name), 'pin', t('แผนที่'))}</div>` : ''}
    </div>`).join('') : `<div class="empty">${t('ยังไม่มีที่พัก')}</div>`}
  </div>
  <div class="block">${head('siren', t('เบอร์ฉุกเฉิน'), t('สถานทูตไทยและเบอร์ฉุกเฉินท้องถิ่น'), add('addContact'))}
  ${contacts.length ? contacts.map(c => `<div class="ticket">
      <div class="tt serif" style="font-size:17px">${esc(t(c.title))}</div>
      ${c.phone ? `<a class="callnum" href="tel:${esc(String(c.phone).replace(/[^0-9+]/g, ''))}">${ico('phone', 16)}${esc(c.phone)}</a>` : ''}
      ${c.note ? `<div class="nt">${esc(c.note)}</div>` : ''}
      <div class="acts"><button type="button" class="ghost" data-act="editContact" data-id="${esc(c.id)}">${ico('edit', 15)}${t('แก้ไข')}</button></div>
    </div>`).join('') : `<div class="empty">${t('ยังไม่มีเบอร์ติดต่อฉุกเฉิน')}<br>${t('เลือกประเทศตอนแก้ไขทริป แอปจะเติมให้อัตโนมัติ')}</div>`}
  </div>
  <div class="block">${head('receipt', t('สรุปทริป'), t('ยอดจองล่วงหน้ากับค่าใช้จ่ายระหว่างทริป'), `<button class="link" data-act="shareSummary">${ico('share', 16)}${t('แชร์สรุป')}</button>`)}<div class="kv">
    <span>${t('ตั๋วและที่พักที่จองไว้')}</span><b class="num">${baht(pre)}</b>
    <span>${t('ค่าใช้จ่ายระหว่างทริป')}</span><b class="num">${tm(expenseItems().reduce((a, e) => a + e.amount, 0))}</b>
    ${isFx() ? `<span>${t('คิดเป็นเงินบาท')}</span><b class="num">≈ ${baht(expenseItems().reduce((a, e) => a + thbOf(e), 0))}</b>` : ''}</div>
    ${isFx() ? `<div class="tiny" style="margin-top:12px">${t('สกุลเงิน')}: ${tf('{c}, เรทประมาณ 1 = {r} บาท', { c: esc(x.currency), r: fmtRate(+x.rate || 0) })}</div>` : ''}</div>`;
}
function budgetBar(spent, budget) {
  const pct = Math.min(100, Math.round(spent / budget * 100)), over = spent > budget;
  return `<div class="bbar"><div class="bb-track"><div class="bb-fill${over ? ' over' : ''}" style="width:${pct}%"></div></div>
    <div class="tiny">${tf('ใช้ไป {a} จากงบ {b} ที่ตั้งไว้ ({p}%)', { a: baht(spent), b: baht(budget), p: pct })}</div></div>`;
}

/* ----- แผนรายวัน ----- */
function stopName(s) { return s.myName || s.name || t('สถานที่'); }
function viewPlan(x) {
  const days = tripDays(x);
  if (!days.length) return `<div class="block empty">${t('ตั้งวันเริ่มและวันจบทริปก่อน')}</div>`;
  T.day = Math.min(T.day, days.length - 1);
  const d = days[T.day], dc = dayColor(d);
  const items = [...of('stop'), ...of('leg')].filter(r => r.date === d).sort(byTime);
  const fls = of('flight').filter(f => f.date === d);
  const stays = of('stay').filter(s => s.checkin <= d && d < s.checkout);
  let prev = null;
  const tl = items.map(r => {
    if (r.kind === 'leg') return `<div class="tli leg tap" data-act="editLeg" data-id="${esc(r.id)}">
      <div class="tm">${esc(r.time || '')}</div><div class="dot"></div>
      <div><div class="tt">${ico(MODEI[r.mode] || 'route', 15)}${esc(modeLabel(r.mode))}</div>
        <div>${esc(r.from || '?')} → ${esc(r.to || '?')}</div>
        ${r.line ? `<div class="sub">${esc(r.line)}</div>` : ''}${r.note ? `<div class="nt">${esc(r.note)}</div>` : ''}
        ${r.cost > 0 ? `<div class="cost">${tm(r.cost)}, ${esc(t(r.method))}, ${tf('{x} จ่าย', { x: esc(r.payer) })}</div>` : ''}</div></div>`;
    const q = r.name || r.myName;
    const dir = prev ? mapDirLink(prev.name || prev.myName, q) : '';
    prev = r;
    return `<div class="tli tap" data-act="editStop" data-id="${esc(r.id)}">
      <div class="tm">${esc(r.time || '')}</div><div class="dot"></div>
      <div><div class="tt">${esc(stopName(r))}</div>
        ${r.myName && r.name && r.myName !== r.name ? `<div class="sub">${esc(r.name)}</div>` : ''}
        ${r.note ? `<div class="nt">${esc(r.note)}</div>` : ''}
        <div class="acts">${thumb(r.photo)}
          ${extLink(r.maps ? safeUrl(r.maps) : mapSearchLink(q), 'pin', t('แผนที่'))}
          ${dir ? extLink(dir, 'route', t('เส้นทาง')) : ''}</div></div></div>`;
  }).join('');
  return `<div class="days">${days.map((y, i) => `<button class="${i === T.day ? 'on' : ''}" style="--dc:${dayColor(y)}" data-act="day" data-i="${i}"><b>${tf('วันที่ {n}', { n: i + 1 })}</b><span>${wday(y)} ${fmtD(y)}</span></button>`).join('')}</div>
    <div class="dayhead" style="--dc:${dc}"><i></i><h2>${wday(d, true)}</h2><span>${fmtD(d)}</span></div>
    ${fls.map(f => `<div class="banner">${ico('plane', 16)}${esc(t(f.dir))} ${esc(f.flightNo || '')} ${esc(f.dep || '')}  ${esc(f.from || '')} → ${esc(f.to || '')}${whoTag(f, x)}</div>`).join('')}
    <div class="block" style="--dc:${dc}"><div class="tl">${tl || `<div class="empty">${t('ยังไม่มีแผนวันนี้')}<br>${t('เริ่มจากเพิ่มสถานที่แรก')}</div>`}</div>
      <div class="pair"><button class="ghost" data-act="addStop">${ico('pin', 16)}${t('สถานที่')}</button><button class="ghost" data-act="addLeg">${ico('route', 16)}${t('การเดินทาง')}</button></div></div>
    ${stays.map(s => `<div class="banner">${ico('bed', 16)}${tf('คืนนี้พักที่ {x}', { x: esc(s.name) })}${whoTag(s, x)}</div>`).join('')}`;
}

/* ----- ค่าใช้จ่าย & หารเงิน ----- */
function expenseItems() {
  const x = trip();
  const legs = of('leg').filter(l => l.cost > 0).map(l => ({ id: l.id, origin: 'leg', title: `${modeLabel(l.mode)} ${l.from || ''} → ${l.to || ''}`,
    date: l.date, amount: l.cost, payer: l.payer || x.members[0], method: l.method || 'เงินสด', mode: 'equal', by: l.by,
    members: l.members && l.members.length ? l.members : x.members, category: 'เดินทาง', rate: l.rate, thbActual: l.thbActual, tcMode: l.tcMode, note: l.note, _pend: l._pend }));
  return [...of('exp').map(e => Object.assign({}, e, { origin: 'exp' })), ...legs];
}
function shares(e) {
  if (e.mode === 'custom') return e.parts || {};
  if (e.mode === 'self') return { [e.payer]: e.amount };
  const m = e.members && e.members.length ? e.members : trip().members, o = {};
  m.forEach(n => o[n] = e.amount / m.length);
  return o;
}
function settleThb(s) {
  const x = trip(), cur = s.cur || x.currency;
  if (cur === 'THB') return s.amount;
  return s.amount * (s.method === 'เงินสด' && walletRate('เงินสด', userOf(s.from) || s.by || x.owner) || +x.rate || 0);
}
function balances(list) { // ทุกยอดเป็นเงินบาท
  const bal = {}, paid = {}, used = {};
  trip().members.forEach(m => { bal[m] = 0; paid[m] = 0; used[m] = 0; });
  (list || expenseItems()).forEach(e => {
    const thb = thbOf(e), k = e.amount ? thb / e.amount : 0;
    paid[e.payer] = (paid[e.payer] || 0) + thb; bal[e.payer] = (bal[e.payer] || 0) + thb;
    const s = shares(e); for (const n in s) { used[n] = (used[n] || 0) + s[n] * k; bal[n] = (bal[n] || 0) - s[n] * k; }
  });
  of('settle').forEach(s => { const v = settleThb(s); bal[s.from] = (bal[s.from] || 0) + v; bal[s.to] = (bal[s.to] || 0) - v; });
  return { bal, paid, used };
}
// สรุปตามหมวด ทั้งทริป หรือเฉพาะส่วนของคนหนึ่ง: [หมวด, ยอดสกุลทริป, ยอดบาท]
function catStats(person, list) {
  const m = {};
  (list || expenseItems()).forEach(e => {
    const f = !person ? 1 : e.amount ? (shares(e)[person] || 0) / e.amount : 0;
    if (!f) return;
    const y = m[e.category || 'อื่นๆ'] = m[e.category || 'อื่นๆ'] || [0, 0];
    y[0] += e.amount * f; y[1] += thbOf(e) * f;
  });
  return Object.entries(m).map(([c, [a, b]]) => [c, a, b]).sort((p, q) => q[2] - p[2] || q[1] - p[1]);
}
const CCOL = i => `var(--c${Math.min(i, 5) + 1})`;
function catBlock(x, list, withPick) {
  const who = withPick && x.members.includes(T.who) ? T.who : '';
  const rows = catStats(who, list);
  const fx = rows.reduce((a, r) => a + r[1], 0), thb = rows.reduce((a, r) => a + r[2], 0);
  const pick = withPick && x.members.length > 1 ? `<div class="pick">${['', ...x.members].map(m =>
    `<button class="chip${m === who ? ' on' : ''}" data-act="who" data-v="${esc(m)}">${m ? esc(m) + (m === myName() ? ' ' + t('(คุณ)') : '') : t('ทั้งทริป')}</button>`).join('')}</div>` : '';
  const hd = head('pie', t('ใช้จ่ายไปกับอะไร'), withPick ? t('แยกตามหมวด ดูทั้งทริปหรือรายคน') : t('แยกตามหมวด'));
  if (!rows.length) return `<div class="block">${hd}${pick}<div class="empty">${who ? tf('ยังไม่มีค่าใช้จ่ายของ {x}', { x: esc(who) }) : t('ยังไม่มีค่าใช้จ่าย')}</div></div>`;
  const fold = rows.length > 6 && !T.catAll;
  const shown = fold ? rows.slice(0, 5) : rows, rest = fold ? rows.slice(5) : [];
  const restFx = rest.reduce((a, r) => a + r[1], 0), restThb = rest.reduce((a, r) => a + r[2], 0);
  const pct = v => thb ? Math.round(v / thb * 100) : 0;
  const segs = [...shown.map((r, i) => [r[2], CCOL(i)]), ...(rest.length ? [[restThb, 'var(--c6)']] : [])];
  return `<div class="block">${hd}${pick}
    <div class="ctot"><b class="num">${tm(fx)}</b>${isFx() ? `<span class="num">≈ ${baht(thb)}</span>` : ''}</div>
    <div class="stack">${segs.map(([v, c]) => `<i style="flex:${Math.max(v, 0.0001)};background:${c}"></i>`).join('')}</div>
    ${shown.map((r, i) => `<div class="leg"><span class="ci" style="background:${CCOL(i)}">${ico(catIco(r[0]), 15)}</span><span>${esc(t(r[0]))}</span>
      <b class="num">${tm(r[1])}</b><em class="num">${pct(r[2])}%</em></div>`).join('')}
    ${rest.length ? `<button class="leg" data-act="catAll"><span class="ci" style="background:var(--c6);color:var(--ink2)">${ico('dots', 15)}</span><span>${tf('อีก {n} หมวด', { n: rest.length })}</span>
      <b class="num">${tm(restFx)}</b><em class="num">${pct(restThb)}%</em></button>` : ''}
    ${rows.length > 6 && T.catAll ? `<button class="link" style="margin-top:6px" data-act="catAll">${t('ย่อ')}</button>` : ''}</div>`;
}
function suggestPay(bal) {
  const cr = [], db = [];
  for (const n in bal) { const v = Math.round(bal[n] * 100) / 100; if (v > 0.009) cr.push([n, v]); else if (v < -0.009) db.push([n, -v]); }
  cr.sort((a, b) => b[1] - a[1]); db.sort((a, b) => b[1] - a[1]);
  const out = []; let i = 0, j = 0;
  while (i < db.length && j < cr.length) {
    const y = Math.min(db[i][1], cr[j][1]);
    out.push({ from: db[i][0], to: cr[j][0], amount: Math.round(y * 100) / 100 });
    db[i][1] -= y; cr[j][1] -= y;
    if (db[i][1] < 0.01) i++; if (cr[j][1] < 0.01) j++;
  }
  return out;
}
// "บันทึกโดย" แสดงเฉพาะรายการที่เพื่อนเป็นคนบันทึก
const recBy = e => shared() && e.by && e.by !== ME.username ? ', ' + tf('บันทึกโดย {x}', { x: esc((trip().access || {})[e.by] || e.by) }) : '';
const splitLabel = (e, x) => e.mode === 'self' ? t('ส่วนตัว') : e.mode === 'custom' ? t('แยกตามที่กิน') : tf('หาร {n} คน', { n: (e.members || x.members).length });
function myBlock(bal, paid, used) {
  const me = myName(), b = Math.round((bal[me] || 0) * 100) / 100;
  return `<div class="block mine">${head('user', tf('ส่วนของฉัน ({x})', { x: esc(me) }), t('ยอดที่เป็นของคุณจริงๆ หลังหารกันแล้ว'))}<div class="kv">
    <span>${t('ใช้ไปจริง')}</span><b class="big2 num">${baht(used[me] || 0)}</b>
    <span>${t('ฉันจ่ายไปแล้ว')}</span><b class="num">${baht(paid[me] || 0)}</b>
    <span>${t(b > 0 ? 'เพื่อนต้องคืนฉัน' : b < 0 ? 'ฉันต้องคืนเพื่อน' : 'ยอดค้าง')}</span>
    <b class="num ${b > 0 ? 'in' : b < 0 ? 'out' : ''}">${b ? baht(Math.abs(b)) : t('เคลียร์แล้ว')}</b></div></div>`;
}
// รายการค่าใช้จ่าย จัดกลุ่มตามวัน แตะแล้วเปิดดูรายละเอียดก่อน
function expList(items, x) {
  const byDate = {}; items.forEach(e => (byDate[e.date || ''] = byDate[e.date || ''] || []).push(e));
  return Object.keys(byDate).map(d => `<div class="dh" style="--dc:${d ? dayColor(d) : 'var(--ink3)'}"><i class="dd"></i><span>${d ? wday(d) + ' ' + fmtD(d) : t('ไม่ระบุวัน')}</span><span class="sp"></span><span class="num">${tm(byDate[d].reduce((a, e) => a + e.amount, 0))}</span></div>` +
    byDate[d].map(e => `<div class="row tap${e._pend ? ' pend' : ''}" data-act="detail" data-id="${esc(e.id)}">
      <span class="ic">${ico(catIco(e.category), 19)}</span>
      <div class="c"><div class="t">${esc(e.title || t(e.category))}${e.photo ? ico('camera', 14) : ''}${estimated(e) ? `<span class="pill est">${t('ยอดประมาณ')}</span>` : ''}</div>
      <div class="s">${e.title ? esc(t(e.category)) + ', ' : ''}${e.mode === 'self' ? '' : tf('{x} จ่าย', { x: esc(e.payer) }) + ', '}${esc(t(e.method))}${e.mode === 'self' ? '' : ', ' + splitLabel(e, x)}${recBy(e)}</div></div>
      <div class="v num">${tm(e.amount)}${isFx() ? `<small>${estimated(e) ? '≈ ' : ''}${baht(thbOf(e))}</small>` : ''}</div></div>`).join('')).join('');
}
const sectionHead = (icon, title, sum) => `<div class="sechead">${ico(icon, 18)}<b>${title}</b><span class="num">${sum}</span></div>`;
function viewMoney(x) {
  const multi = x.members.length > 1, me = myName();
  const byNew = (a, b) => (b.date || '').localeCompare(a.date || '');
  const all = expenseItems();
  // แยกเป็น 2 หัวข้อเสมอ: ค่าใช้จ่ายที่แชร์กับคนในทริป (คิดหารตามเงื่อนไขการจ่าย) กับค่าใช้จ่ายส่วนตัวที่ไม่หารใคร
  const personal = all.filter(e => e.mode === 'self' && (e.payer === me || e.by === ME.username)).sort(byNew);
  const tripItems = all.filter(e => e.mode !== 'self').sort(byNew);
  const sum = a => a.reduce((s, e) => s + e.amount, 0), sumThb = a => a.reduce((s, e) => s + thbOf(e), 0);
  const heroOf = (label, items) => { const est = items.filter(estimated);
    return `<div class="hero"><div class="lbl">${label}</div><div class="big num">${tm(sum(items))}</div>
      ${isFx() ? `<div class="lbl num">≈ ${baht(sumThb(items))}${est.length ? ', ' + tf('{n} รายการยังเป็นยอดประมาณ', { n: est.length }) : ''}</div>` : ''}</div>`; };

  if (!multi) { const items = all.sort(byNew);
    return heroOf(t('ใช้ไปทั้งทริป'), items) + catBlock(x, items, false) + `
    <div class="block">${head('list', t('รายการ'), t('เรียงตามวัน ล่าสุดอยู่บน'))}
      ${items.length ? expList(items, x) : `<div class="empty">${t('ยังไม่มีค่าใช้จ่าย')}</div>`}</div>`; }

  const { bal, paid, used } = balances(tripItems);
  const est = tripItems.filter(estimated), sug = suggestPay(bal);
  const sets = of('settle').sort(byNew);
  const sharedSection = `${sectionHead('users', t('ค่าใช้จ่ายที่แชร์กับคนในทริป'), tm(sum(tripItems)))}
  ${heroOf(t('ค่าใช้จ่ายทริป'), tripItems)}
  ${myBlock(bal, paid, used)}
  ${catBlock(x, tripItems, true)}
  <div class="block">${head('users', t('ใครจ่าย ใครใช้'), isFx() ? t('ยอดเป็นเงินบาท ทุกคนเห็นตรงกัน') : t('ยอดที่แต่ละคนจ่ายและใช้จริง'))}
    ${x.members.map(m => { const b = Math.round((bal[m] || 0) * 100) / 100;
      return `<div class="who"><div>${esc(m)}${m === me ? ' ' + t('(คุณ)') : ''}</div><div class="v num ${b > 0 ? 'in' : b < 0 ? 'out' : ''}">${b > 0 ? tf('ได้คืน {x}', { x: baht(b) }) : b < 0 ? tf('ค้าง {x}', { x: baht(-b) }) : t('เคลียร์แล้ว')}</div>
        <div class="s">${tf('จ่ายไป {a}  ใช้ {b}', { a: baht(paid[m] || 0), b: baht(used[m] || 0) })}</div></div>`; }).join('')}</div>
  <div class="block">${head('swap', t('ต้องคืนเงิน'), t('โอนน้อยครั้งที่สุดให้ครบ'))}
    ${sug.length ? sug.map(s => `<div class="row"><div class="c"><div class="t">${esc(s.from)} → ${esc(s.to)}</div>
      <div class="s num">${baht(s.amount)}${isFx() && +x.rate ? `  (≈ ${tm(s.amount / x.rate)})` : ''}</div></div>
      <button class="ghost" data-act="doSettle" data-from="${esc(s.from)}" data-to="${esc(s.to)}" data-amt="${s.amount}">${t('จ่ายแล้ว')}</button></div>`).join('')
      : `<div class="empty" style="padding:8px">${t('เคลียร์กันครบแล้ว')}</div>`}
    ${est.length && sug.length ? `<div class="tiny">${t('บางรายการยังใช้เรทประมาณ ยอดจะตรงขึ้นเมื่อใส่ยอดเงินบาทที่ถูกตัดจริง')}</div>` : ''}
    ${sets.length ? `<div class="dh" style="margin-top:16px"><span>${t('ประวัติการคืนเงิน')}</span></div>` + sets.map(s => `<div class="row tap" data-act="editSettle" data-id="${esc(s.id)}">
      <div class="c"><div class="t">${esc(s.from)} → ${esc(s.to)}</div><div class="s">${fmtD(s.date)}, ${esc(t(s.method))}</div></div><div class="v num">${money(s.amount, s.cur || x.currency)}</div></div>`).join('') : ''}
  </div>
  <div class="block">${head('list', t('รายการค่าใช้จ่ายทริป'), t('เรียงตามวัน ล่าสุดอยู่บน'))}
    ${tripItems.length ? expList(tripItems, x) : `<div class="empty">${t('ยังไม่มีค่าใช้จ่าย')}</div>`}</div>`;
  const personalSection = `${sectionHead('lock', t('ค่าใช้จ่ายส่วนตัวของฉัน'), tm(sum(personal)))}
  <div class="privacy">${ico('lock', 15)}<span>${t('เห็นเฉพาะคุณ ไม่รวมในการหารกับเพื่อน')}</span></div>
  ${personal.length ? catBlock(x, personal, false) : ''}
  <div class="block">${head('list', t('รายการส่วนตัว'), t('เรียงตามวัน ล่าสุดอยู่บน'))}
    ${personal.length ? expList(personal, x) : `<div class="empty">${t('ยังไม่มีค่าใช้จ่ายส่วนตัว')}<br>${t('กดปุ่ม + เพื่อบันทึกของที่จ่ายคนเดียว')}</div>`}</div>`;
  return sharedSection + personalSection;
}

// ดูรายละเอียดค่าใช้จ่ายก่อน ค่อยกดแก้ไข
function expDetail(id) {
  const e = expenseItems().find(y => y.id === id); if (!e) return;
  const x = trip(), s = shares(e), k = e.amount ? thbOf(e) / e.amount : 0, ri = rateInfo(e);
  const tcLabel = e.method === 'Travel card' && isFx() ? ', ' + (tcAuto(e) ? t('เงินบาท เรทตอนจ่าย') : tf('ยอด {c} ที่แลกไว้', { c: x.currency })) : '';
  openPanel(e.title || t(e.category), `
  <div class="block dtop"><span class="ic big">${ico(catIco(e.category), 26)}</span>
    <div class="big num">${tm(e.amount)}</div>
    ${isFx() ? `<div class="lbl num">${estimated(e) ? '≈ ' : ''}${baht(thbOf(e))}${estimated(e) ? `<span class="pill est">${t('ยอดประมาณ')}</span>` : ''}</div>` : ''}
    <div class="kv" style="margin-top:16px">
      <span>${t('หมวด')}</span><b>${esc(t(e.category))}</b>
      <span>${t('วัน')}</span><b>${e.date ? wday(e.date) + ' ' + fmtD(e.date) : '—'}</b>
      <span>${t('ใครออกเงินไปก่อน')}</span><b>${esc(e.payer)}</b>
      <span>${t('จ่ายด้วย')}</span><b>${esc(t(e.method))}${esc(tcLabel)}</b>
      ${isFx() && ri.rate ? `<span>${t('เรทที่ใช้')}</span><b>${tf('1 = {r} บาท', { r: fmtRate(ri.rate) })}<br><small>${esc(t(ri.src))}</small></b>` : ''}
      ${e.by && shared() ? `<span>${t('บันทึกโดย')}</span><b>${esc((x.access || {})[e.by] || e.by)}</b>` : ''}
    </div></div>
  <div class="block">${head('users', t('แบ่งกันยังไง'), splitLabel(e, x))}
    ${Object.keys(s).map(m => `<div class="row"><div class="c"><div class="t">${esc(m)}${m === myName() && x.members.length > 1 ? ' ' + t('(คุณ)') : ''}</div></div>
      <div class="v num">${tm(s[m])}${isFx() ? `<small>≈ ${baht(s[m] * k)}</small>` : ''}</div></div>`).join('')}</div>
  ${e.photo ? `<div class="block">${head('camera', t('รูปใบเสร็จ / รูปร้าน'), t('แตะเพื่อดูรูปเต็ม'))}
    ${T.thumbs[e.photo] ? `<img class="receipt" data-act="viewp" data-id="${esc(e.photo)}" data-thumb="${esc(e.photo)}" alt="">`
      : `<button class="ghost" data-act="viewp" data-id="${esc(e.photo)}">${ico('camera', 16)}${t('ดูรูป')}</button>`}</div>` : ''}
  ${e.note ? `<div class="block">${head('list', t('โน้ต'), '')}<div class="nt" style="margin:0">${esc(e.note)}</div></div>` : ''}
  <button class="btn" data-act="detailEdit" data-id="${esc(id)}" data-o="${e.origin}">${ico('edit', 18)}${t('แก้ไขรายการนี้')}</button>`);
  fillThumbs($('#sheet'));
}

/* ----- กระเป๋าเงิน (เห็นเฉพาะเจ้าของ) ----- */
function viewWallet(x) {
  const me = myName(), fx = x.currency;
  const mine = expenseItems().filter(e => e.payer === me);
  const by = {}, byThb = {};
  METHODS.forEach(m => { by[m] = 0; byThb[m] = 0; });
  mine.forEach(e => { by[e.method] = (by[e.method] || 0) + e.amount; byThb[e.method] = (byThb[e.method] || 0) + thbOf(e); });
  const cs = cardState();
  const cashAdj = of('settle').filter(s => s.method === 'เงินสด' && (s.cur || fx) === fx).reduce((a, s) => a + (s.to === me ? s.amount : s.from === me ? -s.amount : 0), 0);
  const tops = of('topup').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const cashIn = tops.filter(y => y.wallet === 'เงินสด').reduce((a, y) => a + y.amount, 0);
  const thbSpent = tops.reduce((a, y) => a + (+y.thb || 0), 0);
  const { paid, used } = balances();
  const cashRate = walletRate('เงินสด'), cardRate = walletRate('Travel card');
  const est = mine.some(estimated);
  const myBudget = of('budget')[0];
  return `
  ${shared(x) ? `<div class="privacy">${ico('lock', 15)}<span>${t('หน้านี้เห็นเฉพาะคุณ เพื่อนในทริปไม่เห็นการแลกเงินและยอดเงินในกระเป๋าของคุณ')}</span></div>` : ''}
  <div class="block mine">${head('user', t('เงินของฉันในทริปนี้'), isFx() ? t('คิดเป็นเงินบาท แม้ไม่ได้บันทึกการแลกเงิน') : '')}<div class="kv">
    <span>${t('ส่วนที่ใช้จริง')}</span><b class="big2 num">${baht(used[me] || 0)}</b>
    <span>${t('จ่ายออกไปทั้งหมด')}${x.members.length > 1 ? `<br><small>${t('รวมที่ออกให้เพื่อน')}</small>` : ''}</span><b class="num">${est ? '≈ ' : ''}${baht(paid[me] || 0)}</b>
    ${METHODS.filter(m => by[m]).map(m => `<span style="display:flex;align-items:center;gap:6px">${ico(METHI[m], 16)}${esc(t(m))}</span><b class="num">${tm(by[m])}${isFx() ? `<br><small>≈ ${baht(byThb[m])}</small>` : ''}</b>`).join('')}
    ${thbSpent ? `<span>${t('เงินบาทที่ใช้แลกหรือเติม')}</span><b class="num">${baht(thbSpent)}</b>` : ''}</div>
    ${isFx() ? `<div class="tiny">${t('ถ้าไม่ได้บันทึกการแลกเงิน แอปใช้เรทวันที่บันทึกรายการแทน')}</div>` : ''}
    ${myBudget && myBudget.amount > 0 ? budgetBar(used[me] || 0, myBudget.amount) : ''}
    <button type="button" class="link" style="margin-top:10px" data-act="editBudget">${ico('target', 16)}${t(myBudget && myBudget.amount > 0 ? 'งบส่วนตัว' : 'ตั้งงบส่วนตัว')}</button>
  </div>
  <div class="block">${head('cash', t('เงินสดในมือ'), t('ที่แลกมา และที่เหลืออยู่'))}<div class="kv">
    <span>${t('คงเหลือ')}</span><b class="big2 num">${tm(cashIn + cashAdj - by['เงินสด'])}</b>
    <span>${t('แลกหรือถือมา')}</span><b class="num">${tm(cashIn)}</b>
    <span>${t('จ่ายไป')}</span><b class="num">${tm(by['เงินสด'])}</b>
    ${isFx() && cashRate ? `<span>${t('เรทเฉลี่ยที่แลกมา')}</span><b class="num">${tf('1 = {r} บาท', { r: fmtRate(cashRate) })}</b>` : ''}
    ${cashAdj ? `<span>${t('รับหรือคืนเงินเพื่อน')}</span><b class="num">${cashAdj > 0 ? '+' : '−'}${tm(Math.abs(cashAdj))}</b>` : ''}</div></div>
  <div class="block">${head('globe', t('Travel card'), isFx() ? t('ยอดที่แลกไว้ และเงินบาทในบัตร') : '')}<div class="kv">
    <span>${isFx() ? tf('ยอด {c} ในบัตร', { c: esc(fx) }) : t('คงเหลือ')}</span><b class="big2 num ${cs.fxLeft < 0 ? 'out' : ''}">${tm(cs.fxLeft)}</b>
    <span>${isFx() ? tf('แลกเป็น {c} ไว้', { c: esc(fx) }) : t('เติมเข้า')}</span><b class="num">${tm(cs.fxIn)}</b>
    <span>${t('ใช้ไป')}</span><b class="num">${tm(cs.fxUsed)}</b>
    ${isFx() && cardRate ? `<span>${t('เรทเฉลี่ยที่แลกเข้าบัตร')}</span><b class="num">${tf('1 = {r} บาท', { r: fmtRate(cardRate) })}</b>` : ''}
    ${isFx() && (cs.thbIn || cs.auto.length) ? `
    <span>${t('เงินบาทในบัตร')}</span><b class="big2 num ${cs.thbIn && cs.thbLeft < 0 ? 'out' : ''}">${cs.thbIn ? baht(cs.thbLeft) : '—'}</b>
    ${cs.thbIn ? `<span>${t('เติมเงินบาท')}</span><b class="num">${baht(cs.thbIn)}</b>` : ''}
    <span>${tf('ตัดเงินบาท ({x})', { x: tm(cs.autoFx) })}</span><b class="num">${cs.auto.some(estimated) ? '≈ ' : ''}${baht(cs.thbUsed)}</b>` : ''}</div>
    ${isFx() && cs.fxLeft < 0 ? `<div class="tiny">${tf('ใช้เกินยอด {c} ที่แลกไว้ ถ้าบัตรตัดเงินบาทแทน ให้แก้รายการนั้นเป็น "เงินบาท เรทตอนจ่าย"', { c: esc(fx) })}</div>` : ''}</div>
  ${tops.length ? `<div class="block">${head('clock', t('ประวัติการแลกและเติมเงิน'), t('สิ่งที่คุณบันทึกไว้'))}${tops.map(y => { const thb = isFx() && tcur(y) === 'THB';
    return `<div class="row tap" data-act="editTopup" data-id="${esc(y.id)}"><span class="ic">${ico(y.wallet === 'เงินสด' ? 'cash' : 'globe', 18)}</span><div class="c"><div class="t">${esc(t(y.wallet))}${thb ? ' ' + t('(เงินบาท)') : ''}</div>
      <div class="s">${fmtD(y.date)}${y.thb && !thb ? ', ' + tf('จ่าย {x}', { x: baht(y.thb) }) : ''}${y.note ? ', ' + esc(y.note) : ''}</div></div>
      <div class="v num in">+${thb ? baht(y.amount) : tm(y.amount)}</div></div>`; }).join('')}</div>` : ''}`;
}

