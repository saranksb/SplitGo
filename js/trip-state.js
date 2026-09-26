// สถานะทริปที่กำลังเปิดอยู่ (T), แปลงเป็นเงินบาท, sync ข้อมูลกับเซิร์ฟเวอร์
/* =================================================
   ทริป
================================================= */
const T = { list: null, id: null, recs: [], thumbs: {}, thumbCache: {}, rates: {}, sub: 'overview', day: 0 };
const CURS = [['JPY','JPY เยนญี่ปุ่น'],['KRW','KRW วอนเกาหลี'],['CNY','CNY หยวนจีน'],['TWD','TWD ดอลลาร์ไต้หวัน'],['HKD','HKD ดอลลาร์ฮ่องกง'],
  ['SGD','SGD ดอลลาร์สิงคโปร์'],['MYR','MYR ริงกิตมาเลเซีย'],['VND','VND ดองเวียดนาม'],['LAK','LAK กีบลาว'],['USD','USD ดอลลาร์สหรัฐ'],
  ['EUR','EUR ยูโร'],['GBP','GBP ปอนด์'],['AUD','AUD ดอลลาร์ออสเตรเลีย'],['CHF','CHF ฟรังก์สวิส'],['THB','THB บาท']];
const CUR_EN = { JPY: 'Japanese yen', KRW: 'Korean won', CNY: 'Chinese yuan', TWD: 'Taiwan dollar', HKD: 'Hong Kong dollar', SGD: 'Singapore dollar',
  MYR: 'Malaysian ringgit', VND: 'Vietnamese dong', LAK: 'Lao kip', USD: 'US dollar', EUR: 'Euro', GBP: 'British pound', AUD: 'Australian dollar', CHF: 'Swiss franc', THB: 'Thai baht' };
