// ฟอร์มแก้ไขข้อมูลทริปแต่ละชนิด (เที่ยวบิน ที่พัก ค่าใช้จ่าย ฯลฯ) + แชร์/เข้าร่วมทริป
/* ----- ฟอร์มของทริป ----- */
function tripForm(x) {
  const isNew = !x;
  openForm({
    title: t(isNew ? 'ทริปใหม่' : 'แก้ไขทริป'),
    data: x ? { ...x, membersText: x.members.join(', '), rate: x.currency === 'THB' ? '' : x.rate } : { membersText: ME.username, currency: 'JPY', mapProvider: 'Google Maps' },
    fields: [
      { k: 'name', label: t('ชื่อทริป'), ph: t('เช่น โตเกียว ใบไม้เปลี่ยนสี') },
      { k: 'scope', label: t('ประเภท'), type: 'seg', options: ['ต่างประเทศ', 'ในประเทศ'] },
      { k: 'dest', label: t('ปลายทาง'), ph: t('เช่น โตเกียว–เกียวโต, เชียงใหม่') },
      { k: 'country', label: t('ประเทศ (ใช้เติมเบอร์ฉุกเฉิน/สถานทูตไทยให้อัตโนมัติ)'), type: 'select', raw: true,
        options: [['', t('— เลือกประเทศ —')], ...COUNTRIES.map(([c, th, en]) => [c, LANG === 'en' ? en : th])], when: ['scope', 'ต่างประเทศ'] },
      { k: 'start', label: t('วันเริ่มทริป'), type: 'date' },
      { k: 'end', label: t('วันจบทริป'), type: 'date' },
      { k: 'membersText', label: t(isNew ? 'คนที่ไป คั่นด้วย , (ชื่อแรกคือคุณ ใช้ชื่อที่เพื่อนเรียก)' : 'คนที่ไป คั่นด้วย ,'), ph: t('เช่น ท็อป, อั้ม, บีม') },
      ...(isNew ? [{ k: 'info', type: 'note', text: t('เพื่อนที่ยังไม่มีบัญชีก็ใส่ชื่อไว้ก่อนได้ บันทึกทริปแล้วกดปุ่มแชร์เพื่อส่งโค้ดให้เพื่อนเข้ามาเลือกชื่อตัวเอง') }] : []),
      { k: 'currency', label: t('สกุลเงินของประเทศที่ไป'), type: 'select', raw: true, options: CURS.map(([k, l]) => [k, LANG === 'en' ? `${k} ${CUR_EN[k]}` : l]), when: ['scope', 'ต่างประเทศ'] },
      { k: 'rate', label: t('เรทประมาณ: 1 หน่วย = กี่บาท (เว้นว่างไว้ แอปดึงเรทวันนี้ให้)'), type: 'number', when: ['scope', 'ต่างประเทศ'] },
      { k: 'mapProvider', label: t('แผนที่นำทาง (บางประเทศเช่นจีนเปิด Google Maps ไม่ได้ ให้ใช้ Apple Maps แทน)'), type: 'seg', options: ['Google Maps', 'Apple Maps'] }
    ],
    validate: o => !o.name ? t('ใส่ชื่อทริป') : !o.start || !o.end ? t('ใส่วันเริ่มและวันจบ') : o.end < o.start ? t('วันจบต้องไม่ก่อนวันเริ่ม') : '',
    onSave: async o => {
      o.members = [...new Set(o.membersText.split(/[,，]/).map(s => s.trim()).filter(Boolean))];
      if (!o.members.length) o.members = [ME.username];
      delete o.membersText; o.kind = 'trip';
      if (o.scope === 'ในประเทศ') { o.currency = 'THB'; o.country = ''; }
      if (o.currency === 'THB') o.rate = 1;
      else if (!(o.rate > 0)) {
        try { o.rate = (await run('getRate', o.currency)).rate; }
        catch (y) { throw new Error(t('ดึงเรทวันนี้ไม่ได้ ใส่เรทประมาณเองก่อน')); }
      }
      const r = await run('saveRec', o);
      if (isNew) {
        navPush(); T.id = r.id; T.recs = [r]; T.thumbs = {}; T.rates = {}; T.sub = 'overview'; T.day = 0;
        await addDefaultChecklist(r); await addDefaultContacts(r);
      } else upsert(r);
      renderTrips(); toast(t('บันทึกทริปแล้ว'));
    },
    delLabel: t('ลบทริปนี้ทั้งหมด'),
    onDelete: isNew ? null : async () => {
      if (!confirm(tf('ลบทริป "{x}" ทั้งหมด รวมแผน ค่าใช้จ่าย และรูป{y}?\nกู้คืนไม่ได้', { x: x.name, y: shared(x) ? t(' ของทุกคนในทริป') : '' }))) return false;
      await run('deleteRec', x.id); closeForm(); goList(); toast(t('ลบทริปแล้ว'));
    },
    extra: isNew ? '' : `<button type="button" class="ghost" data-act="dupTrip">${ico('copy', 16)}${t('ทำสำเนาทริปนี้ (เอาแผนไปใช้กับทริปใหม่)')}</button>`
  });
}
// เพิ่มเช็คลิสต์ตั้งต้นให้ทริปใหม่ (ในประเทศได้ชุดสั้น ต่างประเทศได้ชุดเต็ม)
const CHECK_COMMON = [['ยาประจำตัว', 'pill'], ['ที่ชาร์จ/พาวเวอร์แบงก์', 'plug']];
const CHECK_ABROAD = [['พาสปอร์ต / วีซ่า', 'idcard'], ['ประกันเดินทาง', 'shield'], ['ซิม/eSIM เน็ตต่างประเทศ', 'sim'], ['แจ้งธนาคารก่อนใช้บัตรต่างประเทศ', 'card']];
async function addDefaultChecklist(trip) {
  const items = trip.scope === 'ต่างประเทศ' ? [...CHECK_ABROAD, ...CHECK_COMMON] : CHECK_COMMON;
  for (const [title, icon] of items) {
    try { const r = await run('saveRec', { kind: 'check', tripId: trip.id, title, icon, done: false }); upsert(r); } catch (e) {}
  }
}
// เพิ่มเบอร์ฉุกเฉิน/สถานทูตไทยอัตโนมัติ ตามประเทศที่เลือกตอนสร้างทริป
async function addDefaultContacts(trip) {
  if (trip.scope !== 'ต่างประเทศ') return;
  const contacts = [];
  const e = EMBASSY[trip.country];
  if (e) {
    contacts.push({ title: t('สถานทูตไทย'), phone: e.phone, note: tf('{c}{m}', { c: e.city, m: e.more ? ' · ' + e.more : '' }) });
    contacts.push({ title: t('เบอร์ฉุกเฉินท้องถิ่น'), phone: e.emg.match(/\d[\d\/]*\d|\d/)?.[0] || '', note: e.emg });
  }
  contacts.push({ title: t('กรมการกงสุล (Call Center 24 ชม.)'), phone: '+66-2-572-8442', note: t('โทรจากไทย 0-2572-8442') });
  for (const c of contacts) {
    try { const r = await run('saveRec', { kind: 'contact', tripId: trip.id, ...c }); upsert(r); } catch (e2) {}
  }
}
async function dupTrip(tripId) {
  try {
    const r = await run('duplicateTrip', tripId);
    closeForm(); renderTrips(); await openTrip(r.id);
    toast(t('ทำสำเนาทริปแล้ว เที่ยวบิน/ที่พัก/แผนถูกคัดลอกมาให้ (ไม่รวมค่าใช้จ่ายและรูป)'));
  } catch (x) { toast(x.message); }
}
async function dupTrip(tripId) {
  try {
    const r = await run('duplicateTrip', tripId);
    closeForm(); renderTrips(); await openTrip(r.id);
    toast(t('ทำสำเนาทริปแล้ว เที่ยวบิน/ที่พัก/แผนถูกคัดลอกมาให้ (ไม่รวมค่าใช้จ่ายและรูป)'));
  } catch (x) { toast(x.message); }
}
function flightForm(f) {
  const x = trip();
  openForm({
    title: t(f ? 'แก้ไขเที่ยวบิน' : 'เพิ่มเที่ยวบิน'), data: f || { date: x.start },
    fields: [
      { k: 'dir', label: t('เที่ยวบิน'), type: 'seg', options: ['ขาไป', 'ขากลับ', 'ต่อเครื่อง'] },
      { k: 'status', label: t('สถานะตั๋ว'), type: 'seg', options: ['ยังไม่ซื้อ', 'ซื้อตั๋วแล้ว', 'เช็คอินแล้ว'] },
      { k: 'airline', label: t('สายการบิน'), ph: t('เช่น Thai Airways') },
      { k: 'flightNo', label: t('เที่ยวบิน'), ph: t('เช่น TG682') },
      { k: 'date', label: t('วันบิน'), type: 'date' },
      { k: 'dep', label: t('เวลาออก'), type: 'time' },
      { k: 'arr', label: t('เวลาถึง (เวลาท้องถิ่น)'), type: 'time' },
      { k: 'from', label: t('ต้นทาง'), type: 'airport', ph: t('พิมพ์รหัสสนามบิน 3 ตัว เช่น BKK') },
      { k: 'to', label: t('ปลายทาง'), type: 'airport', ph: t('พิมพ์รหัสสนามบิน 3 ตัว เช่น HND') },
      { k: 'ref', label: t('รหัสการจอง (PNR)') },
      { k: 'seat', label: t('ที่นั่ง') },
      { k: 'price', label: t('ราคาตั๋ว (บาท)'), type: 'number' },
      { k: 'pass', label: t('บอร์ดดิ้งพาส / e-ticket'), type: 'photo' },
      { k: 'note', label: t('โน้ต'), type: 'textarea', ph: t('เช่น น้ำหนักกระเป๋า, เทอร์มินัล, เกต') },
      ...(x.members.length > 1 ? [{ k: 'who', label: t('ใครไปเที่ยวบินนี้'), type: 'checks', options: x.members }] : [])
    ],
    onSave: saver('flight'), onDelete: f ? deleter(f.id) : null
  });
}
function stayForm(s) {
  const x = trip();
  openForm({
    title: t(s ? 'แก้ไขที่พัก' : 'เพิ่มที่พัก'), data: s || { checkin: x.start, checkout: x.end },
    fields: [
      { k: 'maps', label: t('ลิงก์แผนที่ (Google Maps หรือ Apple Maps)'), type: 'maps', target: 'name' },
      { k: 'name', label: t('ชื่อที่พัก') },
      { k: 'checkin', label: t('เช็คอิน'), type: 'date' },
      { k: 'checkout', label: t('เช็คเอาท์'), type: 'date' },
      { k: 'status', label: t('สถานะ'), type: 'seg', options: ['ยังไม่จอง', 'จองแล้ว'] },
      { k: 'price', label: t('ราคารวม (บาท)'), type: 'number' },
      { k: 'photo', label: t('รูป'), type: 'photo' },
      { k: 'note', label: t('โน้ต'), type: 'textarea', ph: t('เช่น เลขที่จอง, เวลาเช็คอิน, ใกล้สถานีไหน') },
      ...(x.members.length > 1 ? [{ k: 'who', label: t('ใครพักที่นี่'), type: 'checks', options: x.members }] : [])
    ],
    validate: o => !o.name ? t('ใส่ชื่อที่พัก') : o.checkout && o.checkin && o.checkout < o.checkin ? t('วันเช็คเอาท์ต้องหลังเช็คอิน') : '',
    onSave: saver('stay'), onDelete: s ? deleter(s.id) : null
  });
}
function checkForm(c) {
  openForm({
    title: t(c ? 'แก้ไขรายการ' : 'เพิ่มรายการเช็คลิสต์'), data: c || { icon: 'dots' },
    fields: [
      { k: 'title', label: t('รายการ'), ph: t('เช่น จองรถเช่า') },
      { k: 'icon', label: t('ไอคอน'), type: 'select', raw: true, options: [['dots','อื่นๆ'],['idcard','พาสปอร์ต/บัตร'],['shield','ประกัน'],['pill','ยา'],['plug','ปลั๊กแปลง'],['sim','ซิม/eSIM'],['card','บัตร/ธนาคาร'],['bag','กระเป๋า']] }
    ],
    validate: o => !o.title && t('ใส่ชื่อรายการ'),
    onSave: async o => { o.done = (c && c.done) || false; return saver('check')(o); },
    onDelete: c ? deleter(c.id) : null
  });
}
function toggleCheck(id) {
  const c = rec(id); if (!c) return;
  saver('check')({ ...c, done: !c.done });
}
function contactForm(c) {
  openForm({
    title: t(c ? 'แก้ไขเบอร์ติดต่อ' : 'เพิ่มเบอร์ติดต่อฉุกเฉิน'), data: c || {},
    fields: [
      { k: 'title', label: t('ชื่อ'), ph: t('เช่น สถานทูตไทย, โรงพยาบาลใกล้ที่พัก') },
      { k: 'phone', label: t('เบอร์โทร'), ph: t('เช่น +81-90-4435-7812') },
      { k: 'note', label: t('โน้ต / เวลาติดต่อ'), type: 'textarea', ph: t('เช่น Hotline ฉุกเฉิน 24 ชม.') }
    ],
    validate: o => !o.title && t('ใส่ชื่อผู้ติดต่อ'),
    onSave: saver('contact'), onDelete: c ? deleter(c.id) : null
  });
}
function budgetForm() {
  const b = of('budget')[0];
  openForm({
    title: t('งบส่วนตัว'), data: b || {},
    fields: [
      { k: 'amount', label: t('งบส่วนตัวในทริปนี้ (บาท, ไม่ใส่ก็ได้)'), type: 'number', ph: t('เช่น 20000') }
    ],
    onSave: saver('budget'), onDelete: b ? deleter(b.id) : null
  });
}
function cssVar(n) { return (getComputedStyle(document.documentElement).getPropertyValue(n) || '').trim(); }
function fitText(g, s, maxW) { s = String(s); while (g.measureText(s).width > maxW && s.length > 1) s = s.slice(0, -2) + '…'; return s; }
async function shareSummary() {
  try {
    const x = trip();
    const items = expenseItems();
    const totalThb = isFx() ? items.reduce((a, e) => a + thbOf(e), 0) : items.reduce((a, e) => a + e.amount, 0);
    const fl = of('flight'), st = of('stay');
    const pre = fl.reduce((a, f) => a + (+f.price || 0), 0) + st.reduce((a, s) => a + (+s.price || 0), 0);
    const grand = pre + totalThb;
    const tripItems = items.filter(e => e.mode !== 'self');
    const shareThb = isFx() ? tripItems.reduce((a, e) => a + thbOf(e), 0) : tripItems.reduce((a, e) => a + e.amount, 0);
    const { bal, used } = balances();
    const myBudget = of('budget')[0];
    const cats = catStats().slice(0, 3);
    const bg = cssVar('--bg') || '#F5EDD6', surf = cssVar('--surface') || '#FBF7EA', ink = cssVar('--ink') || '#23291F',
      ink2 = cssVar('--ink2') || '#5B6453', brand = cssVar('--brand') || '#7E9B75', brandInk = cssVar('--brand-ink') || '#44603E',
      onBrand = cssVar('--on-brand') || '#FBF7EA';
    const W = 1080, H = 1400;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.textBaseline = 'alphabetic';
    g.fillStyle = ink2; g.font = '600 26px sans-serif'; g.fillText('Split&Go', 64, 84);
    g.fillStyle = ink; g.font = '700 54px "Noto Serif Thai","Noto Serif",Georgia,serif';
    g.fillText(fitText(g, x.name || '', W - 128), 64, 160);
    g.fillStyle = ink2; g.font = '28px sans-serif';
    g.fillText(`${fmtD(x.start)} – ${fmtD(x.end)}`, 64, 205);
    g.fillStyle = brand; g.beginPath(); g.roundRect ? g.roundRect(64, 240, W - 128, 190, 20) : g.rect(64, 240, W - 128, 190); g.fill();
    g.fillStyle = onBrand; g.font = '26px sans-serif'; g.fillText(t('ค่าใช้จ่ายรวมทั้งทริป'), 96, 292);
    g.font = '700 66px "Noto Serif Thai","Noto Serif",Georgia,serif'; g.fillText(baht(grand), 96, 380);
    let y = 480;
    if (x.members.length > 1) {
      g.fillStyle = ink; g.font = '600 28px sans-serif';
      g.fillText(tf('ค่าใช้จ่ายแชร่ (Expense share) {x}', { x: baht(shareThb) }), 64, y); y += 56;
    }
    if (myBudget && myBudget.amount > 0) {
      const pct = Math.round((used[myName()] || 0) / myBudget.amount * 100);
      g.fillStyle = ink; g.font = '600 28px sans-serif';
      g.fillText(tf('งบส่วนตัว {b} · ใช้ไปแล้ว {p}%', { b: baht(myBudget.amount), p: pct }), 64, y); y += 56;
    }
    const balEntries = Object.entries(bal).filter(([, v]) => Math.abs(v) > .5);
    if (balEntries.length) {
      g.fillStyle = ink; g.font = '700 34px "Noto Serif Thai","Noto Serif",Georgia,serif'; g.fillText(t('ใครจ่าย ใครใช้'), 64, y); y += 48;
      g.font = '27px sans-serif';
      balEntries.forEach(([name, v]) => {
        g.fillStyle = v >= 0 ? brandInk : '#B4413A';
        const label = name + '  ' + (v >= 0 ? tf('ได้คืน {x}', { x: baht(v) }) : tf('ค้าง {x}', { x: baht(-v) }));
        g.fillText(fitText(g, label, W - 128), 64, y); y += 44;
      });
      y += 16;
    }
    if (cats.length) {
      g.fillStyle = ink; g.font = '700 34px "Noto Serif Thai","Noto Serif",Georgia,serif'; g.fillText(t('ใช้จ่ายไปกับอะไร'), 64, y); y += 48;
      g.fillStyle = ink2; g.font = '27px sans-serif';
      cats.forEach(([c, , thb]) => { g.fillText(fitText(g, `${t(c)} — ${baht(thb)}`, W - 128), 64, y); y += 44; });
    }
    g.fillStyle = cssVar('--ink3') || '#8C9280'; g.font = '22px sans-serif'; g.fillText('Split&Go', 64, H - 40);
    cv.toBlob(async blob => {
      if (!blob) return toast(t('สร้างรูปสรุปไม่สำเร็จ'));
      const file = new File([blob], 'trip-summary.png', { type: 'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: x.name }); return; } } catch (e) {}
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'trip-summary.png'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast(t('บันทึกรูปสรุปทริปแล้ว'));
    }, 'image/png');
  } catch (e) { toast(t('สร้างรูปสรุปไม่สำเร็จ')); }
}
function stopForm(s) {
  openForm({
    title: t(s ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่'), data: s || { date: curDay() },
    fields: [
      { k: 'date', label: t('วัน'), type: 'select', raw: true, options: dayOpts() },
      { k: 'time', label: t('ไปถึงประมาณกี่โมง'), type: 'time' },
      { k: 'maps', label: t('ลิงก์แผนที่ (Google Maps หรือ Apple Maps)'), type: 'maps', target: 'name' },
      { k: 'name', label: t('ชื่อสถานที่ (ดึงจากลิงก์ หรือพิมพ์เอง)') },
      { k: 'myName', label: t('ชื่อที่ฉันเรียก (ไทย/อังกฤษ)'), ph: t('เช่น วัดอาซากุสะ') },
      { k: 'note', label: t('ทำอะไร / โน้ต'), type: 'textarea', ph: t('เช่น ไหว้พระ เดินถนนนากามิเสะ ซื้อขนม') },
      { k: 'photo', label: t('รูปสถานที่'), type: 'photo' }
    ],
    validate: o => !o.name && !o.myName && t('ใส่ชื่อสถานที่'),
    onSave: saver('stop'), onDelete: s ? deleter(s.id) : null
  });
}
function legForm(l) {
  const x = trip(), d = curDay(); ensureRate();
  const last = of('stop').filter(y => y.date === d).sort(byTime).pop();
  openForm({
    title: t(l ? 'แก้ไขการเดินทาง' : 'เพิ่มการเดินทาง'),
    data: l || { date: d, from: last ? stopName(last) : '', payer: myName(), method: 'เงินสด', tcMode: cardState().fxLeft > 0 ? TC_PRE : TC_AUTO },
    autoTc: !l,
    fields: [
      { k: 'date', label: t('วัน'), type: 'select', raw: true, options: dayOpts() },
      { k: 'time', label: t('ออกเดินทางกี่โมง'), type: 'time' },
      { k: 'mode', label: t('เดินทางด้วย'), type: 'select', raw: true, options: MODES.map(m => [m, modeLabel(m)]) },
      { k: 'from', label: t('ขึ้นที่'), ph: t('เช่น ป้ายรถเมล์ / สถานี Shinjuku') },
      { k: 'to', label: t('ลงที่'), ph: t('เช่น สถานี Ueno') },
      { k: 'line', label: t('สาย / ชานชาลา / ทางออก'), ph: t('เช่น JR Yamanote ชานชาลา 14, ออกทางออก A3') },
      { k: 'note', label: t('โน้ต'), type: 'textarea', ph: t('เช่น ลงแล้วต่อรถไฟใต้ดินสาย Ginza') },
      { k: 'cost', label: tf('ค่าเดินทาง ({c}) ถ้ามี', { c: x.currency }), type: 'money' },
      { k: 'method', label: t('จ่ายด้วย'), type: 'select', options: METHODS },
      ...payFields(),
      { k: 'payer', label: t('ใครจ่าย'), type: 'select', raw: true, options: x.members },
      { k: 'members', label: t('หารกับใคร'), type: 'checks', options: x.members }
    ],
    onSave: o => { cleanPay(o); if (o.cost > 0) stampRate(o); return saver('leg')(o); }, onDelete: l ? deleter(l.id) : null
  });
}
function expForm(e, preset) {
  const x = trip(); ensureRate();
  openForm({
    title: t(e ? 'แก้ไขค่าใช้จ่าย' : 'เพิ่มค่าใช้จ่าย'),
    data: e || { date: curDay(), payer: myName(), method: 'เงินสด', category: 'อาหาร', mode: (preset && preset.mode) || (x.members.length > 1 ? 'equal' : 'self'),
      tcMode: cardState().fxLeft > 0 ? TC_PRE : TC_AUTO },
    autoTc: !e,
    fields: [
      { k: 'amount', label: tf('จำนวนเงิน ({c})', { c: x.currency }), type: 'money' },
      { k: 'category', label: t('หมวด'), type: 'catchips', scope: 'trip', base: ECATS },
      { k: 'title', label: t('รายการ (ไม่ใส่ก็ได้)'), ph: t('เช่น ร้านราเมน Ichiran') },
      { k: 'method', label: t('จ่ายด้วย'), type: 'select', options: METHODS },
      ...payFields(),
      { k: 'date', label: t('วัน'), type: 'select', raw: true, options: dayOpts() },
      { k: 'payer', label: t('ใครออกเงินไปก่อน'), type: 'select', raw: true, options: x.members },
      { k: 'split', type: 'split' },
      { k: 'photo', label: t('รูปใบเสร็จ / รูปร้าน'), type: 'photo' },
      { k: 'note', label: t('โน้ต'), type: 'textarea' }
    ],
    validate: o => {
      if (!(o.amount > 0)) return t('ใส่จำนวนเงิน');
      if (o.mode === 'equal' && !o.members.length) return t('เลือกคนที่หารอย่างน้อย 1 คน');
      if (o.mode === 'custom') { const s = Object.values(o.parts).reduce((a, b) => a + b, 0); if (Math.abs(s - o.amount) > 0.01) return t('ยอดที่แยกแต่ละคนยังไม่เท่ากับยอดรวม'); }
    },
    onSave: async o => {
      if (o.mode === 'self') o.members = [o.payer];
      cleanPay(o); stampRate(o);
      await saver('exp')(o);
      if (!ECATS.includes(o.category)) bumpCat('trip', ECATS, o.category);
    },
    onDelete: e ? deleter(e.id) : null
  });
}
function renderSplit(d) {
  const mode = d.mode || 'equal';
  $('#split').innerHTML = `<label class="fl">${t('หารยังไง')}</label>
    <div class="seg" id="splitMode"><button type="button" data-m="equal" class="${mode === 'equal' ? 'on' : ''}">${t('หารเท่ากัน')}</button>
    <button type="button" data-m="custom" class="${mode === 'custom' ? 'on' : ''}">${t('ตามที่กิน')}</button>
    <button type="button" data-m="self" class="${mode === 'self' ? 'on' : ''}">${t('ส่วนตัว')}</button></div>
    <div id="splitBody" style="margin-top:10px"></div>`;
  drawSplitBody(mode, d);
}
function drawSplitBody(mode, d) {
  const x = trip();
  if (mode === 'self') {
    $('#splitBody').innerHTML = '<div class="hint" id="splitHint"></div>';
  } else if (mode === 'equal') {
    const sel = d.members && d.members.length ? d.members : x.members;
    $('#splitBody').innerHTML = `<div class="checks" id="splitMembers">${x.members.map(m =>
      `<button type="button" class="chip ${sel.includes(m) ? 'on' : ''}" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div><div class="hint" id="splitHint"></div>`;
  } else {
    const p = d.parts || {};
    $('#splitBody').innerHTML = x.members.map(m => `<div class="prow"><span>${esc(m)}</span>
      <input inputmode="decimal" data-p="${esc(m)}" value="${p[m] ?? ''}" placeholder="0"></div>`).join('') + '<div class="hint" id="splitHint"></div>';
  }
  updateSplitHint();
}
function readSplit() {
  const mode = $('#splitMode .on')?.dataset.m || 'equal';
  if (mode === 'self') { const p = formVal('payer'); return { mode, members: p ? [p] : [], parts: null }; }
  if (mode === 'equal') return { mode, members: $$('#splitMembers .on').map(b => b.dataset.v), parts: null };
  const parts = {};
  $$('#splitBody [data-p]').forEach(i => { const v = num(i.value); if (v > 0) parts[i.dataset.p] = v; });
  return { mode, parts, members: Object.keys(parts) };
}
function updateSplitHint() {
  const h = $('#splitHint'); if (!h) return;
  const amt = num($('[name="amount"]')?.value), s = readSplit();
  if (s.mode === 'self') h.textContent = tf('ค่าใช้จ่ายของ {x} คนเดียว ไม่หารใคร', { x: formVal('payer') }) + (shared() ? t(' และเพื่อนในทริปจะไม่เห็นรายการนี้') : '');
  else if (s.mode === 'equal') h.textContent = s.members.length ? tf('คนละ {x}', { x: tm(amt / s.members.length) }) : t('เลือกอย่างน้อย 1 คน');
  else {
    const diff = amt - Object.values(s.parts).reduce((a, b) => a + b, 0);
    h.textContent = Math.abs(diff) < 0.01 ? t('ยอดครบแล้ว') : diff > 0 ? tf('ยังเหลือ {x} ที่ยังไม่ได้แบ่ง', { x: tm(diff) }) : tf('เกินยอดรวม {x}', { x: tm(-diff) });
  }
}
function settleForm(s) {
  const x = trip();
  openForm({
    title: t(s && s.id ? 'แก้ไขการคืนเงิน' : 'บันทึกการคืนเงิน'),
    data: { date: curDay(), method: 'โอน/QR', ...s, cur: s && s.cur || (s && s.id ? x.currency : 'THB') },
    fields: [
      { k: 'from', label: t('ใครจ่าย'), type: 'select', raw: true, options: x.members },
      { k: 'to', label: t('จ่ายให้ใคร'), type: 'select', raw: true, options: x.members },
      ...(isFx() ? [{ k: 'cur', label: t('คืนเป็นเงิน'), type: 'seg', options: ['THB', x.currency] }] : []),
      { k: 'amount', label: t('จำนวน'), type: 'number' },
      { k: 'method', label: t('จ่ายด้วย'), type: 'seg', options: ['เงินสด', 'โอน/QR'] },
      { k: 'date', label: t('วันที่'), type: 'date' }
    ],
    validate: o => o.from === o.to ? t('คนจ่ายกับคนรับต้องไม่ใช่คนเดียวกัน') : !(o.amount > 0) && t('ใส่จำนวนเงิน'),
    onSave: saver('settle'), onDelete: s && s.id ? deleter(s.id) : null
  });
}
function topupForm(y) {
  const x = trip(), fx = x.currency;
  const thbCard = () => isFx() && formVal('wallet') === 'Travel card' && formVal('cur') === 'THB';
  openForm({
    title: t(y ? 'แก้ไข' : 'แลกเงิน / เติมเงิน'),
    data: y ? { ...y, cur: tcur(y) } : { date: ymd(new Date()), wallet: 'เงินสด', cur: fx },
    fields: [
      { k: 'wallet', label: t('เข้ากระเป๋า'), type: 'seg', options: ['เงินสด', 'Travel card'] },
      ...(isFx() ? [{ k: 'cur', label: t('เติมเข้าบัตรเป็น'), type: 'seg', options: [[fx, tf('แลกเป็น {c}', { c: fx })], ['THB', 'เงินบาท']], when: ['wallet', 'Travel card'] },
        { k: 'info', type: 'note', text: t('บัตรที่ตัดเงินบาทตอนจ่าย เติมเงินบาทไว้ตรงนี้เพื่อดูยอดคงเหลือ ถ้าไม่บันทึกก็ได้ ตอนจ่ายเลือก "เงินบาท เรทตอนจ่าย" ยอดบาทยังคำนวณให้เหมือนเดิม'),
          when: [['wallet', 'Travel card'], ['cur', 'THB']] }] : []),
      { k: 'amount', label: tf('ได้มา ({c})', { c: fx }), type: 'number' },
      ...(isFx() ? [{ k: 'thb', label: t('จ่ายไปกี่บาท'), type: 'number', when: { any: [[['wallet', 'เงินสด']], [['wallet', 'Travel card'], ['cur', fx]]] } }] : []),
      { k: 'date', label: t('วันที่'), type: 'date' },
      { k: 'note', label: t('โน้ต'), ph: t('เช่น แลกที่ SuperRich, เติม YouTrip') }
    ],
    onChange: () => {
      const l = $('#sheet [name="amount"]')?.closest('.fld')?.querySelector('.fl');
      if (l) l.textContent = thbCard() ? t('เติมเงินบาทเข้าบัตร (บาท)') : tf('ได้มา ({c})', { c: fx });
    },
    validate: o => !(o.amount > 0) && t('ใส่จำนวนเงิน'),
    onSave: o => {
      if (!isFx() || o.wallet === 'เงินสด') o.cur = fx;
      if (o.cur === 'THB') o.thb = o.amount;
      return saver('topup')(o);
    },
    onDelete: y ? deleter(y.id) : null
  });
}

/* ----- แชร์ทริป / เข้าร่วมด้วยโค้ด ----- */
function tripInviteText() {
  const x = trip();
  return tf('มาวางแผนทริป "{x}" ด้วยกันใน Split&Go\nเปิดลิงก์นี้ สมัครบัญชีของตัวเอง แล้วเลือกชื่อของคุณในทริป:\n{l}\n\nหรือกด "ใส่โค้ด" ในแอป แล้วพิมพ์โค้ด {c}', { x: x.name, l: inviteLink(x.code), c: x.code });
}
async function openShare() {
  if (!trip().code && isOwner()) { // ทริปจากเวอร์ชันเก่ายังไม่มีโค้ด สร้างให้ตอนเปิดแชร์ครั้งแรก
    try { upsert(await run('newTripCode', T.id)); } catch (y) { return toast(y.message); }
  }
  const x = trip(), acc = x.access || {}, owner = isOwner(x);
  openPanel(t('แชร์ทริป'), `
  <div class="block"><div class="lbl">${t('โค้ดเข้าร่วมทริป')}</div>
    <div class="code">${esc(x.code || '—')}</div>
    <div class="tiny" style="margin:0 0 14px">${t('ส่งข้อความเชิญให้เพื่อน เพื่อนสมัครบัญชีของตัวเอง แล้วแอปจะพาเข้าทริปนี้ให้ หรือเพื่อนกด "ใส่โค้ด" แล้วพิมพ์โค้ดนี้ก็ได้')}</div>
    <button class="btn" data-act="copyTripInvite">${ico('copy', 18)}${t('คัดลอกข้อความเชิญ')}</button></div>
  <div class="block">${head('users', t('คนในทริป'), t('ใครผูกกับบัญชีไหน'))}
    ${x.members.map(m => { const u = Object.keys(acc).find(k => acc[k] === m);
      return `<div class="row"><span class="ic">${ico(u ? 'user' : 'dots', 18)}</span><div class="c"><div class="t">${esc(m)}${u === ME.username ? ' ' + t('(คุณ)') : ''}</div>
        <div class="s">${u ? tf('บัญชี {x}', { x: esc(u) }) + (u === x.owner ? t(', คนสร้างทริป') : '') : t('ยังไม่มีบัญชีเลือกชื่อนี้')}</div></div>
        ${owner && u !== x.owner ? `<button class="ghost" data-act="rmMember" data-m="${esc(m)}">${t('เอาออก')}</button>` : ''}</div>`; }).join('')}
    <div class="tiny">${t('ใส่ค่าใช้จ่ายให้เพื่อนที่ยังไม่มีบัญชีได้ตามปกติ พอเพื่อนเข้าร่วมแล้วเลือกชื่อเดิมของตัวเอง ยอดทั้งหมดจะต่อกันทันที')}</div>
    ${owner && x.members.length > 1 ? `<div class="tiny">${t('คนที่ไม่ได้ไป เอาออกได้ ถ้าเขาไม่ได้เป็นคนจ่ายรายการไหน')}</div>` : ''}</div>
  <div class="block">${head('lock', t('ใครเห็นอะไร'), '')}<div class="tiny" style="margin:0">${t('ทุกคนในทริปเห็นแผนเที่ยว เที่ยวบิน ที่พัก และค่าใช้จ่ายที่หารกัน แก้ไขได้ทุกคน ส่วนค่าใช้จ่ายแบบ "ส่วนตัว" การแลกเงิน และหน้ากระเป๋าเงิน เห็นเฉพาะเจ้าของ')}${owner ? '' : t(' แก้ชื่อทริปและรายชื่อได้เฉพาะคนสร้างทริป')}</div></div>
  ${owner ? `<button class="ghost" style="width:100%;justify-content:center;padding:12px" data-act="newCode">${t('เปลี่ยนโค้ดใหม่')}</button>`
          : `<button class="danger" data-act="leave">${t('ออกจากทริปนี้')}</button>`}`);
}
let JOIN = { code: '' };
function openJoin(code) {
  JOIN = { code: code || '' };
  openPanel(t('เข้าร่วมทริป'), `
    <div class="fld"><label class="fl" for="joinCode">${t('โค้ด 6 ตัวที่เพื่อนส่งมา')}</label>
      <input id="joinCode" class="codein" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false" value="${esc(JOIN.code)}" placeholder="K7Q2MX"></div>
    <div id="joinBody"></div>
    <button class="btn" data-act="joinNext" id="joinBtn">${t('ถัดไป')}</button>`);
  if (JOIN.code) joinNext(); else setTimeout(() => $('#joinCode') && $('#joinCode').focus(), 50);
}
async function joinNext() {
  const code = ($('#joinCode')?.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) return toast(t('โค้ดมี 6 ตัว'));
  const b = $('#joinBtn'); b.disabled = true; b.textContent = t('กำลังค้นหา…');
  try {
    const r = await run('joinTrip', code, '');
    if (r.joined) { closeForm(); toast(t('คุณอยู่ในทริปนี้แล้ว')); goTrip(r.id); return; }
    JOIN.code = code;
    const free = r.members.filter(m => !r.taken.includes(m));
    $('#joinBody').innerHTML = `<div class="jtrip"><div class="tt">${esc(r.name)}</div><div class="sub">${fmtD(r.start)} – ${fmtD(r.end)}</div></div>
      <label class="fl">${t('คุณคือใครในทริปนี้')}</label>
      ${free.length ? `<div class="jchecks" id="joinNames">${free.map(m => `<button type="button" class="chip" data-act="joinPick" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>` : ''}
      <input class="othr" id="joinNew" placeholder="${esc(t(free.length ? 'หรือพิมพ์ชื่อใหม่ ถ้าไม่มีชื่อคุณ' : 'พิมพ์ชื่อที่เพื่อนเรียกคุณ'))}" autocomplete="off">
      ${r.taken.length ? `<div class="tiny">${tf('ชื่อที่มีคนเลือกแล้ว: {x}', { x: esc(r.taken.join(', ')) })}</div>` : ''}
      <div style="height:16px"></div>`;
    $('#joinCode').disabled = true;
    b.dataset.act = 'joinGo'; b.textContent = t('เข้าร่วมทริป');
  } catch (y) { toast(y.message); b.textContent = t('ถัดไป'); }
  b.disabled = false;
}
async function joinGo() {
  const member = ($('#joinNew')?.value || '').trim() || $('#joinNames .chip.on')?.dataset.v || '';
  if (!member) return toast(t('เลือกชื่อของคุณ หรือพิมพ์ชื่อใหม่'));
  const b = $('#joinBtn'); b.disabled = true; b.textContent = t('กำลังเข้าร่วม…');
  try { const r = await run('joinTrip', JOIN.code, member); closeForm(); toast(t('เข้าร่วมทริปแล้ว')); goTrip(r.id); }
  catch (y) { toast(y.message); b.disabled = false; b.textContent = t('เข้าร่วมทริป'); }
}

