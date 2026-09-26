// หน้าเข้าสู่ระบบ/สมัคร/ลืมรหัสผ่าน (gate)
let GMODE = 'login', GSTEP = 1, GFID = '';
function setGateMode(m) {
  GMODE = m; GSTEP = 1;
  $('#gMode').hidden = m === 'forgot';
  $$('#gMode button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  $('#gEmailWrap').hidden = m !== 'signup';
  $('#gHint').hidden = m !== 'signup';
  $('#gForgot').hidden = m === 'signup';
  $('#gForgot').textContent = t(m === 'forgot' ? 'กลับไปเข้าสู่ระบบ' : 'ลืมรหัสผ่าน?');
  $('#gUser').disabled = false;
  $('#gUserLbl').textContent = t(m === 'forgot' ? 'ชื่อผู้ใช้หรืออีเมล' : 'ชื่อผู้ใช้');
  $('#gPassWrap').hidden = false;
  $('#gPass').type = 'password'; $('#gPass').removeAttribute('inputmode');
  $('#gPassLbl').textContent = t('รหัสผ่าน');
  $('#gPass').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
  $('#gPass2Wrap').hidden = m !== 'signup';
  $('#gPass2Lbl').textContent = t('ใส่รหัสผ่านอีกครั้ง');
  $('#gGo').textContent = t(m === 'signup' ? 'สมัครและเข้าใช้งาน' : m === 'forgot' ? 'ส่งรหัสยืนยัน' : 'เข้าสู่ระบบ');
  if (m === 'forgot') applyForgotStep();
}
// โหมด "ลืมรหัสผ่าน" มี 2 ขั้น: 1) กรอกชื่อผู้ใช้/อีเมล 2) กรอกรหัสยืนยันที่ได้ทางอีเมล + รหัสผ่านใหม่
// ใช้ช่อง gPass/gPass2 เดิมซ้ำ (แค่เปลี่ยนป้ายกำกับ) แทนที่จะเพิ่มฟอร์มใหม่
function applyForgotStep() {
  $('#gUser').disabled = GSTEP === 2;
  $('#gPassWrap').hidden = GSTEP === 1;
  $('#gPass').value = ''; $('#gPass2').value = '';
  $('#gPass').type = 'text'; $('#gPass').setAttribute('inputmode', 'numeric'); $('#gPass').autocomplete = 'one-time-code';
  $('#gPassLbl').textContent = t('รหัสยืนยัน (จากอีเมล)');
  $('#gPass2Wrap').hidden = GSTEP === 1;
  $('#gPass2Lbl').textContent = t('รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)');
  $('#gGo').textContent = t(GSTEP === 1 ? 'ส่งรหัสยืนยัน' : 'ตั้งรหัสผ่านใหม่');
}
const gateSub = () => { $('#gSub').textContent = t(QJOIN ? 'เพื่อนชวนคุณเข้าทริป สมัครบัญชีหรือเข้าสู่ระบบก่อน แล้วแอปจะพาเข้าทริปให้' : 'วางแผนทริปกับเพื่อน และดูว่าใครใช้เงินไปเท่าไร'); };
function showGate(msg, mode) {
  closeForm(); $('#fab').hidden = true;
  $('#gUrlWrap').hidden = !!API.url; $('#gServer').hidden = !API.url;
  $('#gUrl').value = API.url;
  $('#gUser').value = ME.username || ''; $('#gPass').value = ''; $('#gPass2').value = ''; $('#gEmail').value = '';
  setGateMode(mode || (QJOIN && !ME.username ? 'signup' : 'login'));
  gateSub();
  $('#gMsg').textContent = msg || '';
  $('#gate').hidden = false;
}
$('#gMode').onclick = e => { const b = e.target.closest('button'); if (b) { setGateMode(b.dataset.m); $('#gMsg').textContent = ''; } };
$('#gServer').onclick = () => { $('#gUrlWrap').hidden = false; $('#gServer').hidden = true; $('#gUrl').focus(); };
$('#gForgot').onclick = () => { setGateMode(GMODE === 'forgot' ? 'login' : 'forgot'); $('#gMsg').textContent = ''; };
$('#gGo').onclick = async () => {
  const url = $('#gUrl').value.trim();
  const msg = x => { $('#gMsg').textContent = x; };
  if (!/^https:\/\/script\.google\.com\/.+\/exec/.test(url)) return msg(t('ลิงก์ต้องขึ้นต้นด้วย https://script.google.com และลงท้ายด้วย /exec'));
  const b = $('#gGo'), label = b.textContent;
  const busy = on => { b.disabled = on; b.textContent = on ? t('รอสักครู่…') : label; };

  if (GMODE === 'forgot') {
    if (GSTEP === 1) {
      const id = $('#gUser').value.trim();
      if (!id) return msg(t('ใส่ชื่อผู้ใช้หรืออีเมล'));
      busy(true); msg('');
      try {
        const r = await call(url, { fn: 'requestReset', args: [id] });
        API.url = url; LS.set('ts_url', url);
        GFID = id; GSTEP = 2; applyForgotStep();
        toast(tf('ส่งรหัสไปที่ {x} แล้ว', { x: r.masked }));
      } catch (e) { msg(e.message); }
      busy(false);
    } else {
      const code = $('#gPass').value.trim(), newPw = $('#gPass2').value;
      if (!code || !newPw) return msg(t('ใส่รหัสยืนยันและรหัสผ่านใหม่'));
      busy(true); msg('');
      try {
        const r = await call(url, { fn: 'resetPassword', args: [GFID, code, newPw] });
        resetState(); setSession(r.token, r.username);
        $('#gate').hidden = true; start();
      } catch (e) { msg(e.message); }
      busy(false);
    }
    return;
  }

  const user = $('#gUser').value.trim(), pass = $('#gPass').value;
  if (!user || !pass) return msg(t('ใส่ชื่อผู้ใช้และรหัสผ่าน'));
  if (GMODE === 'signup' && pass !== $('#gPass2').value) return msg(t('รหัสผ่านสองช่องไม่ตรงกัน'));
  if (GMODE === 'signup' && !$('#gEmail').value.trim()) return msg(t('ใส่อีเมลสำหรับกู้คืนรหัสผ่าน'));
  busy(true); msg('');
  try {
    const args = GMODE === 'signup' ? [user, pass, $('#gEmail').value.trim()] : [user, pass];
    const r = await call(url, { fn: GMODE === 'signup' ? 'register' : 'login', args });
    API.url = url; LS.set('ts_url', url);
    resetState(); setSession(r.token, r.username);
    $('#gate').hidden = true; start();
  } catch (e) { msg(e.message); }
  busy(false);
};
['gUser', 'gEmail', 'gPass', 'gPass2'].forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') $('#gGo').click(); }));