const COUNTRIES = [['GR','กรีซ','Greece'],['KH','กัมพูชา','Cambodia'],['QA','กาตาร์','Qatar'],['KW','คูเวต','Kuwait'],['CN','จีน','China'],['CL','ชิลี','Chile'],['SA','ซาอุดีอาระเบีย','Saudi Arabia'],['JP','ญี่ปุ่น','Japan'],['TR','ตุรกี','Turkey'],['NO','นอร์เวย์','Norway'],['NZ','นิวซีแลนด์','New Zealand'],['BR','บราซิล','Brazil'],['BD','บังกลาเทศ','Bangladesh'],['PK','ปากีสถาน','Pakistan'],['FR','ฝรั่งเศส','France'],['FI','ฟินแลนด์','Finland'],['PH','ฟิลิปปินส์','Philippines'],['MY','มาเลเซีย','Malaysia'],['RU','รัสเซีย','Russia'],['LA','ลาว','Laos'],['LK','ศรีลังกา','Sri Lanka'],['CH','สวิตเซอร์แลนด์','Switzerland'],['SE','สวีเดน','Sweden'],['AE','สหรัฐอาหรับเอมิเรตส์','United Arab Emirates'],['US','สหรัฐอเมริกา','United States'],['SG','สิงคโปร์','Singapore'],['ES','สเปน','Spain'],['AT','ออสเตรีย','Austria'],['AU','ออสเตรเลีย','Australia'],['GB','อังกฤษ (สหราชอาณาจักร)','United Kingdom'],['AR','อาร์เจนตินา','Argentina'],['IT','อิตาลี','Italy'],['IN','อินเดีย','India'],['ID','อินโดนีเซีย','Indonesia'],['IL','อิสราเอล','Israel'],['EG','อียิปต์','Egypt'],['HU','ฮังการี','Hungary'],['HK','ฮ่องกง','Hong Kong'],['KR','เกาหลีใต้','South Korea'],['KE','เคนยา','Kenya'],['CZ','เช็ก','Czech Republic'],['DK','เดนมาร์ก','Denmark'],['NP','เนปาล','Nepal'],['NL','เนเธอร์แลนด์','Netherlands'],['BE','เบลเยียม','Belgium'],['PE','เปรู','Peru'],['MM','เมียนมา','Myanmar'],['MX','เม็กซิโก','Mexico'],['DE','เยอรมนี','Germany'],['VN','เวียดนาม','Vietnam'],['CA','แคนาดา','Canada'],['ZA','แอฟริกาใต้','South Africa'],['PT','โปรตุเกส','Portugal'],['PL','โปแลนด์','Poland'],['MA','โมร็อกโก','Morocco'],['RO','โรมาเนีย','Romania'],['TW','ไต้หวัน','Taiwan']];
const EMBASSY = {
  GR:{phone:'+30-6944-532916',city:'เอเธนส์',more:'',emg:'ฉุกเฉินรวม 112'},
  KH:{phone:'+855-77-888-114',city:'พนมเปญ',more:'',emg:'ตำรวจ 117, ดับเพลิง 118, รถพยาบาล 119'},
  QA:{phone:'+974-5557-8760',city:'โดฮา',more:'',emg:'ฉุกเฉินรวม 999'},
  KW:{phone:'+965-6071-9888',city:'คูเวตซิตี',more:'',emg:'ฉุกเฉินรวม 112'},
  CN:{phone:'+86-157-2731-2531',city:'ปักกิ่ง',more:'เซี่ยงไฮ้ +86-185-1626-8776, กว่างโจว +86-188-1938-6190, เฉิงตู +86-157-0842-8656, คุนหมิง +86-155-8700-3732, ซีอาน +86-182-0292-1281, เซี่ยเหมิน +86-181-5090-7662, หนานหนิง +86-153-0781-3559, ชิงเต่า +86-176-6751-2714',emg:'ตำรวจ 110, รถพยาบาล 120, ดับเพลิง 119'},
  CL:{phone:'+56-9-8735-4002',city:'ซานติอาโก',more:'',emg:'ตำรวจ 133, รถพยาบาล 131'},
  SA:{phone:'+966-55-462-2005',city:'ริยาด',more:'เจดดาห์ +966-56-808-1224',emg:'ตำรวจ 999, ดับเพลิง 998, รถพยาบาล 997'},
  JP:{phone:'+81-90-4435-7812',city:'โตเกียว',more:'โอซาก้า +81-90-1895-0987, ฟุกุโอกะ +81-90-2585-3027',emg:'ตำรวจ 110, รถพยาบาล/ดับเพลิง 119'},
  TR:{phone:'+90-533-641-5698',city:'อังการา',more:'',emg:'ฉุกเฉินรวม 112'},
  NO:{phone:'+47-901-36-815',city:'ออสโล',more:'',emg:'ตำรวจ 112, ดับเพลิง 110, รถพยาบาล 113'},
  NZ:{phone:'+64-021-896-292',city:'เวลลิงตัน',more:'',emg:'ฉุกเฉินรวม 111'},
  BR:{phone:'+55-619-919-8763',city:'บราซิเลีย',more:'',emg:'ตำรวจ 190, รถพยาบาล 192, ดับเพลิง 193'},
  BD:{phone:'+017-0964-0808',city:'ธากา',more:'',emg:'ฉุกเฉินรวม 999'},
  PK:{phone:'+92-315-9009949',city:'อิสลามาบัด',more:'การาจี +92-310-814-7755',emg:'ตำรวจ 15, รถพยาบาล 1122'},
  FR:{phone:'+33-6-46-71-96-94',city:'ปารีส',more:'',emg:'ฉุกเฉินรวม 112 (ตำรวจ 17, รถพยาบาล 15)'},
  FI:{phone:'+358-50-312-0574',city:'เฮลซิงกิ',more:'',emg:'ฉุกเฉินรวม 112'},
  PH:{phone:'+63-917-806-3977',city:'มะนิลา',more:'',emg:'ฉุกเฉินรวม 911'},
  MY:{phone:'+6-017-700-4822',city:'กัวลาลัมเปอร์',more:'ปีนัง +6-012-391-4866, โกตาบารู +6-019-667-5266',emg:'ฉุกเฉินรวม 999'},
  RU:{phone:'+7-916-939-2155',city:'มอสโก',more:'',emg:'ฉุกเฉินรวม 112'},
  LA:{phone:'+856-20-5551-2228',city:'เวียงจันทน์',more:'สะหวันนะเขต +856-20-2271-7060',emg:'ตำรวจ 191, ดับเพลิง 190, รถพยาบาล 195'},
  LK:{phone:'+94-77-307-0747',city:'โคลอมโบ',more:'',emg:'ตำรวจ 119, รถพยาบาล 110'},
  CH:{phone:'+41-79-864-2674',city:'เบิร์น',more:'',emg:'ตำรวจ 117, ดับเพลิง 118, รถพยาบาล 144'},
  SE:{phone:'+46-70-234-4191',city:'สตอกโฮล์ม',more:'',emg:'ฉุกเฉินรวม 112'},
  AE:{phone:'+971-56-112-1348',city:'อาบูดาบี',more:'ดูไบ +971-50-652-5945',emg:'ตำรวจ 999, ดับเพลิง 997, รถพยาบาล 998'},
  US:{phone:'+1-202-999-7690',city:'วอชิงตัน ดี.ซี.',more:'นิวยอร์ก +1-646-842-0864, ลอสแอนเจลิส +1-323-580-4222, ชิคาโก +1-773-294-5933',emg:'ฉุกเฉินรวม 911'},
  SG:{phone:'+65-8421-0105',city:'สิงคโปร์',more:'',emg:'ตำรวจ 999, รถพยาบาล/ดับเพลิง 995'},
  ES:{phone:'00-34-660-24-25-07',city:'มาดริด',more:'',emg:'ฉุกเฉินรวม 112'},
  AT:{phone:'+43-664-999-0424',city:'เวียนนา',more:'',emg:'ตำรวจ 133, ดับเพลิง 122, รถพยาบาล 144'},
  AU:{phone:'+61-402-735-642',city:'แคนเบอร์รา',more:'ซิดนีย์ +61-411-424-303',emg:'ฉุกเฉินรวม 000'},
  GB:{phone:'+44-79186-51720',city:'ลอนดอน',more:'',emg:'ฉุกเฉินรวม 999 หรือ 112'},
  AR:{phone:'+54-911-4080-2185',city:'บัวโนสไอเรส',more:'',emg:'ฉุกเฉินรวม 911'},
  IT:{phone:'+39-333-8518-071',city:'โรม',more:'',emg:'ฉุกเฉินรวม 112'},
  IN:{phone:'+91-95-9932-1484',city:'นิวเดลี',more:'มุมไบ +91-98202-93349, โกลกาตา +91-98302-60382, เจนไน +91-97-9083-1391',emg:'ฉุกเฉินรวม 112'},
  ID:{phone:'+62-811-186-253',city:'จาการ์ตา',more:'',emg:'ตำรวจ 110, ดับเพลิง 113, รถพยาบาล 118/119'},
  IL:{phone:'+972-54-636-8150',city:'เทลอาวีฟ',more:'',emg:'ตำรวจ 100, รถพยาบาล 101, ดับเพลิง 102'},
  EG:{phone:'+201-0194-01243',city:'ไคโร',more:'',emg:'ตำรวจ 122, รถพยาบาล 123'},
  HU:{phone:'+36-30-507-8517',city:'บูดาเปสต์',more:'',emg:'ฉุกเฉินรวม 112'},
  HK:{phone:'+852-6821-1545',city:'ฮ่องกง',more:'อีกสาย +852-6821-1546',emg:'ฉุกเฉินรวม 999'},
  KR:{phone:'+82-10-7275-2955',city:'โซล',more:'',emg:'ฉุกเฉินรวม 112 (ตำรวจ), 119 (รถพยาบาล/ดับเพลิง)'},
  KE:{phone:'+254-733-145-145',city:'ไนโรบี',more:'',emg:'ฉุกเฉินรวม 999 หรือ 112'},
  CZ:{phone:'+420-721-776-717',city:'ปราก',more:'',emg:'ฉุกเฉินรวม 112'},
  DK:{phone:'+45-91-80-72-36',city:'โคเปนเฮเกน',more:'',emg:'ฉุกเฉินรวม 112'},
  NP:{phone:'+977-980-106-9233',city:'กาฐมาณฑุ',more:'',emg:'ตำรวจ 100, ดับเพลิง 101, รถพยาบาล 102'},
  NL:{phone:'+31-6-23669832',city:'เดอะเฮก',more:'',emg:'ฉุกเฉินรวม 112'},
  BE:{phone:'+32-470-859-667',city:'บรัสเซลส์',more:'',emg:'ฉุกเฉินรวม 112'},
  PE:{phone:'+51-940-383-185',city:'ลิมา',more:'',emg:'ตำรวจ 105, รถพยาบาล 106'},
  MM:{phone:'+95-979-700-2801',city:'ย่างกุ้ง',more:'',emg:'ดับเพลิง 191, รถพยาบาล 192, ตำรวจ 199'},
  MX:{phone:'+52-1-55-2564-2662',city:'เม็กซิโกซิตี',more:'',emg:'ฉุกเฉินรวม 911'},
  DE:{phone:'+49-152-035-1913',city:'เบอร์ลิน',more:'แฟรงก์เฟิร์ต +49-174-352-3033, มิวนิก +49-1520-212-5038',emg:'ตำรวจ 110, รถพยาบาล/ดับเพลิง 112'},
  VN:{phone:'+84-904-544-800',city:'ฮานอย',more:'โฮจิมินห์ +84-366-332-071',emg:'ตำรวจ 113, รถพยาบาล 115, ดับเพลิง 114'},
  CA:{phone:'+1-613-853-2650',city:'ออตตาวา',more:'แวนคูเวอร์ +1-778-984-9055',emg:'ฉุกเฉินรวม 911'},
  ZA:{phone:'+27-82-923-6179',city:'พริทอเรีย',more:'',emg:'ตำรวจ 10111, รถพยาบาล 10177, มือถือ 112'},
  PT:{phone:'+351-968-771-843',city:'ลิสบอน',more:'',emg:'ฉุกเฉินรวม 112'},
  PL:{phone:'+48-696-642-348',city:'วอร์ซอ',more:'',emg:'ฉุกเฉินรวม 112'},
  MA:{phone:'+212-661-899-597',city:'ราบัต',more:'',emg:'ตำรวจ 19, รถพยาบาล 15'},
  RO:{phone:'+40-725-197-860',city:'บูคาเรสต์',more:'',emg:'ฉุกเฉินรวม 112'},
  TW:{phone:'+886-952-238-931',city:'ไทเป',more:'',emg:'ตำรวจ 110, รถพยาบาล/ดับเพลิง 119'}
};
const METHODS = ['เงินสด','บัตรเครดิต','Travel card','โอน/QR'];
const TC_PRE = 'ใช้ยอดที่แลกไว้', TC_AUTO = 'ตัดเงินบาทอัตโนมัติ';
const tcAuto = e => e.method === 'Travel card' && e.tcMode === TC_AUTO;
const payFields = () => !isFx() ? [] : [
  { k: 'tcMode', label: t('Travel card ตัดเงินจากไหน'), type: 'seg', options: [[TC_PRE, tf('ยอด {c} ที่แลกไว้', { c: trip().currency })], [TC_AUTO, 'เงินบาท เรทตอนจ่าย']], when: ['method', 'Travel card'] },
  { k: 'thbActual', label: t('ยอดเงินบาทที่ถูกตัดจริง (ดูจากบิลหรือแอปบัตร ใส่ทีหลังได้)'), type: 'number',
    when: { any: [[['method', 'บัตรเครดิต|โอน/QR']], [['method', 'Travel card'], ['tcMode', TC_AUTO]]] } }
];
const MODES = ['🚶 เดิน','🚌 รถเมล์','🚆 รถไฟ','🚇 รถไฟใต้ดิน','🚄 ชินคันเซ็น/รถไฟความเร็วสูง','🚕 แท็กซี่','🚗 รถเช่า/รถส่วนตัว','⛴ เรือ','✈️ เครื่องบิน','อื่นๆ'];
const ECATS = ['อาหาร','เดินทาง','ที่พัก','ตั๋ว/กิจกรรม','ช้อปปิ้ง','ของฝาก','อื่นๆ'];

const trip = () => T.recs.find(r => r.kind === 'trip');
// ชื่อของฉันในทริปนี้ และบัญชีที่ผูกกับแต่ละชื่อ
const myName = () => { const x = trip(); return (x.access && x.access[ME.username]) || x.members[0]; };
const userOf = m => { const a = trip().access || {}; return Object.keys(a).find(k => a[k] === m) || ''; };
const isOwner = x => (x || trip()).owner === ME.username;
const shared = x => Object.keys((x || trip()).access || {}).length > 1;
const of = k => T.recs.filter(r => r.kind === k);
const rec = id => T.recs.find(r => r.id === id);
const byTime = (a, b) => (a.time || '99').localeCompare(b.time || '99');
function upsert(r) { T.mut++; upsert0(r); }
function upsert0(r) { const i = T.recs.findIndex(x => x.id === r.id); i >= 0 ? T.recs[i] = r : T.recs.push(r); }
function tripDays(x) {
  const out = []; if (!x || !x.start || !x.end) return out;
  const d = new Date(x.start + 'T00:00'), e = new Date(x.end + 'T00:00');
  while (d <= e && out.length < 90) { out.push(ymd(d)); d.setDate(d.getDate() + 1); }
  return out;
}
const dayOpts = () => tripDays(trip()).map((d, i) => [d, `${tf('วันที่ {n}', { n: i + 1 })} — ${wday(d)} ${fmtD(d)}`]);
const curDay = () => tripDays(trip())[T.day] || trip().start;
const tm = n => money(n, trip().currency);

/* ----- แปลงเป็นเงินบาท -----
   เงินสด = เรทเฉลี่ยที่แลกมา, Travel card แบบแลกไว้ = เรทที่เติม,
   บัตรเครดิต / Travel card แบบตัดเงินบาท / โอน = เรทวันที่บันทึก จนกว่าจะใส่ยอดบาทที่ถูกตัดจริง */
const isFx = () => { const x = trip(); return !!x && !!x.currency && x.currency !== 'THB'; };
const tcur = x => (isFx() && x.cur) || trip().currency;
// เรทเฉลี่ยที่แต่ละคนแลกมา ของเราคำนวณจากรายการในเครื่อง ของเพื่อนใช้ค่าที่เซิร์ฟเวอร์สรุปให้
function walletRate(w, uname) {
  if (!uname || uname === ME.username) {
    const xs = of('topup').filter(x => x.wallet === w && tcur(x) === trip().currency && x.amount > 0 && +x.thb > 0);
    const a = xs.reduce((s, x) => s + x.amount, 0);
    return a ? xs.reduce((s, x) => s + +x.thb, 0) / a : 0;
  }
  const r = T.rates[uname];
  return r ? r[w === 'เงินสด' ? 'cash' : 'card'] || 0 : 0;
}
const payerUser = e => userOf(e.payer) || e.by || trip().owner || ME.username;
function rateInfo(e) {
  const x = trip();
  if (!isFx()) return { rate: 1, src: '' };
  if (+e.thbActual > 0 && e.amount > 0) return { rate: e.thbActual / e.amount, src: 'ยอดที่ถูกตัดจริง' };
  const pu = payerUser(e), mine = pu === ME.username;
  if (e.method === 'เงินสด') { const r = walletRate('เงินสด', pu); if (r) return { rate: r, src: mine ? 'เรทเฉลี่ยที่แลกเงินสดมา' : tf('เรทที่ {x} แลกมา', { x: e.payer }) }; }
  if (e.method === 'Travel card' && !tcAuto(e)) { const r = walletRate('Travel card', pu); if (r) return { rate: r, src: mine ? 'เรทที่แลกเข้า Travel card' : tf('เรทบัตรของ {x}', { x: e.payer }) }; }
  if (e.rate) return { rate: e.rate, src: e.id ? 'เรทวันที่บันทึก' : 'เรทวันนี้' };
  return { rate: +x.rate || 0, src: 'เรทประมาณของทริป' };
}
const thbOf = e => isFx() ? e.amount * rateInfo(e).rate : e.amount;
const estimated = e => isFx() && (e.method === 'บัตรเครดิต' || tcAuto(e)) && !(+e.thbActual > 0);
const fmtRate = r => r >= 1 ? r.toFixed(2) : r >= 0.01 ? r.toFixed(4) : r.toFixed(6);
// ยอดใน Travel card ของฉัน: ส่วนที่แลกเป็นเงินต่างประเทศไว้ และส่วนที่เป็นเงินบาท
function cardState(excludeId) {
  const x = trip(), me = myName(), sum = a => a.reduce((s, e) => s + e.amount, 0);
  const tops = of('topup').filter(y => y.wallet === 'Travel card');
  const fxIn = sum(tops.filter(y => tcur(y) === x.currency));
  const thbIn = isFx() ? sum(tops.filter(y => tcur(y) === 'THB')) : 0;
  const items = expenseItems().filter(e => e.payer === me && e.method === 'Travel card' && e.id !== excludeId);
  const auto = items.filter(tcAuto), pre = items.filter(e => !tcAuto(e));
  const fxUsed = sum(pre), thbUsed = auto.reduce((a, e) => a + thbOf(e), 0);
  return { fxIn, fxUsed, fxLeft: fxIn - fxUsed, thbIn, thbUsed, thbLeft: thbIn - thbUsed, auto, autoFx: sum(auto) };
}
function ensureRate() {
  const cur = trip().currency;
  if (!isFx() || T.rateCur === cur) return;
  run('getRate', cur).then(r => { T.rateToday = r.rate; T.rateCur = cur; updateFxHint(); }).catch(() => {});
}
function cleanPay(o) {
  if (o.method !== 'Travel card') delete o.tcMode;
  if (!(o.method === 'บัตรเครดิต' || o.method === 'โอน/QR' || tcAuto(o))) delete o.thbActual;
}
function stampRate(o) { if (isFx() && !o.rate) o.rate = T.rateCur === trip().currency && T.rateToday || +trip().rate || 0; }
function tripStatus(x) {
  const today = ymd(new Date());
  if (x.start > today) return ['soon', tf('อีก {n} วัน', { n: Math.round((new Date(x.start) - new Date(today)) / 864e5) })];
  return x.end >= today ? ['now', t('กำลังเที่ยว')] : ['', t('จบแล้ว')];
}

/* ----- โหลดข้อมูล ----- */
/* ----- เก็บข้อมูลล่าสุดไว้ในเครื่อง: เปิดแอป/ทริปได้ทันที แล้วค่อยอัปเดตจาก Google เงียบๆ ----- */
const CK = () => 'ts_c_' + ME.username;
function cacheGet() { try { return JSON.parse(localStorage.getItem(CK()) || '{}'); } catch (e) { return {}; } }
function cacheSet(fn) {
  try {
    const c = cacheGet(); fn(c);
    const ids = Object.keys(c.trips || {}).sort((a, b) => c.trips[b].at - c.trips[a].at);
    ids.slice(6).forEach(k => delete c.trips[k]); // เก็บแค่ 6 ทริปล่าสุด
    localStorage.setItem(CK(), JSON.stringify(c));
  } catch (e) {}
}
function cacheTrip() {
  if (!T.id || !trip()) return;
  const id = T.id, recs = T.recs.filter(r => !r._pend), rates = T.rates;
  cacheSet(c => { c.trips = c.trips || {}; c.trips[id] = { recs, rates, at: Date.now() }; });
}
// แสดงสถานะกำลังบันทึก
let SYNC = 0;
function syncUI(d) {
  SYNC = Math.max(0, SYNC + d); const e = $('#sync'); e.textContent = t('กำลังบันทึก…'); e.hidden = !SYNC;
  if (!SYNC && T.id) { clearTimeout(T.rt); T.rt = setTimeout(() => { T.needReload = false; reloadTrip(); }, 300); }
}
window.addEventListener('beforeunload', e => { if (SYNC) { e.preventDefault(); e.returnValue = ''; } });

async function loadTrips() {
  if (!T.list) { const c = cacheGet(); if (c.list) { T.list = c.list; if (!T.id) renderTrips(); } }
  if (!T.list) $('#trips').innerHTML = `<div class="empty">${t('กำลังโหลด…')}</div>`;
  try { T.list = await run('listTrips'); cacheSet(c => { c.list = T.list; }); if (!T.id) renderTrips(); }
  catch (e) {
    if (T.id) return;
    $('#trips').innerHTML = `<div class="block"><div class="empty">${t('โหลดทริปไม่สำเร็จ')}<br>${esc(e && e.message || e)}</div>
      <button class="btn" data-act="retry">${t('ลองใหม่')}</button></div>`;
  }
}
// ทุกครั้งที่แก้ข้อมูลในเครื่อง ตัวนับจะเพิ่ม คำตอบจาก Google ที่ขอไว้ก่อนการแก้ล่าสุดจะไม่ถูกเอามาทับ
T.mut = 0;
const PENDREC = {}; // tripId -> รายการที่กำลังบันทึกค้างอยู่ (ยังไม่ได้คำตอบจากเซิร์ฟเวอร์)
const CONFIRMED = {}; // tripId -> [{rec, ts}] รายการที่เพิ่งบันทึกสำเร็จเมื่อไม่นาน
const RECENT_MS = 8000;
function noteConfirmed(tripId, rc) {
  const list = CONFIRMED[tripId] = (CONFIRMED[tripId] || []).filter(x => x.rec.id !== rc.id && Date.now() - x.ts < RECENT_MS);
  list.push({ rec: rc, ts: Date.now() });
}
// คำตอบจาก getTrip บางครั้งอ่านข้อมูลจากเซิร์ฟเวอร์ไปตั้งแต่ก่อนที่การบันทึกล่าสุดจะเขียนเสร็จ (ส่งคำขอพร้อมกัน)
// จึงอาจไม่มีรายการที่เพิ่งบันทึกหรือกำลังบันทึกอยู่ ใส่กลับเข้าไปกันไม่ให้ดูเหมือนรายการหายไป
function reconcilePending(id) {
  const now = Date.now();
  (PENDREC[id] || []).forEach(rc => { if (!T.recs.some(x => x.id === rc.id)) T.recs.push(rc); });
  (CONFIRMED[id] || []).forEach(({ rec: rc, ts }) => {
    if (now - ts > RECENT_MS) return;
    if (!T.recs.some(x => x.id === rc.id)) T.recs.push(rc);
  });
}
function applyTrip(r, sameTrip) {
  T.recs = r.recs; T.rates = r.rates || {}; T.loadedAt = Date.now();
  T.thumbs = Object.assign({}, sameTrip ? T.thumbs : {}, r.thumbs || {}); // รวมรูป ไม่ทิ้งรูปที่เพิ่งอัปโหลด
  reconcilePending(T.id);
}
function freshEnough(id, seq) { return T.id === id && T.mut === seq && !SYNC; }
// กันรายการหายถาวรถ้าปิดแอป/สลับแอปกลางคันตอนกำลังบันทึก (PENDREC/CONFIRMED อยู่แค่ในหน่วยความจำ หายไปถ้าโหลดหน้าใหม่)
// เก็บคำขอบันทึกที่ยังไม่ยืนยันไว้ใน localStorage ด้วย แล้วลองส่งซ้ำทุกครั้งที่เปิดแอป
const OBK = () => 'ts_ob_' + ME.username;
function obGet() { try { return JSON.parse(localStorage.getItem(OBK()) || '[]'); } catch (e) { return []; } }
function obSet(list) { try { localStorage.setItem(OBK(), JSON.stringify(list)); } catch (e) {} }
function obAdd(cid, payload, localId) { const l = obGet().filter(x => x.cid !== cid); l.push({ cid, payload, localId, ts: Date.now() }); obSet(l); }
function obRemove(cid) { const l = obGet(); const n = l.filter(x => x.cid !== cid); if (n.length !== l.length) obSet(n); }
async function flushOutbox() {
  for (const item of obGet()) {
    try {
      const r = await run('saveRec', item.payload);
      obRemove(item.cid);
      noteConfirmed(item.payload.tripId, r);
      if (T.id === item.payload.tripId) {
        const i = T.recs.findIndex(x => x.id === item.localId);
        if (i >= 0) T.recs[i] = r; else if (!T.recs.some(x => x.id === r.id)) T.recs.push(r);
        cacheTrip(); renderTrips();
      }
    } catch (e) {
      if (e && e.code === 'AUTH') break; // รอเข้าสู่ระบบใหม่ก่อน ค่อยลองใหม่ครั้งหน้า
      if (!isNetErr(e)) obRemove(item.cid); // เซิร์ฟเวอร์ปฏิเสธถาวร ลองซ้ำไปก็ไม่มีประโยชน์
    }
  }
}
// โหลดทริปใหม่เงียบๆ เพื่อเห็นรายการที่เพื่อนเพิ่งบันทึก
async function reloadTrip() {
  if (!T.id || $('#sheetBg').classList.contains('show')) return;
  const id = T.id;
  const seq = T.mut;
  try {
    const r = await run('getTrip', id);
    if (T.id !== id) return;
    if (!freshEnough(id, seq)) { Object.assign(T.thumbs, r.thumbs || {}); return; }
    if ($('#sheetBg').classList.contains('show')) { Object.assign(T.thumbs, r.thumbs || {}); return; }
    applyTrip(r, true); T.thumbCache[id] = T.thumbs; cacheTrip(); renderTrips();
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && T.id && Date.now() - (T.loadedAt || 0) > 20000) reloadTrip(); });
function goTrip(id) { openTrip(id); }
async function openTrip(id) {
  if (!T.id) navPush();
  T.id = id; T.recs = []; T.sub = 'overview'; T.day = 0; T.who = ''; T.catAll = false;
  const firstView = () => { const i = tripDays(trip()).indexOf(ymd(new Date())); if (i >= 0) { T.day = i; T.sub = 'plan'; } };
  const cached = (cacheGet().trips || {})[id];
  if (cached) {
    applyTrip({ recs: cached.recs, rates: cached.rates, thumbs: T.thumbCache[id] || {} }, false);
    T.loadedAt = 0; firstView(); renderTrips(); window.scrollTo(0, 0);
  }
  else { $('#trips').innerHTML = `<div class="empty">${t('กำลังเปิดทริป…')}</div>`; renderFab(); }
  const seq = T.mut;
  try {
    const r = await run('getTrip', id);
    if (T.id !== id) return;
    if (cached && (!freshEnough(id, seq) || $('#sheetBg').classList.contains('show'))) {
      Object.assign(T.thumbs, r.thumbs || {}); T.thumbCache[id] = T.thumbs; fillThumbs();
      if (T.mut !== seq || SYNC) T.needReload = true; // ขอใหม่หลังบันทึกเสร็จ
      return;
    }
    applyTrip(r, !!cached); T.thumbCache[id] = T.thumbs; cacheTrip();
    if (!cached) { firstView(); window.scrollTo(0, 0); }
    renderTrips();
  } catch (e) { if (!cached) { toast(e.message); goList(); } }
}
// บันทึกแบบไม่ต้องรอ: ปิดฟอร์มและแสดงรายการทันที แล้วส่งขึ้น Google ต่อเบื้องหลัง ถ้าไม่สำเร็จจะคืนค่าเดิม
const PEND = {}; // id ชั่วคราว -> Promise ของ id จริง
async function realId(id) { return PEND[id] ? await PEND[id] : id; }
const isNetErr = x => !!(x && /เชื่อมต่อไม่ได้|ตอบกลับผิดรูปแบบ/.test(x.message || ''));
function saver(kind) {
  return async o => {
    o.kind = kind; o.tripId = T.id;
    if (o.id && PEND[o.id]) { o.id = await PEND[o.id]; if (!o.id) throw new Error(t('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง')); }
    const tripId = T.id, prev = o.id ? rec(o.id) : null; T.mut++;
    const tmp = o.id ? '' : 'tmp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const local = { ...o, id: o.id || tmp, by: prev ? prev.by : ME.username, _pend: true };
    upsert(local); renderTrips(); toast(t('บันทึกแล้ว')); syncUI(1);
    (PENDREC[tripId] = PENDREC[tripId] || []).push(local);
    const send = { ...o }; delete send._pend;
    if (tmp) send.cid = tmp; // ให้เซิร์ฟเวอร์กันสร้างซ้ำ ถ้าคำขอนี้เคยไปถึงแล้วแต่ตอบกลับมาไม่ทัน (แอปถูกปิดกลางคัน)
    const outboxKey = tmp || (local.id + ':' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    // เก็บคำขอไว้ใน localStorage ด้วย กันรายการหายถาวรถ้าปิด/สลับแอปกลางคันก่อนบันทึกเสร็จ (ลองส่งซ้ำตอนเปิดแอปครั้งหน้า)
    obAdd(outboxKey, send, local.id);
    const job = run('saveRec', send).then(r => {
      obRemove(outboxKey);
      PENDREC[tripId] = (PENDREC[tripId] || []).filter(x => x.id !== local.id);
      noteConfirmed(tripId, r);
      if (T.id === tripId) {
        const i = T.recs.findIndex(x => x.id === local.id);
        if (i >= 0) T.recs[i] = r; else upsert(r);
        if (FORM && FORM.data && FORM.data.id === local.id) FORM.data.id = r.id;
        cacheTrip(); if (!$('#sheetBg').classList.contains('show')) renderTrips();
      }
      return r.id;
    }, x => {
      if (isNetErr(x)) {
        // เน็ตหลุดตอนบันทึก: คงรายการที่เห็นไว้เหมือนเดิม (ยังอยู่ใน PENDREC/localStorage) แล้วลองส่งซ้ำอัตโนมัติทันทีที่เน็ตกลับมาหรือเปิดแอปใหม่
        toast(t('เน็ตหลุดตอนบันทึก จะลองส่งใหม่ให้อัตโนมัติ'));
        return null;
      }
      obRemove(outboxKey);
      PENDREC[tripId] = (PENDREC[tripId] || []).filter(y => y.id !== local.id);
      if (T.id === tripId) {
        if (prev) upsert(prev); else T.recs = T.recs.filter(y => y.id !== local.id);
        renderTrips();
      }
      toast(t('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง') + (x && x.message ? ': ' + x.message : ''));
      return null;
    }).finally(() => { syncUI(-1); if (tmp) setTimeout(() => delete PEND[tmp], 60000); });
    if (tmp) PEND[tmp] = job;
  };
}
function deleter(id) {
  return async () => {
    if (!confirm(t('ลบรายการนี้?'))) return false;
    const tripId = T.id, prev = rec(id); T.mut++;
    T.recs = T.recs.filter(r => r.id !== id); renderTrips(); toast(t('ลบแล้ว')); syncUI(1);
    realId(id).then(rid => rid ? run('deleteRec', rid) : null).then(() => { if (T.id === tripId) cacheTrip(); }, x => {
      if (T.id === tripId && prev) { upsert(prev); renderTrips(); }
      toast(t('ลบไม่สำเร็จ ลองใหม่อีกครั้ง') + (x && x.message ? ': ' + x.message : ''));
    }).finally(() => syncUI(-1));
  };
}
