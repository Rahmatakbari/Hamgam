console.log("app.js loaded");
// ══════════════════════════════════════════════════════════════
// سیستم احراز هویت و مدیریت وضعیت برنامه
// ══════════════════════════════════════════════════════════════

const AuthStates = {
  NOT_ACTIVATED: 'NOT_ACTIVATED',
  ACTIVATED_NO_USER: 'ACTIVATED_NO_USER',
  READY: 'READY'
};

const AuthStorage = {
  keys: {
    ACTIVATION_STATUS: 'hamgam_activation_status',
    ACTIVATION_PASSWORD: 'hamgam_activation_password',
    USER_PASSWORD_HASH: 'hamgam_user_password_hash',
    APP_STATE: 'hamgam_app_state'
  },
  
  // بررسی وضعیت برنامه
  getAppState: function() {
    const isActivated = localStorage.getItem(this.keys.ACTIVATION_STATUS) === 'true';
    const hasUserPassword = !!localStorage.getItem(this.keys.USER_PASSWORD_HASH);
    
    if (!isActivated) {
      return AuthStates.NOT_ACTIVATED;
    } else if (!hasUserPassword) {
      return AuthStates.ACTIVATED_NO_USER;
    } else {
      return AuthStates.READY;
    }
  },
  
  // فعال‌سازی برنامه
  activateApp: function(activationPassword) {
    localStorage.setItem(this.keys.ACTIVATION_STATUS, 'true');
    localStorage.setItem(this.keys.ACTIVATION_PASSWORD, activationPassword);
  },
  
  // بررسی رمز فعال‌سازی
  verifyActivationPassword: function(password) {
    const storedPassword = localStorage.getItem(this.keys.ACTIVATION_PASSWORD) || '1234';
    return password === storedPassword;
  },
  
  // ثبت رمز کاربر
  setUserPassword: function(password) {
    const hash = this.hashPassword(password);
    localStorage.setItem(this.keys.USER_PASSWORD_HASH, hash);
  },
  
  // بررسی رمز کاربر
  verifyUserPassword: function(password) {
    const storedHash = localStorage.getItem(this.keys.USER_PASSWORD_HASH);
    if (!storedHash) return false;
    const hash = this.hashPassword(password);
    return hash === storedHash;
  },
  
  // Hash ساده رمز (در production باید از crypto قوی‌تر استفاده شود)
  hashPassword: function(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'hash_' + Math.abs(hash).toString(36) + '_' + password.length;
  },
  
  // ریست کامل (برای تست)
  resetAll: function() {
    localStorage.removeItem(this.keys.ACTIVATION_STATUS);
    localStorage.removeItem(this.keys.ACTIVATION_PASSWORD);
    localStorage.removeItem(this.keys.USER_PASSWORD_HASH);
  }
};
// ══════════════════════════════════════════════════════════════
// منطق صفحات احراز هویت
// ══════════════════════════════════════════════════════════════

// نمایش/مخفی کردن رمز
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    `;
  } else {
    input.type = 'password';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `;
  }
}

// فعال‌سازی برنامه
function handleActivation() {
  const code = document.getElementById('activationCode').value.trim();
  const errorEl = document.getElementById('activationError');
  const input = document.getElementById('activationCode');
  
  // پاک کردن خطای قبلی
  errorEl.textContent = '';
  input.classList.remove('error');
  
  // بررسی خالی بودن
  if (!code) {
    errorEl.textContent = 'لطفاً رمز فعال‌سازی را وارد کنید';
    input.classList.add('error');
    return;
  }
  
  // بررسی رمز
  if (AuthStorage.verifyActivationPassword(code)) {
    // فعال‌سازی موفق
    AuthStorage.activateApp(code);
    showPage('createPassword');
  } else {
    // رمز اشتباه
    errorEl.textContent = 'رمز فعال‌سازی نادرست است';
    input.classList.add('error');
    input.focus();
  }
}

// ایجاد رمز کاربر
function handleCreatePassword() {
  const password = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const errorEl = document.getElementById('createPasswordError');
  
  // پاک کردن خطای قبلی
  errorEl.textContent = '';
  
  // بررسی خالی بودن
  if (!password) {
    errorEl.textContent = 'لطفاً رمز عبور را وارد کنید';
    return;
  }
  
  // بررسی طول رمز
  if (password.length < 4) {
    errorEl.textContent = 'رمز عبور باید حداقل ۴ کاراکتر باشد';
    return;
  }
  
  // بررسی تطابق رمزها
  if (password !== confirm) {
    errorEl.textContent = 'رمزهای عبور یکسان نیستند';
    return;
  }
  
  // ذخیره رمز
  AuthStorage.setUserPassword(password);
  showPage('login');
}

// ورود به برنامه
function handleLogin() {
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const input = document.getElementById('loginPassword');
  
  // پاک کردن خطای قبلی
  errorEl.textContent = '';
  input.classList.remove('error');
  
  // بررسی خالی بودن
  if (!password) {
    errorEl.textContent = 'لطفاً رمز عبور را وارد کنید';
    input.classList.add('error');
    return;
  }
  
  // بررسی رمز
  if (AuthStorage.verifyUserPassword(password)) {
    // ورود موفق
    sessionStorage.setItem('hamgam_logged_in', 'true');
    document.getElementById('authContainer').style.display = 'none';
    // اجرای برنامه اصلی
    if (typeof initMainApp === 'function') {
      initMainApp();
    }
  } else {
    // رمز اشتباه
    errorEl.textContent = 'رمز عبور نادرست است';
    input.classList.add('error');
    input.focus();
  }
}

// اثر انگشت (placeholder)
function handleFingerprint() {
  alert('قابلیت اثر انگشت در نسخه‌های آینده اضافه خواهد شد');
}

// فراموشی رمز (placeholder)
function handleForgotPassword() {
  if (confirm('آیا مطمئن هستید؟ این عملیات تمام داده‌های برنامه را پاک می‌کند.')) {
    AuthStorage.resetAll();
    location.reload();
  }
}

// نمایش صفحه
function showPage(page) {
  const pages = ['activation', 'createPassword', 'login'];
  pages.forEach(p => {
    const el = document.getElementById(p + 'Page');
    if (el) el.style.display = 'none';
  });
  
  const targetPage = document.getElementById(page + 'Page');
  if (targetPage) {
    targetPage.style.display = 'block';
    // فوکوس روی اولین input
    setTimeout(() => {
      const firstInput = targetPage.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }
}

// تشخیص وضعیت و نمایش صفحه مناسب
function initAuth() {
  console.log('initAuth called');
  
  // پاک کردن sessionStorage برای تست
  sessionStorage.removeItem('hamgam_logged_in');
  
  try {
    const state = AuthStorage.getAppState();
    console.log('State:', state);
    
    const container = document.getElementById('authContainer');
    
    if (!container) {
      console.error('authContainer not found!');
      return;
    }
    
    // اگر برنامه قبلاً فعال شده و کاربر وارد شده، container را مخفی کن
    if (state === AuthStates.READY) {
      const isLoggedIn = sessionStorage.getItem('hamgam_logged_in') === 'true';
      console.log('isLoggedIn:', isLoggedIn);
      if (isLoggedIn) {
        container.style.display = 'none';
        console.log('User already logged in, hiding auth container');
        return;
      }
    }
    
    // container از قبل نمایش داده می‌شود (display:flex در CSS)
    console.log('Showing auth container');
    
    // نمایش صفحه مناسب
    switch (state) {
      case AuthStates.NOT_ACTIVATED:
        showPage('activation');
        console.log('Showing activation page');
        break;
      case AuthStates.ACTIVATED_NO_USER:
        showPage('createPassword');
        console.log('Showing create password page');
        break;
      case AuthStates.READY:
        showPage('login');
        console.log('Showing login page');
        break;
    }
  } catch (error) {
    console.error('Error in initAuth:', error);
  }
}

// اجرای سیستم احراز هویت
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired');
  initAuth();
});

// Enter key support
document.addEventListener('DOMContentLoaded', function() {
  // فعال‌سازی
  const activationInput = document.getElementById('activationCode');
  if (activationInput) {
    activationInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleActivation();
    });
  }
  
  // ایجاد رمز
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  if (newPasswordInput) {
    newPasswordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') confirmPasswordInput.focus();
    });
  }
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleCreatePassword();
    });
  }
  
  // ورود
  const loginInput = document.getElementById('loginPassword');
  if (loginInput) {
    loginInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
  }
});
/* ==========================================================================
   فروشگاه هم‌گام — سیستم کامل «فروشگاه + گدام» (موبایل، آفلاین)
   --------------------------------------------------------------------------
   بخش‌بندی فایل:
     ۱) ابزارها      — اعداد فارسی، پول، تاریخ شمسی
     ۲) تقویم شمسی   — محاسبه دقیق جلالی (بدون کتابخانه)
     ۳) انبارهٔ داده — مدل داده + ذخیره در localStorage
     ۴) محاسبات      — مانده مشتری/فراهم‌کننده، صندوق، سود، گزارش
     ۵) اجزای ظاهری  — پیام، شیت پایین، تأیید
     ۶) صفحه‌ها      — خانه، فروش، گدام، حساب‌ها، بیشتر
     ۷) کنش‌ها        — همهٔ دکمه‌ها
     ۸) راه‌اندازی
   بدون هیچ کتابخانهٔ خارجی — کاملاً آفلاین و موبایل‌اول.
   ========================================================================== */
'use strict';

/* ══════════════ ۱) ابزارها ══════════════ */
var FA = '۰۱۲۳۴۵۶۷۸۹';

/** ارقام فارسی/عربی → لاتین */
function toEn(s) {
  return String(s == null ? '' : s)
    .replace(/[۰-۹]/g, function (d) { return String(FA.indexOf(d)); })
    .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); })
    .replace(/[،,\\s]/g, '');
}
/** لاتین → فارسی */
function toFa(s) { return String(s == null ? '' : s); }
/** خواندن عدد از هر ورودی */
function num(s, def) { var v = parseFloat(toEn(s)); return isFinite(v) ? v : (def || 0); }
/** گرد کردن پول تا ۲ رقم */
function m2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
/** جداکننده هزارگان */
function group(n) {
  var x = m2(n); var neg = x < 0; x = Math.abs(x);
  var i = Math.floor(x); var f = Math.round((x - i) * 100);
  var s = String(i).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (f) s += '.' + (f < 10 ? '0' + f : f);
  return (neg ? '-' : '') + s;
}
function money(n) { return '<span style="direction:ltr;display:inline-block">' + toFa(group(n)) + ' ' + DB.settings.currency + '</span>'; }
function moneyPlain(n) { return toFa(group(n)) + ' ' + DB.settings.currency; } // برای متن ساده (بدون HTML)
function fmtMoney(amount, currency) { 
  // فرمت کردن مبلغ با direction:ltr برای نمایش صحیح در RTL
  return '<span style="direction:ltr;display:inline-block">' + (amount < 0 ? '-' : '') + toFa(group(Math.abs(amount))) + ' ' + esc(currency) + '</span>';
}
function qtyTxt(n) { return toFa(group(n)); }
function signedMoney(n) {
  var v = m2(n);
  var color = v < 0 ? 'var(--danger)' : v > 0 ? 'var(--ink)' : 'var(--muted)';
  var sign = v < 0 ? '-' : '';
  return '<span class="tnum" style="color:' + color + ';direction:ltr;display:inline-block">' + sign + toFa(group(Math.abs(v))) + ' ' + esc(DB.settings.currency) + '</span>';
}
function balColor(n) { return n < 0 ? 'var(--danger)' : n > 0 ? 'var(--success)' : 'var(--muted)'; }
function balColorSupplier(n) { return n > 0 ? 'var(--danger)' : n < 0 ? 'var(--success)' : 'var(--muted)'; }
/** جلوگیری از تزریق HTML */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
}
function uid(p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ══════════════ ۲) تقویم شمسی (الگوریتم دقیق) ══════════════ */
function _div(a, b) { return ~~(a / b); }
function _mod(a, b) { return a - ~~(a / b) * b; }
var JBREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
  1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
function jalCal(jy, noLeap) {
  var bl = JBREAKS.length, gy = jy + 621, leapJ = -14, jp = JBREAKS[0];
  var jm, jump = 0, leap, leapG, march, n, i;
  for (i = 1; i < bl; i++) {
    jm = JBREAKS[i]; jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + _div(jump, 33) * 8 + _div(_mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ = leapJ + _div(n, 33) * 8 + _div(_mod(n + 3, 33), 4);
  if (_mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  leapG = _div(gy, 4) - _div((_div(gy, 100) + 1) * 3, 4) - 150;
  march = 20 + leapJ - leapG;
  if (!noLeap) {
    if (jump - n < 6) n = n - jump + _div(jump + 4, 33) * 33;
    leap = _mod(_mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
  }
  return { leap: leap, gy: gy, march: march };
}
function g2d(gy, gm, gd) {
  var d = _div((gy + _div(gm - 8, 6) + 100100) * 1461, 4)
    + _div(153 * _mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  return d - _div(_div(gy + 100100 + _div(gm - 8, 6), 100) * 3, 4) + 752;
}
function d2g(jdn) {
  var j = 4 * jdn + 139361631;
  j = j + _div(_div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  var i = _div(_mod(j, 1461), 4) * 5 + 308;
  var gd = _div(_mod(i, 153), 5) + 1;
  var gm = _mod(_div(i, 153), 12) + 1;
  var gy = _div(j, 1461) - 100100 + _div(8 - gm, 6);
  return { gy: gy, gm: gm, gd: gd };
}
function toJalali(date) {
  var d = date ? (typeof date === 'string' ? parseLocalDateStr(date) : new Date(date)) : new Date();
  var jdn = g2d(d.getFullYear(), d.getMonth() + 1, d.getDate());
  var gy = d2g(jdn).gy, jy = gy - 621;
  var r = jalCal(jy, false), jdn1f = g2d(gy, 3, r.march), k = jdn - jdn1f, jm, jd;
  if (k >= 0) {
    if (k <= 185) { jm = 1 + _div(k, 31); jd = _mod(k, 31) + 1; return { jy: jy, jm: jm, jd: jd, dow: d.getDay() }; }
    k -= 186;
  } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
  jm = 7 + _div(k, 30); jd = _mod(k, 30) + 1;
  return { jy: jy, jm: jm, jd: jd, dow: d.getDay() };
}

function toGregorian(jy, jm, jd) {
  var r = jalCal(jy, true);
  var jdn1f = g2d(r.gy, 3, r.march);
  var jdn = jdn1f + (jm <= 6 ? (jm - 1) * 31 : (jm - 1) * 30 + 6) + jd - 1;
  var g = d2g(jdn);
  return new Date(g.gy, g.gm - 1, g.gd);
}

function jalaliLeap(jy) {
  var r = jalCal(jy, false);
  return r.leap === 0;
}

function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalaliLeap(jy) ? 30 : 29;
}
var AF_MONTHS = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
var IR_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
var DOW = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
function monthName(i) { return (DB.settings.months === 'ir' ? IR_MONTHS : AF_MONTHS)[i - 1] || ''; }
function faDate(date) { 
  var j = toJalali(date); 
  var month = j.jm < 10 ? '0' + j.jm : j.jm;
  var day = j.jd < 10 ? '0' + j.jd : j.jd;
  return j.jy + '-' + month + '-' + day; 
}
function faDateLong(date) { var j = toJalali(date); return DOW[j.dow] + '، ' + faDate(date); }

/** تبدیل Date به ISO string محلی (بدون تغییر timezone) */
function toLocalISOString(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

/** تاریخ‌گیر عمومی — جایگزین همهٔ open*DatePicker های تکراری */
var _datePickerValues = {};

function openDatePicker(inputId, afterPick) {
  var input = typeof inputId === 'string' ? document.getElementById(inputId) : inputId;
  if (!input) input = document.querySelector('[data-iso]');
  var currentDate = input && input.dataset.iso ? parseLocalDateStr(input.dataset.iso) : new Date();
  var reopenCallback = _reopenSheetCallback;
  var inputIdStr = typeof inputId === 'string' ? inputId : (input ? input.id : '');
  jalaliDatePicker(currentDate, function(selectedDate) {
    var isoStr = toLocalDateStr(selectedDate);
    // ذخیره مقدار برای بازیابی بعدی
    if (inputIdStr) {
      _datePickerValues[inputIdStr] = isoStr;
    }
    if (input) {
      input.value = faDate(selectedDate);
      input.dataset.iso = isoStr;
    }
    if (afterPick) afterPick(selectedDate, input);
    // بازیابی sheet قبلی
    if (reopenCallback) {
      reopenCallback();
    }
  });
}
/* سازگاری عقبی: wrapper های کوتاه */
function openInvoiceDatePicker() { openDatePicker(null, function(d) { invoiceDate = toLocalDateStr(d); }); }
function openTxDatePicker()     { openDatePicker('txDate'); }
function openTrsDatePicker() {
  // ذخیره مقادیر فرم قبل از باز کردن date picker
  _treasuryFormData.amount = $('#trsAmount') ? $('#trsAmount').value : '';
  _treasuryFormData.reason = $('#trsReason') ? $('#trsReason').value : '';
  _treasuryFormData.note = $('#trsNote') ? $('#trsNote').value : '';
  openDatePicker('trsDate');
}
function openPurDatePicker()    { openDatePicker('purDate'); }
function openClDatePicker()     { openDatePicker('clDate'); }
function openAccPayDatePicker() { openDatePicker('accPayDate'); }
function openAccDebtDatePicker(){ openDatePicker('accDebtDate'); }
function openEditTxDatePicker() { openDatePicker('editTxDate'); }

function jalaliDatePicker(currentDate, callback) {
  var selected = currentDate ? toJalali(currentDate) : toJalali();
  var viewYear = selected.jy;
  var viewMonth = selected.jm;
  var touchStartX = 0;
  var touchEndX = 0;
  var isConfirming = false; // flag برای جلوگیری از اجرای دوباره
  
  function render() {
    // محاسبه روز هفته اول ماه جلالی
    var firstDayGregorian = toGregorian(viewYear, viewMonth, 1);
    var firstDayDow = firstDayGregorian.getDay(); // 0=یکشنبه، 1=دوشنبه، ...، 6=شنبه
    
    var monthLen = jalaliMonthLength(viewYear, viewMonth);
    var monthNameStr = monthName(viewMonth);
    
    var body = '';
    
    // Header - تاریخ انتخاب شده
    body += '<div style="text-align:center;margin-bottom:16px;padding:16px;background:var(--surface2);border-radius:12px">';
    body += '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">تاریخ انتخاب شده</div>';
    body += '<div style="font-size:28px;font-weight:800;color:var(--primary);margin-bottom:6px;letter-spacing:2px">' + toFa(selected.jd) + ' / ' + toFa(selected.jm) + ' / ' + toFa(selected.jy) + '</div>';
    body += '<div style="font-size:13px;color:var(--muted);font-weight:600">' + monthNameStr + ' ' + toFa(selected.jy) + '</div>';
    body += '</div>';
    
    // Navigator - انتخاب ماه و سال
    body += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:0 4px">';
    body += '<button class="icon-btn" data-dp="prevMonth" aria-label="ماه قبل" style="width:44px;height:44px;border-radius:10px"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6"/></svg></button>';
    body += '<button data-dp="openMonthYearPicker" style="text-align:center;font-size:20px;font-weight:800;background:transparent;border:none;padding:10px 20px;border-radius:10px;cursor:pointer;letter-spacing:1px">' + toFa(viewMonth) + ' / ' + toFa(viewYear) + '</button>';
    body += '<button class="icon-btn" data-dp="nextMonth" aria-label="ماه بعد" style="width:44px;height:44px;border-radius:10px"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg></button>';
    body += '</div>';
    
    // Day names
    body += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:12px;padding:0 2px">';
    ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].forEach(function(d) {
      body += '<div style="text-align:center;font-size:13px;color:var(--muted);font-weight:700;padding:8px;text-transform:uppercase">' + d + '</div>';
    });
    body += '</div>';
    
    // Days with swipe container
    body += '<div class="date-picker-days" id="datePickerDays" style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;padding:0 2px">';
    
    // Empty cells before first day
    // تبدیل day of week از JavaScript (0=یکشنبه) به تقویم ما (0=شنبه)
    // فرمول: (firstDayDow + 1) % 7
    // مثال: یکشنبه (0) → 1 empty cell، شنبه (6) → 0 empty cells
    var emptyCells = (firstDayDow + 1) % 7;
    for (var i = 0; i < emptyCells; i++) {
      body += '<div></div>';
    }
    
    // Days
    for (var d = 1; d <= monthLen; d++) {
      var isSelected = (viewYear === selected.jy && viewMonth === selected.jm && d === selected.jd);
      var isToday = (viewYear === toJalali().jy && viewMonth === toJalali().jm && d === toJalali().jd);
      var bgColor = isSelected ? 'var(--primary)' : 'transparent';
      var textColor = isSelected ? 'var(--primary-fg)' : 'var(--ink)';
      var fontWeight = isSelected ? '800' : '600';
      var border = isToday && !isSelected ? '2px solid var(--primary)' : '2px solid transparent';
      
      body += '<button class="date-day" data-day="' + d + '" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:10px;background:' + bgColor + ';color:' + textColor + ';font-weight:' + fontWeight + ';font-size:15px;border:' + border + '">' + toFa(d) + '</button>';
    }
    
    body += '</div>';
    
    sheet({
      title: 'انتخاب تاریخ',
      body: body,
      foot: '<button class="btn outline" data-act="closeSheet" style="flex:1">لغو</button><button class="btn" data-dp="confirmDate" style="flex:1">تأیید</button>',
      reopenCallback: null, // بدون reopenCallback (قبلاً ذخیره شده)
      onOpen: function(wrap) {
        // Event delegation روی sheet body
        var sheetBody = wrap.querySelector('.sheet-body');
        var sheetFoot = wrap.querySelector('.sheet-foot');
        
        function handleClick(e) {
          if (e.target.closest('[data-dp="prevMonth"]')) {
            e.preventDefault();
            e.stopPropagation();
            var daysContainer = document.getElementById('datePickerDays');
            if (daysContainer) daysContainer.classList.add('slide-right');
            setTimeout(function() {
              viewMonth--;
              if (viewMonth < 1) { viewMonth = 12; viewYear--; }
              render();
            }, 150);
          } else if (e.target.closest('[data-dp="nextMonth"]')) {
            e.preventDefault();
            e.stopPropagation();
            var daysContainer = document.getElementById('datePickerDays');
            if (daysContainer) daysContainer.classList.add('slide-left');
            setTimeout(function() {
              viewMonth++;
              if (viewMonth > 12) { viewMonth = 1; viewYear++; }
              render();
            }, 150);
          } else if (e.target.closest('[data-dp="openMonthYearPicker"]')) {
            e.preventDefault();
            e.stopPropagation();
            openMonthYearPicker(viewYear, viewMonth, function(year, month) {
              viewYear = year;
              viewMonth = month;
              render();
            });
          } else if (e.target.closest('[data-day]')) {
            e.preventDefault();
            e.stopPropagation();
            var day = parseInt(e.target.closest('[data-day]').dataset.day);
            selected = { jy: viewYear, jm: viewMonth, jd: day };
            render();
          } else if (e.target.closest('[data-dp="confirmDate"]')) {
            if (isConfirming) return; // جلوگیری از اجرای دوباره
            isConfirming = true;
            e.preventDefault();
            e.stopPropagation();
            var gDate = toGregorian(selected.jy, selected.jm, selected.jd);
            closeSheet();
            if (callback) callback(gDate);
          }
        }
        
        if (sheetBody) sheetBody.addEventListener('click', handleClick);
        if (sheetFoot) sheetFoot.addEventListener('click', handleClick);
        
        // Swipe events
        var daysContainer = document.getElementById('datePickerDays');
        if (daysContainer) {
          daysContainer.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
          });
          daysContainer.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
          });
        }
      }
    });
  }
  
  function handleSwipe() {
    var diff = touchEndX - touchStartX;
    var threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      var daysContainer = document.getElementById('datePickerDays');
      if (diff > 0) {
        if (daysContainer) daysContainer.classList.add('slide-right');
        setTimeout(function() {
          viewMonth--;
          if (viewMonth < 1) { viewMonth = 12; viewYear--; }
          render();
        }, 150);
      } else {
        if (daysContainer) daysContainer.classList.add('slide-left');
        setTimeout(function() {
          viewMonth++;
          if (viewMonth > 12) { viewMonth = 1; viewYear++; }
          render();
        }, 150);
      }
    }
  }
  
  render();
}

function openMonthYearPicker(currentYear, currentMonth, callback) {
  var selectedYear = currentYear;
  var selectedMonth = currentMonth;
  
  var body = '<div class="month-year-picker">';
  
  // Year selector
  body += '<div style="margin-bottom:20px">';
  body += '<div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--muted)">سال</div>';
  body += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
  for (var y = currentYear - 5; y <= currentYear + 5; y++) {
    var isSelected = (y === selectedYear);
    var bgColor = isSelected ? 'var(--primary)' : 'var(--surface2)';
    var textColor = isSelected ? 'var(--primary-fg)' : 'var(--ink)';
    body += '<button data-year="' + y + '" style="padding:10px;border-radius:8px;background:' + bgColor + ';color:' + textColor + ';font-weight:600;font-size:14px;border:none;cursor:pointer;transition:all 0.2s">' + toFa(y) + '</button>';
  }
  body += '</div>';
  body += '</div>';
  
  // Month selector
  body += '<div>';
  body += '<div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--muted)">ماه</div>';
  body += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
  for (var m = 1; m <= 12; m++) {
    var isSelected = (m === selectedMonth);
    var bgColor = isSelected ? 'var(--primary)' : 'var(--surface2)';
    var textColor = isSelected ? 'var(--primary-fg)' : 'var(--ink)';
    body += '<button data-month="' + m + '" style="padding:10px;border-radius:8px;background:' + bgColor + ';color:' + textColor + ';font-weight:600;font-size:13px;border:none;cursor:pointer;transition:all 0.2s">' + toFa(m) + '<br><span style="font-size:11px;opacity:0.8">' + monthName(m) + '</span></button>';
  }
  body += '</div>';
  body += '</div>';
  
  body += '</div>';
  
  sheet({
    title: 'انتخاب ماه و سال',
    body: body,
    foot: '<button class="btn outline" data-act="closeSheet" style="flex:1">لغو</button><button class="btn" data-dp="confirmMonthYear" style="flex:1">تأیید</button>',
    onOpen: function(wrap) {
      var sheetBody = wrap.querySelector('.sheet-body');
      var sheetFoot = wrap.querySelector('.sheet-foot');
      
      function handleClick(e) {
        if (e.target.closest('[data-year]')) {
          e.preventDefault();
          e.stopPropagation();
          selectedYear = parseInt(e.target.closest('[data-year]').dataset.year);
          document.querySelectorAll('[data-year]').forEach(function(btn) {
            var y = parseInt(btn.dataset.year);
            var isSelected = (y === selectedYear);
            btn.style.background = isSelected ? 'var(--primary)' : 'var(--surface2)';
            btn.style.color = isSelected ? 'var(--primary-fg)' : 'var(--ink)';
          });
        } else if (e.target.closest('[data-month]')) {
          e.preventDefault();
          e.stopPropagation();
          selectedMonth = parseInt(e.target.closest('[data-month]').dataset.month);
          document.querySelectorAll('[data-month]').forEach(function(btn) {
            var m = parseInt(btn.dataset.month);
            var isSelected = (m === selectedMonth);
            btn.style.background = isSelected ? 'var(--primary)' : 'var(--surface2)';
            btn.style.color = isSelected ? 'var(--primary-fg)' : 'var(--ink)';
          });
        } else if (e.target.closest('[data-dp="confirmMonthYear"]')) {
          e.preventDefault();
          e.stopPropagation();
          closeSheet();
          if (callback) callback(selectedYear, selectedMonth);
        }
      }
      
      if (sheetBody) sheetBody.addEventListener('click', handleClick);
      if (sheetFoot) sheetFoot.addEventListener('click', handleClick);
    }
  });
}
function faTime(date) {
  var d = new Date(date); var h = d.getHours(), mi = d.getMinutes();
  return toFa((h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi);
}
function dayKey(date) {
  var j = toJalali(date);
  return j.jy + '-' + (j.jm < 10 ? '0' : '') + j.jm + '-' + (j.jd < 10 ? '0' : '') + j.jd;
}
/**
 * بررسی اینکه تاریخ در بازه مشخص است یا نه
 * 
 * @param {string} iso - تاریخ به فرمت YYYY-MM-DD یا ISO
 * @param {string} range - بازه: 'today', 'week', 'month', 'all'
 * @returns {boolean}
 * 
 * تعاریف:
 * - today: امروز محلی
 * - week: هفته جاری شمسی (شنبه تا جمعه)
 * - month: ماه جاری شمسی
 */
function inRange(iso, range) {
  if (range === 'all') return true;
  
  var now = new Date();
  var d = parseLocalDateStr(iso);
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (range === 'today') {
    return d >= today;
  }
  
  if (range === 'week') {
    // هفته جاری شمسی (شنبه تا جمعه)
    var jalaliToday = toJalali(now);
    var dayOfWeek = jalaliToday.dow; // 0=شنبه، 1=یکشنبه، ...، 6=جمعه
    
    // پیدا کردن شنبه این هفته
    var saturday = new Date(today);
    saturday.setDate(saturday.getDate() - dayOfWeek);
    
    return d >= saturday;
  }
  
  if (range === 'month') {
    // ماه جاری شمسی
    var jalaliToday = toJalali(now);
    var firstDayOfMonth = toGregorian(jalaliToday.jy, jalaliToday.jm, 1);
    
    return d >= firstDayOfMonth;
  }
  
  return true;
}
/* ══════════════ نمودارهای SVG ══════════════ */
function svgBarChart(data, options) {
  var o = options || {};
  var width = o.width || 320;
  var height = o.height || 180;
  var padding = { top: 20, right: 10, bottom: 40, left: 50 };
  var chartW = width - padding.left - padding.right;
  var chartH = height - padding.top - padding.bottom;
  
  if (!data || !data.length) {
    return '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">داده‌ای موجود نیست</div>';
  }
  
  var maxVal = Math.max.apply(null, data.map(function(d) { return d.value; }));
  if (maxVal === 0) maxVal = 1;
  
  var barW = Math.min(30, (chartW / data.length) * 0.7);
  var gap = (chartW - barW * data.length) / (data.length + 1);
  
  var svg = '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%;max-width:' + width + 'px;height:auto">';
  
  // محور Y
  for (var i = 0; i <= 4; i++) {
    var y = padding.top + (chartH / 4) * i;
    var val = maxVal - (maxVal / 4) * i;
    svg += '<line x1="' + padding.left + '" y1="' + y + '" x2="' + (width - padding.right) + '" y2="' + y + '" stroke="var(--line)" stroke-width="1"/>';
    svg += '<text x="' + (padding.left - 5) + '" y="' + (y + 4) + '" text-anchor="end" fill="var(--muted)" font-size="10">' + toFa(Math.round(val)) + '</text>';
  }
  
  // میله‌ها
  data.forEach(function(d, i) {
    var x = padding.left + gap + i * (barW + gap);
    var barH = (d.value / maxVal) * chartH;
    var y = padding.top + chartH - barH;
    var color = d.color || 'var(--primary)';
    
    svg += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + barH + '" fill="' + color + '" rx="3"/>';
    svg += '<text x="' + (x + barW / 2) + '" y="' + (height - padding.bottom + 15) + '" text-anchor="middle" fill="var(--muted)" font-size="10">' + esc(d.label) + '</text>';
  });
  
  svg += '</svg>';
  return svg;
}

function svgPieChart(data, options) {
  var o = options || {};
  var size = o.size || 160;
  var radius = size / 2 - 10;
  var cx = size / 2;
  var cy = size / 2;
  
  if (!data || !data.length) {
    return '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">داده‌ای موجود نیست</div>';
  }
  
  var total = data.reduce(function(sum, d) { return sum + d.value; }, 0);
  if (total === 0) {
    return '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">داده‌ای موجود نیست</div>';
  }
  
  var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" style="width:100%;max-width:' + size + 'px;height:auto">';
  var angle = 0;
  
  data.forEach(function(d) {
    var slice = (d.value / total) * 360;
    var startAngle = angle;
    var endAngle = angle + slice;
    
    var x1 = cx + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    var y1 = cy + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    var x2 = cx + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    var y2 = cy + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    var largeArc = slice > 180 ? 1 : 0;
    var color = d.color || 'var(--primary)';
    
    if (slice >= 360) {
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="' + color + '"/>';
    } else {
      svg += '<path d="M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z" fill="' + color + '"/>';
    }
    
    angle = endAngle;
  });
  
  svg += '</svg>';
  return svg;
}

function svgBarChartLegend(data, options) {
  var o = options || {};
  var html = '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:8px">';
  data.forEach(function(d) {
    var color = d.color || 'var(--primary)';
    html += '<div style="display:flex;align-items:center;gap:6px;font-size:11px">';
    html += '<div style="width:12px;height:12px;border-radius:3px;background:' + color + '"></div>';
    html += '<span>' + esc(d.label) + ': ' + toFa(d.value) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function todayInput() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

/**
 * تبدیل Date به YYYY-MM-DD محلی (بدون تبدیل به UTC)
 * استفاده برای ذخیره تاریخ‌های "روز تقویمی"
 */
function toLocalDateStr(date) {
  var d = date || new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

/**
 * تبدیل YYYY-MM-DD (محلی یا UTC) به Date محلی
 * اگر ISO کامل باشد (با T و Z)، به روز محلی درست تفسیر می‌کند
 */
function parseLocalDateStr(str) {
  if (!str) return new Date();
  var parts = String(str).split('T')[0].split('-');
  return new Date(+parts[0], (+parts[1] || 1) - 1, +parts[2] || 1);
}

function todayInputSafe() { return todayInput(); }

function parseInputDate(v) {
  if (!v) return new Date();
  var p = String(v).split('-');
  return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
}

/* ══════════════ انواع حساب ══════════════ */
var ACCOUNT_TYPES = {
  customer: { 
    label: 'مشتری', 
    color: 'var(--primary)', 
    icon: 'م'
  },
  supplier: { 
    label: 'فراهم‌کننده', 
    color: 'var(--accent)', 
    icon: 'ف'
  },
  exchange: { 
    label: 'صراف', 
    color: 'var(--info)', 
    icon: 'ص'
  },
  employee: { 
    label: 'کارمند', 
    color: 'var(--warning)', 
    icon: 'ک'
  },
  partner: { 
    label: 'شریک', 
    color: '#9B59B6', 
    icon: 'ش'
  },
  bank: { 
    label: 'حساب بانکی', 
    color: '#16A085', 
    icon: 'ب'
  },
  cash: { 
    label: 'صندوق', 
    color: '#27AE60', 
    icon: 'خ'
  },
  expense: { 
    label: 'مصرف', 
    color: 'var(--danger)', 
    icon: 'م'
  },
  income: { 
    label: 'درآمد', 
    color: 'var(--success)', 
    icon: 'د'
  },
  other: { 
    label: 'سایر', 
    color: 'var(--muted)', 
    icon: 'س'
  }
};

function getAccountColor(name) {
  var colors = [
    '#FF6B6B', // قرمز
    '#4ECDC4', // فیروزه‌ای
    '#45B7D1', // آبی
    '#FFA07A', // نارنجی روشن
    '#98D8C8', // سبز نعنایی
    '#F7DC6F', // زرد
    '#BB8FCE', // بنفش
    '#85C1E2', // آبی روشن
    '#F8B739', // طلایی
    '#52B788', // سبز
    '#E63946', // قرمز تیره
    '#A8DADC', // آبی ملایم
    '#FFB4A2', // صورتی
    '#B5E48C', // سبز روشن
    '#CDB4DB', // بنفش ملایم
    '#FFC8DD'  // صورتی روشن
  ];
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getAccountInitial(name, type, size) {
  var color = getAccountColor(name);
  var initial = name ? name.charAt(0) : '?';
  return '<span style="position:relative;width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">' +
    '<span style="position:absolute;inset:0;background:' + color + ';opacity:0.2;border-radius:50%"></span>' +
    '<span style="position:relative;font-size:18px;font-weight:700;color:var(--ink)">' + initial + '</span>' +
    '</span>';
}

function accountById(id) {
  return DB.accounts.find(function(a) { return a.id === id; });
}

function accountBalance(id) {
  var acc = accountById(id);
  if (!acc) return 0;
  var b = m2(acc.opening || 0);
  
  // شناسه مشتری/فراهم‌کننده (oldId یا id)
  var entityId = acc.oldId || acc.id;
  
  // محاسبه از فاکتورهای فروش (اگر مشتری باشد)
  if (acc.type === 'customer') {
    // فروش → افزایش بدهی مشتری
    DB.sales.forEach(function(s) { 
      if (s.customerId === entityId) b += m2(s.total); 
    });
    // پرداخت مشتری → کاهش بدهی
    DB.payments.forEach(function(p) { 
      if (p.customerId === entityId) b -= m2(p.amount); 
    });
  }
  
  // محاسبه از فاکتورهای خرید (اگر فراهم‌کننده باشد)
  if (acc.type === 'supplier') {
    // خرید → افزایش بدهی ما به فراهم‌کننده
    DB.purchases.forEach(function(p) { 
      if (p.supplierId === entityId) b += m2(p.total); 
    });
    // پرداخت به فراهم‌کننده → کاهش بدهی
    DB.supplierPayments.forEach(function(p) { 
      if (p.supplierId === entityId) b -= m2(p.amount); 
    });
  }
  
  // محاسبه از accountAdjustments (برای همه انواع حساب)
  // چک کن هم accountId و هم customerId/supplierId (برای backward compatibility)
  DB.accountAdjustments.forEach(function(a) { 
    if (a.accountId === id) {
      b += m2(a.delta);
    } else if (acc.type === 'customer' && a.kind === 'cust' && a.customerId === entityId) {
      b += m2(a.delta);
    } else if (acc.type === 'supplier' && a.kind === 'supp' && a.supplierId === entityId) {
      b += m2(a.delta);
    }
  });
  
  return m2(b);
}

function balColorForAccount(balance, type) {
  // برای مصرف: مثبت = قرمز (هزینه)، منفی = سبز
  // برای عاید: مثبت = سبز (درآمد)، منفی = قرمز
  // برای بقیه: مثبت = قرمز (قرضدار)، منفی = سبز (طلبکار)
  if (type === 'expense') {
    return balance > 0 ? 'var(--danger)' : balance < 0 ? 'var(--success)' : 'var(--muted)';
  } else if (type === 'income') {
    return balance > 0 ? 'var(--success)' : balance < 0 ? 'var(--danger)' : 'var(--muted)';
  } else {
    return balance > 0 ? 'var(--danger)' : balance < 0 ? 'var(--success)' : 'var(--muted)';
  }
}
var KEY = 'hamgam.store.v1';
function blankDB() {
  return {
    settings: {
      shop: 'فروشگاه هم‌گام', currency: 'AFN', phone: '', address: '',
      footer: 'از خرید شما سپاسگزاریم', theme: 'light', months: 'af',
      lowStock: 3, printer: 'a4', pin: '',
      whatsappTemplate: 'سلام {customer}، بردگی شما نزد {shop} مبلغ {amount} است. لطفاً تسویه فرمایید.',
    },
    categories: [],
    products: [], suppliers: [], customers: [],
    sales: [], payments: [], accountAdjustments: [],
    purchases: [], supplierPayments: [],
    stockAdjustments: [], stockMoves: [], expenses: [],
    treasury: [],
    accounts: [], // سیستم حساب چندنوعی
    counters: { sale: 0, purchase: 0 }
  };
}
var DB = blankDB();
function load() {
  try {
    var raw = localStorage.getItem(KEY);
    if (!raw) return;
    var d = JSON.parse(raw);
    var b = blankDB();
    // ادغام امن: فیلدهای جدید اگر در بکاپ نبودند، از پیش‌فرض می‌مانند
    DB.settings = Object.assign(b.settings, d.settings || {});
    
    // تبدیل "افغانی" به "AFN" (migration)
    if (DB.settings.currency === 'افغانی') {
      DB.settings.currency = 'AFN';
      save();
    }
    
    ['categories', 'products', 'suppliers', 'customers', 'sales', 'payments', 'accountAdjustments',
      'purchases', 'supplierPayments', 'stockAdjustments', 'stockMoves', 'expenses', 'treasury', 'accounts']
      .forEach(function (k) { DB[k] = d[k] || b[k]; });
    // مهاجرت داده‌های قدیمی به نام‌های جدید (سازگاری با بکاپ‌های پیشین)
    if (d.movements) DB.stockMoves = d.movements;
    if (d.adjustments) DB.stockAdjustments = d.adjustments;
    if (d.custAdj) d.custAdj.forEach(function (a) { DB.accountAdjustments.push(Object.assign({ kind: 'cust' }, a)); });
    if (d.suppAdj) d.suppAdj.forEach(function (a) { DB.accountAdjustments.push(Object.assign({ kind: 'supp' }, a)); });
    DB.counters = Object.assign(b.counters, d.counters || {});
    // مهاجرت customers و suppliers به accounts (سیستم چندنوعی)
    migrateToAccounts();
  } catch (e) { console.warn('خواندن داده ناموفق', e); }
}
/* ══════════════ مهاجرت به سیستم چندنوعی ══════════════ */
function migrateToAccounts() {
  if (!DB.accounts) DB.accounts = [];
  
  var migrated = false;
  
  // مهاجرت customers
  DB.customers.forEach(function(c) {
    // چک کن آیا account مربوطه وجود دارد یا نه
    var existingAcc = DB.accounts.find(function(a) { 
      return (a.oldId === c.id || a.id === c.id) && a.type === 'customer'; 
    });
    
    if (!existingAcc) {
      DB.accounts.push({
        id: 'acc_' + c.id,
        oldId: c.id,
        oldType: 'customer',
        type: 'customer',
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        note: c.note || '',
        opening: c.opening || 0,
        pinned: c.pinned || false,
        disabled: c.disabled || false,
        createdAt: c.createdAt || new Date().toISOString()
      });
      migrated = true;
    } else {
      // همگام‌سازی account با customer
      existingAcc.name = c.name;
      existingAcc.phone = c.phone || '';
      existingAcc.address = c.address || '';
      existingAcc.note = c.note || '';
      existingAcc.opening = c.opening || 0;
      existingAcc.pinned = c.pinned || false;
      existingAcc.disabled = c.disabled || false;
      migrated = true;
    }
  });
  
  // مهاجرت suppliers
  DB.suppliers.forEach(function(s) {
    var existingAcc = DB.accounts.find(function(a) { 
      return (a.oldId === s.id || a.id === s.id) && a.type === 'supplier'; 
    });
    
    if (!existingAcc) {
      DB.accounts.push({
        id: 'acc_' + s.id,
        oldId: s.id,
        oldType: 'supplier',
        type: 'supplier',
        name: s.name,
        phone: s.phone || '',
        address: s.address || '',
        note: s.note || '',
        opening: s.opening || 0,
        pinned: s.pinned || false,
        disabled: s.disabled || false,
        createdAt: s.createdAt || new Date().toISOString()
      });
      migrated = true;
    } else {
      // همگام‌سازی account با supplier
      existingAcc.name = s.name;
      existingAcc.phone = s.phone || '';
      existingAcc.address = s.address || '';
      existingAcc.note = s.note || '';
      existingAcc.opening = s.opening || 0;
      existingAcc.pinned = s.pinned || false;
      existingAcc.disabled = s.disabled || false;
      migrated = true;
    }
  });
  
  // مهاجرت accountAdjustments (تنظیم accountId)
  DB.accountAdjustments.forEach(function(a) {
    if (!a.accountId) {
      if (a.kind === 'cust' && a.customerId) {
        a.accountId = 'acc_' + a.customerId;
        migrated = true;
      } else if (a.kind === 'supp' && a.supplierId) {
        a.accountId = 'acc_' + a.supplierId;
        migrated = true;
      }
    }
  });
  
  if (migrated) {
    save();
  }
}

var saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); }
    catch (e) { toast('ذخیره نشد — حافظهٔ مرورگر اجازه نمی‌دهد', 'bad'); }
    autoBackup();
    // بازخورد بصری خیلی سبک
    var ind = document.createElement('div');
    ind.className = 'save-indicator';
    document.body.appendChild(ind);
    setTimeout(function() { if (ind.parentNode) ind.remove(); }, 600);
  }, 60);
}
var META_KEY = 'hamgam.store.meta';
function autoBackup() {
  try {
    var meta = {};
    try { meta = JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch (e) { meta = {}; }
    var today = todayInput();
    if (meta.lastAuto === today) return; // امروز قبلاً بکاپ گرفته شده
    localStorage.setItem(KEY + '.auto', JSON.stringify(DB));
    meta.lastAuto = today;
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) { }
}
var PENDING_PIN = null;
/**
 * درخواست ورود PIN قبل از اجرای عملیات حساس
 * 
 * @param {function} onOk - callback که بعد از تأیید PIN اجرا می‌شود
 * 
 * رفتار:
 * - اگر DB.settings.pin خالی باشد → onOk اجرا می‌شود (بدون قفل)
 * - اگر DB.settings.pin تنظیم شده باشد → sheet ورود رمز نمایش داده می‌شود
 * 
 * ⚠️ محدودیت امنیتی:
 * PIN به‌صورت plaintext در localStorage ذخیره می‌شود.
 * این یک محافظت ساده در برابر دسترسی تصادفی است، نه امنیت واقعی.
 * برای امنیت واقعی، باید از hash (مثل SHA-256) استفاده شود،
 * اما در اپ آفلاین موبایل، امنیت مطلق وجود ندارد.
 */
function requirePin(onOk) {
  if (!DB.settings.pin) { onOk(); return; }
  sheet({
    title: 'ورود رمز',
    body: fld('رمز ۴ رقمی', '<input class="input tnum" id="pinInput" inputmode="numeric" maxlength="4" data-focus placeholder="••••">'),
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="pinSubmit">تأیید</button>',
    onOpen: function () { PENDING_PIN = onOk; }
  });
}

/* ══════════════ ۴) محاسبات ══════════════ */
function customerBalance(id) {
  // پیدا کردن account مربوطه
  var acc = DB.accounts.find(function(a) { 
    return (a.oldId === id || a.id === id) && a.type === 'customer'; 
  });
  
  if (acc) {
    // استفاده از accountBalance (منبع حقیقت)
    return accountBalance(acc.id);
  } else {
    // fallback برای backward compatibility
    var c = customerById(id);
    var b = c ? m2(c.opening || 0) : 0;
    DB.sales.forEach(function (s) { if (s.customerId === id) b += m2(s.total); });
    DB.payments.forEach(function (p) { if (p.customerId === id) b -= m2(p.amount); });
    DB.accountAdjustments.forEach(function (a) { if (a.kind === 'cust' && a.customerId === id) b += m2(a.delta); });
    return m2(b);
  }
}

function supplierBalance(id) {
  // پیدا کردن account مربوطه
  var acc = DB.accounts.find(function(a) { 
    return (a.oldId === id || a.id === id) && a.type === 'supplier'; 
  });
  
  if (acc) {
    // استفاده از accountBalance (منبع حقیقت)
    return accountBalance(acc.id);
  } else {
    // fallback برای backward compatibility
    var c = supplierById(id);
    var b = c ? m2(c.opening || 0) : 0;
    DB.purchases.forEach(function (s) { if (s.supplierId === id) b += m2(s.total); });
    DB.supplierPayments.forEach(function (p) { if (p.supplierId === id) b -= m2(p.amount); });
    DB.accountAdjustments.forEach(function (a) { if (a.kind === 'supp' && a.supplierId === id) b += m2(a.delta); });
    return m2(b);
  }
}
function cashBox() {
  var v = 0;
  // محاسبات خودکار از عملیات‌ها (فقط اگر withTreasury داشته باشند)
  DB.sales.forEach(function (s) { v += m2(s.paid); });
  DB.payments.forEach(function (p) { 
    // فقط پرداخت‌هایی که withTreasury ندارند (قدیمی) یا withTreasury = true
    if (p.withTreasury === undefined || p.withTreasury === true) {
      v += m2(p.amount); 
    }
  });
  DB.expenses.forEach(function (e) { v -= m2(e.amount); });
  DB.supplierPayments.forEach(function (p) { 
    if (p.withTreasury === undefined || p.withTreasury === true) {
      v -= m2(p.amount); 
    }
  });
  DB.purchases.forEach(function (p) { v -= m2(p.paid); });
  // تراکنش‌های دستی خزانه (فقط manual)
  DB.treasury.forEach(function (t) {
    if (t.source === 'manual') {
      if (t.type === 'in') v += m2(t.amount);
      else if (t.type === 'out') v -= m2(t.amount);
    }
  });
  return m2(v);
}
function treasurySummary(range) {
  var totalIn = 0, totalOut = 0;
  DB.treasury.forEach(function (t) {
    if (!inRange(t.date, range)) return;
    if (t.type === 'in') totalIn += m2(t.amount);
    else if (t.type === 'out') totalOut += m2(t.amount);
  });
  return { totalIn: m2(totalIn), totalOut: m2(totalOut), net: m2(totalIn - totalOut) };
}
function addTreasury(type, amount, reason, method, date, note, source) {
  DB.treasury.push({
    id: uid('trs'),
    type: type, // 'in' or 'out'
    amount: m2(amount),
    reason: reason || '',
    method: method || 'نقد',
    date: date || new Date().toISOString(),
    note: note || '',
    source: source || 'manual'
  });
}
function saleProfit(s) {
  var g = 0;
  s.items.forEach(function (it) { g += (m2(it.price) - m2(it.cost)) * num(it.qty); });
  return m2(g - m2(s.discount));
}
function summary(range) {
  var out = { count: 0, sales: 0, profit: 0, cash: 0, credit: 0, expenses: 0, purchase: 0 };
  DB.sales.forEach(function (s) {
    if (!inRange(s.date, range)) return;
    out.count++; out.sales += m2(s.total); out.profit += saleProfit(s);
    out.cash += m2(s.paid); out.credit += m2(s.due);
  });
  DB.expenses.forEach(function (e) { if (inRange(e.date, range)) out.expenses += m2(e.amount); });
  DB.purchases.forEach(function (p) { if (inRange(p.date, range)) out.purchase += m2(p.total); });
  ['sales', 'profit', 'cash', 'credit', 'expenses', 'purchase'].forEach(function (k) { out[k] = m2(out[k]); });
  return out;
}
function topProducts(range) {
  var map = {};
  DB.sales.forEach(function (s) {
    if (!inRange(s.date, range)) return;
    s.items.forEach(function (it) {
      if (!map[it.pid]) map[it.pid] = { name: it.name, qty: 0, total: 0 };
      map[it.pid].qty += num(it.qty);
      map[it.pid].total += m2(it.price) * num(it.qty);
    });
  });
  return Object.keys(map).map(function (k) { return map[k]; })
    .sort(function (a, b) { return b.total - a.total; });
}
/**
 * جمع بدهی مشتریان (از منبع داده واحد: DB.accounts)
 * 
 * @returns {number} - جمع بدهی همه مشتریان فعال
 * 
 * قانون: حساب‌های disabled خارج جمع هستند
 */
function totalDebt() { 
  var t = 0; 
  DB.accounts.forEach(function (acc) { 
    if (acc.type === 'customer' && !acc.disabled) {
      var b = accountBalance(acc.id); 
      if (b > 0) t += b; 
    }
  }); 
  return m2(t); 
}

/**
 * جمع بدهی به تأمین‌کنندگان (از منبع داده واحد: DB.accounts)
 * 
 * @returns {number} - جمع بدهی به همه تأمین‌کنندگان فعال
 * 
 * قانون: حساب‌های disabled خارج جمع هستند
 */
function totalPayable() { 
  var t = 0; 
  DB.accounts.forEach(function (acc) { 
    if (acc.type === 'supplier' && !acc.disabled) {
      var b = accountBalance(acc.id); 
      if (b > 0) t += b; 
    }
  }); 
  return m2(t); 
}
function productById(id) { return DB.products.find(function (p) { return p.id === id; }); }
function customerById(id) { return DB.customers.find(function (c) { return c.id === id; }); }
function supplierById(id) { return DB.suppliers.find(function (c) { return c.id === id; }); }
function stockState(p) {
  var min = num(p.min, DB.settings.lowStock);
  if (num(p.stock) <= 0) return 'bad';
  if (min > 0 && num(p.stock) <= min) return 'low';
  return 'ok';
}
/**
 * چک کردن موجودی قبل از تغییر
 * 
 * @param {string} pid - شناسه کالا
 * @param {number} qtyChange - تغییر تعداد (مثبت = افزایش، منفی = کاهش)
 * @param {string} operationName - نام عملیات برای پیام خطا
 * @returns {boolean} - true اگر مجاز، false اگر غیرمجاز
 */
function checkStock(pid, qtyChange, operationName) {
  var p = productById(pid);
  
  // کالا وجود ندارد
  if (!p) {
    toast('کالا یافت نشد. عملیات ' + (operationName || '') + ' لغو شد.', 'bad');
    return false;
  }
  
  var currentStock = num(p.stock);
  var newStock = m2(currentStock + qtyChange);
  
  // اگر کاهش موجودی است و موجودی کافی نیست
  if (qtyChange < 0 && newStock < 0) {
    var productName = p.name || 'کالای ناشناس';
    var shortage = Math.abs(newStock);
    toast('موجودی ' + productName + ' کافی نیست. کمبود: ' + toFa(group(shortage)) + ' ' + (p.unit || 'عدد'), 'bad');
    return false;
  }
  
  return true;
}

/**
 * اعمال تغییر موجودی با چک کردن
 * 
 * @param {string} pid - شناسه کالا
 * @param {number} qtyChange - تغییر تعداد (مثبت = افزایش، منفی = کاهش)
 * @param {string} moveType - نوع حرکت (sale, purchase, return, adjust)
 * @param {string} moveNote - توضیح حرکت
 * @param {string} operationName - نام عملیات برای پیام خطا
 * @returns {boolean} - true اگر موفق، false اگر ناموفق
 */
function addStockMove(type, pid, qty, note, d) {
  DB.stockMoves.push({ 
    id: uid('mv'), 
    date: (d ? d.toISOString() : new Date().toISOString()), 
    productId: pid, 
    type: type, 
    qty: m2(qty), 
    note: note || '' 
  });
}

function applyStockChange(pid, qtyChange, moveType, moveNote, operationName) {
  if (!checkStock(pid, qtyChange, operationName)) {
    return false;
  }
  
  var p = productById(pid);
  p.stock = m2(num(p.stock) + qtyChange);
  addStockMove(moveType, pid, Math.abs(qtyChange), moveNote);
  
  return true;
}
function stockMovesFor(pid) {
  return DB.stockMoves.filter(function (m) { return !pid || m.productId === pid; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
}

/* ══════════════ ۵) اجزای ظاهری ══════════════ */
var $ = function (s) { return document.querySelector(s); };
var viewEl, sheetRoot, toastRoot;
function toast(msg, kind) {
  var el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  toastRoot.appendChild(el);
  setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; setTimeout(function () { el.remove(); }, 260); }, 2200);
}
var _reopenSheetCallback = null;

/**
 * سیستم Sheet با پشتیبانی از Nested Sheets
 * 
 * چرخه حیات:
 * 1. وقتی sheet جدید باز می‌شود، sheet قبلی پنهان می‌شود (نه بسته)
 * 2. وقتی sheet بسته می‌شود، sheet قبلی دوباره نشان داده می‌شود
 * 3. state (مبلغ، یادداشت، id، تاریخ) خودکار حفظ می‌شود
 */
var _sheetStack = [];
var _treasuryFormData = {}; // ذخیره مقادیر فرم خزانه

function sheet(opts) {
  // اگر sheet قبلی وجود دارد، پنهانش کن
  var currentSheet = sheetRoot.querySelector('.sheet-wrapper');
  if (currentSheet) {
    _sheetStack.push(currentSheet);
    currentSheet.style.display = 'none';
  }
  
  _reopenSheetCallback = opts.reopenCallback || null;
  var wrap = document.createElement('div');
  wrap.className = 'sheet-wrapper';
  var headHtml = '';
  if (opts.title !== '') {
    headHtml = '<div class="sheet-head"><b>' + esc(opts.title) + '</b>' +
    '<button class="icon-btn no-print" data-act="closeSheet" aria-label="بستن">' +
    '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/></svg>' +
    '</button></div>';
  }
  wrap.innerHTML =
    '<div class="backdrop no-print" data-act="closeSheet"></div>' +
    '<div class="sheet" role="dialog">' +
    '<div class="grab"></div>' +
    headHtml +
    '<div class="sheet-body">' + opts.body + '</div>' +
    (opts.foot ? '<div class="sheet-foot no-print">' + opts.foot + '</div>' : '') +
    '</div>';
  sheetRoot.appendChild(wrap);
  document.body.style.overflow = 'hidden';

  // Swipe-down روی grab برای بستن
  var grab = wrap.querySelector('.grab');
  if (grab) {
    var startY = 0, threshold = 60;
    grab.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; }, { passive: true });
    grab.addEventListener('touchend', function(e) {
      var dy = e.changedTouches[0].clientY - startY;
      if (dy > threshold) closeSheet();
    }, { passive: true });
  }

  if (opts.onOpen) opts.onOpen(wrap);
  var f = wrap.querySelector('[data-focus]');
  if (f) setTimeout(function () { f.focus(); }, 120);
}
/** ثبت handler های تاریخ‌گیر برای پاکسازی هنگام closeSheet */
var _datePickerHandlers = [];
function registerDatePickerHandler(fn) { _datePickerHandlers.push(fn); }
function clearDatePickerHandlers() {
  _datePickerHandlers.forEach(function(fn) { document.removeEventListener('click', fn); });
  _datePickerHandlers = [];
}
function closeSheet() {
  // حذف همه sheets (نه فقط یکی)
  sheetRoot.innerHTML = '';
  
  // پاک کردن stack
  _sheetStack = [];
  
  clearDatePickerHandlers();
  
  // پاک کردن state
  document.body.style.overflow = '';
  _reopenSheetCallback = null;
  // _datePickerValues را پاک نکن - reopenCallback ممکن است sheet قبلی را دوباره باز کند
}
function confirmBox(title, msg, onYes, yesTxt) {
  sheet({
    title: title,
    body: '<p style="margin:0;color:var(--muted);font-size:13.5px;line-height:1.9">' + esc(msg) + '</p>',
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button>' +
      '<button class="btn danger" data-act="confirmYes">' + esc(yesTxt || 'بله، انجام شود') + '</button>',
    onOpen: function () { PENDING_YES = onYes; }
  });
}
var PENDING_YES = null;
var PAY_WITH_TREASURY = true;

/* ══════════════ ۶) صفحه‌ها ══════════════ */
var route = 'home';
var cart = [];
var repRange = 'today';
var moreTab = 'report';
var accTypeFilter = '';
var accActiveFilter = 'all';
var qAccount = '';
var qProduct = '';
var qCustomer = '';
var qSupplier = '';
var accTab = 'cust';     // cust | supp
var PRESELECT_CUSTOMER = ''; // مشتری پیش‌انتخاب‌شده در تسویه (برای «بردگی جنس»)
var CHECKOUT_CUSTOMER = ''; // مشتری فعلی در شیت تسویه (برای نمایش آخرین قیمت)
var receiptItems = []; // اقلام فرم ورود کالا (چندقلمی)
var invoiceCustomer = ''; // مشتری انتخاب‌شده در فاکتور
var invoiceDate = ''; // تاریخ فاکتور
var invoiceNote = ''; // یادداشت فاکتور
var invoiceDiscount = 0; // تخفیف فاکتور
var invoicePaid = 0; // پرداختی فاکتور
var qProductAdd = ''; // جست‌وجو در شیت افزودن کالا
var stockCat = '';       // دستهٔ فیلتر شده در گدام
var EDIT_ID = '', RET = [], RETURN_ID = '';

function render(noScroll) {
  var html = '';
  if (route === 'home') html = viewHome();
  else if (route === 'sale') html = viewSale();
  else if (route === 'stock') html = viewStock();
  else if (route === 'accounts') html = viewAccounts();
  else if (route === 'treasury') html = viewTreasury();
  else html = viewMore();
  viewEl.innerHTML = html;
  viewEl.classList.toggle('has-action-bar', route === 'sale' && cart.length > 0);
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.go === route); });
  $('#shopName').textContent = DB.settings.shop || 'فروشگاه هم‌گام';
  $('#todayLabel').textContent = faDateLong();
  if (!noScroll) window.scrollTo(0, 0);
}
function go(r) {
  // وقتی وارد صفحه فروش می‌شود و سبد خالی است، اطلاعات فاکتور ریست شود
  if (r === 'sale' && !cart.length) resetInvoice();
  route = r;
  // به‌روزرسانی URL hash برای حفظ صفحه هنگام refresh
  if (location.hash !== '#' + r) location.hash = r;
  render();
}

function emptyBox(title, desc, btn) {
  return '<div class="card"><div class="empty">' +
    '<div class="ic"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="m12 2 9 5v10l-9 5-9-5V7Zm0 0v10m0 0 9-5m-9 5-9-5"/></svg></div>' +
    '<b>' + esc(title) + '</b><p>' + esc(desc || '') + '</p>' + (btn || '') + '</div></div>';
}
/** empty state کوچک و یکدست برای داخل کارت/لیست */
function emptyInline(msg) {
  return '<div style="text-align:center;padding:28px 16px;color:var(--muted);font-size:13px">' + esc(msg) + '</div>';
}

/* ─────────── خانه ─────────── */
function viewHome() {
  var t = summary('today'), debt = totalDebt(), pay = totalPayable(), cash = cashBox();
  var low = DB.products.filter(function (p) { return stockState(p) !== 'ok'; });
  var recent = DB.sales.slice().reverse().slice(0, 5);
  var recentPayments = DB.payments.slice().reverse().slice(0, 3);
  var hasActivity = recent.length > 0 || recentPayments.length > 0;

  var h = '';

  // ═══ ۱. کارت‌های خلاصه ═══
  h += '<div class="stats">';
  h += dashStat('فروش امروز', money(t.sales), toFa(t.count) + ' فاکتور', 'pri', 'M3 3h2l.4 2M7 13h10l3-8H5.4M7 13 5.4 5');
  h += dashStat('نقد صندوق', money(cash), '', cash >= 0 ? 'info' : 'bad', 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6');
  h += dashStat('آوردگی مشتریان', money(debt), debt > 0 ? 'دارد' : 'تسویه', debt > 0 ? 'warn' : 'ok', 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z');
  h += dashStat('بردگی تأمین‌کننده', money(pay), pay > 0 ? 'داریم' : 'تسویه', pay > 0 ? 'bad' : 'ok', 'M20 12V8H4v4m0 0 8 5 8-5');
  h += '</div>';

  // ═══ ۱.۵ نمودارها ═══
  if (t.count > 0) {
    h += '<div class="section-title" style="margin-top:14px">نمودار امروز</div>';
    h += '<div class="card" style="padding:14px">';
    
    // نمودار دایره‌ای نقد/نسیه
    var cashSales = 0, creditSales = 0;
    DB.sales.forEach(function(s) {
      if (!inRange(s.date, 'today')) return;
      cashSales += s.paid;
      creditSales += s.due;
    });
    
    if (cashSales > 0 || creditSales > 0) {
      h += '<div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--muted)">نسبت نقد به نسیه</div>';
      h += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">';
      h += '<div style="flex:1">' + svgPieChart([
        { label: 'نقد', value: cashSales, color: 'var(--success)' },
        { label: 'نسیه', value: creditSales, color: 'var(--warning)' }
      ], { size: 120 }) + '</div>';
      h += '<div style="flex:1">';
      h += '<div style="margin-bottom:8px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--success);margin-left:6px"></span><span style="font-size:12px">نقد: ' + money(cashSales) + '</span></div>';
      h += '<div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--warning);margin-left:6px"></span><span style="font-size:12px">نسیه: ' + money(creditSales) + '</span></div>';
      h += '</div></div>';
    }
    
    // ۳ کالای پرفروش
    var top = topProducts('today').slice(0, 3);
    if (top.length > 0) {
      h += '<div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--muted)">پرفروش‌ترین کالاها</div>';
      h += svgBarChart(top.map(function(p, i) {
        return { label: p.name.substring(0, 8), value: p.qty, color: ['var(--primary)', 'var(--info)', 'var(--accent)'][i] };
      }), { height: 140 });
      h += svgBarChartLegend(top.map(function(p, i) {
        return { label: p.name, value: toFa(p.qty) + ' عدد', color: ['var(--primary)', 'var(--info)', 'var(--accent)'][i] };
      }));
    }
    
    h += '</div>';
  }

  // ═══ ۲. اقدام سریع ═══
  h += '<div class="section-title" style="margin-top:14px">اقدام سریع</div>';
  h += '<div class="quick">';
  h += quickAct('goodsReceipt', 'ورود کالا', '#B4532A', 'M3 7h18v10H3zM3 12h18M7 7v10');
  h += quickAct('quickReceive', 'آوردگی', '#1B7F5A', 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6');
  h += quickAct('newExpense', 'مصرف', '#C0392B', 'M12 5v14M5 12h14');
  h += quickAct('goTreasury', 'خزانه', '#5B4DDA', 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6');
  h += quickAct('closing', 'بستن صندوق', '#2A6DB4', 'M3 3v6h18V3M3 21v-6h18v6M3 9h18M3 15h18');
  h += '</div>';

  // ═══ ۳. هشدارها ═══
  if (low.length) {
    h += '<div class="section-title" style="margin-top:18px">';
    h += '<span style="display:flex;align-items:center;gap:5px;color:var(--warning)">';
    h += '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>';
    h += 'نیاز به توجه</span></div>';

    // کالاهای کم
    if (low.length) {
      h += '<div class="card" style="padding:10px 12px;margin-bottom:8px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
      h += '<span style="font-size:12.5px;font-weight:700;color:var(--danger)">' + toFa(low.length) + ' کالا رو به اتمام</span>';
      h += '<button data-act="goStock" style="font-size:11px;font-weight:700;color:var(--primary)">گدام ←</button></div>';
      low.slice(0, 3).forEach(function (p) {
        var st = stockState(p);
        h += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--line)">';
        h += '<span class="chip ' + st + '" style="flex:none;font-size:10px;padding:2px 7px">' + (st === 'bad' ? '✗' : '↓') + '</span>';
        h += '<span style="flex:1;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.name) + '</span>';
        h += '<span class="tnum" style="font-size:11px;color:var(--muted);flex:none">' + qtyTxt(p.stock) + ' ' + esc(p.unit || '') + '</span>';
        h += '</div>';
      });
      h += '</div>';
    }
  }

  // ═══ ۴. آخرین فاکتورها ═══
  if (recent.length) {
    h += '<div class="section-title" style="margin-top:18px">آخرین فاکتورها' + (DB.sales.length > 3 ? '<button data-act="allSales">همه ←</button>' : '') + '</div>';
    h += '<div class="list">';
    recent.slice(0, 3).forEach(function (s) {
      h += '<button class="item" data-act="openSale" data-id="' + s.id + '">' +
        '<span class="ic" style="font-size:12px">' + toFa(s.no) + '</span>' +
        '<div class="mid"><div class="t">' + esc(s.customerName || 'نقدی') + '</div><div class="s">' + faDate(s.date) + ' · ' + faTime(s.date) + '</div></div>' +
        '<div class="end"><b class="tnum">' + money(s.total) + '</b>' + (s.due > 0 ? '<span class="chip low" style="font-size:10px">بردگی</span>' : '<span class="chip ok" style="font-size:10px">نقدی</span>') + '</div></button>';
    });
    h += '</div>';
  }

  // ═══ ۵. آخرین آوردگی‌ها ═══
  if (recentPayments.length) {
    h += '<div class="section-title" style="margin-top:14px">آخرین آوردگی‌ها</div>';
    h += '<div class="list">';
    recentPayments.forEach(function (p) {
      var c = customerById(p.customerId);
      h += '<div class="item" style="padding:8px 10px"><span class="ic" style="background:#1b7f5a1f;color:var(--success);width:32px;height:32px">';
      h += '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12l7 7 7-7"/></svg>';
      h += '</span><div class="mid"><div class="t" style="font-size:12.5px">' + esc(c ? c.name : '—') + '</div><div class="s">' + faDate(p.date) + '</div></div>';
      h += '<div class="end"><b class="tnum" style="color:var(--success)">+' + money(p.amount) + '</b></div></div>';
    });
    h += '</div>';
  }

  // ═══ ۶. خالی ═══
  if (!hasActivity && !low.length) {
    h += '<div style="text-align:center;padding:40px 20px;color:var(--muted)">';
    h += '<svg viewBox="0 0 24 24" width="48" height="48" style="margin-bottom:12px;color:var(--primary);opacity:.4"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0V8h6M8 13h8M8 17h5"/></svg>';
    h += '<div style="font-size:14px;font-weight:700;color:var(--ink);margin-bottom:4px">آماده کار هستید!</div>';
    h += '<div style="font-size:12px">از تب «فاکتور» اولین فاکتور خود را ثبت کنید.</div>';
    h += '</div>';
  }

  return h;
}
function dashStat(lbl, val, hint, tone, iconPath) {
  var col = { pri: 'var(--primary)', ok: 'var(--success)', warn: 'var(--warning)', info: 'var(--info)', bad: 'var(--danger)' }[tone] || 'var(--primary)';
  return '<div class="stat"><div class="lbl">' + esc(lbl) +
    '<span class="dot" style="background:' + col + '1f;color:' + col + '">' +
    '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg></span></div>' +
    '<div class="val tnum">' + val + '</div>' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
}
function stat(lbl, val, hint, tone) {
  var col = { pri: 'var(--primary)', ok: 'var(--success)', warn: 'var(--warning)', info: 'var(--info)', bad: 'var(--danger)' }[tone] || 'var(--primary)';
  return '<div class="stat"><div class="lbl">' + esc(lbl) +
    '<span class="dot" style="background:' + col + '1f;color:' + col + '">' +
    '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="m3 17 6-6 4 4 8-8"/></svg></span></div>' +
    '<div class="val tnum">' + val + '</div>' + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
}
function quickAct(act, label, color, path) {
  return '<button data-act="' + act + '"><i style="background:' + color + '1f;color:' + color + '"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="' + path + '"/></svg></i>' + esc(label) + '</button>';
}

/* ─────────── صفحه فاکتور ─────────── */
function viewSale() {
  if (!invoiceDate) invoiceDate = todayInput();
  var nextNo = (DB.counters.sale || 0) + 1;
  var sub = cartSubtotal();
  var disc = m2(invoiceDiscount);
  var total = m2(sub - disc); if (total < 0) total = 0;
  var paid = Math.min(m2(invoicePaid), total);
  var due = m2(total - paid);

  var h = '<h1 class="page-title">صدور فاکتور</h1>';

  // ═══ A. اطلاعات فاکتور ═══
  h += '<div class="card" style="margin-bottom:10px">';
  var custOpts = '<option value="">— مشتری نقدی —</option>';
  DB.accounts.forEach(function (acc) { 
    if (acc.type === 'customer' && !acc.disabled) {
      var custId = acc.oldId || acc.id;
      custOpts += '<option value="' + custId + '"' + (invoiceCustomer === custId ? ' selected' : '') + '>' + esc(acc.name) + '</option>';
    }
  });
  h += '<div class="row2">';
  h += fld('مشتری', '<select class="input" data-on="invCustomer">' + custOpts + '</select>');
  h += fld('شماره فاکتور', '<input class="input tnum" value="' + toFa(nextNo) + '" disabled style="background:var(--surface2)">');
  h += '</div>';
  h += fld('تاریخ', '<input class="input" type="text" readonly value="' + esc(faDate(invoiceDate)) + '" data-iso="' + esc(invoiceDate) + '" data-act="openInvoiceDatePicker" style="cursor:pointer;background:var(--surface)">');
  h += '</div>';

  // ═══ B. اقلام فاکتور ═══
  h += '<div class="card" style="margin-bottom:10px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h += '<span style="font-size:13px;font-weight:800">اقلام فاکتور' + (cart.length ? ' (' + toFa(cart.length) + ' قلم)' : '') + '</span>';
  if (cart.length) h += '<button class="btn ghost sm" data-act="clearCart" style="color:var(--danger);font-size:12px;height:30px;padding:0 8px">خالی کردن</button>';
  h += '</div>';

  // دکمه افزودن کالا
  h += '<button class="btn soft block" data-act="openAddProduct" style="margin-bottom:10px"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg> افزودن کالا</button>';

  // لیست اقلام
  if (cart.length) {
    cart.forEach(function (c, i) {
      var p = productById(c.pid);
      var lineTotal = m2(m2(c.price) * num(c.qty));
      var st = p ? stockState(p) : 'ok';
      var warn = '';
      if (p && num(c.qty) > num(p.stock)) warn = '<span class="chip bad" style="font-size:9px;margin-right:4px">موجودی کم</span>';
      h += '<div class="cart-line" style="flex-wrap:wrap;padding:8px 0">';
      h += '<button class="icon-btn" data-act="rmLine" data-i="' + i + '" style="color:var(--danger);width:28px;height:28px"><svg viewBox="0 0 24 24" width="15" height="15"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>';
      h += '<div class="mid"><div class="t">' + esc(p ? p.name : 'کالا') + warn + '</div>';
      h += '<div class="s tnum" style="font-size:11px">' + qtyTxt(c.qty) + ' × ' + money(c.price) + ' = <b>' + money(lineTotal) + '</b></div></div>';
      h += '<div class="stepper" style="transform:scale(.85)"><button data-act="minus" data-i="' + i + '">−</button><input class="tnum" data-on="qty" data-i="' + i + '" value="' + toFa(c.qty) + '" inputmode="decimal"><button data-act="plus" data-i="' + i + '">+</button></div>';
      h += '<div style="width:100%;margin-top:4px;display:flex;align-items:center;gap:6px">';
      h += '<label style="font-size:10px;color:var(--muted);white-space:nowrap">قیمت:</label>';
      h += '<input class="input tnum" data-on="cartPrice" data-i="' + i + '" value="' + toFa(c.price) + '" inputmode="decimal" style="height:32px;font-size:12.5px;padding:0 8px;flex:1">';
      h += '<span style="font-size:10px;color:var(--muted)">' + esc(DB.settings.currency) + '</span></div></div>';
    });
  } else {
    h += '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12.5px">هنوز کالایی اضافه نشده</div>';
  }
  h += '</div>';

  // ═══ C. خلاصه مالی ═══
  if (cart.length) {
    h += '<div class="card" style="margin-bottom:10px">';
    h += '<div style="font-size:13px;font-weight:800;margin-bottom:8px">خلاصه مالی</div>';
    h += '<div class="totals" style="margin:0;padding:0;border:0">';
    h += '<div><span>جمع اقلام</span><span class="tnum">' + money(sub) + '</span></div>';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0"><span>تخفیف</span><input class="input tnum" data-on="invDiscount" inputmode="decimal" value="' + toFa(invoiceDiscount) + '" style="width:100px;height:34px;font-size:13px;padding:0 8px;text-align:left"></div>';
    h += '<div class="big"><span>قابل پرداخت</span><span class="tnum">' + money(total) + '</span></div>';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0"><span>آوردگی</span><input class="input tnum" data-on="invPaid" inputmode="decimal" value="' + toFa(invoicePaid) + '" style="width:120px;height:34px;font-size:13px;padding:0 8px;text-align:left"></div>';
    if (due > 0 && invoiceCustomer) h += '<div style="display:flex;justify-content:space-between;padding:4px 0;color:var(--danger);font-weight:700"><span>باقی (بردگی)</span><span class="tnum">' + money(due) + '</span></div>';
    else if (due > 0 && !invoiceCustomer) h += '<div style="font-size:11.5px;color:var(--warning);padding:4px 0">⚠ برای بردگی، مشتری انتخاب کنید</div>';
    h += '</div>';
    h += '<div class="btn-row three" style="margin-top:8px"><button class="btn outline sm" data-act="invPayAll">تمام</button><button class="btn outline sm" data-act="invPayHalf">نصف</button><button class="btn outline sm" data-act="invPayNone">بردگی</button></div>';
    h += '</div>';
  }

  // ═══ D. دکمه‌های نهایی ═══
  h += '<div class="checkout-bar" style="gap:6px;padding:8px 12px">';
  h += '<button class="btn outline" data-act="cancelInvoice" style="flex:1;height:42px;font-size:13px">انصراف</button>';
  h += '<button class="btn" data-act="saveInvoice" style="flex:2;height:42px;font-size:13px"' + (!cart.length ? ' disabled' : '') + '>ثبت فاکتور</button>';
  h += '<button class="btn soft" data-act="saveInvoicePrint" style="flex:1;height:42px;font-size:13px"' + (!cart.length ? ' disabled' : '') + '>چاپ</button>';
  h += '</div>';

  return h;
}

/* شیت افزودن کالا به فاکتور */
function openAddProductSheet() {
  var h = '<div class="search"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/></svg><input class="input" data-on="qProductAdd" value="' + esc(qProductAdd) + '" placeholder="نام کالا…" data-focus></div>';
  h += '<div class="chips" style="margin-bottom:8px">';
  h += '<button class="' + (stockCat === '' ? 'on' : '') + '" data-act="catFilter" data-v="">همه</button>';
  DB.categories.forEach(function (c) { h += '<button class="' + (stockCat === c ? 'on' : '') + '" data-act="catFilter" data-v="' + esc(c) + '">' + esc(c) + '</button>'; });
  h += '</div>';
  h += '<div id="addProductList"></div>';
  sheet({
    title: 'افزودن کالا',
    body: h,
    onOpen: function () { renderAddProductList(); }
  });
}
function renderAddProductList() {
  var box = $('#addProductList'); if (!box) return;
  var list = filterProducts(qProductAdd);
  if (!list.length) { box.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">کالایی پیدا نشد</div>'; return; }
  var h = '<div class="list">';
  list.slice(0, 40).forEach(function (p) {
    var st = stockState(p);
    h += '<button class="item" data-act="addToCart" data-id="' + p.id + '"><span class="ic">' + esc((p.name || '؟').trim().charAt(0)) + '</span>';
    h += '<div class="mid"><div class="t">' + esc(p.name) + '</div><div class="s">' + (p.category ? esc(p.category) + ' · ' : '') + 'موجودی ' + qtyTxt(p.stock) + ' ' + esc(p.unit || '') + '</div></div>';
    h += '<div class="end"><b class="tnum">' + money(p.price) + '</b>' + (st !== 'ok' ? '<span class="chip ' + st + '">' + (st === 'bad' ? 'ناموجود' : 'کم') + '</span>' : '') + '</div></button>';
  });
  h += '</div>';
  box.innerHTML = h;
}
function getLastPriceForCustomer(pid, cid) {
  if (!cid) return null;
  // پیدا کردن آخرین فاکتور این مشتری که این کالا را دارد
  for (var i = DB.sales.length - 1; i >= 0; i--) {
    var s = DB.sales[i];
    if (s.customerId === cid) {
      var item = s.items.find(function (it) { return it.pid === pid; });
      if (item) return m2(item.price);
    }
  }
  return null;
}

function cartSubtotal() { var s = 0; cart.forEach(function (c) { s += m2(c.price) * num(c.qty); }); return m2(s); }
function filterProducts(q) {
  var k = toEn(q).toLowerCase().trim();
  return DB.products.filter(function (p) {
    if (stockCat === '__none__' && p.category) return false;
    if (stockCat && stockCat !== '__none__' && p.category !== stockCat) return false;
    if (!k) return true;
    return (p.name + ' ' + (p.barcode || '')) .toLowerCase().indexOf(k) > -1 || toEn(p.name).toLowerCase().indexOf(k) > -1;
  }).sort(function (a, b) { return a.name.localeCompare(b.name, 'fa'); });
}

/* ─────────── گدام (انبار) ─────────── */
function viewStock() {
  var list = filterProducts(qProduct);
  var value = 0; DB.products.forEach(function (p) { value += m2(p.cost) * Math.max(0, num(p.stock)); });
  var h = '<h1 class="page-title">گدام و انبار</h1>';
  h += '<div class="stats">' +
    stat('تعداد کالا', toFa(DB.products.length), DB.categories.length + ' دسته', 'pri') +
    stat('ارزش انبار', money(value), '', 'info') +
    '</div>';
  h += '<div style="margin-top:12px" class="btn-row">' +
    '<button class="btn block sm" data-act="newProduct"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg> کالای جدید</button>' +
    '<button class="btn soft block sm" data-act="goodsReceipt"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 7h18v10H3zM3 12h18M7 7v10"/></svg> ورود کالا</button>' +
    '</div>';
  // فیلتر دسته‌بندی
  h += '<div class="chips" style="margin-top:12px">';
  h += '<button class="' + (stockCat === '' ? 'on' : '') + '" data-act="catFilter" data-v="">همه</button>';
  DB.categories.forEach(function (c) { h += '<button class="' + (stockCat === c ? 'on' : '') + '" data-act="catFilter" data-v="' + esc(c) + '">' + esc(c) + '</button>'; });
  if (DB.products.some(function (p) { return !p.category; })) h += '<button class="' + (stockCat === '__none__' ? 'on' : '') + '" data-act="catFilter" data-v="__none__">بدون دسته</button>';
  h += '</div>';
  h += '<div class="search" style="margin-top:8px"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/></svg><input class="input" data-on="qProduct" value="' + esc(qProduct) + '" placeholder="جست‌وجوی کالا…"></div>';
  if (!DB.products.length) { h += emptyBox('انبار خالی است', 'اولین کالای دکان را اضافه کنید.', '<button class="btn" data-act="newProduct">افزودن کالا</button>'); return h; }
  h += '<div class="list">';
  list.forEach(function (p) {
    var st = stockState(p);
    h += '<div class="item">' +
      '<span class="ic" data-act="editProduct" data-id="' + p.id + '">' + esc((p.name || '؟').trim().charAt(0)) + '</span>' +
      '<div class="mid" data-act="editProduct" data-id="' + p.id + '"><div class="t">' + esc(p.name) + '</div><div class="s">خرید ' + money(p.cost) + ' • فروش ' + money(p.price) + (p.category ? ' • ' + esc(p.category) : '') + '</div></div>' +
      '<div class="end"><b class="tnum">' + qtyTxt(p.stock) + '</b><span class="chip ' + st + '">' + (st === 'bad' ? 'ناموجود' : st === 'low' ? 'کم' : 'موجود') + '</span></div>' +
      '<button class="icon-btn" data-act="showMovements" data-id="' + p.id + '" aria-label="تاریخچه حرکت" title="تاریخچه حرکت"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg></button>' +
      '</div>';
  });
  h += '</div>';
  h += '<p class="hint-row">برای «ورود کالا»، «اصلاح موجودی» و «تاریخچه حرکت»، کالا را باز کنید یا از دکمهٔ ورود کالا استفاده کنید.</p>';
  return h;
}

/* ─────────── حساب‌ها (مشتری + فراهم‌کننده) ─────────── */
function viewAccounts() {
  var h = '<h1 class="page-title">حساب‌ها</h1>';
  
  // جستجو
  h += '<div class="search"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/></svg><input class="input" data-on="qAccount" value="' + esc(qAccount) + '" placeholder="جستجو در حساب‌ها…"></div>';
  
  // Tab فعال/غیرفعال
  h += '<div class="seg" style="margin:12px 0">';
  h += '<button class="' + (accActiveFilter === 'active' ? 'on' : '') + '" data-act="accActiveFilter" data-v="active">فعال</button>';
  h += '<button class="' + (accActiveFilter === 'disabled' ? 'on' : '') + '" data-act="accActiveFilter" data-v="disabled">غیرفعال</button>';
  h += '</div>';
  
  // فیلتر کردن حساب‌ها
  var k = toEn(qAccount).toLowerCase().trim();
  var list = DB.accounts.filter(function(acc) {
    if (accActiveFilter === 'active' && acc.disabled) return false;
    if (accActiveFilter === 'disabled' && !acc.disabled) return false;
    if (k) {
      var searchStr = (acc.name + ' ' + (acc.phone || '') + ' ' + (ACCOUNT_TYPES[acc.type] ? ACCOUNT_TYPES[acc.type].label : '')).toLowerCase();
      if (searchStr.indexOf(k) < 0 && toEn(acc.name).toLowerCase().indexOf(k) < 0) return false;
    }
    return true;
  });
  
  // Empty State
  if (!list.length) {
    if (!DB.accounts.length) {
      h += emptyBox('هنوز حسابی ندارید', 'برای شروع، اولین حساب خود را ایجاد کنید.', '<button class="btn" data-act="newAccount">ایجاد حساب جدید</button>');
    } else {
      h += emptyBox('حسابی پیدا نشد', 'فیلترها یا جستجو را تغییر دهید.');
    }
  } else {
    // مرتب‌سازی: پین‌شده‌ها بالا
    list.sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
    
    h += '<div class="list">';
    list.forEach(function(acc) {
      var b = accountBalance(acc.id);
      var typeInfo = ACCOUNT_TYPES[acc.type] || ACCOUNT_TYPES.other;
      var color = balColorForAccount(b, acc.type);
      
      h += '<div class="item" data-act="openAccount" data-id="' + acc.id + '">';
      h += '<span class="ic" style="background:' + typeInfo.color + '15;color:' + typeInfo.color + '">' + (acc.pinned ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z"/></svg>' : getAccountInitial(acc.name, acc.type, 20)) + '</span>';
      h += '<div class="mid">';
      h += '<div class="t">' + esc(acc.name) + '</div>';
      h += '<div class="s"><span class="chip" style="font-size:10px;padding:2px 6px;background:' + typeInfo.color + '15;color:' + typeInfo.color + '">' + typeInfo.label + '</span>';
      h += (acc.phone ? ' · ' + toFa(acc.phone) : '') + '</div>';
      h += '</div>';
      h += '<div class="end">';
      h += '<b class="tnum" style="color:' + color + ';direction:ltr;display:inline-block">' + toFa(group(Math.abs(b))) + '</b>';
      h += '<div style="font-size:10px;color:var(--muted)">' + esc(DB.settings.currency) + '</div>';
      h += '</div>';
      h += '<button class="icon-btn" data-act="accountMenu" data-id="' + acc.id + '" style="width:32px;height:32px;color:var(--muted)" aria-label="منو">';
      h += '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>';
      h += '</button>';
      h += '</div>';
    });
    h += '</div>';
  }
  
  // FAB
  h += '<button class="fab" data-act="newAccount" aria-label="ایجاد حساب">';
  h += '<svg viewBox="0 0 24 24" width="26" height="26"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>';
  h += '</button>';
  
  return h;
}

/* ─────────── بیشتر (گزارش + تنظیمات) ─────────── */
/* ─────────── خزانه ─────────── */
var treasuryRange = 'today';
function viewTreasury() {
  var balance = cashBox();
  var ts = treasurySummary(treasuryRange);
  var h = '<h1 class="page-title">خزانه</h1>';
  
  // کارت‌های خلاصه
  h += '<div class="stats">';
  h += dashStat('موجودی خزانه', money(balance), '', balance >= 0 ? 'info' : 'bad', 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6');
  h += dashStat('ورود', money(ts.totalIn), '', 'ok', 'M12 5v14M5 12l7 7 7-7');
  h += dashStat('خروج', money(ts.totalOut), '', 'bad', 'M12 19V5M5 12l7-7 7 7');
  h += dashStat('خالص', money(ts.net), '', ts.net >= 0 ? 'ok' : 'bad', 'M3 17l6-6 4 4 8-8');
  h += '</div>';
  
  // فیلتر بازه زمانی
  h += '<div class="chips" style="margin-top:14px">';
  h += '<button class="' + (treasuryRange === 'today' ? 'on' : '') + '" data-act="trsRange" data-v="today">امروز</button>';
  h += '<button class="' + (treasuryRange === 'week' ? 'on' : '') + '" data-act="trsRange" data-v="week">۷ روز</button>';
  h += '<button class="' + (treasuryRange === 'month' ? 'on' : '') + '" data-act="trsRange" data-v="month">۳۰ روز</button>';
  h += '<button class="' + (treasuryRange === 'all' ? 'on' : '') + '" data-act="trsRange" data-v="all">همه</button>';
  h += '</div>';
  
  // دکمه‌های ورود/خروج دستی
  h += '<div class="btn-row" style="margin-top:14px">';
  h += '<button class="btn success" data-act="treasuryIn"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12l7 7 7-7"/></svg> ورود دستی</button>';
  h += '<button class="btn danger" data-act="treasuryOut"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 19V5M5 12l7-7 7 7"/></svg> خروج دستی</button>';
  h += '</div>';
  
  // تاریخچه تراکنش‌ها
  h += '<div class="section-title" style="margin-top:18px">تاریخچه</div>';
  var txns = DB.treasury.slice().reverse().filter(function (t) { return inRange(t.date, treasuryRange); });
  if (!txns.length) {
    h += '<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px">تراکنشی ثبت نشده</div>';
  } else {
    h += '<div class="list">';
    txns.slice(0, 30).forEach(function (t) {
      var isIn = t.type === 'in';
      h += '<div class="item" style="padding:10px 12px">';
      h += '<span class="ic" style="background:' + (isIn ? '#1b7f5a1a' : '#c0392b1a') + ';color:' + (isIn ? 'var(--success)' : 'var(--danger)') + '">';
      h += '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="' + (isIn ? 'M12 5v14M5 12l7 7 7-7' : 'M12 19V5M5 12l7-7 7 7') + '"/></svg>';
      h += '</span>';
      h += '<div class="mid"><div class="t" style="font-size:13px">' + esc(t.reason) + '</div>';
      h += '<div class="s">' + faDate(t.date) + ' · ' + faTime(t.date) + (t.method && t.method !== 'نقد' ? ' · ' + esc(t.method) : '') + '</div>';
      if (t.note) h += '<div class="s" style="margin-top:2px">' + esc(t.note) + '</div>';
      h += '</div>';
      h += '<div class="end"><b class="tnum" style="color:' + (isIn ? 'var(--success)' : 'var(--danger)') + '">' + (isIn ? '' : '-') + money(t.amount) + '</b></div>';
      h += '</div>';
    });
    h += '</div>';
  }
  
  return h;
}

function viewMore() {
  var h = '<h1 class="page-title">گزارش و تنظیمات</h1>';
  
  // تب‌ها
  h += '<div class="seg" style="margin-bottom:12px">';
  h += '<button class="' + (moreTab === 'report' ? 'on' : '') + '" data-act="moreTab" data-v="report">گزارش</button>';
  h += '<button class="' + (moreTab === 'analysis' ? 'on' : '') + '" data-act="moreTab" data-v="analysis">تحلیل</button>';
  h += '<button class="' + (moreTab === 'settings' ? 'on' : '') + '" data-act="moreTab" data-v="settings">تنظیمات</button>';
  h += '</div>';
  
  if (moreTab === 'report') {
    h += viewReport();
  } else if (moreTab === 'analysis') {
    h += viewAnalysis();
  } else {
    h += viewSettings();
  }
  
  return h;
}

function viewReport() {
  var s = summary(repRange);
  var h = '';
  h += '<div class="chips">' + chipBtn('today', 'امروز') + chipBtn('week', 'این هفته') + chipBtn('month', 'این ماه') + chipBtn('all', 'همه') + '</div>';
  h += '<div class="stats">' +
    stat('فروش', money(s.sales), toFa(s.count) + ' فاکتور', 'pri') +
    stat('نقدی', money(s.cash), '', 'info') +
    stat('بردگی', money(s.credit), '', 'warn') +
    '</div>';
  if (s.expenses) h += '<div class="card" style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:13.5px"><span style="color:var(--muted)">مصارف این بازه</span><b class="tnum" style="color:var(--danger)">' + money(s.expenses) + '</b></div>' +
    (s.purchase ? '<div style="display:flex;justify-content:space-between;font-size:13.5px;margin-top:4px"><span style="color:var(--muted)">خرید کالا (ورود)</span><b class="tnum" style="color:var(--danger)">' + money(s.purchase) + '</b></div>' : '') +
    '</div>';
  var invValue = 0; DB.products.forEach(function (p) { invValue += m2(p.cost) * Math.max(0, num(p.stock)); });
  h += '<div class="card" style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:13.5px"><span style="color:var(--muted)">ارزش کل انبار (بهای تمام‌شده)</span><b class="tnum">' + money(invValue) + '</b></div></div>';
  var top = topProducts(repRange);
  if (top.length) {
    h += '<div class="section-title">پرفروش‌ترین کالاها</div><div class="list">';
    top.slice(0, 5).forEach(function (t, i) {
      h += '<div class="item"><span class="ic">' + toFa(i + 1) + '</span><div class="mid"><div class="t">' + esc(t.name) + '</div><div class="s">' + qtyTxt(t.qty) + ' فروش رفته</div></div><div class="end"><b class="tnum">' + money(t.total) + '</b></div></div>';
    });
    h += '</div>';
  }
  var debtors = DB.customers.map(function (c) { return { c: c, b: customerBalance(c.id) }; }).filter(function (x) { return x.b > 0; }).sort(function (a, b) { return b.b - a.b; });
  if (debtors.length) {
    h += '<div class="section-title">دارندگان بردگی (' + toFa(debtors.length) + ')</div><div class="list">';
    debtors.slice(0, 6).forEach(function (x) {
      h += '<div class="item"><span class="ic" data-act="openCustomer" data-id="' + x.c.id + '">' + esc(x.c.name.charAt(0)) + '</span><div class="mid" data-act="openCustomer" data-id="' + x.c.id + '"><div class="t">' + esc(x.c.name) + '</div><div class="s">' + (x.c.phone ? toFa(x.c.phone) : '—') + '</div></div><div class="end"><b class="tnum" style="color:var(--danger)">' + money(x.b) + '</b></div>' +
        '<button class="icon-btn" data-act="sendWhatsapp" data-id="' + x.c.id + '" data-amount="' + x.b + '" style="color:#25D366;width:36px;height:36px" title="یادآوری واتساپ"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Z"/></svg></button></div>';
    });
    h += '</div>';
  }
  // ابزارها
  h += '<div class="section-title">ابزارها</div><div class="card"><div class="btn-row">' +
    '<button class="btn outline sm" data-act="goTreasury">خزانه</button>' +
    '<button class="btn outline sm" data-act="allSales">همهٔ فاکتورها</button>' +
    '<button class="btn outline sm" data-act="newExpense">ثبت مصرف</button></div>' +
    '<div class="btn-row" style="margin-top:8px">' +
    '<button class="btn outline sm" data-act="warehouseHistory">تاریخچه انبار</button>' +
    '<button class="btn outline sm" data-act="closing">بستن صندوق</button>' +
    '<button class="btn outline sm" data-act="exportCSV">خروجی CSV</button></div>' +
    '<div class="btn-row" style="margin-top:8px">' +
    '<button class="btn outline sm" data-act="backup">پشتیبان‌گیری</button>' +
    '<button class="btn outline sm" data-act="restore">بازیابی</button>' +
    '<button class="btn outline sm" data-act="restoreAuto">بازیابی خودکار</button></div></div>';
  return h;
}

function viewAnalysis() {
  var h = '';
  var range = repRange === 'all' ? 'month' : repRange;
  
  h += '<div class="chips">' + chipBtn('week', 'این هفته') + chipBtn('month', 'این ماه') + '</div>';
  
  // ۱. روند فروش
  h += '<div class="section-title">روند فروش</div>';
  var days = range === 'week' ? 7 : 30;
  var salesByDay = [];
  for (var i = days - 1; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var dayStr = d.toISOString().split('T')[0];
    var daySales = 0;
    DB.sales.forEach(function(s) {
      if (s.date.split('T')[0] === dayStr) daySales += s.total;
    });
    salesByDay.push({ label: toFa(d.getDate()), value: daySales });
  }
  h += '<div class="card">' + svgBarChart(salesByDay, { height: 160 }) + '</div>';
  
  // ۲. تفکیک نقد/نسیه
  h += '<div class="section-title" style="margin-top:16px">تفکیک نقد و نسیه</div>';
  var cashTotal = 0, creditTotal = 0;
  DB.sales.forEach(function(s) {
    if (!inRange(s.date, range)) return;
    cashTotal += s.paid;
    creditTotal += s.due;
  });
  h += '<div class="card">';
  h += '<div style="display:flex;align-items:center;gap:16px">';
  h += '<div style="flex:1">' + svgPieChart([
    { label: 'نقد', value: cashTotal, color: 'var(--success)' },
    { label: 'نسیه', value: creditTotal, color: 'var(--warning)' }
  ], { size: 140 }) + '</div>';
  h += '<div style="flex:1">';
  h += '<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--muted)">نقد</div><div style="font-size:16px;font-weight:700">' + money(cashTotal) + '</div></div>';
  h += '<div><div style="font-size:11px;color:var(--muted)">نسیه</div><div style="font-size:16px;font-weight:700">' + money(creditTotal) + '</div></div>';
  h += '</div></div></div>';
  
  // ۳. ورود و خروج خزانه
  h += '<div class="section-title" style="margin-top:16px">ورود و خروج خزانه</div>';
  var treasuryByDay = [];
  for (var i = days - 1; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var dayStr = d.toISOString().split('T')[0];
    var dayIn = 0, dayOut = 0;
    DB.treasury.forEach(function(t) {
      if (t.date.split('T')[0] !== dayStr) return;
      if (t.type === 'in') dayIn += t.amount;
      else if (t.type === 'out') dayOut += t.amount;
    });
    treasuryByDay.push({ label: toFa(d.getDate()), value: dayIn - dayOut, color: dayIn - dayOut >= 0 ? 'var(--success)' : 'var(--danger)' });
  }
  h += '<div class="card">' + svgBarChart(treasuryByDay, { height: 160 }) + '</div>';
  
  // ۴. ۵ کالای پرفروش
  h += '<div class="section-title" style="margin-top:16px">۵ کالای پرفروش</div>';
  var top = topProducts(range).slice(0, 5);
  if (top.length > 0) {
    h += '<div class="card">';
    h += svgBarChart(top.map(function(p, i) {
      return { label: p.name.substring(0, 10), value: p.total, color: ['var(--primary)', 'var(--info)', 'var(--accent)', 'var(--warning)', 'var(--danger)'][i] };
    }), { height: 180 });
    h += svgBarChartLegend(top.map(function(p, i) {
      return { label: p.name, value: money(p.total), color: ['var(--primary)', 'var(--info)', 'var(--accent)', 'var(--warning)', 'var(--danger)'][i] };
    }));
    h += '</div>';
  } else {
    h += '<div class="card" style="text-align:center;padding:20px;color:var(--muted);font-size:12px">داده‌ای موجود نیست</div>';
  }
  
  // ۵. مقایسه هفته
  if (range === 'week') {
    h += '<div class="section-title" style="margin-top:16px">مقایسه با هفته قبل</div>';
    var thisWeek = summary('week');
    var lastWeekSales = 0, lastWeekCount = 0;
    var lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 13);
    var lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    DB.sales.forEach(function(s) {
      var sd = new Date(s.date);
      if (sd >= lastWeekStart && sd < lastWeekEnd) {
        lastWeekSales += s.total;
        lastWeekCount++;
      }
    });
    h += '<div class="card"><div class="stats">';
    h += stat('این هفته', money(thisWeek.sales), toFa(thisWeek.count) + ' فاکتور', 'pri');
    h += stat('هفته قبل', money(lastWeekSales), toFa(lastWeekCount) + ' فاکتور', 'info');
    h += '</div>';
    var diff = thisWeek.sales - lastWeekSales;
    var diffPercent = lastWeekSales > 0 ? Math.round((diff / lastWeekSales) * 100) : 0;
    h += '<div style="margin-top:12px;text-align:center;font-size:14px;font-weight:700;color:' + (diff >= 0 ? 'var(--success)' : 'var(--danger)') + '">';
    h += (diff >= 0 ? '' : '') + toFa(diffPercent) + '٪';
    h += '</div></div>';
  }
  
  return h;
}

function viewSettings() {
  var h = '';
  h += '<div class="card">' +
    fld('نام فروشگاه', '<input class="input" data-on="setShop" value="' + esc(DB.settings.shop) + '">') +
    '<div class="row2">' + fld('واحد پول', '<input class="input" data-on="setCurrency" value="' + esc(DB.settings.currency) + '">') +
    fld('نام ماه‌ها', '<select class="input" data-on="setMonths"><option value="af"' + (DB.settings.months === 'af' ? ' selected' : '') + '>افغانستان</option><option value="ir"' + (DB.settings.months === 'ir' ? ' selected' : '') + '>ایران</option></select>') + '</div>' +
    fld('چاپگر', '<select class="input" data-on="setPrinter"><option value="a4"' + (DB.settings.printer === 'a4' ? ' selected' : '') + '>A4 / معمولی</option><option value="thermal"' + (DB.settings.printer === 'thermal' ? ' selected' : '') + '>حرارتی ۵۸/۸۰</option></select>') +
    fld('شمارهٔ تماس (روی فاکتور)', '<input class="input" data-on="setPhone" inputmode="tel" value="' + esc(DB.settings.phone) + '">') +
    fld('آدرس (روی فاکتور)', '<input class="input" data-on="setAddress" value="' + esc(DB.settings.address) + '">') +
    fld('یادداشت پایین فاکتور', '<input class="input" data-on="setFooter" value="' + esc(DB.settings.footer) + '">') +
    fld('قالب پیام واتساپ', '<textarea class="input" data-on="setWhatsappTemplate" rows="3" style="height:auto;min-height:72px;font-size:13px">' + esc(DB.settings.whatsappTemplate || '') + '</textarea><p class="hint-row">متغیرها: <code dir="ltr">{shop}</code> = نام فروشگاه، <code dir="ltr">{customer}</code> = نام مشتری، <code dir="ltr">{amount}</code> = مبلغ بردگی</p>') +
    '<button class="btn soft block sm" style="margin-top:8px" data-act="pinSetup">' + (DB.settings.pin ? 'تغییر رمز حذف/ریست' : 'تنظیم رمز حذف/ریست') + '</button>' +
    '<button class="btn soft block sm" style="margin-top:8px;background:#007bff;color:#fff" onclick="installApp()">📲 نصب برنامه روی گوشی</button>' +
    '</div>';
  h += '<div class="card"><div class="btn-row"><button class="btn soft sm" data-act="sample">داده نمونه</button><button class="btn danger sm" data-act="wipe">پاک کردن همه</button></div>' +
    '<p style="font-size:11.5px;color:var(--muted);margin:10px 0 0;line-height:1.9">داده‌ها فقط داخل همین گوشی ذخیره می‌شوند. هر چند وقت یک‌بار «پشتیبان‌گیری» کنید و فایل را جای امن نگه دارید.</p></div>';
  h += '<p style="text-align:center;font-size:11px;color:var(--muted);margin:18px 0 0">فروشگاه هم‌گام — نسخهٔ موبایل ' + toFa('2.0') + '</p>';
  return h;
}
function chipBtn(v, label) { return '<button class="' + (repRange === v ? 'on' : '') + '" data-act="range" data-v="' + v + '">' + label + '</button>'; }
function fld(label, input) { return '<div class="field"><label>' + label + '</label>' + input + '</div>'; }
function fldSafe(label, input) { return '<div class="field"><label>' + esc(label) + '</label>' + input + '</div>'; }

/* ══════════════ ۷) کنش‌ها ══════════════ */
/* تابع کمکی ثبت فاکتور (استفاده مشترک بین saveSale و quickCash) */
function resetInvoice() {
  invoiceCustomer = '';
  invoiceDate = todayInput();
  invoiceNote = '';
  invoiceDiscount = 0;
  invoicePaid = 0;
}

function createSale(opts) {
  var sub = cartSubtotal(), total = m2(sub - opts.discount);
  if (total < 0) return toast('تخفیف از جمع بیشتر است', 'bad');
  var paid = Math.min(opts.paid, total);
  var due = m2(total - paid);
  if (due > 0 && !opts.customerId) return toast('برای فروش بردگی، مشتری را انتخاب کنید', 'warn');
  
  // اگر مشتری انتخاب نشده، از حساب پیش‌فرض "مشتری نقدی" استفاده کن
  var customerId = opts.customerId;
  if (!customerId) {
    var cashCustomer = DB.accounts.find(function(a) { return a.type === 'customer' && a.name === 'مشتری نقدی'; });
    if (!cashCustomer) {
      cashCustomer = {
        id: uid('acc'),
        oldId: uid('cus'),
        type: 'customer',
        name: 'مشتری نقدی',
        phone: '',
        address: '',
        opening: 0,
        note: 'حساب پیش‌فرض برای فروش‌های نقدی',
        pinned: false,
        disabled: false,
        createdAt: new Date().toISOString()
      };
      DB.accounts.push(cashCustomer);
      DB.customers.push({
        id: cashCustomer.oldId,
        name: cashCustomer.name,
        phone: '',
        address: '',
        opening: 0,
        note: cashCustomer.note,
        createdAt: cashCustomer.createdAt
      });
    }
    customerId = cashCustomer.oldId;
  } else {
    // اگر customerId یک account.id است، آن را به customer.id تبدیل کن
    var acc = DB.accounts.find(function(a) { return a.id === customerId; });
    if (acc && acc.oldId) {
      customerId = acc.oldId;
    }
  }
  
  var c = customerById(customerId);
  // اگر customer در DB.customers نیست، از DB.accounts بخوان
  if (!c) {
    var acc = DB.accounts.find(function(a) { return (a.oldId === customerId || a.id === customerId) && a.type === 'customer'; });
    if (acc) {
      c = { id: acc.oldId || acc.id, name: acc.name, phone: acc.phone, address: acc.address, opening: acc.opening, note: acc.note };
    }
  }
  var saleDate = opts.date || new Date();
  DB.counters.sale = (DB.counters.sale || 0) + 1;
  var sale = {
    id: uid('sal'), no: DB.counters.sale, date: saleDate.toISOString(),
    customerId: customerId, customerName: c ? c.name : '',
    items: cart.map(function (x) { return { pid: x.pid, name: x.name, unit: x.unit, qty: num(x.qty), price: m2(x.price), cost: m2(x.cost) }; }),
    subtotal: sub, discount: m2(opts.discount), total: total, paid: m2(paid), due: due, note: opts.note || ''
  };
  
  // چک کردن موجودی همه کالاها قبل از کاهش
  var stockCheckFailed = false;
  sale.items.forEach(function (it) {
    if (!checkStock(it.pid, -num(it.qty), 'فروش')) {
      stockCheckFailed = true;
    }
  });
  
  if (stockCheckFailed) {
    toast('ثبت فاکتور لغو شد. موجودی کافی نیست.', 'bad');
    return;
  }
  
  // اعمال کاهش موجودی
  sale.items.forEach(function (it) {
    applyStockChange(it.pid, -num(it.qty), 'sale', 'فاکتور ' + sale.no, 'فروش');
  });
  
  DB.sales.push(sale);
  // ورود به خزانه (بخش نقدی فاکتور)
  if (paid > 0) {
    addTreasury('in', paid, 'فروش فاکتور ' + sale.no, 'نقد', saleDate.toISOString(), sale.note, 'sale');
  }
  // ثبت آوردگی در حساب مشتری (اگر پرداختی داشته)
  if (paid > 0) {
    DB.payments.push({
      id: uid('pay'),
      customerId: customerId,
      amount: paid,
      note: 'پرداخت فاکتور ' + sale.no,
      date: saleDate.toISOString()
    });
  }
  save();
  cart = [];
  closeSheet();
  render();
  toast('فاکتور ' + toFa(sale.no) + ' ثبت شد', 'ok');
  var afterAct = opts.afterAction || 'show';
  if (afterAct === 'print') {
    setTimeout(function () { showSale(sale.id); setTimeout(doPrint, 400); }, 350);
  } else if (afterAct === 'share') {
    setTimeout(function () {
      var txt = receiptText(sale);
      if (navigator.share) navigator.share({ title: 'فاکتور ' + toFa(sale.no), text: txt }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('فاکتور کپی شد', 'ok'); });
      else showSale(sale.id);
    }, 350);
  } else {
    setTimeout(function () { showSale(sale.id); }, 350);
  }
}

var ACT = {
  /* فعال‌سازی برنامه */
  saveActivationPassword: function () { saveActivationPassword(); },
  
  /* تاریخ‌گیرها */
  openInvoiceDatePicker: function () { openInvoiceDatePicker(); },
  openAccPayDatePicker: function () { openAccPayDatePicker(); },
  openAccDebtDatePicker: function () { openAccDebtDatePicker(); },
  openTxDatePicker: function () { openTxDatePicker(); },
  openTrsDatePicker: function () { openTrsDatePicker(); },
  openPurDatePicker: function () { openPurDatePicker(); },
  openEditTxDatePicker: function () { openEditTxDatePicker(); },
  openClDatePicker: function () { openClDatePicker(); },
  
  /* ناوبری */
  goSale: function () { go('sale'); }, goStock: function () { go('stock'); }, goReports: function () { go('more'); },
  goAccounts: function () { go('accounts'); },
  quickReceive: function () {
    if (!DB.customers.length) return toast('هنوز مشتری ندارید', 'warn');
    var opts = '';
    DB.customers.forEach(function (c) {
      var b = customerBalance(c.id);
      if (b > 0) opts += '<option value="' + c.id + '">' + esc(c.name) + ' (' + money(b) + ')</option>';
    });
    if (!opts) return toast('هیچ مشتری دارای بردگی نیست', 'warn');
    sheet({
      title: 'آوردگی',
      body: fld('مشتری', '<select class="input" id="qrCustomer">' + opts + '</select>') +
        fld('مبلغ', '<input class="input tnum" id="qrAmount" inputmode="decimal" data-focus placeholder="۰">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('یادداشت', '<input class="input" id="qrNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn success" data-act="saveQuickReceive">ثبت آوردگی</button>'
    });
  },
  saveQuickReceive: function () {
    var cid = $('#qrCustomer').value;
    var amount = m2(num($('#qrAmount').value));
    if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var method = 'نقد';
    var note = $('#qrNote').value.trim();
    DB.payments.push({ id: uid('pay'), customerId: cid, amount: amount, note: note, date: new Date().toISOString(), withTreasury: PAY_WITH_TREASURY });
    if (PAY_WITH_TREASURY) {
      addTreasury('in', amount, 'آوردگی از مشتری', method, new Date().toISOString(), note, 'quickReceive');
    }
    PAY_WITH_TREASURY = true;
    save(); closeSheet(); render(); toast('آوردگی ' + money(amount) + ' ثبت شد', 'ok');
  },
  closeSheet: function () { closeSheet(); },
  confirmYes: function () { var f = PENDING_YES; PENDING_YES = null; closeSheet(); if (f) f(); },
  range: function (el) { repRange = el.dataset.v; render(); },
  moreTab: function (el) { moreTab = el.dataset.v; render(); },
  accTypeFilter: function (el) { accTypeFilter = el.dataset.v; render(); },
  accActiveFilter: function (el) { accActiveFilter = el.dataset.v; render(); },
  accTypeChange: function () { updateAccFields(); },
  accOpeningType: function (el) {
    var v = el.dataset.v;
    $('#accOpeningDebit').classList.toggle('on', v === 'debit');
    $('#accOpeningCredit').classList.toggle('on', v === 'credit');
  },
  editAccOpeningType: function (el) {
    var v = el.dataset.v;
    $('#editAccOpeningDebit').classList.toggle('on', v === 'debit');
    $('#editAccOpeningCredit').classList.toggle('on', v === 'credit');
  },
  saveEditAccount: function (el) {
    var id = el.dataset.id;
    var acc = accountById(id);
    if (!acc) return;
    
    var name = $('#editAccName').value.trim();
    if (!name) return toast('نام حساب را وارد کنید', 'warn');
    
    acc.name = name;
    acc.type = $('#editAccType').value;
    acc.phone = toEn($('#editAccPhone').value);
    acc.address = $('#editAccAddress').value.trim();
    acc.note = $('#editAccNote').value.trim();
    
    var openingBal = m2(num($('#editAccOpeningBal').value));
    var openingType = $('#editAccOpeningCredit').classList.contains('on') ? 'credit' : 'debit';
    acc.opening = openingType === 'credit' ? -openingBal : openingBal;
    
    // آپدیت customer یا supplier مربوطه
    if (acc.type === 'customer' && acc.oldId) {
      var cust = customerById(acc.oldId);
      if (cust) {
        cust.name = acc.name;
        cust.phone = acc.phone;
        cust.address = acc.address;
        cust.opening = acc.opening;
        cust.note = acc.note;
      }
    } else if (acc.type === 'supplier' && acc.oldId) {
      var supp = supplierById(acc.oldId);
      if (supp) {
        supp.name = acc.name;
        supp.phone = acc.phone;
        supp.address = acc.address;
        supp.opening = acc.opening;
        supp.note = acc.note;
      }
    }
    
    save(); closeSheet(); render();
    toast('حساب به‌روزرسانی شد', 'ok');
  },
  editTxType: function (el) {
    var v = el.dataset.v;
    $("#editTxTypeIncome").classList.toggle("on", v === "income");
    $("#editTxTypeExpense").classList.toggle("on", v === "expense");
  },
  saveEditTransaction: function (el) {
    var txid = el.dataset.txid;
    var accId = el.dataset.accid;
    var parts = txid.split("_");
    var kind = parts[0], tid = parts.slice(1).join("_");
    
    var isIn = $("#editTxTypeIncome").classList.contains("on");
    var amount = m2(num($("#editTxAmount").value));
    if (amount <= 0) return toast("مبلغ را وارد کنید", "warn");
    var note = $("#editTxNote").value.trim();
    var dateInput = document.getElementById("editTxDate");
    var selectedDate = dateInput && dateInput.dataset.iso ? new Date(dateInput.dataset.iso) : new Date();
    
    if (kind === "pay") {
      var payment = DB.payments.find(function(p) { return p.id === tid; });
      if (payment) {
        payment.amount = isIn ? amount : -amount;
        payment.note = note;
        payment.date = selectedDate.toISOString();
      }
    } else if (kind === "spay") {
      var spay = DB.supplierPayments.find(function(p) { return p.id === tid; });
      if (spay) {
        spay.amount = isIn ? amount : -amount;
        spay.note = note;
        spay.date = selectedDate.toISOString();
      }
    } else if (kind === "adj") {
      var adj = DB.accountAdjustments.find(function(a) { return a.id === tid; });
      if (adj) {
        adj.delta = isIn ? -amount : amount;
        adj.note = note;
        adj.date = selectedDate.toISOString();
      }
    }
    
    save(); closeSheet();
    setTimeout(function() { showAccount(accId); }, 200);
    toast("تراکنش به‌روزرسانی شد", "ok");
  },
  accPayForm: function (el) {
    var id = el.dataset.id;
    var acc = accountById(id);
    if (!acc) return;
    
    var b = accountBalance(id);
    var dateIso = _datePickerValues['accPayDate'] || todayInput();
    sheet({
      title: 'آوردگی — ' + acc.name,
      body:
        fld('مبلغ', '<input class="input tnum" id="accPayAmount" inputmode="decimal" data-focus placeholder="۰">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('تاریخ', '<input class="input" type="text" readonly id="accPayDate" data-iso="' + dateIso + '" value="' + esc(faDate(dateIso)) + '" data-act="openAccPayDatePicker" style="cursor:pointer;background:var(--surface)">') +
        fld('یادداشت', '<input class="input" id="accPayNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn success" data-act="saveAccPay" data-id="' + id + '">ثبت</button>',
      reopenCallback: function() { ACT.accPayForm({ dataset: { id: id } }); }
    });
  },
  saveAccPay: function (el) {
    var id = el.dataset.id;
    var amount = m2(num($('#accPayAmount').value));
    if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var method = 'نقد';
    var note = $('#accPayNote').value.trim();
    var dateInput = document.getElementById('accPayDate');
    var selectedDate = dateInput && dateInput.dataset.iso ? new Date(dateInput.dataset.iso) : new Date();
    
    DB.accountAdjustments.push({
      id: uid('adj'), accountId: id, delta: -amount, note: note,
      date: selectedDate.toISOString(), withTreasury: PAY_WITH_TREASURY
    });
    
    if (PAY_WITH_TREASURY) {
      addTreasury('in', amount, 'آوردگی حساب', method, selectedDate.toISOString(), note, 'account');
    }
    
    PAY_WITH_TREASURY = true;
    delete _datePickerValues['accPayDate'];
    save(); closeSheet();
    setTimeout(function() { showAccount(id); }, 200);
    toast('آوردگی ' + money(amount) + ' ثبت شد', 'ok');
  },
  accDebtForm: function (el) {
    var id = el.dataset.id;
    var acc = accountById(id);
    if (!acc) return;
    
    var b = accountBalance(id);
    var dateIso = _datePickerValues['accDebtDate'] || todayInput();
    sheet({
      title: 'بردگی — ' + acc.name,
      body:
        fld('مبلغ', '<input class="input tnum" id="accDebtAmount" inputmode="decimal" data-focus placeholder="۰">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('تاریخ', '<input class="input" type="text" readonly id="accDebtDate" data-iso="' + dateIso + '" value="' + esc(faDate(dateIso)) + '" data-act="openAccDebtDatePicker" style="cursor:pointer;background:var(--surface)">') +
        fld('یادداشت', '<input class="input" id="accDebtNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn warning" data-act="saveAccDebt" data-id="' + id + '">ثبت</button>',
      reopenCallback: function() { ACT.accDebtForm({ dataset: { id: id } }); }
    });
  },
  saveAccDebt: function (el) {
    var id = el.dataset.id;
    var amount = m2(num($('#accDebtAmount').value));
    if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var method = 'نقد';
    var note = $('#accDebtNote').value.trim();
    var dateInput = document.getElementById('accDebtDate');
    var selectedDate = dateInput && dateInput.dataset.iso ? new Date(dateInput.dataset.iso) : new Date();
    
    DB.accountAdjustments.push({
      id: uid('adj'), accountId: id, delta: amount, note: note,
      date: selectedDate.toISOString(), withTreasury: PAY_WITH_TREASURY
    });
    
    if (PAY_WITH_TREASURY) {
      addTreasury('out', amount, 'بردگی حساب', method, selectedDate.toISOString(), note, 'account');
    }
    
    PAY_WITH_TREASURY = true;
    delete _datePickerValues['accDebtDate'];
    save(); closeSheet();
    setTimeout(function() { showAccount(id); }, 200);
    toast('بردگی ' + money(amount) + ' ثبت شد', 'ok');
  },
  accTab: function (el) { accTab = el.dataset.v; render(); },
  catFilter: function (el) { stockCat = el.dataset.v; if ($('#addProductList')) renderAddProductList(); else render(); },

  /* سبد فروش */
  addToCart: function (el) {
    var p = productById(el.dataset.id); if (!p) return;
    
    // بررسی موجودی
    if (num(p.stock) <= 0) {
      toast(p.name + ' موجود نیست', 'warn');
      return;
    }
    
    var line = cart.find(function (c) { return c.pid === p.id; });
    if (line) {
      // بررسی اینکه تعداد جدید از موجودی بیشتر نشود
      if (num(line.qty) + 1 > num(p.stock)) {
        toast('موجودی ' + p.name + ' کافی نیست (فقط ' + toFa(p.stock) + ' ' + esc(p.unit || '') + ')', 'warn');
        return;
      }
      line.qty = num(line.qty) + 1;
    } else {
      var price = m2(p.price);
      if (invoiceCustomer) {
        var lp = getLastPriceForCustomer(p.id, invoiceCustomer);
        if (lp !== null) price = lp;
      }
      cart.push({ pid: p.id, qty: 1, price: price, cost: m2(p.cost), name: p.name, unit: p.unit });
    }
    toast(p.name + ' اضافه شد (' + toFa(cart.length) + ' قلم)', 'ok');
    // اگر از شیت اضافه شده، شیت را به‌روز نگه دار
    if ($('#addProductList')) {
      renderAddProductList();
    }
    // صفحه اصلی را بدون اسکرول به‌روز کن تا اقلام جدید نشان داده شود
    render(true);
    // اگر شیت باز بود، دوباره لیست شیت را بساز (چون render آن را پاک نکرده)
    if ($('#addProductList')) {
      renderAddProductList();
      var inp = document.querySelector('#addProductList ~ .search input, .sheet [data-on="qProductAdd"]');
      // فوکوس به فیلد جست‌وجوی شیت برگردد
      setTimeout(function () {
        var f = document.querySelector('.sheet [data-focus]');
        if (f) f.focus();
      }, 30);
    }
  },
  plus: function (el) { 
    var i = +el.dataset.i; 
    var cartItem = cart[i];
    var p = productById(cartItem.pid);
    
    // بررسی موجودی
    if (p && num(cartItem.qty) + 1 > num(p.stock)) {
      toast('موجودی ' + p.name + ' کافی نیست (فقط ' + toFa(p.stock) + ' ' + esc(p.unit || '') + ')', 'warn');
      return;
    }
    
    cartItem.qty = num(cartItem.qty) + 1; 
    render(); 
  },
  minus: function (el) { 
    var i = +el.dataset.i; 
    cart[i].qty = num(cart[i].qty) - 1; 
    if (cart[i].qty <= 0) cart.splice(i, 1); 
    render(); 
  },
  rmLine: function (el) { cart.splice(+el.dataset.i, 1); render(); },
  clearCart: function () { cart = []; resetInvoice(); closeSheet(); render(); },
  showCart: function () { /* deprecated: سبد الان inline است */ },
  openAddProduct: function () { qProductAdd = ''; openAddProductSheet(); },
  cancelInvoice: function () {
    if (cart.length) {
      confirmBox('انصراف از فاکتور', 'اقلام فاکتور پاک شوند؟', function () { cart = []; resetInvoice(); render(); });
    } else { resetInvoice(); go('home'); }
  },

  /* تسویه */
  checkout: function () {
    if (!cart.length) return;
    var sub = cartSubtotal();
    var opts = '<option value="">— مشتری نقدی —</option>';
    DB.accounts.forEach(function (acc) { 
      if (acc.type === 'customer' && !acc.disabled) {
        var custId = acc.oldId || acc.id;
        opts += '<option value="' + custId + '">' + esc(acc.name) + '</option>';
      }
    });
    sheet({
      title: 'تسویه و ثبت فاکتور',
      body:
        '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:15px"><b>جمع اقلام</b><b class="tnum">' + money(sub) + '</b></div></div>' +
        fld('مشتری', '<select class="input" id="ckCustomer" data-on="ckCustomer">' + opts + '</select>') +
        '<div class="row2">' + fld('تخفیف', '<input class="input tnum" id="ckDiscount" inputmode="decimal" value="۰">') +
        fld('پرداختی', '<input class="input tnum" id="ckPaid" inputmode="decimal" data-focus value="' + toFa(sub) + '">') + '</div>' +
        '<div class="btn-row three" style="margin-bottom:12px"><button class="btn outline sm" data-act="payAll">تمام</button><button class="btn outline sm" data-act="payHalf">نصف</button><button class="btn outline sm" data-act="payNone">بردگی</button></div>' +
        fld('یادداشت', '<input class="input" id="ckNote" placeholder="اختیاری">') +
        '<div id="ckSummary" style="font-size:13px;color:var(--muted)"></div>',
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn success" data-act="saveSale">ثبت فاکتور</button>',
      onOpen: function () { CHECKOUT_CUSTOMER = ''; if (PRESELECT_CUSTOMER) { var sel = $('#ckCustomer'); if (sel) { sel.value = PRESELECT_CUSTOMER; CHECKOUT_CUSTOMER = PRESELECT_CUSTOMER; } PRESELECT_CUSTOMER = ''; } updateCheckout(); }
    });
  },
  payAll: function () { $('#ckPaid').value = toFa(m2(cartSubtotal() - num($('#ckDiscount').value))); updateCheckout(); },
  payTreasury: function (el) {
    var v = el.dataset.v;
    PAY_WITH_TREASURY = (v === 'yes');
    $('#payTrYes').classList.toggle('on', v === 'yes');
    $('#payTrNo').classList.toggle('on', v === 'no');
  },
  payHalf: function () { $('#ckPaid').value = toFa(m2((cartSubtotal() - num($('#ckDiscount').value)) / 2)); updateCheckout(); },
  payNone: function () { $('#ckPaid').value = '۰'; updateCheckout(); },
  saveSale: function () {
    var disc = num($('#ckDiscount').value), paid = num($('#ckPaid').value);
    var cid = $('#ckCustomer').value, note = $('#ckNote').value.trim();
    createSale({ customerId: cid, discount: disc, paid: paid, note: note, afterAction: 'show' });
  },
  quickCash: function () {
    if (!cart.length) return toast('سبد خرید خالی است', 'warn');
    var sub = cartSubtotal();
    createSale({
      customerId: null, discount: 0, paid: sub, note: invoiceNote,
      date: invoiceDate ? parseInputDate(invoiceDate) : new Date(),
      afterAction: 'show'
    });
    resetInvoice();
  },
  invPayAll: function () {
    var sub = cartSubtotal(), disc = m2(invoiceDiscount);
    invoicePaid = m2(sub - disc); if (invoicePaid < 0) invoicePaid = 0;
    render();
  },
  invPayHalf: function () {
    var sub = cartSubtotal(), disc = m2(invoiceDiscount);
    invoicePaid = m2((sub - disc) / 2); if (invoicePaid < 0) invoicePaid = 0;
    render();
  },
  invPayNone: function () {
    invoicePaid = 0;
    render();
  },
  saveInvoice: function () {
    if (!cart.length) return toast('سبد خرید خالی است', 'warn');
    var sub = cartSubtotal(), disc = m2(invoiceDiscount), total = m2(sub - disc);
    if (total < 0) return toast('تخفیف از جمع بیشتر است', 'bad');
    var paid = Math.min(m2(invoicePaid), total);
    var due = m2(total - paid);
    if (due > 0 && !invoiceCustomer) return toast('برای فروش بردگی، مشتری انتخاب کنید', 'warn');
    createSale({
      customerId: invoiceCustomer || null, discount: disc, paid: paid, note: invoiceNote,
      date: invoiceDate ? parseInputDate(invoiceDate) : new Date(),
      afterAction: 'show'
    });
    resetInvoice();
  },
  saveInvoicePrint: function () {
    if (!cart.length) return toast('سبد خرید خالی است', 'warn');
    var sub = cartSubtotal(), disc = m2(invoiceDiscount), total = m2(sub - disc);
    if (total < 0) return toast('تخفیف از جمع بیشتر است', 'bad');
    var paid = Math.min(m2(invoicePaid), total);
    var due = m2(total - paid);
    if (due > 0 && !invoiceCustomer) return toast('برای فروش بردگی، مشتری انتخاب کنید', 'warn');
    createSale({
      customerId: invoiceCustomer || null, discount: disc, paid: paid, note: invoiceNote,
      date: invoiceDate ? parseInputDate(invoiceDate) : new Date(),
      afterAction: 'print'
    });
    resetInvoice();
  },

  /* فاکتور */
  openSale: function (el) { showSale(el.dataset.id); },
  allSales: function () {
    var h = '';
    if (!DB.sales.length) h = '<div class="empty"><b>فاکتوری نیست</b></div>';
    else {
      h = '<div class="list">';
      DB.sales.slice().reverse().forEach(function (s) {
        h += '<button class="item" data-act="openSale" data-id="' + s.id + '"><span class="ic">' + toFa(s.no) + '</span><div class="mid"><div class="t">' + esc(s.customerName || 'مشتری نقدی') + '</div><div class="s">' + faDate(s.date) + ' — ' + faTime(s.date) + '</div></div><div class="end"><b class="tnum">' + money(s.total) + '</b>' + (s.due > 0 ? '<span class="chip low">بردگی</span>' : '<span class="chip ok">نقدی</span>') + '</div></button>';
      });
      h += '</div>';
    }
    sheet({ title: 'همهٔ فاکتورها', body: h });
  },
  printSale: function () { doPrint(); },
  printAccountStatement: function () { doPrint(); },
  shareAccountStatement: function (el) {
    var id = el.dataset.id || window._currentPrintAccountId;
    if (!id) return;
    var acc = accountById(id);
    if (!acc) return;
    
    var b = accountBalance(id);
    var txt = '📋 صورت‌حساب\n';
    txt += 'حساب: ' + acc.name + '\n';
    txt += 'نوع: ' + (ACCOUNT_TYPES[acc.type] ? ACCOUNT_TYPES[acc.type].label : 'سایر') + '\n';
    txt += 'فروشگاه: ' + DB.settings.shop + '\n';
    txt += 'مانده: ' + toFa(group(b)) + '\n';
    txt += (b > 0 ? 'وضعیت: قرضدار' : b < 0 ? 'وضعیت: طلبکار' : 'وضعیت: تسویه') + '\n';
    if (acc.phone) txt += 'شماره: ' + acc.phone + '\n';
    txt += 'تاریخ: ' + faDateLong();
    
    if (navigator.share) {
      navigator.share({ title: 'صورت‌حساب ' + acc.name, text: txt }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(function () { toast('صورت‌حساب کپی شد', 'ok'); });
    } else {
      toast('مرورگر اشتراک‌گذاری را پشتیبانی نمی‌کند', 'warn');
    }
  },
  shareSale: function (el) { var s = DB.sales.find(function (x) { return x.id === el.dataset.id; }); if (!s) return; var txt = receiptText(s); if (navigator.share) navigator.share({ title: 'فاکتور ' + s.no, text: txt }).catch(function () { }); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('فاکتور کپی شد', 'ok'); }); else toast('مرورگر اشتراک‌گذاری ندارد', 'warn'); },
  delSale: function (el) {
    var id = el.dataset.id;
    requirePin(function () {
      confirmBox('حذف فاکتور', 'موجودی کالاها به انبار برمی‌گردد، رکوردهای خزانه و پرداخت‌های مرتبط حذف می‌شوند. مطمئن هستید؟', function () {
        var saleIndex = DB.sales.findIndex(function (x) { return x.id === id; });
        if (saleIndex < 0) return toast('فاکتور یافت نشد', 'warn');
        
        var sale = DB.sales[saleIndex];
        var saleNo = sale.no;
        
        // 1. برگرداندن موجودی کالاها
        sale.items.forEach(function (it) {
          applyStockChange(it.pid, num(it.qty), 'return', 'برگشت از حذف فاکتور ' + saleNo, 'حذف فاکتور');
        });
        
        // 2. حذف رکوردهای خزانه وابسته به این فاکتور
        // شناسایی با reason: 'فروش فاکتور X'
        var treasuryReason = 'فروش فاکتور ' + saleNo;
        var treasuryBefore = DB.treasury.length;
        DB.treasury = DB.treasury.filter(function (t) {
          return t.reason !== treasuryReason;
        });
        var treasuryRemoved = treasuryBefore - DB.treasury.length;
        
        // 3. حذف پرداخت‌های مرتبط با این فاکتور
        // شناسایی با note: 'پرداخت فاکتور X'
        var paymentNote = 'پرداخت فاکتور ' + saleNo;
        var paymentsBefore = DB.payments.length;
        DB.payments = DB.payments.filter(function (p) {
          return p.note !== paymentNote;
        });
        var paymentsRemoved = paymentsBefore - DB.payments.length;
        
        // 4. حذف فاکتور
        DB.sales.splice(saleIndex, 1);
        
        // 5. ذخیره و نمایش نتیجه
        save();
        render();
        
        var msg = 'فاکتور ' + toFa(saleNo) + ' حذف شد';
        if (treasuryRemoved > 0) msg += '، ' + toFa(treasuryRemoved) + ' رکورد خزانه';
        if (paymentsRemoved > 0) msg += '، ' + toFa(paymentsRemoved) + ' پرداخت';
        msg += ' حذف شد';
        
        toast(msg, 'ok');
      });
    });
  },
  editSale: function (el) { editSale(el.dataset.id); },
  saveEditSale: function (el) {
    var id = el.dataset.id;
    var s = DB.sales.find(function (x) { return x.id === id; });
    if (!s) return;
    
    // مقادیر قبلی
    var oldPaid = m2(s.paid);
    var oldCustomerId = s.customerId;
    
    // مقادیر جدید
    var newCustomerId = $('#edCustomer').value || null;
    var newDiscount = num($('#edDiscount').value);
    var newTotal = m2(s.subtotal - newDiscount);
    
    // اعتبارسنجی: تخفیف بزرگ‌تر از subtotal
    if (newTotal < 0) {
      return toast('تخفیف نمی‌تواند از جمع اقلام بیشتر باشد', 'bad');
    }
    
    // اعتبارسنجی: paid بیشتر از total را clamp کن
    var newPaid = Math.min(num($('#edPaid').value), newTotal);
    var newDue = m2(newTotal - newPaid);
    
    // پیدا کردن مشتری جدید
    var newCustomer = newCustomerId ? customerById(newCustomerId) : null;
    
    // محاسبه اختلاف paid
    var paidDiff = m2(newPaid - oldPaid);
    
    // 1. اصلاح خزانه اگر paid تغییر کرده
    if (paidDiff !== 0) {
      var treasuryReason = 'فروش فاکتور ' + s.no;
      
      if (paidDiff > 0) {
        // paid افزایش یافته → ثبت رکورد جدید در treasury
        addTreasury('in', paidDiff, treasuryReason, 'نقد', new Date().toISOString(), 'اصلاح فاکتور (افزایش پرداخت)', 'sale');
      } else {
        // paid کاهش یافته → حذف یا اصلاح رکورد treasury
        var absDiff = Math.abs(paidDiff);
        var treasuryRecord = DB.treasury.find(function(t) {
          return t.reason === treasuryReason && t.type === 'in';
        });
        
        if (treasuryRecord) {
          if (treasuryRecord.amount <= absDiff) {
            // رکورد treasury کوچک‌تر یا مساوی اختلاف است → حذف کامل
            DB.treasury = DB.treasury.filter(function(t) { return t.id !== treasuryRecord.id; });
            // اگر هنوز اختلاف باقی مانده، رکورد منفی ثبت کن
            var remaining = m2(absDiff - treasuryRecord.amount);
            if (remaining > 0) {
              addTreasury('out', remaining, treasuryReason, 'نقد', new Date().toISOString(), 'اصلاح فاکتور (کاهش پرداخت)', 'sale');
            }
          } else {
            // رکورد treasury بزرگ‌تر از اختلاف است → کاهش مبلغ
            treasuryRecord.amount = m2(treasuryRecord.amount - absDiff);
          }
        }
      }
    }
    
    // 2. به‌روزرسانی فاکتور
    s.discount = m2(newDiscount);
    s.total = newTotal;
    s.paid = m2(newPaid);
    s.due = newDue;
    s.customerId = newCustomerId;
    s.customerName = newCustomer ? newCustomer.name : '';
    
    // 3. ذخیره و نمایش
    EDIT_ID = '';
    save();
    closeSheet();
    
    // نمایش فاکتور به‌روزرسانی شده
    setTimeout(function() {
      showSale(id);
    }, 200);
    
    var msg = 'فاکتور به‌روزرسانی شد';
    if (paidDiff !== 0) {
      msg += ' (اختلاف پرداخت: ' + (paidDiff > 0 ? '+' : '') + toFa(group(paidDiff)) + ')';
    }
    toast(msg, 'ok');
  },
  returnSale: function (el) { returnSheet(el.dataset.id); },
  retPlus: function (el) { var i = +el.dataset.i, s = DB.sales.find(function (x) { return x.id === RETURN_ID; }), max = s ? num(s.items[i].qty) : 0; RET[i] = Math.min((RET[i] || 0) + 1, max); var inp = $('#ret_' + i); if (inp) inp.value = toFa(RET[i]); updateReturn(); },
  retMinus: function (el) { var i = +el.dataset.i; RET[i] = Math.max(0, (RET[i] || 0) - 1); var inp = $('#ret_' + i); if (inp) inp.value = toFa(RET[i]); updateReturn(); },
  saveReturn: function (el) {
    var id = el.dataset.id, s = DB.sales.find(function (x) { return x.id === id; }); if (!s) return;
    if (RET.reduce(function (a, b) { return a + b; }, 0) <= 0) return toast('ابتدا کالا انتخاب کنید', 'warn');
    confirmBox('تأیید برگشت', 'موجودی انبار برمی‌گردد و صندوق/آوردگی اصلاح می‌شود. ادامه می‌دهید؟', function () { doReturn(id); });
  },

  /* کالا */
  newProduct: function () { productForm(null); },
  editProduct: function (el) { productForm(productById(el.dataset.id)); },
  saveProduct: function (el) {
    var id = el.dataset.id, name = $('#pName').value.trim();
    if (!name) return toast('نام کالا لازم است', 'warn');
    var isNew = !id;
    var costEl = $('#pCost'), priceEl = $('#pPrice');
    var cost = costEl ? m2(num(costEl.value)) : 0;
    var price = priceEl ? m2(num(priceEl.value)) : 0;
    if (cost < 0 || price < 0) return toast('قیمت نمی‌تواند منفی باشد', 'warn');
    if (num($('#pStock').value) < 0) return toast('موجودی نمی‌تواند منفی باشد', 'warn');
    var cat = $('#pCategory').value.trim();
    if (cat && DB.categories.indexOf(cat) < 0) DB.categories.push(cat);
    var data = {
      name: name, category: cat, unit: $('#pUnit').value.trim() || 'عدد',
      cost: cost, price: price,
      stock: m2(num($('#pStock').value)), min: m2(num($('#pMin').value)), barcode: $('#pBarcode').value.trim()
    };
    if (id) { Object.assign(productById(id), data, { updatedAt: new Date().toISOString() }); toast('کالا ذخیره شد', 'ok'); }
    else { data.id = uid('prd'); data.createdAt = new Date().toISOString(); DB.products.push(data); toast('کالا اضافه شد', 'ok'); }
    save(); closeSheet(); render();
  },
  delProduct: function (el) {
    var id = el.dataset.id;
    requirePin(function () {
      confirmBox('حذف کالا', 'این کالا برای همیشه حذف شود؟ فاکتورهای گذشته دست‌نخورده می‌مانند.', function () { DB.products = DB.products.filter(function (p) { return p.id !== id; }); save(); render(); toast('کالا حذف شد', 'ok'); });
    });
  },
  /* ورود کالا (خرید از فراهم‌کننده) */
  goodsReceipt: function (el) { 
    var sid = el ? el.dataset.sid : null;
    receiptForm(sid); 
  },
  savePurchase: function () {
    if (!receiptItems.length) return toast('هیچ کالایی اضافه نشده', 'warn');
    var freight = m2(num($('#purFreight').value)), other = m2(num($('#purOther').value));
    if (freight < 0 || other < 0) return toast('هزینه‌ها نمی‌توانند منفی باشند', 'warn');
    var date = $('#purDate').value ? parseInputDate($('#purDate').value) : new Date();
    var itemsTotal = 0;
    receiptItems.forEach(function (it) { itemsTotal += m2(m2(it.qty) * m2(it.cost)); });
    var total = m2(itemsTotal + freight + other);
    var sid = $('#purSupplier').value;
    var paid = sid ? Math.min(m2(num($('#purPaid').value)), total) : 0;
    var due = m2(total - paid);
    // به‌روزرسانی موجودی همه اقلام
    var sup = sid ? supplierById(sid) : null;
    receiptItems.forEach(function (it) {
      applyStockChange(it.pid, it.qty, 'purchase', 'ورود کالا' + (sup ? ' از ' + sup.name : ''), 'خرید');
      var p = productById(it.pid);
      if (p && it.cost > 0) p.cost = it.cost;
    });
    
    DB.counters.purchase = (DB.counters.purchase || 0) + 1;
    DB.purchases.push({
      id: uid('pur'), no: DB.counters.purchase, date: date.toISOString(),
      supplierId: sid || null, supplierName: sup ? sup.name : '',
      items: receiptItems.map(function (it) { return { pid: it.pid, name: it.name, unit: it.unit, qty: it.qty, cost: it.cost }; }),
      freight: freight, other: other, total: total, paid: paid, due: due, note: $('#purNote').value.trim()
    });
    // خروج از خزانه (پرداخت نقدی به فراهم‌کننده)
    if (paid > 0) {
      addTreasury('out', paid, 'پرداخت برای ورود کالا', 'نقد', date.toISOString(), $('#purNote').value.trim(), 'purchase');
    }
    var count = receiptItems.length;
    save(); closeSheet(); render();
    toast('ورود ' + toFa(count) + ' قلم کالا ثبت شد' + (due > 0 ? ' — بردگی: ' + money(due) : ''), 'ok');
  },
  addReceiptItem: function () { addReceiptItem(); },
  rmReceiptItem: function (el) { removeReceiptItem(+el.dataset.i); },
  /* اصلاح دستی موجودی */
  stockAdjust: function (el) { adjustForm(el.dataset.id); },
  saveAdjust: function (el) {
    var pid = el.dataset.id, p = productById(pid); if (!p) return;
    var qty = num($('#adjQty').value), reason = $('#adjReason').value;
    if (!qty) return toast('مقدار را وارد کنید', 'warn');
    
    // چک کردن موجودی اگر کاهش است
    if (!applyStockChange(pid, qty, 'adjust', 'اصلاح: ' + reason, 'اصلاح موجودی')) {
      return;
    }
    
    DB.stockAdjustments.push({ id: uid('adj'), productId: pid, qty: m2(qty), reason: reason, note: $('#adjNote').value.trim(), date: new Date().toISOString() });
    save(); closeSheet(); render(); toast('موجودی اصلاح شد', 'ok');
  },
  showMovements: function (el) { showMovements(el.dataset.id); },

  /* مشتری */
  newCustomer: function () { customerForm(null, 'cust'); },
  editCustomer: function (el) { customerForm(customerById(el.dataset.id), 'cust'); },
  saveCustomer: function (el) {
    var id = el.dataset.id, name = $('#cName').value.trim(); if (!name) return toast('نام مشتری لازم است', 'warn');
    var data = { name: name, phone: toEn($('#cPhone').value), address: $('#cAddress').value.trim(), opening: m2(num($('#cOpening').value)), note: $('#cNote').value.trim() };
    if (id) { 
      Object.assign(customerById(id), data); 
      // آپدیت account مربوطه
      var acc = DB.accounts.find(function(a) { return a.oldId === id && a.type === 'customer'; });
      if (acc) {
        acc.name = data.name;
        acc.phone = data.phone;
        acc.address = data.address;
        acc.opening = data.opening;
        acc.note = data.note;
      }
      toast('ذخیره شد', 'ok'); 
    }
    else { 
      data.id = uid('cus'); 
      data.createdAt = new Date().toISOString(); 
      DB.customers.push(data); 
      // اضافه کردن به accounts
      DB.accounts.push({
        id: uid('acc'),
        oldId: data.id,
        type: 'customer',
        name: data.name,
        phone: data.phone,
        address: data.address,
        opening: data.opening,
        note: data.note,
        pinned: false,
        disabled: false,
        createdAt: data.createdAt
      });
      toast('مشتری اضافه شد', 'ok'); 
    }
    save(); closeSheet(); render();
  },
  openCustomer: function (el) { showCustomer(el.dataset.id); },
  borrowGoods: function (el) { PRESELECT_CUSTOMER = el.dataset.id; closeSheet(); go('sale'); },
  sendWhatsapp: function (el) {
    var c = customerById(el.dataset.id);
    if (!c) return;
    if (!c.phone) return toast('این مشتری شماره تماس ندارد', 'warn');
    var amount = num(el.dataset.amount);
    var link = buildWhatsappLink(c, amount);
    if (link) window.open(link, '_blank');
  },
  custMenu: function (el) {
    showCustomerMenu(el.dataset.id, el);
  },
  newTx: function (el) {
    var cid = el.dataset.cid;
    PAY_WITH_TREASURY = true;
    sheet({
      title: 'تراکنش جدید',
      body:
        '<div class="seg" style="margin-bottom:12px">' +
        '<button class="on" data-act="txType" data-v="income" id="txTypeIncome">آوردگی</button>' +
        '<button data-act="txType" data-v="expense" id="txTypeExpense">بردگی</button></div>' +
        fld('مبلغ (' + esc(DB.settings.currency) + ')', '<input class="input tnum" id="txAmount" inputmode="decimal" data-focus placeholder="۰">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('توضیحات', '<input class="input" id="txDesc" placeholder="مثلاً آوردگی نقدی">') +
        fld('شماره فاکتور (اختیاری)', '<input class="input" id="txInvNo" placeholder="INV-...">') +
        '<div class="row2">' +
        fld('تاریخ', '<input class="input" type="text" readonly id="txDate" data-iso="' + todayInput() + '" value="' + esc(faDate(todayInput())) + '" data-act="openTxDatePicker" style="cursor:pointer;background:var(--surface)">') +
        fld('ساعت', '<input class="input" type="time" id="txTime" value="' + new Date().toTimeString().slice(0,5) + '">') +
        '</div>',
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="saveTx" data-cid="' + cid + '">ثبت تراکنش</button>'
    });
  },
  txType: function (el) {
    var v = el.dataset.v;
    $('#txTypeIncome').classList.toggle('on', v === 'income');
    $('#txTypeExpense').classList.toggle('on', v === 'expense');
  },
  saveTx: function (el) {
    var cid = el.dataset.cid;
    var amount = m2(num($('#txAmount').value));
    if (amount <= 0) return toast('مبلغ باید بیشتر از صفر باشد', 'warn');
    var isIn = $('#txTypeIncome').classList.contains('on');
    var desc = $('#txDesc').value.trim();
    var invNo = $('#txInvNo').value.trim();
    var method = 'نقد';
    var dateVal = $('#txDate').value;
    var timeVal = $('#txTime').value || '00:00';
    var dt = parseInputDate(dateVal);
    var tp = timeVal.split(':');
    dt.setHours(+tp[0], +tp[1]);

    if (isIn) {
      DB.payments.push({ id: uid('pay'), customerId: cid, amount: amount, note: desc, date: dt.toISOString(), withTreasury: PAY_WITH_TREASURY });
      if (PAY_WITH_TREASURY) {
        addTreasury('in', amount, 'آوردگی از مشتری', method, dt.toISOString(), desc, 'tx');
      }
    } else {
      DB.accountAdjustments.push({
        id: uid('ca'), kind: 'cust', customerId: cid, supplierId: null,
        delta: amount, note: desc + (invNo ? ' (' + invNo + ')' : ''), date: dt.toISOString(), withTreasury: PAY_WITH_TREASURY
      });
      if (PAY_WITH_TREASURY) {
        addTreasury('out', amount, 'بردگی مشتری', method, dt.toISOString(), desc, 'tx');
      }
    }
    PAY_WITH_TREASURY = true;
    save(); closeSheet();
    setTimeout(function () { showCustomer(cid); }, 100);
    toast('تراکنش ثبت شد', 'ok');
  },
  txMenu: function (el) {
    var txid = el.dataset.txid;
    var cid = el.dataset.cid;
    closeContextMenu();
    var backdrop = document.createElement('div');
    backdrop.className = 'ctx-backdrop';
    backdrop.addEventListener('click', closeContextMenu);
    document.body.appendChild(backdrop);
    var menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.innerHTML =
      '<button data-tact="view"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg> جزئیات</button>' +
      '<button data-tact="edit"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ویرایش</button>' +
      '<div class="sep"></div>' +
      '<button data-tact="del" class="danger"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg> حذف</button>';
    document.body.appendChild(menu);
    var rect = el.getBoundingClientRect();
    var menuH = menu.offsetHeight;
    var winH = window.innerHeight;
    if (rect.bottom + menuH + 8 > winH) {
      menu.style.bottom = (winH - rect.top + 4) + 'px';
    } else {
      menu.style.top = (rect.bottom + 4) + 'px';
    }
    menu.style.left = Math.max(8, rect.right - 200) + 'px';
    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tact]'); if (!btn) return;
      var act = btn.dataset.tact;
      closeContextMenu();
      if (act === 'edit') {
        editTransaction(txid, cid);
      } else if (act === 'del') {
        confirmBox('حذف تراکنش', 'آیا از حذف این تراکنش مطمئن هستید؟', function () {
          var parts = txid.split('_');
          var kind = parts[0], tid = parts.slice(1).join('_');
          if (kind === 'pay') {
            DB.payments = DB.payments.filter(function (p) { return p.id !== tid; });
          } else if (kind === 'adj') {
            DB.accountAdjustments = DB.accountAdjustments.filter(function (a) { return a.id !== tid; });
          } else if (kind === 'sale') {
            toast('فاکتور از اینجا قابل حذف نیست', 'warn'); return;
          }
          save(); closeSheet();
          setTimeout(function () { showCustomer(cid); }, 100);
          toast('تراکنش حذف شد', 'ok');
        });
      } else if (act === 'view') {
        toast('جزئیات در حال حاضر در دسترس نیست', 'warn');
      }
    });
  },
  stxMenu: function (el) {
    var txid = el.dataset.txid;
    var sid = el.dataset.sid;
    closeContextMenu();
    var backdrop = document.createElement('div');
    backdrop.className = 'ctx-backdrop';
    backdrop.addEventListener('click', closeContextMenu);
    document.body.appendChild(backdrop);
    var menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.innerHTML =
      '<button data-tact="view"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg> جزئیات</button>' +
      '<div class="sep"></div>' +
      '<button data-tact="del" class="danger"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg> حذف</button>';
    document.body.appendChild(menu);
    var rect = el.getBoundingClientRect();
    var menuH = menu.offsetHeight;
    var winH = window.innerHeight;
    if (rect.bottom + menuH + 8 > winH) {
      menu.style.bottom = (winH - rect.top + 4) + 'px';
    } else {
      menu.style.top = (rect.bottom + 4) + 'px';
    }
    menu.style.left = Math.max(8, rect.right - 200) + 'px';
    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tact]'); if (!btn) return;
      var act = btn.dataset.tact;
      closeContextMenu();
      if (act === 'del') {
        confirmBox('حذف تراکنش', 'آیا از حذف این تراکنش مطمئن هستید؟', function () {
          var parts = txid.split('_');
          var kind = parts[0], tid = parts.slice(1).join('_');
          if (kind === 'spay') {
            DB.supplierPayments = DB.supplierPayments.filter(function (p) { return p.id !== tid; });
          } else if (kind === 'sadj') {
            DB.accountAdjustments = DB.accountAdjustments.filter(function (a) { return a.id !== tid; });
          } else if (kind === 'pur') {
            toast('فاکتور خرید از اینجا قابل حذف نیست', 'warn'); return;
          }
          save(); closeSheet();
          setTimeout(function () { showSupplier(sid); }, 100);
          toast('تراکنش حذف شد', 'ok');
        });
      } else if (act === 'view') {
        toast('جزئیات در حال حاضر در دسترس نیست', 'warn');
      }
    });
  },
  accTxMenu: function (el) {
    var txid = el.dataset.txid;
    var accId = el.dataset.accid;
    closeContextMenu();
    var backdrop = document.createElement('div');
    backdrop.className = 'ctx-backdrop';
    backdrop.addEventListener('click', closeContextMenu);
    document.body.appendChild(backdrop);
    var menu = document.createElement('div');
    menu.className = 'ctx-menu';
    var parts = txid.split('_');
    var kind = parts[0];
    var canEdit = (kind === 'pay' || kind === 'spay' || kind === 'adj');
    var menuHtml = '';
    menuHtml += '<button data-tact="view"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg> جزئیات</button>';
    if (canEdit) {
      menuHtml += '<button data-tact="edit"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ویرایش</button>';
    }
    menuHtml += '<div class="sep"></div>';
    menuHtml += '<button data-tact="del" class="danger"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg> حذف</button>';
    menu.innerHTML = menuHtml;
    document.body.appendChild(menu);
    // موقعیت‌دهی هوشمند: اگر پایین جا نیست، بالا باز شود
    var rect = el.getBoundingClientRect();
    var menuH = menu.offsetHeight;
    var winH = window.innerHeight;
    if (rect.bottom + menuH + 8 > winH) {
      menu.style.bottom = (winH - rect.top + 4) + 'px';
    } else {
      menu.style.top = (rect.bottom + 4) + 'px';
    }
    menu.style.left = Math.max(8, rect.right - 200) + 'px';
    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tact]'); if (!btn) return;
      var act = btn.dataset.tact;
      closeContextMenu();
      if (act === 'view') {
        showTransactionDetails(txid, accId);
      } else if (act === 'edit') {
        editTransaction(txid, accId);
      } else if (act === 'del') {
        confirmBox('حذف تراکنش', 'آیا از حذف این تراکنش مطمئن هستید؟', function () {
          var tid = parts.slice(1).join('_');
          if (kind === 'pay') {
            DB.payments = DB.payments.filter(function (p) { return p.id !== tid; });
          } else if (kind === 'spay') {
            DB.supplierPayments = DB.supplierPayments.filter(function (p) { return p.id !== tid; });
          } else if (kind === 'adj') {
            DB.accountAdjustments = DB.accountAdjustments.filter(function (a) { return a.id !== tid; });
          } else if (kind === 'sale') {
            toast('فاکتور فروش از اینجا قابل حذف نیست', 'warn'); return;
          } else if (kind === 'pur') {
            toast('فاکتور خرید از اینجا قابل حذف نیست', 'warn'); return;
          }
          save(); closeSheet();
          setTimeout(function () { showAccount(accId); }, 100);
          toast('تراکنش حذف شد', 'ok');
        });
      }
    });
  },
  suppMenu: function (el) {
    showSupplierMenu(el.dataset.id, el);
  },
  delCustomer: function (el) {
    var id = el.dataset.id;
    requirePin(function () {
      confirmBox('حذف مشتری', 'مشتری و سابقهٔ پرداخت‌هایش حذف می‌شود. ادامه؟', function () {
      DB.customers = DB.customers.filter(function (c) { return c.id !== id; });
      DB.payments = DB.payments.filter(function (p) { return p.customerId !== id; });
      DB.accountAdjustments = DB.accountAdjustments.filter(function (a) { return !(a.kind === 'cust' && a.customerId === id); });
      save(); render(); toast('مشتری حذف شد', 'ok');
      });
    });
  },
  payForm: function (el) { payForm(el.dataset.id); },
  savePay: function (el) {
    var amount = m2(num($('#payAmount').value)); if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var method = 'نقد';
    var note = $('#payNote').value.trim();
    DB.payments.push({ id: uid('pay'), customerId: el.dataset.id, amount: amount, note: note, date: new Date().toISOString() });
    if (PAY_WITH_TREASURY) {
      addTreasury('in', amount, 'آوردگی از مشتری', method, new Date().toISOString(), note, 'payment');
    }
    PAY_WITH_TREASURY = true;
    save(); closeSheet(); render(); toast('آوردگی ' + money(amount) + ' ثبت شد', 'ok');
  },
  accAdjForm: function (el) {
    var acc = accountById(el.dataset.id);
    if (!acc) return;
    adjBalanceForm(el.dataset.id, acc.type);
  },
  debtForm: function (el) {
    var id = el.dataset.id;
    var c = customerById(id); if (!c) return;
    var b = customerBalance(id);
    sheet({
      title: 'بردگی — ' + c.name,
      body: '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">مانده فعلی</span><b class="tnum">' + money(b) + '</b></div></div>' +
        fld('مبلغ', '<input class="input tnum" id="debtAmount" inputmode="decimal" data-focus value="' + toFa(Math.max(0, b)) + '">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('یادداشت', '<input class="input" id="debtNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn warning" data-act="saveDebt" data-id="' + id + '">ثبت</button>'
    });
  },
  saveDebt: function (el) {
    var id = el.dataset.id;
    var amount = m2(num($('#debtAmount').value));
    if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var method = 'نقد';
    var note = $('#debtNote').value.trim();
    
    DB.accountAdjustments.push({
      id: uid('ca'), kind: 'cust', customerId: id, supplierId: null,
      delta: -amount, note: note, date: new Date().toISOString(), withTreasury: PAY_WITH_TREASURY
    });
    
    if (PAY_WITH_TREASURY) {
      addTreasury('out', amount, 'بردگی مشتری', method, new Date().toISOString(), note, 'debt');
    }
    
    PAY_WITH_TREASURY = true;
    save(); closeSheet();
    setTimeout(function () { showCustomer(id); }, 100);
    toast('بردگی ' + money(amount) + ' ثبت شد', 'ok');
  },
  suppDebtForm: function (el) {
    var id = el.dataset.id;
    var c = supplierById(id); if (!c) return;
    var b = supplierBalance(id);
    sheet({
      title: 'بردگی — ' + c.name,
      body: '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">مانده فعلی</span><b class="tnum">' + money(b) + '</b></div></div>' +
        fld('مبلغ', '<input class="input tnum" id="suppDebtAmount" inputmode="decimal" data-focus value="' + toFa(Math.max(0, b)) + '">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('یادداشت', '<input class="input" id="suppDebtNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn warning" data-act="saveSuppDebt" data-id="' + id + '">ثبت</button>'
    });
  },
  saveSuppDebt: function (el) {
    var id = el.dataset.id;
    var amount = m2(num($('#suppDebtAmount').value));
    if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var method = 'نقد';
    var note = $('#suppDebtNote').value.trim();
    
    DB.accountAdjustments.push({
      id: uid('sa'), kind: 'supp', supplierId: id, customerId: null,
      delta: -amount, note: note, date: new Date().toISOString(), withTreasury: PAY_WITH_TREASURY
    });
    
    if (PAY_WITH_TREASURY) {
      addTreasury('out', amount, 'بردگی فراهم‌کننده', method, new Date().toISOString(), note, 'suppDebt');
    }
    
    PAY_WITH_TREASURY = true;
    save(); closeSheet();
    setTimeout(function () { showSupplier(id); }, 100);
    toast('بردگی ' + money(amount) + ' ثبت شد', 'ok');
  },
  saveAccountAdj: function (el) {
    var kind = el.dataset.kind;
    var delta = num($('#adjAmt').value); if (!delta) return toast('مبلغ را وارد کنید', 'warn');
    var method = 'نقد';
    var note = $('#adjNote').value.trim();
    DB.accountAdjustments.push({
      id: uid(kind === 'cust' ? 'ca' : 'sa'), kind: kind,
      customerId: kind === 'cust' ? el.dataset.id : null,
      supplierId: kind === 'supp' ? el.dataset.id : null,
      delta: m2(delta), note: note, date: new Date().toISOString(), withTreasury: PAY_WITH_TREASURY
    });
    if (PAY_WITH_TREASURY) {
      var reason = (kind === 'cust' ? 'تنظیم حساب مشتری' : 'تنظیم حساب فراهم‌کننده');
      if (delta > 0) {
        addTreasury('out', Math.abs(delta), reason, method, new Date().toISOString(), note, 'adjustment');
      } else {
        addTreasury('in', Math.abs(delta), reason, method, new Date().toISOString(), note, 'adjustment');
      }
    }
    PAY_WITH_TREASURY = true;
    save(); closeSheet(); render(); toast('تنظیم حساب ثبت شد', 'ok');
  },

  /* فراهم‌کننده */
  newSupplier: function () { customerForm(null, 'supp'); },
  editSupplier: function (el) { customerForm(supplierById(el.dataset.id), 'supp'); },
  saveSupplier: function (el) {
    var id = el.dataset.id, name = $('#cName').value.trim(); if (!name) return toast('نام فراهم‌کننده لازم است', 'warn');
    var data = { name: name, phone: toEn($('#cPhone').value), address: $('#cAddress').value.trim(), opening: m2(num($('#cOpening').value)), note: $('#cNote').value.trim() };
    if (id) { 
      Object.assign(supplierById(id), data); 
      // آپدیت account مربوطه
      var acc = DB.accounts.find(function(a) { return a.oldId === id && a.type === 'supplier'; });
      if (acc) {
        acc.name = data.name;
        acc.phone = data.phone;
        acc.address = data.address;
        acc.opening = data.opening;
        acc.note = data.note;
      }
      toast('ذخیره شد', 'ok'); 
    }
    else { 
      data.id = uid('sup'); 
      data.createdAt = new Date().toISOString(); 
      DB.suppliers.push(data); 
      // اضافه کردن به accounts
      DB.accounts.push({
        id: uid('acc'),
        oldId: data.id,
        type: 'supplier',
        name: data.name,
        phone: data.phone,
        address: data.address,
        opening: data.opening,
        note: data.note,
        pinned: false,
        disabled: false,
        createdAt: data.createdAt
      });
      toast('فراهم‌کننده اضافه شد', 'ok'); 
    }
    save(); closeSheet(); render();
  },
  openSupplier: function (el) { showSupplier(el.dataset.id); },
  delSupplier: function (el) {
    var id = el.dataset.id;
    requirePin(function () {
      confirmBox('حذف فراهم‌کننده', 'سابقهٔ پرداخت‌ها حذف می‌شود. ادامه؟', function () {
      DB.suppliers = DB.suppliers.filter(function (c) { return c.id !== id; });
      DB.supplierPayments = DB.supplierPayments.filter(function (p) { return p.supplierId !== id; });
      DB.accountAdjustments = DB.accountAdjustments.filter(function (a) { return !(a.kind === 'supp' && a.supplierId === id); });
      save(); render(); toast('فراهم‌کننده حذف شد', 'ok');
      });
    });
  },
  suppPayForm: function (el) { suppPayForm(el.dataset.id); },
  saveSuppPay: function (el) {
    var amount = m2(num($('#payAmount').value)); if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var method = 'نقد';
    var note = $('#payNote').value.trim();
    DB.supplierPayments.push({ id: uid('sp'), supplierId: el.dataset.id, amount: amount, note: note, date: new Date().toISOString() });
    if (PAY_WITH_TREASURY) {
      addTreasury('out', amount, 'پرداخت به فراهم‌کننده', method, new Date().toISOString(), note, 'supplierPayment');
    }
    PAY_WITH_TREASURY = true;
    save(); closeSheet(); render(); toast('پرداخت ' + money(amount) + ' ثبت شد', 'ok');
  },
  suppAdjForm: function (el) { adjBalanceForm(el.dataset.id, 'supp'); },
  trsRange: function (el) { treasuryRange = el.dataset.v; render(); },
  treasuryIn: function () {
    var savedAmount = _treasuryFormData.amount || '';
    var savedReason = _treasuryFormData.reason || 'فروش نقدی';
    var savedNote = _treasuryFormData.note || '';
    var savedDate = _datePickerValues['trsDate'] || todayInput();
    
    sheet({
      title: 'ورود دستی به خزانه',
      body:
        fld('مبلغ', '<input class="input tnum" id="trsAmount" inputmode="decimal" data-focus placeholder="۰" value="' + esc(savedAmount) + '">') +
        fld('دلیل', '<select class="input" id="trsReason"><option' + (savedReason === 'فروش نقدی' ? ' selected' : '') + '>فروش نقدی</option><option' + (savedReason === 'آورگی مشتری' ? ' selected' : '') + '>آورگی مشتری</option><option' + (savedReason === 'سایر' ? ' selected' : '') + '>سایر</option></select>') +

        fld('تاریخ', '<input class="input" type="text" readonly id="trsDate" data-iso="' + savedDate + '" value="' + esc(faDate(savedDate)) + '" data-act="openTrsDatePicker" style="cursor:pointer;background:var(--surface)">') +
        fld('یادداشت', '<input class="input" id="trsNote" placeholder="اختیاری" value="' + esc(savedNote) + '">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn success" data-act="saveTrsIn">ثبت ورود</button>',
      reopenCallback: function() { ACT.treasuryIn(); }
    });
  },
  treasuryOut: function () {
    var savedAmount = _treasuryFormData.amount || '';
    var savedReason = _treasuryFormData.reason || 'مصرف/خرج';
    var savedNote = _treasuryFormData.note || '';
    var savedDate = _datePickerValues['trsDate'] || todayInput();
    
    sheet({
      title: 'خروج دستی از خزانه',
      body:
        fld('مبلغ', '<input class="input tnum" id="trsAmount" inputmode="decimal" data-focus placeholder="۰" value="' + esc(savedAmount) + '">') +
        fld('دلیل', '<select class="input" id="trsReason"><option' + (savedReason === 'مصرف/خرج' ? ' selected' : '') + '>مصرف/خرج</option><option' + (savedReason === 'پرداخت به فراهم‌کننده' ? ' selected' : '') + '>پرداخت به فراهم‌کننده</option><option' + (savedReason === 'برداشت شخصی' ? ' selected' : '') + '>برداشت شخصی</option><option' + (savedReason === 'سایر' ? ' selected' : '') + '>سایر</option></select>') +

        fld('تاریخ', '<input class="input" type="text" readonly id="trsDate" data-iso="' + savedDate + '" value="' + esc(faDate(savedDate)) + '" data-act="openTrsDatePicker" style="cursor:pointer;background:var(--surface)">') +
        fld('یادداشت', '<input class="input" id="trsNote" placeholder="اختیاری" value="' + esc(savedNote) + '">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn danger" data-act="saveTrsOut">ثبت خروج</button>',
      reopenCallback: function() { ACT.treasuryOut(); }
    });
  },
  saveTrsIn: function () {
    var amount = m2(num($('#trsAmount').value));
    if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var reason = $('#trsReason').value;
    var method = 'نقد';
    var dateVal = $('#trsDate').value;
    var note = $('#trsNote').value.trim();
    var dt = dateVal ? parseInputDate(dateVal) : new Date();
    addTreasury('in', amount, reason, method, dt.toISOString(), note, 'manual');
    save(); closeSheet(); render();
    toast('ورود ' + money(amount) + ' به خزانه ثبت شد', 'ok');
  },
  saveTrsOut: function () {
    var amount = m2(num($('#trsAmount').value));
    if (amount <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var reason = $('#trsReason').value;
    var method = 'نقد';
    var dateVal = $('#trsDate').value;
    var note = $('#trsNote').value.trim();
    var dt = dateVal ? parseInputDate(dateVal) : new Date();
    addTreasury('out', amount, reason, method, dt.toISOString(), note, 'manual');
    save(); closeSheet(); render();
    toast('خروج ' + money(amount) + ' از خزانه ثبت شد', 'ok');
  },
  goTreasury: function () { route = 'treasury'; render(); },
  newAccount: function () {
    sheet({
      title: 'ایجاد حساب جدید',
      body:
        fld('نام حساب *', '<input class="input" id="accName" data-focus placeholder="مثلاً: احمد خان">') +
        fld('نوع حساب *', '<select class="input" id="accType" data-on="accTypeChange">' +
          Object.keys(ACCOUNT_TYPES).map(function(k) { return '<option value="' + k + '">' + ACCOUNT_TYPES[k].label + '</option>'; }).join('') +
        '</select>') +
        '<div id="accDynamicFields"></div>' +
        '<details style="margin-top:12px"><summary style="cursor:pointer;font-size:13px;color:var(--primary);font-weight:600">اطلاعات بیشتر</summary>' +
        '<div style="margin-top:8px">' +
        fld('توضیحات', '<textarea class="input" id="accNote" rows="2" placeholder="اختیاری"></textarea>') +
        '</div></details>',
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="saveNewAccount">ایجاد</button>',
      onOpen: function() { updateAccFields(); }
    });
  },
  saveNewAccount: function () {
    var name = $('#accName').value.trim();
    if (!name) return toast('نام حساب را وارد کنید', 'warn');
    var type = $('#accType').value;
    var phone = toEn($('#accPhone') ? $('#accPhone').value : '');
    var address = $('#accAddress') ? $('#accAddress').value.trim() : '';
    var openingBal = m2(num($('#accOpeningBal') ? $('#accOpeningBal').value : 0));
    var openingType = $('#accOpeningType') ? $('#accOpeningType').value : 'debit';
    var note = $('#accNote') ? $('#accNote').value.trim() : '';
    
    // تنظیم مانده اولیه بر اساس نوع
    var opening = openingType === 'credit' ? -openingBal : openingBal;
    
    var acc = {
      id: uid('acc'),
      type: type,
      name: name,
      phone: phone,
      address: address,
      opening: opening,
      note: note,
      pinned: false,
      disabled: false,
      createdAt: new Date().toISOString()
    };
    
    // اگر مشتری یا فراهم‌کننده است، در DB.customers یا DB.suppliers هم اضافه کن
    if (type === 'customer') {
      var custId = uid('cus');
      acc.oldId = custId;
      DB.customers.push({
        id: custId,
        name: name,
        phone: phone,
        address: address,
        opening: opening,
        note: note,
        createdAt: acc.createdAt
      });
    } else if (type === 'supplier') {
      var suppId = uid('sup');
      acc.oldId = suppId;
      DB.suppliers.push({
        id: suppId,
        name: name,
        phone: phone,
        address: address,
        opening: opening,
        note: note,
        createdAt: acc.createdAt
      });
    }
    
    DB.accounts.push(acc);
    save(); closeSheet(); render();
    toast('حساب «' + name + '» ایجاد شد', 'ok');
  },
  openAccount: function (el) {
    showAccount(el.dataset.id);
  },
  accountMenu: function (el) {
    var accId = el.dataset.id;
    var acc = accountById(accId);
    if (!acc) return;
    
    var hasPhone = !!acc.phone;
    
    var menu = [
      { label: 'مشاهده صورت‌حساب', act: 'openAccount', icon: 'eye' },
      { label: 'ویرایش پروفایل', act: 'editAccount', icon: 'edit' },
      { sep: true },
      { label: 'تماس' + (!hasPhone ? ' (بدون شماره)' : ''), act: 'callAccount', icon: 'phone', disabled: !hasPhone },
      { label: 'واتساپ' + (!hasPhone ? ' (بدون شماره)' : ''), act: 'waAccount', icon: 'wa', disabled: !hasPhone },
      { label: 'کپی شماره' + (!hasPhone ? ' (بدون شماره)' : ''), act: 'copyPhoneAccount', icon: 'copy', disabled: !hasPhone },
      { label: 'اشتراک‌گذاری خلاصه', act: 'shareAccount', icon: 'share' },
      { sep: true },
      { label: acc.pinned ? 'برداشتن پین' : 'پین کردن', act: 'togglePinAccount', icon: 'pin' },
      { sep: true },
      { label: 'فلتر تراکنش‌ها', act: 'filterAccountFromMenu', icon: 'filter' },
      { label: 'چاپ صورت‌حساب', act: 'printAccountFromMenu', icon: 'print' },
      { sep: true },
      { label: acc.disabled ? 'فعال کردن حساب' : 'غیرفعال کردن', act: 'toggleAccount', icon: 'toggle' },
      { sep: true },
      { label: 'حذف حساب', act: 'deleteAccount', icon: 'del', danger: true }
    ];
    
    showContextMenu(el, menu, function(act) {
      if (act === 'openAccount') showAccount(accId);
      else if (act === 'editAccount') editAccount(accId);
      else if (act === 'callAccount') {
        if (!acc.phone) return toast('شماره تماس ندارد', 'warn');
        window.open('tel:' + acc.phone, '_self');
      }
      else if (act === 'waAccount') {
        if (!acc.phone) return toast('شماره تماس ندارد', 'warn');
        var b = accountBalance(accId);
        var txt = '📋 خلاصه حساب\n' +
          'حساب: ' + acc.name + '\n' +
          'فروشگاه: ' + DB.settings.shop + '\n' +
          'مانده: ' + toFa(group(b)) + '\n' +
          (b > 0 ? 'وضعیت: قرضدار' : b < 0 ? 'وضعیت: طلبکار' : 'وضعیت: تسویه') + '\n' +
          'تاریخ: ' + faDateLong();
        var link = 'https://wa.me/' + encodeURIComponent(toEn(acc.phone).replace(/^0+/, '93')) + '?text=' + encodeURIComponent(txt);
        window.open(link, '_blank');
      }
      else if (act === 'copyPhoneAccount') {
        if (!acc.phone) return toast('شماره تماس ندارد', 'warn');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(acc.phone).then(function() {
            toast('شماره کپی شد: ' + toFa(acc.phone), 'ok');
          });
        } else {
          toast('مرورگر کپی را پشتیبانی نمی‌کند', 'warn');
        }
      }
      else if (act === 'shareAccount') {
        var b = accountBalance(accId);
        var txt = '📋 خلاصه حساب\n' +
          'حساب: ' + acc.name + '\n' +
          'نوع: ' + (ACCOUNT_TYPES[acc.type] ? ACCOUNT_TYPES[acc.type].label : 'سایر') + '\n' +
          'فروشگاه: ' + DB.settings.shop + '\n' +
          'مانده: ' + toFa(group(b)) + '\n' +
          (b > 0 ? 'وضعیت: قرضدار' : b < 0 ? 'وضعیت: طلبکار' : 'وضعیت: تسویه') + '\n' +
          (acc.phone ? 'شماره: ' + acc.phone + '\n' : '') +
          'تاریخ: ' + faDateLong();
        if (navigator.share) {
          navigator.share({ title: 'خلاصه حساب ' + acc.name, text: txt });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(txt).then(function() {
            toast('خلاصه کپی شد', 'ok');
          });
        } else {
          toast('مرورگر اشتراک‌گذاری را پشتیبانی نمی‌کند', 'warn');
        }
      }
      else if (act === 'togglePinAccount') {
        acc.pinned = !acc.pinned;
        save(); render();
        toast(acc.pinned ? 'حساب پین شد' : 'پین برداشته شد', 'ok');
      }
      else if (act === 'filterAccountFromMenu') {
        showAccountFilter(accId);
      }
      else if (act === 'printAccountFromMenu') {
        printAccount(accId);
      }
      else if (act === 'toggleAccount') {
        acc.disabled = !acc.disabled;
        save(); render();
        toast(acc.disabled ? 'حساب غیرفعال شد' : 'حساب فعال شد', 'ok');
      }
      else if (act === 'deleteAccount') {
        requirePin(function() {
          confirmBox('حذف حساب', 'آیا از حذف «' + acc.name + '» مطمئن هستید؟\nتمام سوابق این حساب حذف خواهد شد.', function() {
            DB.accounts = DB.accounts.filter(function(a) { return a.id !== accId; });
            DB.accountAdjustments = DB.accountAdjustments.filter(function(a) { return a.accountId !== accId; });
            save(); render();
            toast('حساب حذف شد', 'ok');
          });
        });
      }
    });
  },

  /* مصرف */
  newExpense: function () {
    sheet({ title: 'ثبت مصرف', body: fld('مبلغ', '<input class="input tnum" id="exAmount" inputmode="decimal" data-focus placeholder="۰">') + fld('شرح', '<input class="input" id="exNote" placeholder="مثلاً کرایه دکان">'), foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn danger" data-act="saveExpense">ثبت مصرف</button>' });
  },
  saveExpense: function () {
    var a = m2(num($('#exAmount').value)); if (a <= 0) return toast('مبلغ را وارد کنید', 'warn');
    var note = $('#exNote').value.trim();
    DB.expenses.push({ id: uid('exp'), amount: a, note: note, date: new Date().toISOString() });
    addTreasury('out', a, 'مصرف/خرج', 'نقد', new Date().toISOString(), note, 'expense');
    save(); closeSheet(); render(); toast('مصرف ثبت شد', 'ok');
  },

  /* بستن صندوق */
  closing: function () { closingSheet(); },
  printClosing: function () { doPrint(); },

  /* پشتیبان */
  backup: function () {
    var data = JSON.stringify(DB, null, 1), blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hamgam-' + dayKey() + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000); toast('فایل پشتیبان ساخته شد', 'ok');
  },
  restore: function () {
    requirePin(function () {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = function () {
        var f = inp.files && inp.files[0]; if (!f) return;
        var fr = new FileReader();
        fr.onload = function () { try { var d = JSON.parse(String(fr.result)); if (!d || !d.settings) throw new Error('bad'); localStorage.setItem(KEY, JSON.stringify(d)); load(); applyTheme(); render(); toast('اطلاعات بازیابی شد', 'ok'); } catch (e) { toast('فایل معتبر نیست', 'bad'); } };
        fr.readAsText(f);
      };
      inp.click();
    });
  },
  exportCSV: function () { exportSalesCSV(); },
  pinSetup: function () {
    var has = !!DB.settings.pin;
    sheet({
      title: has ? 'تغییر رمز' : 'تنظیم رمز',
      body: (has ? fld('رمز فعلی', '<input class="input tnum" id="pinOld" inputmode="numeric" maxlength="4" data-focus placeholder="••••">') : '') +
        fld('رمز جدید (۴ رقم)', '<input class="input tnum" id="pinNew" inputmode="numeric" maxlength="4" placeholder="••••">') +
        fld('تکرار رمز جدید', '<input class="input tnum" id="pinNew2" inputmode="numeric" maxlength="4" placeholder="••••">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="savePin">ذخیره</button>'
    });
  },
  savePin: function () {
    var has = !!DB.settings.pin;
    
    // اگر PIN قبلی تنظیم شده، باید تأیید شود
    if (has) {
      var oldPin = toEn($('#pinOld').value).replace(/\D/g, '');
      if (oldPin !== DB.settings.pin) {
        return toast('رمز فعلی اشتباه است', 'bad');
      }
    }
    
    var nw = toEn($('#pinNew').value).replace(/\D/g, ''), nw2 = toEn($('#pinNew2').value).replace(/\D/g, '');
    if (nw.length !== 4) return toast('رمز باید ۴ رقم باشد', 'warn');
    if (nw !== nw2) return toast('رمزهای جدید یکسان نیستند', 'warn');
    DB.settings.pin = nw; save(); closeSheet(); render(); toast('رمز ذخیره شد', 'ok');
  },
  pinSubmit: function () {
    var v = toEn($('#pinInput').value).replace(/\D/g, '');
    if (v !== DB.settings.pin) { toast('رمز اشتباه است', 'bad'); return; }
    var fn = PENDING_PIN; PENDING_PIN = null; closeSheet(); if (fn) fn();
  },
  restoreAuto: function () {
    var data = localStorage.getItem(KEY + '.auto');
    if (!data) return toast('نسخهٔ خودکار یافت نشد', 'warn');
    requirePin(function () {
      confirmBox('بازیابی نسخهٔ خودکار', 'داده‌های فعلی با آخرین نسخهٔ پشتیبان خودکار جایگزین شوند؟', function () {
        try { var d = JSON.parse(data); if (!d || !d.settings) throw new Error('bad'); localStorage.setItem(KEY, data); load(); applyTheme(); render(); toast('از نسخهٔ خودکار بازیابی شد', 'ok'); } catch (e) { toast('فایل معتبر نیست', 'bad'); }
      });
    });
  },
  warehouseHistory: function () { warehouseHistory(); },
  wipe: function () {
    requirePin(function () {
      confirmBox('پاک کردن همه‌چیز', 'تمام کالاها، حساب‌ها و فاکتورها حذف می‌شوند. این کار برگشت ندارد!', function () {
        localStorage.removeItem(KEY); DB = blankDB(); save(); render(); toast('همه‌چیز پاک شد', 'ok');
      }, 'بله، پاک کن');
    });
  },
  sample: function () { if (DB.products.length) return toast('اول داده‌های فعلی را پاک کنید', 'warn'); seed(); save(); render(); toast('داده نمونه ساخته شد', 'ok'); },
  filterAccount: function (el) { showAccountFilter(el.dataset.id, accountById(el.dataset.id).type); },
  printAccount: function (el) { printAccount(el.dataset.id); },
  applyAccountFilter: function (el) { applyAccountFilter(el.dataset.id); },
  clearAccountFilter: function (el) { clearAccountFilter(el.dataset.id); },
  openFilterFromDate: function () { openFilterFromDate(); },
  openFilterToDate: function () { openFilterToDate(); },
};

/* به‌روزرسانی زندهٔ تسویه */
function updateCheckout() {
  var box = $('#ckSummary'); if (!box) return;
  var sub = cartSubtotal(), disc = num($('#ckDiscount').value), total = m2(sub - disc);
  var paid = Math.min(num($('#ckPaid').value), total), due = m2(total - paid);
  box.innerHTML = '<div style="display:flex;justify-content:space-between;padding:2px 0"><span>قابل پرداخت</span><b class="tnum" style="color:var(--ink)">' + money(total) + '</b></div>' +
    '<div style="display:flex;justify-content:space-between;padding:2px 0"><span>باقی (بردگی)</span><b class="tnum" style="color:' + (due > 0 ? 'var(--danger)' : 'var(--success)') + '">' + money(due) + '</b></div>';
}

/* فرم کالا (با دسته‌بندی) */
function productForm(p) {
  var id = p ? p.id : '';
  var isNew = !p;
  var catList = DB.categories.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('');
  var body =
    fld('نام کالا', '<input class="input" id="pName" data-focus value="' + esc(p ? p.name : '') + '" placeholder="مثلاً روغن حبیب">') +
    '<div class="row2">' +
    fld('دسته‌بندی', '<input class="input" id="pCategory" list="catList" value="' + esc(p ? (p.category || '') : '') + '" placeholder="مثلاً روغن"><datalist id="catList">' + catList + '</datalist>') +
    fld('واحد', '<input class="input" id="pUnit" value="' + esc(p ? (p.unit || 'عدد') : 'عدد') + '">') +
    '</div>';
  if (isNew) {
    // کالای جدید: بدون قیمت (قیمت از ورود کالا تنظیم می‌شود)
    body +=
      '<div class="row2">' +
      fld('موجودی اولیه', '<input class="input tnum" id="pStock" inputmode="decimal" value="۰">') +
      fld('هشدار کمبود', '<input class="input tnum" id="pMin" inputmode="decimal" value="' + toFa(DB.settings.lowStock || 3) + '">') +
      '</div>' +
      fld('بارکد', '<input class="input" id="pBarcode" dir="ltr" placeholder="اختیاری">') +
      '<p class="hint-row" style="margin-top:4px">💡 قیمت خرید و فروش بعداً از طریق «ورود کالا» یا «ویرایش» تنظیم می‌شود.</p>';
  } else {
    // ویرایش: همه فیلدها
    body +=
      '<div class="row2">' +
      fld('قیمت خرید (' + esc(DB.settings.currency) + ')', '<input class="input tnum" id="pCost" inputmode="decimal" value="' + toFa(p.cost) + '">') +
      fld('قیمت فروش (' + esc(DB.settings.currency) + ')', '<input class="input tnum" id="pPrice" inputmode="decimal" value="' + toFa(p.price) + '">') +
      '</div>' +
      '<div class="row2">' +
      fld('موجودی', '<input class="input tnum" id="pStock" inputmode="decimal" value="' + toFa(p.stock) + '">') +
      fld('هشدار کمبود', '<input class="input tnum" id="pMin" inputmode="decimal" value="' + toFa(p.min || 0) + '">') +
      '</div>' +
      fld('بارکد', '<input class="input" id="pBarcode" dir="ltr" value="' + esc(p.barcode || '') + '">') +
      '<button class="btn ghost block sm" style="color:var(--danger);margin-top:8px" data-act="delProduct" data-id="' + id + '">حذف این کالا</button>';
  }
  sheet({
    title: isNew ? 'کالای جدید' : 'ویرایش کالا',
    body: body,
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="saveProduct" data-id="' + id + '">ذخیره</button>'
  });
}

/* فرم ورود کالا (خرید) */
function receiptForm(preselectSupplierId, preserveItems) {
  if (!preserveItems) {
    receiptItems = [];
  }
  var opts = '';
  DB.products.forEach(function (p) { opts += '<option value="' + p.id + '">' + esc(p.name) + (p.category ? ' (' + esc(p.category) + ')' : '') + ' — موجودی: ' + qtyTxt(p.stock) + '</option>'; });
  var sup = '<option value="">— بدون فراهم‌کننده —</option>';
  DB.suppliers.forEach(function (s) { 
    var b = supplierBalance(s.id); 
    var selected = preselectSupplierId === s.id ? ' selected' : '';
    sup += '<option value="' + s.id + '"' + selected + '>' + esc(s.name) + (b > 0 ? ' (بردگی: ' + group(b) + ')' : '') + '</option>'; 
  });
  
  // تاریخ: از _datePickerValues استفاده کن اگر وجود دارد
  var purDateIso = _datePickerValues['purDate'] || toLocalDateStr(new Date());
  var purDateDisplay = faDate(parseLocalDateStr(purDateIso));
  
  sheet({
    title: 'ورود کالا (خرید)',
    body:
      // بخش اطلاعات کلی رسید
      '<div style="font-size:13px;font-weight:700;margin-bottom:8px">اطلاعات رسید</div>' +
      '<div class="row2">' +
      fld('تاریخ', '<input class="input" type="text" readonly id="purDate" data-iso="' + purDateIso + '" value="' + esc(purDateDisplay) + '" data-act="openPurDatePicker" style="cursor:pointer;background:var(--surface)">') +
      fld('فراهم‌کننده (اختیاری)', '<select class="input" id="purSupplier" data-on="purCalc">' + sup + '</select>') +
      '</div>' +
      '<div id="purSuppBox" style="display:none">' +
      fld('پرداختی نقدی به فراهم‌کننده (' + esc(DB.settings.currency) + ')', '<input class="input tnum" id="purPaid" inputmode="decimal" data-on="purCalc" value="۰">') +
      '</div>' +
      '<div class="row2">' + fld('کرایه / باربری (' + esc(DB.settings.currency) + ')', '<input class="input tnum" id="purFreight" inputmode="decimal" data-on="purCalc" value="۰">') + fld('سایر هزینه‌ها (' + esc(DB.settings.currency) + ')', '<input class="input tnum" id="purOther" inputmode="decimal" data-on="purCalc" value="۰">') + '</div>' +
      fld('یادداشت', '<input class="input" id="purNote" placeholder="مثلاً فاکتور شماره ۱۲۳">') +
      // بخش افزودن قلم
      '<div style="font-size:13px;font-weight:700;margin:12px 0 8px">افزودن قلم</div>' +
      fld('کالا', '<select class="input" id="purProduct" data-on="purProductSel" data-focus><option value="">— انتخاب کالا —</option><option value="__new__">+ ساخت کالای جدید</option>' + opts + '</select>') +
      '<div id="purNewBox" style="display:none">' +
      fld('نام کالای جدید', '<input class="input" id="purNewName" placeholder="مثلاً روغن نو">') +
      '<div class="row2">' + fld('دسته', '<input class="input" id="purNewCat" placeholder="اختیاری">') + fld('واحد', '<input class="input" id="purNewUnit" value="عدد">') + '</div>' +
      '</div>' +
      '<div class="row2">' + fld('تعداد', '<input class="input tnum" id="purQty" inputmode="decimal" value="۱">') + fld('بهای خرید واحد (' + esc(DB.settings.currency) + ')', '<input class="input tnum" id="purCost" inputmode="decimal" value="۰">') + '</div>' +
      '<button class="btn soft block sm" data-act="addReceiptItem" style="margin-top:8px"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg> افزودن به لیست</button>' +
      // بخش لیست اقلام
      '<div id="receiptItemsList" style="margin-top:12px"></div>' +
      '<div id="purSummary" class="card" style="box-shadow:none;background:var(--surface2);margin:8px 0 4px;padding:10px 12px"></div>',
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn success" data-act="savePurchase">ثبت نهایی</button>',
    reopenCallback: function() { receiptForm(preselectSupplierId, true); },
    onOpen: function () { 
      updateReceiptList(); 
      updatePurchase();
      // اگر فراهم‌کننده پیش‌انتخاب شده، purSuppBox را نمایش بده
      if (preselectSupplierId) {
        var suppBox = $('#purSuppBox');
        if (suppBox) suppBox.style.display = 'block';
      }
    }
  });
}
function addReceiptItem() {
  var pid = $('#purProduct').value;
  if (pid === '__new__') {
    var nm = $('#purNewName').value.trim();
    if (!nm) return toast('نام کالای جدید را وارد کنید', 'warn');
    var ncat = $('#purNewCat').value.trim();
    var np = { id: uid('prd'), name: nm, category: ncat, unit: $('#purNewUnit').value.trim() || 'عدد', cost: m2(num($('#purCost').value)), price: m2(num($('#purCost').value)), stock: 0, min: 0, barcode: '', createdAt: new Date().toISOString() };
    DB.products.push(np); if (ncat && DB.categories.indexOf(ncat) < 0) DB.categories.push(ncat);
    pid = np.id;
    // به‌روزرسانی لیست کالاها
    var sel = $('#purProduct');
    if (sel) {
      var opt = document.createElement('option');
      opt.value = pid;
      opt.textContent = nm + (ncat ? ' (' + ncat + ')' : '') + ' — موجودی: ۰';
      sel.insertBefore(opt, sel.querySelector('option[value="__new__"]'));
    }
  }
  if (!pid) return toast('ابتدا کالا را انتخاب کنید', 'warn');
  var qty = num($('#purQty').value);
  if (qty <= 0) return toast('تعداد باید بیشتر از صفر باشد', 'warn');
  var cost = m2(num($('#purCost').value));
  if (cost < 0) return toast('قیمت خرید نمی‌تواند منفی باشد', 'warn');
  var p = productById(pid); if (!p) return;
  // بررسی تکراری نبودن
  var existing = receiptItems.find(function (it) { return it.pid === pid; });
  if (existing) {
    existing.qty = m2(num(existing.qty) + qty);
    if (cost > 0) existing.cost = cost;
  } else {
    receiptItems.push({ pid: pid, name: p.name, unit: p.unit, qty: qty, cost: cost });
  }
  // خالی کردن فیلدها
  $('#purProduct').value = '';
  $('#purQty').value = '۱';
  $('#purCost').value = '۰';
  if ($('#purNewName')) $('#purNewName').value = '';
  if ($('#purNewCat')) $('#purNewCat').value = '';
  $('#purNewBox').style.display = 'none';
  toast(p.name + ' اضافه شد', 'ok');
  updateReceiptList();
  updatePurchase();
}
function removeReceiptItem(i) {
  receiptItems.splice(i, 1);
  updateReceiptList();
  updatePurchase();
}
function updateReceiptList() {
  var box = $('#receiptItemsList'); if (!box) return;
  if (!receiptItems.length) { box.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12.5px;padding:12px 0">هنوز کالایی اضافه نشده</div>'; return; }
  var h = '<div style="font-size:12px;font-weight:700;margin-bottom:6px">اقلام (' + toFa(receiptItems.length) + ' قلم)</div><div class="list">';
  receiptItems.forEach(function (it, i) {
    h += '<div class="item" style="padding:8px 10px"><span class="ic" style="width:32px;height:32px;font-size:12px">' + esc((it.name || '؟').trim().charAt(0)) + '</span>' +
      '<div class="mid"><div class="t" style="font-size:13px">' + esc(it.name) + '</div><div class="s tnum">' + qtyTxt(it.qty) + ' ' + esc(it.unit || '') + ' × ' + money(it.cost) + ' = <b>' + money(m2(it.qty) * m2(it.cost)) + '</b></div></div>' +
      '<button class="icon-btn" data-act="rmReceiptItem" data-i="' + i + '" style="color:var(--danger);width:32px;height:32px"><svg viewBox="0 0 24 24" width="15" height="15"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button></div>';
  });
  h += '</div>';
  box.innerHTML = h;
}
function updatePurchase() {
  var box = $('#purSummary'); if (!box) return;
  var itemsTotal = 0;
  receiptItems.forEach(function (it) { itemsTotal += m2(m2(it.qty) * m2(it.cost)); });
  var freight = m2(num($('#purFreight') ? $('#purFreight').value : 0));
  var other = m2(num($('#purOther') ? $('#purOther').value : 0));
  var total = m2(itemsTotal + freight + other);
  var sid = $('#purSupplier') ? $('#purSupplier').value : '';
  var paid = Math.min(m2(num($('#purPaid') ? $('#purPaid').value : 0)), total);
  var due = m2(total - paid);
  // نمایش/مخفی کردن بخش پرداخت فراهم‌کننده
  var suppBox = $('#purSuppBox');
  if (suppBox) suppBox.style.display = sid ? 'block' : 'none';
  var h = '';
  if (receiptItems.length) h += '<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:13px"><span style="color:var(--muted)">جمع اقلام (' + toFa(receiptItems.length) + ' قلم)</span><b class="tnum">' + money(itemsTotal) + '</b></div>';
  if (freight > 0) h += '<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12px"><span style="color:var(--muted)">کرایه</span><span class="tnum">' + money(freight) + '</span></div>';
  if (other > 0) h += '<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12px"><span style="color:var(--muted)">سایر</span><span class="tnum">' + money(other) + '</span></div>';
  h += '<div style="display:flex;justify-content:space-between;padding:6px 0 2px;font-size:15px;font-weight:800;border-top:1px dashed var(--line);margin-top:4px"><span>جمع کل</span><span class="tnum">' + money(total) + '</span></div>';
  if (sid) {
    h += '<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12.5px"><span style="color:var(--muted)">پرداخت نقدی</span><b class="tnum">' + money(paid) + '</b></div>';
    if (due > 0) h += '<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:13px;font-weight:700;color:var(--danger)"><span>باقی بردگی به فراهم‌کننده</span><span class="tnum">' + money(due) + '</span></div>';
    else h += '<div style="font-size:11.5px;color:var(--success);padding:2px 0">✓ تسویه کامل</div>';
  }
  box.innerHTML = h;
}

/* فرم اصلاح دستی موجودی */
function adjustForm(pid) {
  sheet({
    title: 'اصلاح موجودی',
    body:
      fld('مقدار (مثبت = افزایش، منفی = کاهش)', '<input class="input tnum" id="adjQty" inputmode="decimal" data-focus placeholder="مثلاً ۲ یا −۱">') +
      fld('دلیل', '<select class="input" id="adjReason"><option value="شمارش مجدد">شمارش مجدد</option><option value="خرابی/ضایعات">خرابی/ضایعات</option><option value="گم‌شدن">گم‌شدن</option><option value="دیگر">دیگر</option></select>') +
      fld('یادداشت', '<input class="input" id="adjNote" placeholder="اختیاری">'),
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="saveAdjust" data-id="' + pid + '">ثبت اصلاح</button>'
  });
}

/* تاریخچه حرکت انبار */
function showMovements(pid) {
  var p = productById(pid); if (!p) return;
  var list = stockMovesFor(pid);
  var st = stockState(p);
  // خلاصه آماری
  var totalIn = 0, totalOut = 0;
  list.forEach(function (m) { if (num(m.qty) > 0) totalIn += num(m.qty); else totalOut += Math.abs(num(m.qty)); });
  // کارت موجودی فعلی
  var stLabel = st === 'ok' ? 'موجود' : st === 'low' ? 'رو به اتمام' : 'ناموجود';
  var stClass = st === 'ok' ? 'ok' : st === 'low' ? 'low' : 'bad';
  var h = '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between">' +
    '<div><div style="font-size:12px;color:var(--muted)">موجودی فعلی</div>' +
    '<div class="tnum" style="font-size:20px;font-weight:800;margin-top:2px">' + qtyTxt(p.stock) + ' <span style="font-size:12px;font-weight:600;color:var(--muted)">' + esc(p.unit || '') + '</span></div></div>' +
    '<div style="text-align:left"><span class="chip ' + stClass + '">' + stLabel + '</span>' +
    '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + toFa(list.length) + ' حرکت</div></div></div>' +
    '<div style="display:flex;gap:16px;margin-top:8px;padding-top:8px;border-top:1px dashed var(--line)">' +
    '<div style="font-size:11.5px"><span style="color:var(--muted)">مجموع ورود: </span><b class="tnum" style="color:var(--success)">+' + qtyTxt(totalIn) + '</b></div>' +
    '<div style="font-size:11.5px"><span style="color:var(--muted)">مجموع خروج: </span><b class="tnum" style="color:var(--danger)">−' + qtyTxt(totalOut) + '</b></div></div></div>';
  // لیست حرکت‌ها
  if (!list.length) {
    h += '<div class="empty"><div class="ic"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg></div><b>هنوز حرکتی ثبت نشده</b><p>با فروش، ورود کالا یا اصلاح موجودی، تاریخچه اینجا نمایش داده می‌شود.</p></div>';
  } else {
    h += '<div style="font-size:13px;font-weight:800;margin:4px 0 8px">جزئیات حرکت‌ها</div><div class="list">';
    list.forEach(function (m) {
      var t = {
        sale:     ['فروش',     'var(--danger)',  '-', 'فروش'],
        purchase: ['ورود کالا', 'var(--success)', '+', 'ورود'],
        return:   ['برگشت',    'var(--info)',    '+', 'برگشت'],
        adjust:   ['اصلاح دستی', 'var(--warning)', '', 'اصلاح']
      }[m.type] || ['نامشخص', 'var(--muted)', '', ''];
      var qtyAbs = Math.abs(num(m.qty));
      var sign = num(m.qty) >= 0 ? '' : '-';
      var qtyColor = num(m.qty) > 0 ? 'var(--success)' : num(m.qty) < 0 ? 'var(--danger)' : 'var(--ink)';
      h += '<div class="item"><span class="ic" style="background:' + t[1] + '1a;color:' + t[1] + '">' +
        '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="' +
        (m.type === 'sale' ? 'M3 3h2l.4 2M7 13h10l3-8H5.4M7 13 5.4 5M7 13l-.7 3.5h11.4M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z' :
         m.type === 'purchase' ? 'M3 7h18v10H3zM3 12h18M7 7v10' :
         m.type === 'return' ? 'M3 10h13a5 5 0 0 1 0 10H9M3 10l4-4M3 10l4 4' :
         'M12 5v14M5 12h14') +
        '"/></svg></span>' +
        '<div class="mid"><div class="t">' + t[0] + '</div>' +
        '<div class="s">' + faDate(m.date) + ' — ' + faTime(m.date) +
        (m.note ? ' · ' + esc(m.note) : '') + '</div></div>' +
        '<div class="end"><b class="tnum" style="color:' + qtyColor + '">' + sign + ' ' + qtyTxt(qtyAbs) + '</b></div></div>';
    });
    h += '</div>';
  }
  sheet({ title: 'تاریخچه حرکت — ' + (p ? p.name : ''), body: h, reopenCallback: function() { showMovements(pid); } });
}

/* تاریخچه کلی حرکت انبار (با فیلتر کالا) */
function warehouseHistory() {
  var opts = '<option value="">همهٔ کالاها</option>';
  DB.products.forEach(function (p) { opts += '<option value="' + p.id + '">' + esc(p.name) + '</option>'; });
  sheet({
    title: 'تاریخچه حرکت انبار',
    body: fld('فیلتر بر اساس کالا', '<select class="input" id="whProduct" data-on="whFilter">' + opts + '</select>') + '<div id="whList"></div>',
    reopenCallback: function() { warehouseHistory(); },
    onOpen: function () { renderWH(); }
  });
}
function renderWH() {
  var pid = $('#whProduct') ? $('#whProduct').value : '';
  var list = stockMovesFor(pid);
  var h = '';
  if (!list.length) h = '<div class="empty"><b>حرکتی ثبت نشده</b></div>';
  else {
    h = '<div class="list">';
    list.forEach(function (m) {
      var p = productById(m.productId);
      var t = { sale: ['فروش', 'var(--danger)', '-'], purchase: ['ورود', 'var(--success)', '+'], return: ['برگشت', 'var(--info)', '+'], adjust: ['اصلاح', 'var(--warning)', ''] }[m.type] || ['', 'var(--muted)', ''];
      var sign = t[2] === '+' ? '' : t[2] === '-' ? '-' : '';
      h += '<div class="item"><span class="ic" style="color:' + t[1] + '">' + sign + '</span>' +
        '<div class="mid"><div class="t">' + t[0] + (m.note ? ' — ' + esc(m.note) : '') + '</div><div class="s">' + esc(p ? p.name : 'حذف‌شده') + ' · ' + faDate(m.date) + ' ' + faTime(m.date) + '</div></div>' +
        '<div class="end"><b class="tnum">' + qtyTxt(m.qty) + '</b></div></div>';
    });
    h += '</div>';
  }
  var box = $('#whList'); if (box) box.innerHTML = h;
}

/* فرم مشتری/فراهم‌کننده */
function customerForm(c, kind) {
  var id = c ? c.id : '', isSupp = kind === 'supp';
  sheet({
    title: c ? (isSupp ? 'ویرایش فراهم‌کننده' : 'ویرایش مشتری') : (isSupp ? 'فراهم‌کننده جدید' : 'مشتری جدید'),
    body:
      fld(isSupp ? 'نام فراهم‌کننده' : 'نام مشتری', '<input class="input" id="cName" data-focus value="' + esc(c ? c.name : '') + '">') +
      fld('شمارهٔ تماس', '<input class="input" id="cPhone" dir="ltr" inputmode="tel" value="' + esc(c ? (c.phone || '') : '') + '">') +
      fld('آدرس', '<input class="input" id="cAddress" value="' + esc(c ? (c.address || '') : '') + '" placeholder="اختیاری">') +
      fld('مانده اولیه (افتتاحیه)', '<input class="input tnum" id="cOpening" inputmode="decimal" value="' + toFa(c ? (c.opening || 0) : 0) + '" placeholder="۰">') +
      fld('یادداشت', '<input class="input" id="cNote" value="' + esc(c ? (c.note || '') : '') + '">') +
      (c ? '<button class="btn ghost block sm" style="color:var(--danger)" data-act="' + (isSupp ? 'delSupplier' : 'delCustomer') + '" data-id="' + id + '">حذف</button>' : ''),
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="' + (isSupp ? 'saveSupplier' : 'saveCustomer') + '" data-id="' + id + '">ذخیره</button>'
  });
}

/* پروفایل مشتری */
/* ══════════════ فیلتر تراکنش‌های حساب ══════════════ */
var _accountFilters = {}; // ذخیره فیلتر هر حساب { accountId: { type, fromDate, toDate } }
var _accountFilterDraft = {}; // مقادیر موقت فیلتر (قبل از اعمال)

function showAccountFilter(accountId) {
  var acc = accountById(accountId);
  if (!acc) return;
  
  // اولویت: مقادیر draft (اگر از date picker برگشته باشیم)، بعد فیلتر ذخیره‌شده
  var draft = _accountFilterDraft[accountId] || _accountFilters[accountId] || { type: 'all', fromDate: '', toDate: '' };
  var currentFilter = {
    type: draft.type || 'all',
    fromDate: _datePickerValues['filterFromDate'] || draft.fromDate || '',
    toDate: _datePickerValues['filterToDate'] || draft.toDate || ''
  };
  
  var typeOptions = '<option value="all"' + (currentFilter.type === 'all' ? ' selected' : '') + '>همه</option>' +
    '<option value="income"' + (currentFilter.type === 'income' ? ' selected' : '') + '>فقط آوردگی</option>' +
    '<option value="expense"' + (currentFilter.type === 'expense' ? ' selected' : '') + '>فقط بردگی</option>';
  
  // پاک کردن _datePickerValues برای این فیلدها (چون الان خوانده شدند)
  delete _datePickerValues['filterFromDate'];
  delete _datePickerValues['filterToDate'];
  
  sheet({
    title: 'فلتر تراکنش‌ها — ' + acc.name,
    body:
      fld('نوع تراکنش', '<select class="input" id="filterType" data-on="filterTypeChange" data-acc="' + accountId + '">' + typeOptions + '</select>') +
      fld('از تاریخ', '<input class="input" type="text" readonly id="filterFromDate" data-iso="' + currentFilter.fromDate + '" value="' + (currentFilter.fromDate ? faDate(currentFilter.fromDate) : '') + '" data-act="openFilterFromDate" placeholder="انتخاب تاریخ" style="cursor:pointer;background:var(--surface)">') +
      fld('تا تاریخ', '<input class="input" type="text" readonly id="filterToDate" data-iso="' + currentFilter.toDate + '" value="' + (currentFilter.toDate ? faDate(currentFilter.toDate) : '') + '" data-act="openFilterToDate" placeholder="انتخاب تاریخ" style="cursor:pointer;background:var(--surface)">'),
    foot: '<button class="btn outline" data-act="clearAccountFilter" data-id="' + accountId + '">پاک کردن</button><button class="btn" data-act="applyAccountFilter" data-id="' + accountId + '">اعمال فلتر</button>',
    reopenCallback: function() { showAccountFilter(accountId); }
  });
}

function openFilterFromDate() { openDatePicker('filterFromDate'); }
function openFilterToDate() { openDatePicker('filterToDate'); }

function applyAccountFilter(accountId) {
  var type = $('#filterType').value;
  var fromDate = $('#filterFromDate').dataset.iso || '';
  var toDate = $('#filterToDate').dataset.iso || '';
  
  _accountFilters[accountId] = { type: type, fromDate: fromDate, toDate: toDate };
  delete _accountFilterDraft[accountId];
  closeSheet();
  
  // باز کردن دوباره پروفایل حساب
  var acc = accountById(accountId);
  if (acc) {
    showAccount(accountId);
  }
}

function clearAccountFilter(accountId) {
  delete _accountFilters[accountId];
  delete _accountFilterDraft[accountId];
  closeSheet();
  
  // باز کردن دوباره پروفایل حساب
  var acc = accountById(accountId);
  if (acc) {
    showAccount(accountId);
  }
}

function filterTransactions(txns, accountId) {
  var filter = _accountFilters[accountId];
  if (!filter) return txns;
  
  return txns.filter(function(tx) {
    // فیلتر نوع
    if (filter.type === 'income') {
      // آوردگی = income = delta < 0 (برای showAccount) یا tx.type === 'income' (برای showCustomer/showSupplier)
      if (tx.type) {
        if (tx.type !== 'income') return false;
      } else if (tx.delta !== undefined) {
        if (tx.delta >= 0) return false;
      }
    }
    if (filter.type === 'expense') {
      // بردگی = expense = delta > 0 (برای showAccount) یا tx.type === 'expense' (برای showCustomer/showSupplier)
      if (tx.type) {
        if (tx.type !== 'expense') return false;
      } else if (tx.delta !== undefined) {
        if (tx.delta <= 0) return false;
      }
    }
    
    // فیلتر تاریخ
    if (filter.fromDate) {
      var txDate = tx.date.split('T')[0];
      if (txDate < filter.fromDate) return false;
    }
    if (filter.toDate) {
      var txDate = tx.date.split('T')[0];
      if (txDate > filter.toDate) return false;
    }
    
    return true;
  });
}

function printAccount(id) {
  showPrintSettingsDialog(id);
}

// ══════════════════════════════════════════════════════════════
// سیستم تنظیمات چاپ حرفه‌ای
// ══════════════════════════════════════════════════════════════

function showPrintSettingsDialog(id) {
  var acc = accountById(id);
  if (!acc) return;
  
  window._printAccountId = id;
  
  // تاریخ فعلی
  var today = new Date();
  var todayJalali = toJalali(today);
  
  // ساخت Dialog
  var dialog = document.createElement('div');
  dialog.id = 'printSettingsDialog';
  dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  
  // Overlay
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px);';
  overlay.onclick = function() { closePrintSettingsDialog(); };
  
  // Dialog Content
  var content = document.createElement('div');
  content.style.cssText = 'position:relative;background:var(--surface);border-radius:24px;padding:24px 20px;width:88%;max-width:420px;max-height:85vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.2);direction:rtl;font-family:inherit;';
  
  // عنوان
  var title = document.createElement('div');
  title.style.cssText = 'font-size:18px;font-weight:700;color:var(--ink);margin-bottom:20px;text-align:right;';
  title.textContent = 'تنظیمات چاپ';
  
  // بخش تاریخ‌ها
  var dateSection = document.createElement('div');
  dateSection.style.cssText = 'margin-bottom:18px;';
  
  var dateRow = document.createElement('div');
  dateRow.style.cssText = 'display:flex;gap:10px;margin-bottom:6px;';
  
  // دکمه تاریخ شروع
  var startDateBtn = document.createElement('button');
  startDateBtn.id = 'startDateBtn';
  startDateBtn.style.cssText = 'flex:1;padding:14px 12px;border:1.5px solid var(--line);border-radius:12px;background:var(--surface);color:var(--primary);font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit;';
  startDateBtn.textContent = 'تاریخ شروع';
  startDateBtn.onclick = function() { openDatePickerForPrint('start'); };
  
  // دکمه تاریخ ختم
  var endDateBtn = document.createElement('button');
  endDateBtn.id = 'endDateBtn';
  endDateBtn.style.cssText = 'flex:1;padding:14px 12px;border:1.5px solid var(--line);border-radius:12px;background:var(--surface);color:var(--primary);font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit;';
  endDateBtn.textContent = 'تاریخ ختم';
  endDateBtn.onclick = function() { openDatePickerForPrint('end'); };
  
  dateRow.appendChild(startDateBtn);
  dateRow.appendChild(endDateBtn);
  dateSection.appendChild(dateRow);
  
  // فیلد نوع معامله
  var typeField = document.createElement('div');
  typeField.style.cssText = 'margin-bottom:18px;';
  
  var typeLabel = document.createElement('div');
  typeLabel.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:6px;font-weight:600;';
  typeLabel.textContent = 'نوع معامله';
  
  var typeSelect = document.createElement('div');
  typeSelect.style.cssText = 'position:relative;cursor:pointer;';
  typeSelect.onclick = function() { toggleDropdown('typeDropdown'); };
  
  var typeValue = document.createElement('div');
  typeValue.id = 'typeValue';
  typeValue.style.cssText = 'padding:12px 0;border-bottom:1.5px solid var(--line);display:flex;justify-content:space-between;align-items:center;';
  typeValue.innerHTML = '<span style="color:var(--ink);font-size:14px;font-weight:600;">همه</span><svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  
  var typeDropdown = document.createElement('div');
  typeDropdown.id = 'typeDropdown';
  typeDropdown.style.cssText = 'display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1.5px solid var(--line);border-radius:12px;margin-top:4px;max-height:180px;overflow-y:auto;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
  
  var typeOptions = ['همه', 'آوردگی', 'بردگی'];
  typeOptions.forEach(function(opt) {
    var item = document.createElement('div');
    item.style.cssText = 'padding:11px 14px;cursor:pointer;transition:background 0.15s;font-size:13px;color:var(--ink);';
    item.textContent = opt;
    item.onmouseover = function() { this.style.background = 'var(--surface2)'; };
    item.onmouseout = function() { this.style.background = 'var(--surface)'; };
    item.onclick = function(e) {
      e.stopPropagation();
      document.getElementById('typeValue').querySelector('span').textContent = opt;
      document.getElementById('typeDropdown').style.display = 'none';
      window._selectedType = opt;
    };
    typeDropdown.appendChild(item);
  });
  
  typeSelect.appendChild(typeValue);
  typeSelect.appendChild(typeDropdown);
  typeField.appendChild(typeLabel);
  typeField.appendChild(typeSelect);
  
  // فیلد واحد پول
  var currencyField = document.createElement('div');
  currencyField.style.cssText = 'margin-bottom:24px;';
  
  var currencyLabel = document.createElement('div');
  currencyLabel.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:6px;font-weight:600;';
  currencyLabel.textContent = 'واحد پول';
  
  var currencySelect = document.createElement('div');
  currencySelect.style.cssText = 'position:relative;cursor:pointer;';
  currencySelect.onclick = function() { toggleDropdown('currencyDropdown'); };
  
  var currencyValue = document.createElement('div');
  currencyValue.id = 'currencyValue';
  currencyValue.style.cssText = 'padding:12px 0;border-bottom:1.5px solid var(--line);display:flex;justify-content:space-between;align-items:center;';
  currencyValue.innerHTML = '<span style="color:var(--ink);font-size:14px;font-weight:600;">همه</span><svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  
  var currencyDropdown = document.createElement('div');
  currencyDropdown.id = 'currencyDropdown';
  currencyDropdown.style.cssText = 'display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1.5px solid var(--line);border-radius:12px;margin-top:4px;max-height:180px;overflow-y:auto;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
  
  var currencyOptions = ['همه', 'AFN', 'USD', 'IRR'];
  currencyOptions.forEach(function(opt) {
    var item = document.createElement('div');
    item.style.cssText = 'padding:11px 14px;cursor:pointer;transition:background 0.15s;font-size:13px;color:var(--ink);';
    item.textContent = opt;
    item.onmouseover = function() { this.style.background = 'var(--surface2)'; };
    item.onmouseout = function() { this.style.background = 'var(--surface)'; };
    item.onclick = function(e) {
      e.stopPropagation();
      document.getElementById('currencyValue').querySelector('span').textContent = opt;
      document.getElementById('currencyDropdown').style.display = 'none';
      window._selectedCurrency = opt;
    };
    currencyDropdown.appendChild(item);
  });
  
  currencySelect.appendChild(currencyValue);
  currencySelect.appendChild(currencyDropdown);
  currencyField.appendChild(currencyLabel);
  currencyField.appendChild(currencySelect);
  
  // دکمه‌ها
  var buttons = document.createElement('div');
  buttons.style.cssText = 'display:flex;gap:10px;margin-top:20px;';
  
  var cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = 'flex:1;padding:13px;border:none;border-radius:12px;background:transparent;color:var(--primary);font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:inherit;';
  cancelBtn.textContent = 'لغو';
  cancelBtn.onclick = function() { closePrintSettingsDialog(); };
  
  var printBtn = document.createElement('button');
  printBtn.style.cssText = 'flex:1;padding:13px;border:none;border-radius:12px;background:var(--primary);color:var(--primary-fg);font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:inherit;';
  printBtn.textContent = 'چاپ';
  printBtn.onclick = function() { executePrintWithSettings(); };
  printBtn.onmousedown = function() { this.style.opacity = '0.9'; };
  printBtn.onmouseup = function() { this.style.opacity = '1'; };
  
  buttons.appendChild(cancelBtn);
  buttons.appendChild(printBtn);
  
  // جمع‌آوری همه
  content.appendChild(title);
  content.appendChild(dateSection);
  content.appendChild(typeField);
  content.appendChild(currencyField);
  content.appendChild(buttons);
  
  dialog.appendChild(overlay);
  dialog.appendChild(content);
  
  document.body.appendChild(dialog);
  
  // مقداردهی اولیه
  window._selectedType = 'همه';
  window._selectedCurrency = 'همه';
  window._startDate = null;
  window._endDate = null;
}

function closePrintSettingsDialog() {
  var dialog = document.getElementById('printSettingsDialog');
  if (dialog) {
    dialog.remove();
  }
}

function toggleDropdown(id) {
  var dropdown = document.getElementById(id);
  if (dropdown) {
    var isVisible = dropdown.style.display === 'block';
    // بستن همه dropdown ها
    document.querySelectorAll('[id$="Dropdown"]').forEach(function(d) {
      d.style.display = 'none';
    });
    // باز کردن dropdown مورد نظر
    if (!isVisible) {
      dropdown.style.display = 'block';
    }
  }
}

function openDatePickerForPrint(type) {
  // موقتاً Dialog را مخفی کن
  var dialog = document.getElementById('printSettingsDialog');
  if (dialog) dialog.style.display = 'none';
  
  jalaliDatePicker(null, function(selectedDate) {
    // Dialog را دوباره نمایش بده
    if (dialog) dialog.style.display = 'flex';
    
    var btn = document.getElementById(type === 'start' ? 'startDateBtn' : 'endDateBtn');
    if (btn) {
      btn.textContent = faDate(selectedDate);
      btn.style.color = 'var(--ink)';
      btn.style.fontWeight = '600';
    }
    if (type === 'start') {
      window._startDate = toLocalDateStr(selectedDate);
    } else {
      window._endDate = toLocalDateStr(selectedDate);
    }
  });
}

function executePrintWithSettings() {
  var id = window._printAccountId;
  var startDate = window._startDate;
  var endDate = window._endDate;
  var type = window._selectedType || 'همه';
  var currency = window._selectedCurrency || 'همه';
  
  // اعتبارسنجی تاریخ‌ها
  if (startDate && endDate && startDate > endDate) {
    toast('تاریخ شروع باید قبل از تاریخ ختم باشد', 'warn');
    return;
  }
  
  // بستن Dialog
  closePrintSettingsDialog();
  
  // اجرای چاپ با فیلترها
  generatePrintLayout(id, startDate, endDate, type, currency);
}

function generatePrintLayout(id, fromDate, toDate, type, currency) {
  var acc = accountById(id);
  if (!acc) return;
  
  var entityId = acc.oldId || acc.id;
  var st = DB.settings;
  
  // مقدار پیش‌فرض برای فیلترها
  type = type || 'همه';
  currency = currency || 'همه';
  
  // ══════════════════════════════════════════════════════════════
  // مرحله ۱: جمع‌آوری معاملات (Transaction Data)
  // ══════════════════════════════════════════════════════════════
  var txns = [];
  
  // برای مشتری
  if (acc.type === 'customer') {
    DB.sales.forEach(function (s) {
      if (s.customerId === entityId) {
        txns.push({
          type: 'فروش',
          amount: m2(s.total),
          date: s.date,
          desc: 'فاکتور INV-' + s.no,
          invoiceNo: s.no,
          currency: s.currency || st.currency
        });
      }
    });
    DB.payments.forEach(function (p) {
      if (p.customerId === entityId) {
        txns.push({
          type: 'دریافت',
          amount: m2(p.amount),
          date: p.date,
          desc: p.note || 'پرداخت',
          invoiceNo: '',
          currency: p.currency || st.currency
        });
      }
    });
  }
  
  // برای فراهم‌کننده
  if (acc.type === 'supplier') {
    DB.purchases.forEach(function (p) {
      if (p.supplierId === entityId) {
        txns.push({
          type: 'خرید',
          amount: m2(p.total),
          date: p.date,
          desc: 'فاکتور خرید ' + toFa(p.no),
          invoiceNo: p.no,
          currency: p.currency || st.currency
        });
      }
    });
    DB.supplierPayments.forEach(function (p) {
      if (p.supplierId === entityId) {
        txns.push({
          type: 'پرداخت',
          amount: m2(p.amount),
          date: p.date,
          desc: p.note || 'پرداخت',
          invoiceNo: '',
          currency: p.currency || st.currency
        });
      }
    });
  }
  
  // accountAdjustments برای همه انواع
  DB.accountAdjustments.forEach(function(a) {
    if (a.accountId === id) {
      txns.push({
        type: 'سایر',
        amount: Math.abs(m2(a.delta)),
        date: a.date,
        desc: a.note || 'تنظیم حساب',
        invoiceNo: '',
        currency: a.currency || st.currency
      });
    }
  });
  
  // ══════════════════════════════════════════════════════════════
  // مرحله ۲: مرتب‌سازی و فیلتر و محاسبه بیلانس
  // ══════════════════════════════════════════════════════════════
  txns.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
  
  // محاسبه بیلانس قبل از بازه (اگر fromDate مشخص شده باشد)
  var balanceBefore = acc.opening || 0;
  if (fromDate) {
    txns.forEach(function(tx) {
      var txDate = toLocalDateStr(new Date(tx.date));
      if (txDate < fromDate) {
        if (tx.type === 'دریافت' || tx.type === 'پرداخت') {
          balanceBefore = m2(balanceBefore - tx.amount);
        } else {
          balanceBefore = m2(balanceBefore + tx.amount);
        }
      }
    });
  }
  
  // فیلتر معاملات بر اساس بازه زمانی
  if (fromDate || toDate) {
    txns = txns.filter(function(tx) {
      var txDate = toLocalDateStr(new Date(tx.date));
      if (fromDate && txDate < fromDate) return false;
      if (toDate && txDate > toDate) return false;
      return true;
    });
  }
  
  // فیلتر بر اساس نوع معامله
  if (type !== 'همه') {
    txns = txns.filter(function(tx) {
      // آوردگی = دریافت، پرداخت (income)
      if (type === 'آوردگی') {
        return tx.type === 'دریافت' || tx.type === 'پرداخت';
      }
      // بردگی = فروش، خرید، سایر (expense)
      if (type === 'بردگی') {
        return tx.type === 'فروش' || tx.type === 'خرید' || tx.type === 'سایر';
      }
      return true;
    });
  }
  
  // فیلتر بر اساس واحد پول
  if (currency !== 'همه') {
    txns = txns.filter(function(tx) {
      return tx.currency === currency;
    });
  }
  
  // محاسبه بیلانس تجمعی و جمع‌ها
  var runningBal = balanceBefore;
  var totalDebit = 0;
  var totalCredit = 0;
  
  txns.forEach(function (tx) {
    if (tx.type === 'دریافت' || tx.type === 'پرداخت') {
      runningBal = m2(runningBal - tx.amount);
      totalCredit += tx.amount;
    } else {
      runningBal = m2(runningBal + tx.amount);
      totalDebit += tx.amount;
    }
    tx.balanceAfter = runningBal;
  });
  
  var finalBalance = txns.length > 0 ? txns[txns.length - 1].balanceAfter : balanceBefore;
  
  // ══════════════════════════════════════════════════════════════
  // مرحله ۳: تاریخ و ساعت
  // ══════════════════════════════════════════════════════════════
  var now = new Date();
  var dateStr = faDate(now);
  var timeStr = faTime(now);
  
  // ══════════════════════════════════════════════════════════════
  // مرحله ۴: ساخت Print Layout (HTML مستقل)
  // ══════════════════════════════════════════════════════════════
  var printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    toast('لطفاً popup blocker را غیرفعال کنید', 'warn');
    return;
  }
  
  // HTML کامل با CSS مستقل
  var html = '<!DOCTYPE html>';
  html += '<html lang="fa" dir="rtl">';
  html += '<head>';
  html += '<meta charset="UTF-8">';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  html += '<title>صورت حساب ' + esc(acc.name) + '</title>';
  html += '<style>';
  
  // CSS Print
  html += '@page {';
  html += '  size: A4 portrait;';
  html += '  margin: 10mm 12mm;';
  html += '}';
  
  html += '* {';
  html += '  box-sizing: border-box;';
  html += '  margin: 0;';
  html += '  padding: 0;';
  html += '}';
  
  html += 'body {';
  html += '  font-family: "Vazirmatn", "Tahoma", "Arial", sans-serif;';
  html += '  font-size: 11px;';
  html += '  line-height: 1.5;';
  html += '  color: #000;';
  html += '  background: #fff;';
  html += '  direction: rtl;';
  html += '  padding: 0;';
  html += '  margin: 0;';
  html += '}';
  
  html += '.page {';
  html += '  width: 100%;';
  html += '  max-width: 210mm;';
  html += '  margin: 0 auto;';
  html += '  padding: 0;';
  html += '}';
  
  // سربرگ
  html += '.header {';
  html += '  text-align: center;';
  html += '  margin-bottom: 18px;';
  html += '  padding-bottom: 12px;';
  html += '  border-bottom: 2px solid #000;';
  html += '}';
  
  html += '.shop-name {';
  html += '  font-size: 22px;';
  html += '  font-weight: 900;';
  html += '  margin-bottom: 6px;';
  html += '  letter-spacing: 0.3px;';
  html += '}';
  
  html += '.shop-info {';
  html += '  font-size: 11px;';
  html += '  color: #333;';
  html += '  margin-bottom: 3px;';
  html += '  line-height: 1.6;';
  html += '}';
  
  // تاریخ و ساعت
  html += '.datetime {';
  html += '  text-align: left;';
  html += '  font-size: 10px;';
  html += '  color: #555;';
  html += '  margin-bottom: 15px;';
  html += '  font-weight: 600;';
  html += '}';
  
  // عنوان
  html += '.title {';
  html += '  text-align: center;';
  html += '  font-size: 18px;';
  html += '  font-weight: 900;';
  html += '  margin: 20px 0 18px 0;';
  html += '  padding: 10px;';
  html += '  background: #f5f5f5;';
  html += '  border: 1px solid #ccc;';
  html += '}';
  
  // جدول بیلانس
  html += '.balance-section {';
  html += '  margin: 15px 0 20px 0;';
  html += '}';
  
  html += '.balance-table {';
  html += '  width: 100%;';
  html += '  border-collapse: collapse;';
  html += '  font-size: 12px;';
  html += '}';
  
  html += '.balance-table th, .balance-table td {';
  html += '  border: 1px solid #999;';
  html += '  padding: 8px 12px;';
  html += '}';
  
  html += '.balance-table th {';
  html += '  background: #f0f0f0;';
  html += '  font-weight: 700;';
  html += '}';
  
  html += '.balance-amount {';
  html += '  font-weight: 900;';
  html += '  font-size: 14px;';
  html += '}';
  
  // عنوان معاملات
  html += '.transactions-title {';
  html += '  text-align: center;';
  html += '  font-size: 14px;';
  html += '  font-weight: 800;';
  html += '  margin: 20px 0 12px 0;';
  html += '  padding: 8px;';
  html += '  background: #f0f0f0;';
  html += '  border: 1px solid #ccc;';
  html += '}';
  
  // جدول معاملات
  html += '.transactions-table {';
  html += '  width: 100%;';
  html += '  border-collapse: collapse;';
  html += '  font-size: 10px;';
  html += '  page-break-inside: auto;';
  html += '}';
  
  html += '.transactions-table thead {';
  html += '  display: table-header-group;';
  html += '}';
  
  html += '.transactions-table th {';
  html += '  background: #e8e8e8;';
  html += '  padding: 7px 5px;';
  html += '  border: 1px solid #999;';
  html += '  font-weight: 700;';
  html += '  font-size: 10px;';
  html += '}';
  
  html += '.transactions-table td {';
  html += '  padding: 6px 5px;';
  html += '  border: 1px solid #ccc;';
  html += '  vertical-align: top;';
  html += '}';
  
  html += '.transactions-table tr {';
  html += '  page-break-inside: avoid;';
  html += '  break-inside: avoid;';
  html += '}';
  
  html += '.transactions-table tbody tr:nth-child(even) {';
  html += '  background: #fafafa;';
  html += '}';
  
  // ستون‌ها
  html += '.col-num { width: 3.5%; text-align: center; font-weight: 600; }';
  html += '.col-date { width: 11%; text-align: right; font-size: 9px; }';
  html += '.col-desc { width: 32%; text-align: right; line-height: 1.4; }';
  html += '.col-debt { width: 13%; text-align: left; color: #c0392b; font-weight: 700; }';
  html += '.col-income { width: 13%; text-align: left; color: #27ae60; font-weight: 700; }';
  html += '.col-balance { width: 27.5%; text-align: left; font-weight: 700; }';
  
  // فوتر
  html += '.footer {';
  html += '  margin-top: 25px;';
  html += '  padding-top: 12px;';
  html += '  border-top: 1px solid #999;';
  html += '  text-align: center;';
  html += '  font-size: 9px;';
  html += '  color: #666;';
  html += '}';
  
  html += '.page-number {';
  html += '  margin-top: 6px;';
  html += '  font-weight: 600;';
  html += '}';
  
  // Print styles
  html += '@media print {';
  html += '  body { margin: 0; padding: 0; }';
  html += '  .page { max-width: none; }';
  html += '  .no-print { display: none !important; }';
  html += '}';
  
  // فونت Vazirmatn از CDN
  html += '@import url("https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css");';
  
  html += '</style>';
  html += '</head>';
  html += '<body>';
  
  // دکمه چاپ (فقط در preview) - FAB در گوشه پایین-راست
  html += '<div class="no-print" style="position:fixed;bottom:30px;right:30px;z-index:1000">';
  html += '<button onclick="window.print()" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:var(--primary);color:var(--primary-fg);border:none;border-radius:50%;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:all 0.2s ease;" onmouseover="this.style.transform=\'scale(1.1)\';this.style.boxShadow=\'0 6px 16px rgba(0,0,0,0.3)\';" onmouseout="this.style.transform=\'scale(1)\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.2)\';">';
  html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>';
  html += '</button>';
  html += '</div>';
  
  html += '<div class="page">';
  
  // ══════════════════════════════════════════════════════════════
  // سربرگ
  // ══════════════════════════════════════════════════════════════
  html += '<div class="header">';
  html += '<div class="shop-name">' + esc(st.shop) + '</div>';
  if (st.address) html += '<div class="shop-info">' + esc(st.address) + '</div>';
  if (st.phone) html += '<div class="shop-info" style="font-weight:600">تلفن: ' + toFa(st.phone) + '</div>';
  html += '</div>';
  
  // ══════════════════════════════════════════════════════════════
  // تاریخ و ساعت
  // ══════════════════════════════════════════════════════════════
  html += '<div class="datetime">تاریخ چاپ: ' + dateStr + ' &bull; ' + timeStr + '</div>';
  
  // ══════════════════════════════════════════════════════════════
  // عنوان
  // ══════════════════════════════════════════════════════════════
  html += '<div class="title">صورت حساب ' + esc(acc.name) + '</div>';
  
  // نمایش اطلاعات فیلترها
  var hasFilter = fromDate || toDate || type !== 'همه' || currency !== 'همه';
  if (hasFilter) {
    html += '<div style="background:#f8f9fa;padding:12px;margin-bottom:15px;border:1px solid #e5e7eb;border-radius:6px;font-size:11px">';
    html += '<div style="font-weight:700;margin-bottom:8px;color:#374151">اطلاعات گزارش:</div>';
    
    if (fromDate && toDate) {
      html += '<div style="margin-bottom:4px"><span style="color:#6b7280">بازه زمانی:</span> <span style="font-weight:600">از ' + faDate(fromDate) + ' تا ' + faDate(toDate) + '</span></div>';
    } else if (fromDate) {
      html += '<div style="margin-bottom:4px"><span style="color:#6b7280">بازه زمانی:</span> <span style="font-weight:600">از ' + faDate(fromDate) + ' تا امروز</span></div>';
    } else if (toDate) {
      html += '<div style="margin-bottom:4px"><span style="color:#6b7280">بازه زمانی:</span> <span style="font-weight:600">از ابتدا تا ' + faDate(toDate) + '</span></div>';
    }
    
    if (type !== 'همه') {
      html += '<div style="margin-bottom:4px"><span style="color:#6b7280">نوع معامله:</span> <span style="font-weight:600">' + esc(type) + '</span></div>';
    }
    
    if (currency !== 'همه') {
      html += '<div style="margin-bottom:4px"><span style="color:#6b7280">واحد پول:</span> <span style="font-weight:600">' + esc(currency) + '</span></div>';
    }
    
    if (fromDate && balanceBefore !== 0) {
      html += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #e5e7eb"><span style="color:#6b7280">بیلانس قبل از بازه:</span> <span style="font-weight:700;color:' + balColorForAccount(balanceBefore, acc.type) + ';direction:ltr;display:inline-block">' + (balanceBefore < 0 ? '-' : '') + toFa(group(Math.abs(balanceBefore))) + ' ' + esc(st.currency) + '</span></div>';
    }
    
    html += '</div>';
  }
  
  // ══════════════════════════════════════════════════════════════
  // جدول بیلانس
  // ══════════════════════════════════════════════════════════════
  html += '<div class="balance-section">';
  html += '<table class="balance-table">';
  html += '<thead>';
  html += '<tr>';
  html += '<th style="text-align:right">واحد پول</th>';
  html += '<th style="text-align:left">بیلانس</th>';
  html += '</tr>';
  html += '</thead>';
  html += '<tbody>';
  html += '<tr>';
  html += '<td style="text-align:right">' + esc(st.currency) + '</td>';
  html += '<td style="text-align:left" class="balance-amount"><span style="direction:ltr;display:inline-block">' + (finalBalance < 0 ? '-' : '') + toFa(group(Math.abs(finalBalance))) + ' ' + esc(st.currency) + '</span></td>';
  html += '</tr>';
  html += '</tbody>';
  html += '</table>';
  html += '</div>';
  
  // ══════════════════════════════════════════════════════════════
  // عنوان معاملات
  // ══════════════════════════════════════════════════════════════
  html += '<div class="transactions-title">معاملات حساب</div>';
  
  // ══════════════════════════════════════════════════════════════
  // جدول معاملات
  // ══════════════════════════════════════════════════════════════
  if (txns.length > 0) {
    html += '<table class="transactions-table">';
    html += '<thead>';
    html += '<tr>';
    html += '<th class="col-num">#</th>';
    html += '<th class="col-date">تاریخ</th>';
    html += '<th class="col-desc">توضیحات</th>';
    html += '<th class="col-debt">بردگی</th>';
    html += '<th class="col-income">آوردگی</th>';
    html += '<th class="col-balance">بیلانس</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    
    txns.forEach(function (tx, i) {
      var isIn = tx.type === 'دریافت' || tx.type === 'پرداخت';
      html += '<tr>';
      html += '<td class="col-num">' + toFa(i + 1) + '</td>';
      html += '<td class="col-date">' + faDate(tx.date) + '</td>';
      html += '<td class="col-desc">' + esc(tx.desc) + '</td>';
      html += '<td class="col-debt">' + (!isIn ? toFa(group(tx.amount)) : '') + '</td>';
      html += '<td class="col-income">' + (isIn ? toFa(group(tx.amount)) : '') + '</td>';
      html += '<td class="col-balance"><span style="direction:ltr;display:inline-block">' + (tx.balanceAfter < 0 ? '-' : '') + toFa(group(Math.abs(tx.balanceAfter))) + ' ' + esc(st.currency) + '</span></td>';
      html += '</tr>';
    });
    
    html += '</tbody>';
    html += '</table>';
    
    // جمع‌کل‌ها
    html += '<div style="margin-top:20px;padding:15px;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px">';
    html += '<div style="font-weight:700;margin-bottom:12px;font-size:13px;color:#374151">خلاصه مالی:</div>';
    
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb">';
    html += '<span style="color:#6b7280">تعداد معاملات:</span>';
    html += '<span style="font-weight:600">' + toFa(txns.length) + ' معامله</span>';
    html += '</div>';
    
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb">';
    html += '<span style="color:#6b7280">مجموع بدهکار:</span>';
    html += '<span style="font-weight:600;color:#dc2626;direction:ltr;display:inline-block">' + toFa(group(totalDebit)) + ' ' + esc(st.currency) + '</span>';
    html += '</div>';
    
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb">';
    html += '<span style="color:#6b7280">مجموع بستانکار:</span>';
    html += '<span style="font-weight:600;color:#16a34a;direction:ltr;display:inline-block">' + toFa(group(totalCredit)) + ' ' + esc(st.currency) + '</span>';
    html += '</div>';
    
    html += '<div style="display:flex;justify-content:space-between;padding-top:8px">';
    html += '<span style="font-weight:700;font-size:13px;color:#374151">بیلانس نهایی:</span>';
    html += '<span style="font-weight:700;font-size:14px;color:' + balColorForAccount(finalBalance, acc.type) + ';direction:ltr;display:inline-block">' + (finalBalance < 0 ? '-' : '') + toFa(group(Math.abs(finalBalance))) + ' ' + esc(st.currency) + '</span>';
    html += '</div>';
    
    html += '</div>';
    
  } else {
    html += '<div style="text-align:center;padding:40px;color:#9ca3af;font-size:13px">';
    html += '<div style="margin-bottom:8px">📭</div>';
    html += '<div>هیچ معامله‌ای یافت نشد</div>';
    html += '</div>';
  }
  
  // ══════════════════════════════════════════════════════════════
  // فوتر
  // ══════════════════════════════════════════════════════════════
  html += '<div class="footer">';
  if (st.footer) html += '<div>' + esc(st.footer) + '</div>';
  html += '<div class="page-number">صفحه ۱ از ۱</div>';
  html += '</div>';
  
  html += '</div>'; // end .page
  html += '</body>';
  html += '</html>';
  
  // نوشتن HTML و باز کردن print dialog
  printWindow.document.write(html);
  printWindow.document.close();
  
  // صبر برای لود فونت و سپس باز کردن print dialog
  setTimeout(function() {
    printWindow.focus();
    printWindow.print();
  }, 500);
}

function showCustomer(id) {
  var c = customerById(id); if (!c) return;

  // جمع‌آوری تراکنش‌ها
  var txns = [];
  DB.sales.forEach(function (s) {
    if (s.customerId === id) {
      txns.push({
        id: 'sale_' + s.id,
        type: 'expense',
        amount: m2(s.total),
        date: s.date,
        desc: 'فاکتور ' + toFa(s.no),
        invoiceNo: s.no
      });
    }
  });
  DB.payments.forEach(function (p) {
    if (p.customerId === id) {
      txns.push({
        id: 'pay_' + p.id,
        type: 'income',
        amount: m2(p.amount),
        date: p.date,
        desc: p.note || 'آوردگی',
        invoiceNo: '',
        withTreasury: p.withTreasury !== false
      });
    }
  });
  DB.accountAdjustments.forEach(function (a) {
    if (a.kind === 'cust' && a.customerId === id) {
      txns.push({
        id: 'adj_' + a.id,
        type: a.delta >= 0 ? 'expense' : 'income',
        amount: Math.abs(m2(a.delta)),
        date: a.date,
        desc: 'تنظیم حساب' + (a.note ? ' — ' + a.note : ''),
        invoiceNo: '',
        withTreasury: a.withTreasury || false
      });
    }
  });

  // مرتب‌سازی: قدیمی به جدید برای محاسبه بیلانس
  txns.sort(function (a, b) { return a.date > b.date ? 1 : a.date < b.date ? -1 : 0; });

  // محاسبه بیلانس تجمعی
  var runningBal = 0;
  var totalIncome = 0, totalExpense = 0;

  txns.forEach(function (tx) {
    if (tx.type === 'income') {
      runningBal = m2(runningBal - tx.amount);
      totalIncome += tx.amount;
    } else {
      runningBal = m2(runningBal + tx.amount);
      totalExpense += tx.amount;
    }
    tx.balanceAfter = runningBal;
  });

  // نمایش: جدید به قدیم
  
  // اعمال فیلتر
  txns = filterTransactions(txns, id);
  txns.reverse();

  var body = '';

  // ═══ هدر مدرن ═══
  body += '<div class="acc-page-header">';
  body += '<button class="acc-back" data-act="closeSheet" aria-label="بازگشت">';
  body += '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>';
  body += '</button>';
  body += '<div class="acc-title">' + esc(c.name) + '</div>';
  body += '<div class="acc-head-actions">';
  body += '<button class="icon-btn" data-act="custMenu" data-id="' + id + '" aria-label="بیشتر">';
  body += '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/></svg>';
  body += '</button></div></div>';

  // ═══ اطلاعات تماس ═══
  if (c.phone || c.address) {
    body += '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
    if (c.phone) {
      body += '<a href="tel:' + esc(c.phone) + '" class="chip pri" style="font-size:12px;padding:6px 12px;text-decoration:none;display:flex;align-items:center;gap:5px">';
      body += '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>';
      body += toFa(c.phone) + '</a>';
    }
    if (c.address) {
      body += '<span class="chip" style="font-size:12px;padding:6px 12px;display:flex;align-items:center;gap:5px">';
      body += '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
      body += esc(c.address) + '</span>';
    }
    body += '</div>';
  }

  // ═══ مانده بزرگ ═══
  var cur = esc(DB.settings.currency);
  var balColorValue = balColor(runningBal);
  body += '<div class="card" style="text-align:center;margin-bottom:12px;padding:20px">';
  body += '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">مانده حساب</div>';
  body += '<div class="tnum" style="font-size:28px;font-weight:800;color:' + balColorValue + ';direction:ltr;display:inline-block">' + (runningBal < 0 ? '-' : '') + toFa(group(Math.abs(runningBal))) + ' ' + cur + '</div>';
  body += '</div>';

  // ═══ دکمه‌های اصلی ═══
  body += '<div class="btn-row" style="margin-bottom:16px">';
  body += '<button class="btn success" data-act="payForm" data-id="' + id + '">آوردگی</button>';
  body += '<button class="btn warning" data-act="debtForm" data-id="' + id + '">بردگی</button>';
  body += '</div>';

  // ═══ لیست تاریخچه ═══
  body += '<div style="font-size:14px;font-weight:800;margin:4px 4px 10px">تاریخچه</div>';
  if (!txns.length) {
    body += '<div class="acc-empty-tx">هنوز تراکنشی ثبت نشده</div>';
  } else {
    txns.slice(0, 50).forEach(function (tx) {
      var isIn = tx.type === 'income';
      var amtColor = isIn ? 'var(--success)' : 'var(--danger)';
      var balClass = tx.balanceAfter < 0 ? 'negative' : tx.balanceAfter > 0 ? 'positive' : '';
      var d = new Date(tx.date);
      var timeStr = faDate(tx.date) + ' · ' + faTime(tx.date);

      body += '<div class="acc-tx-card">';
      body += '<div class="acc-tx-top">';
      body += '<div class="acc-tx-info">';
      body += '<div class="acc-tx-amount" style="color:' + amtColor + ';direction:ltr;display:inline-block">' + (isIn ? '' : '-') + toFa(group(tx.amount)) + ' ' + cur + '</div>';
      body += '<div class="acc-tx-balance ' + balClass + '" style="direction:ltr;display:inline-block">بیلانس: ' + (tx.balanceAfter < 0 ? '-' : '') + toFa(group(Math.abs(tx.balanceAfter))) + ' ' + cur + '</div>';
      body += '</div>';
      body += '<button class="acc-tx-more" data-act="txMenu" data-txid="' + tx.id + '" data-cid="' + id + '" aria-label="منو">';
      body += '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>';
      body += '</button>';
      body += '</div>';
      body += '<div class="acc-tx-bottom">';
      body += '<div class="acc-tx-meta">';
      body += '<div class="acc-tx-date">' + timeStr + '</div>';
      body += '<div class="acc-tx-desc">' + esc(tx.desc);
      if (tx.withTreasury !== undefined) {
        body += ' <span style="font-size:10px;color:' + (tx.withTreasury ? 'var(--success)' : 'var(--muted)') + '">(' + (tx.withTreasury ? 'با خزانه' : 'بدون خزانه') + ')</span>';
      }
      body += '</div>';
      body += '</div>';
      body += '</div>';
    });
  }

  sheet({ title: '', body: body, reopenCallback: function() { showCustomer(id); } });
}

/* پروفایل فراهم‌کننده */
function showSupplier(id) {
  var c = supplierById(id); if (!c) return;

  // جمع‌آوری تراکنش‌ها
  var txns = [];
  DB.purchases.forEach(function (s) {
    if (s.supplierId === id) {
      txns.push({
        id: 'pur_' + s.id,
        type: 'expense',
        amount: m2(s.total),
        date: s.date,
        desc: 'فاکتور خرید ' + toFa(s.no),
        invoiceNo: s.no
      });
    }
  });
  DB.supplierPayments.forEach(function (p) {
    if (p.supplierId === id) {
      txns.push({
        id: 'spay_' + p.id,
        type: 'income',
        amount: m2(p.amount),
        date: p.date,
        desc: p.note || 'آوردگی',
        invoiceNo: '',
        withTreasury: p.withTreasury !== false
      });
    }
  });
  DB.accountAdjustments.forEach(function (a) {
    if (a.kind === 'supp' && a.supplierId === id) {
      txns.push({
        id: 'sadj_' + a.id,
        type: a.delta >= 0 ? 'expense' : 'income',
        amount: Math.abs(m2(a.delta)),
        date: a.date,
        desc: 'تنظیم حساب' + (a.note ? ' — ' + a.note : ''),
        invoiceNo: '',
        withTreasury: a.withTreasury || false
      });
    }
  });

  // مرتب‌سازی: قدیمی به جدید برای محاسبه بیلانس
  txns.sort(function (a, b) { return a.date > b.date ? 1 : a.date < b.date ? -1 : 0; });

  // محاسبه بیلانس تجمعی
  var runningBal = 0;
  var totalIncome = 0, totalExpense = 0;

  txns.forEach(function (tx) {
    if (tx.type === 'income') {
      runningBal = m2(runningBal - tx.amount);
      totalIncome += tx.amount;
    } else {
      runningBal = m2(runningBal + tx.amount);
      totalExpense += tx.amount;
    }
    tx.balanceAfter = runningBal;
  });

  // نمایش: جدید به قدیم
  
  // اعمال فیلتر
  txns = filterTransactions(txns, id);
  txns.reverse();

  var body = '';

  // ═══ هدر مدرن ═══
  body += '<div class="acc-page-header">';
  body += '<button class="acc-back" data-act="closeSheet" aria-label="بازگشت">';
  body += '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>';
  body += '</button>';
  body += '<div class="acc-title">' + esc(c.name) + '</div>';
  body += '<div class="acc-head-actions">';
  body += '<button class="icon-btn" data-act="suppMenu" data-id="' + id + '" aria-label="بیشتر">';
  body += '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/></svg>';
  body += '</button></div></div>';

  // ═══ اطلاعات تماس ═══
  if (c.phone || c.address) {
    body += '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
    if (c.phone) {
      body += '<a href="tel:' + esc(c.phone) + '" class="chip pri" style="font-size:12px;padding:6px 12px;text-decoration:none;display:flex;align-items:center;gap:5px">';
      body += '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>';
      body += toFa(c.phone) + '</a>';
    }
    if (c.address) {
      body += '<span class="chip" style="font-size:12px;padding:6px 12px;display:flex;align-items:center;gap:5px">';
      body += '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
      body += esc(c.address) + '</span>';
    }
    body += '</div>';
  }

  // ═══ مانده بزرگ ═══
  var cur = esc(DB.settings.currency);
  var balColorValue = balColorSupplier(runningBal);
  body += '<div class="card" style="text-align:center;margin-bottom:12px;padding:20px">';
  body += '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">مانده حساب</div>';
  body += '<div class="tnum" style="font-size:28px;font-weight:800;color:' + balColorValue + ';direction:ltr;display:inline-block">' + (runningBal < 0 ? '-' : '') + toFa(group(Math.abs(runningBal))) + ' ' + cur + '</div>';
  body += '</div>';

  // ═══ دکمه‌های اصلی ═══
  body += '<div class="btn-row" style="margin-bottom:16px">';
  body += '<button class="btn success" data-act="suppPayForm" data-id="' + id + '">آوردگی</button>';
  body += '<button class="btn warning" data-act="suppDebtForm" data-id="' + id + '">بردگی</button>';
  body += '</div>';

  // ═══ لیست تاریخچه ═══
  body += '<div style="font-size:14px;font-weight:800;margin:4px 4px 10px">تاریخچه</div>';
  if (!txns.length) {
    body += '<div class="acc-empty-tx">هنوز تراکنشی ثبت نشده</div>';
  } else {
    txns.slice(0, 50).forEach(function (tx) {
      var isIn = tx.type === 'income';
      var amtColor = isIn ? 'var(--success)' : 'var(--danger)';
      var balClass = tx.balanceAfter < 0 ? 'negative' : tx.balanceAfter > 0 ? 'positive' : '';
      var d = new Date(tx.date);
      var timeStr = faDate(tx.date) + ' · ' + faTime(tx.date);

      body += '<div class="acc-tx-card">';
      body += '<div class="acc-tx-top">';
      body += '<div class="acc-tx-info">';
      body += '<div class="acc-tx-amount" style="color:' + amtColor + ';direction:ltr;display:inline-block">' + (isIn ? '' : '-') + toFa(group(tx.amount)) + ' ' + cur + '</div>';
      body += '<div class="acc-tx-balance ' + balClass + '" style="direction:ltr;display:inline-block">بیلانس: ' + (tx.balanceAfter < 0 ? '-' : '') + toFa(group(Math.abs(tx.balanceAfter))) + ' ' + cur + '</div>';
      body += '</div>';
      body += '<button class="acc-tx-more" data-act="stxMenu" data-txid="' + tx.id + '" data-sid="' + id + '" aria-label="منو">';
      body += '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>';
      body += '</button>';
      body += '</div>';
      body += '<div class="acc-tx-bottom">';
      body += '<div class="acc-tx-meta">';
      body += '<div class="acc-tx-date">' + timeStr + '</div>';
      body += '<div class="acc-tx-desc">' + esc(tx.desc);
      if (tx.withTreasury !== undefined) {
        body += ' <span style="font-size:10px;color:' + (tx.withTreasury ? 'var(--success)' : 'var(--muted)') + '">(' + (tx.withTreasury ? 'با خزانه' : 'بدون خزانه') + ')</span>';
      }
      body += '</div>';
      body += '</div>';
      body += '</div>';
      body += '</div></div>';
    });
  }

  sheet({ title: '', body: body, reopenCallback: function() { showSupplier(id); } });
}

function payForm(id) { payFormTo(id, 'cust'); }
function payFormTo(id, kind) {
  var c = kind === 'cust' ? customerById(id) : supplierById(id); if (!c) return;
  var b = kind === 'cust' ? customerBalance(id) : supplierBalance(id);
  sheet({
    title: (kind === 'cust' ? 'آوردگی از ' : 'پرداخت به ') + c.name,
    body: '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">' + (kind === 'cust' ? 'بردگی فعلی' : 'بردگی ما') + '</span><b class="tnum">' + money(b) + '</b></div></div>' +
      fld('مبلغ', '<input class="input tnum" id="payAmount" inputmode="decimal" data-focus value="' + toFa(Math.max(0, b)) + '">') +
      fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

      fld('یادداشت', '<input class="input" id="payNote" placeholder="اختیاری">'),
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn success" data-act="' + (kind === 'cust' ? 'savePay' : 'saveSuppPay') + '" data-id="' + id + '">ثبت</button>'
  });
}
function suppPayForm(id) { payFormTo(id, 'supp'); }
function adjBalanceForm(id, kind) {
  var c = kind === 'cust' ? customerById(id) : supplierById(id); if (!c) return;
  PAY_WITH_TREASURY = false; // پیش‌فرض: بدون خزانه
  sheet({
    title: 'تنظیم دستی حساب — ' + c.name,
    body: fld('مبلغ (مثبت = افزایش بردگی، منفی = کاهش)', '<input class="input tnum" id="adjAmt" inputmode="decimal" data-focus placeholder="مثلاً ۵۰ یا −۵۰">') +
      fld('خزانه', '<div class="seg"><button data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button class="on" data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

      fld('یادداشت', '<input class="input" id="adjNote" placeholder="دلیل تعدیل">'),
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="saveAccountAdj" data-kind="' + kind + '" data-id="' + id + '">ثبت</button>'
  });
}

/* نمایش فاکتور */
function showSale(id) {
  var s = DB.sales.find(function (x) { return x.id === id; }); if (!s) return;
  var st = DB.settings;
  
  // ساخت فاکتور چاپی حرفه‌ای
  var body = '<div class="receipt">';
  
  // هدر فروشگاه
  body += '<div style="text-align:center;margin-bottom:12px">';
  body += '<div style="font-size:18px;font-weight:800;margin-bottom:4px">' + esc(st.shop) + '</div>';
  if (st.address) body += '<div style="font-size:11px;color:var(--muted)">' + esc(st.address) + '</div>';
  if (st.phone) body += '<div style="font-size:11px;color:var(--muted)">' + toFa(st.phone) + '</div>';
  body += '</div>';
  
  // اطلاعات فاکتور
  body += '<div style="border:1px solid var(--line);border-radius:8px;padding:10px;margin-bottom:12px;background:var(--surface2)">';
  body += '<div class="r" style="margin-bottom:4px"><span style="font-weight:700">شماره فاکتور:</span><span style="font-weight:800">' + toFa(s.no) + '</span></div>';
  body += '<div class="r" style="margin-bottom:4px"><span>تاریخ:</span><span>' + faDate(s.date) + ' — ' + faTime(s.date) + '</span></div>';
  body += '<div class="r"><span>مشتری:</span><span style="font-weight:700">' + esc(s.customerName || 'نقدی') + '</span></div>';
  body += '</div>';
  
  // جدول اقلام
  body += '<div style="margin-bottom:12px">';
  body += '<div style="font-size:12px;font-weight:800;margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid var(--line)">اقلام فاکتور</div>';
  
  // هدر جدول
  body += '<div class="receipt-table-header">';
  body += '<span style="flex:2">کالا</span>';
  body += '<span style="flex:1;text-align:center">تعداد</span>';
  body += '<span style="flex:1;text-align:left">قیمت</span>';
  body += '<span style="flex:1;text-align:left;font-weight:800">جمع</span>';
  body += '</div>';
  
  // ردیف‌های جدول
  s.items.forEach(function (it, i) {
    var lineTotal = m2(m2(it.price) * num(it.qty));
    body += '<div class="receipt-table-row' + (i % 2 === 0 ? ' even' : '') + '">';
    body += '<span style="flex:2;font-weight:600">' + esc(it.name) + '</span>';
    body += '<span style="flex:1;text-align:center">' + qtyTxt(it.qty) + '</span>';
    body += '<span style="flex:1;text-align:left">' + money(it.price) + '</span>';
    body += '<span style="flex:1;text-align:left;font-weight:700">' + money(lineTotal) + '</span>';
    body += '</div>';
  });
  body += '</div>';
  
  // خلاصه مالی
  body += '<div style="border-top:2px solid var(--line);padding-top:10px">';
  body += '<div class="r" style="margin-bottom:4px"><span>جمع اقلام:</span><span>' + money(s.subtotal) + '</span></div>';
  if (s.discount) body += '<div class="r" style="margin-bottom:4px;color:var(--success)"><span>تخفیف:</span><span>−' + money(s.discount) + '</span></div>';
  body += '<div class="r" style="font-size:16px;font-weight:800;margin:8px 0;padding:8px;background:var(--primary-soft);border-radius:8px"><span>قابل پرداخت:</span><span>' + money(s.total) + '</span></div>';
  body += '<div class="r" style="margin-bottom:4px"><span>آوردگی:</span><span style="color:var(--success);font-weight:700">' + money(s.paid) + '</span></div>';
  if (s.due > 0) {
    body += '<div class="r" style="font-weight:800;color:var(--danger)"><span>باقی (بردگی):</span><span>' + money(s.due) + '</span></div>';
  } else {
    body += '<div class="r" style="font-weight:700;color:var(--success)"><span>وضعیت:</span><span>✓ تسویه کامل</span></div>';
  }
  body += '</div>';
  
  // یادداشت
  if (s.note) {
    body += '<div style="margin-top:12px;padding:8px;background:var(--surface2);border-radius:6px;font-size:11.5px">';
    body += '<span style="font-weight:700">یادداشت:</span> ' + esc(s.note);
    body += '</div>';
  }
  
  // فوتر
  if (st.footer) {
    body += '<div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px dashed var(--line);font-size:11.5px;color:var(--muted)">';
    body += esc(st.footer);
    body += '</div>';
  }
  
  body += '</div>';
  
  // دکمه‌های عملیاتی
  body += '<div class="btn-row three no-print" style="margin-top:14px">' +
    '<button class="btn outline sm" data-act="printSale">چاپ</button>' +
    '<button class="btn outline sm" data-act="shareSale" data-id="' + s.id + '">ارسال</button>' +
    '<button class="btn outline sm" data-act="editSale" data-id="' + s.id + '">ویرایش</button></div>' +
    '<div class="btn-row no-print" style="margin-top:8px">' +
    '<button class="btn outline sm" data-act="returnSale" data-id="' + s.id + '">برگشت کالا</button>' +
    '<button class="btn ghost sm" style="color:var(--danger)" data-act="delSale" data-id="' + s.id + '">حذف فاکتور</button></div>';
  
  sheet({ title: 'فاکتور ' + toFa(s.no), body: body });
}
/* ───────────── منوی شناور مشتری ───────────── */
function closeContextMenu() {
  var m = document.querySelector('.ctx-menu'); if (m) m.remove();
  var b = document.querySelector('.ctx-backdrop'); if (b) b.remove();
}
function showCustomerMenu(id, anchorEl) {
  closeContextMenu();
  var c = customerById(id); if (!c) return;
  var b = customerBalance(id);
  var isPinned = !!c.pinned;
  var isDisabled = !!c.disabled;
  var hasPhone = !!c.phone;
  // ساخت بک‌دراپ
  var backdrop = document.createElement('div');
  backdrop.className = 'ctx-backdrop';
  backdrop.addEventListener('click', closeContextMenu);
  document.body.appendChild(backdrop);
  // ساخت منو
  var menu = document.createElement('div');
  menu.className = 'ctx-menu';
  // موقعیت: کنار دکمه سه‌نقطه
  var rect = anchorEl.getBoundingClientRect();
  var top = rect.bottom + 4;
  var left = rect.right - 240;
  if (left < 8) left = 8;
  if (top + 400 > window.innerHeight) top = rect.top - 400;
  if (top < 8) top = 8;
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
  // SVG آیکون‌ها
  var icons = {
    eye: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    money: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13 5.4 5M7 13l-.7 3.5h11.4M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>',
    filter: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/></svg>',
    print: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 17v5M9 3h6l-1 7 3 3H7l3-3Z"/></svg>',
    disable: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M1 1l22 22M17.9 17.9A10 10 0 0 1 3.4 6.1M9.9 4.2A10 10 0 0 1 22 12c0 2.2-.7 4.2-1.9 5.9"/></svg>',
    enable: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    del: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'
  };
  var items = '';
  // گروه ۱: کارهای روزمره
  items += '<button data-ctx="openCustomer" data-id="' + id + '">' + icons.eye + ' مشاهده صورت‌حساب</button>';
  items += '<button data-ctx="editCustomer" data-id="' + id + '">' + icons.edit + ' ویرایش پروفایل</button>';
  items += '<button data-ctx="payForm" data-id="' + id + '">' + icons.money + ' آوردگی</button>';
  items += '<button data-ctx="debtForm" data-id="' + id + '">' + icons.cart + ' بردگی</button>';
  items += '<div class="sep"></div>';
  // گروه ۲: ارتباط
  items += '<button data-ctx="callCustomer" data-id="' + id + '"' + (!hasPhone ? ' disabled style="opacity:.4;pointer-events:none"' : '') + '>' + icons.phone + ' تماس' + (!hasPhone ? ' (بدون شماره)' : '') + '</button>';
  items += '<button data-ctx="waCustomer" data-id="' + id + '"' + (!hasPhone ? ' disabled style="opacity:.4;pointer-events:none"' : '') + '>' + icons.wa + ' واتساپ' + (!hasPhone ? ' (بدون شماره)' : '') + '</button>';
  items += '<button data-ctx="copyPhone" data-id="' + id + '"' + (!hasPhone ? ' disabled style="opacity:.4;pointer-events:none"' : '') + '>' + icons.copy + ' کپی شماره تماس</button>';
  items += '<button data-ctx="shareAccount" data-id="' + id + '">' + icons.share + ' اشتراک‌گذاری خلاصه</button>';
  items += '<div class="sep"></div>';
  items += '<button data-ctx="togglePin" data-id="' + id + '">' + icons.pin + ' ' + (isPinned ? 'برداشتن پین' : 'پین کردن') + '</button>';
  items += '<div class="sep"></div>';
  // گروه ۳: فلتر و چاپ
  items += '<button data-ctx="filterAccount" data-id="' + id + '">' + icons.filter + ' فلتر تراکنش‌ها</button>';
  items += '<button data-ctx="printAccount" data-id="' + id + '">' + icons.print + ' چاپ صورت‌حساب</button>';
  items += '<div class="sep"></div>';
  // گروه ۴: مدیریت حساب
  items += '<button data-ctx="toggleDisable" data-id="' + id + '">' + (isDisabled ? icons.enable : icons.disable) + ' ' + (isDisabled ? 'فعال کردن حساب' : 'غیرفعال کردن') + '</button>';
  items += '<div class="sep"></div>';
  // گروه ۴: خطرناک
  items += '<button data-ctx="delCustomer" data-id="' + id + '" class="danger">' + icons.del + ' حذف حساب</button>';
  menu.innerHTML = items;
  document.body.appendChild(menu);
  // هندل کلیک روی گزینه‌ها
  menu.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-ctx]');
    if (!btn || btn.disabled) return;
    var act = btn.dataset.ctx;
    closeContextMenu();
    setTimeout(function () { CTX_ACTIONS[act](btn.dataset.id); }, 80);
  });
}

function showSupplierMenu(id, anchorEl) {
  closeContextMenu();
  var c = supplierById(id); if (!c) return;
  var b = supplierBalance(id);
  var hasPhone = !!c.phone;
  // ساخت بک‌دراپ
  var backdrop = document.createElement('div');
  backdrop.className = 'ctx-backdrop';
  backdrop.addEventListener('click', closeContextMenu);
  document.body.appendChild(backdrop);
  // ساخت منو
  var menu = document.createElement('div');
  menu.className = 'ctx-menu';
  // موقعیت: کنار دکمه سه‌نقطه
  var rect = anchorEl.getBoundingClientRect();
  var top = rect.bottom + 4;
  var left = rect.right - 240;
  if (left < 8) left = 8;
  if (top + 400 > window.innerHeight) top = rect.top - 400;
  if (top < 8) top = 8;
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
  // SVG آیکون‌ها
  var icons = {
    eye: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    money: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M3 7h18v10H3zM3 12h18M7 7v10"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>',
    filter: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/></svg>',
    print: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>',
    del: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'
  };
  var items = '';
  // گروه ۱: کارهای روزمره
  items += '<button data-sctx="openSupplier" data-id="' + id + '">' + icons.eye + ' مشاهده پروفایل</button>';
  items += '<button data-sctx="editSupplier" data-id="' + id + '">' + icons.edit + ' ویرایش</button>';
  items += '<button data-sctx="suppPayForm" data-id="' + id + '">' + icons.money + ' آوردگی</button>';
  items += '<button data-sctx="suppDebtForm" data-id="' + id + '">' + icons.cart + ' بردگی</button>';
  items += '<div class="sep"></div>';
  // گروه ۲: ارتباط
  items += '<button data-sctx="callSupplier" data-id="' + id + '"' + (!hasPhone ? ' disabled style="opacity:.4;pointer-events:none"' : '') + '>' + icons.phone + ' تماس' + (!hasPhone ? ' (بدون شماره)' : '') + '</button>';
  items += '<button data-sctx="waSupplier" data-id="' + id + '"' + (!hasPhone ? ' disabled style="opacity:.4;pointer-events:none"' : '') + '>' + icons.wa + ' واتساپ' + (!hasPhone ? ' (بدون شماره)' : '') + '</button>';
  items += '<button data-sctx="copyPhoneSupplier" data-id="' + id + '"' + (!hasPhone ? ' disabled style="opacity:.4;pointer-events:none"' : '') + '>' + icons.copy + ' کپی شماره</button>';
  items += '<div class="sep"></div>';
  // گروه ۳: فلتر و چاپ
  items += '<button data-sctx="filterAccount" data-id="' + id + '">' + icons.filter + ' فلتر تراکنش‌ها</button>';
  items += '<button data-sctx="printAccount" data-id="' + id + '">' + icons.print + ' چاپ صورت‌حساب</button>';
  items += '<div class="sep"></div>';
  // گروه ۴: خطرناک
  items += '<button data-sctx="delSupplier" data-id="' + id + '" class="danger">' + icons.del + ' حذف</button>';
  menu.innerHTML = items;
  document.body.appendChild(menu);
  // هندل کلیک روی گزینه‌ها
  menu.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-sctx]');
    if (!btn || btn.disabled) return;
    var act = btn.dataset.sctx;
    closeContextMenu();
    setTimeout(function () { SUPP_CTX_ACTIONS[act](btn.dataset.id); }, 80);
  });
}
/* ══════════════ توابع حساب‌ها ══════════════ */
var ACC_HANDLERS = {
  accPayForm: function (el) {
    var id = el.dataset.id;
    var acc = accountById(id);
    if (!acc) return;
    
    var b = accountBalance(id);
    sheet({
      title: 'آوردگی — ' + acc.name,
      body:
        fld('مبلغ', '<input class="input tnum" id="accPayAmount" inputmode="decimal" data-focus placeholder="۰">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('یادداشت', '<input class="input" id="accPayNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn success" data-act="saveAccPay" data-id="' + id + '">ثبت</button>'
    });
  },
  accDebtForm: function (el) {
    var id = el.dataset.id;
    var acc = accountById(id);
    if (!acc) return;
    
    var b = accountBalance(id);
    sheet({
      title: 'بردگی — ' + acc.name,
      body:
        fld('مبلغ', '<input class="input tnum" id="accDebtAmount" inputmode="decimal" data-focus placeholder="۰">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('یادداشت', '<input class="input" id="accDebtNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn warning" data-act="saveAccDebt" data-id="' + id + '">ثبت</button>'
    });
  }
};

function updateAccFields() {
  var type = $('#accType').value;
  var html = '';
  
  // فیلدهای مشترک
  html += fld('شماره تماس', '<input class="input" id="accPhone" dir="ltr" inputmode="tel" placeholder="اختیاری">');
  
  // فیلدهای خاص بر اساس نوع
  if (type === 'customer' || type === 'supplier' || type === 'employee' || type === 'partner') {
    html += fld('آدرس / محل', '<input class="input" id="accAddress" placeholder="اختیاری">');
  } else if (type === 'bank') {
    html += fld('نام بانک', '<input class="input" id="accAddress" placeholder="مثلاً: بانک ملی">');
  }
  
  // مانده اولیه
  html += '<div class="card" style="margin-top:12px;padding:12px;background:var(--surface2)">';
  html += '<div style="font-size:13px;font-weight:600;margin-bottom:8px">مانده اولیه (اختیاری)</div>';
  html += fld('مبلغ', '<input class="input tnum" id="accOpeningBal" inputmode="decimal" placeholder="۰">');
  html += '<div class="seg" style="margin-top:8px">';
  html += '<button class="on" data-act="accOpeningType" data-v="debit" id="accOpeningDebit">قرضدار</button>';
  html += '<button data-act="accOpeningType" data-v="credit" id="accOpeningCredit">طلبکار</button>';
  html += '</div>';
  html += '</div>';
  
  $('#accDynamicFields').innerHTML = html;
}

function showContextMenu(anchorEl, items, callback) {
  closeContextMenu();
  var backdrop = document.createElement('div');
  backdrop.className = 'ctx-backdrop';
  backdrop.addEventListener('click', closeContextMenu);
  document.body.appendChild(backdrop);
  
  var menu = document.createElement('div');
  menu.className = 'ctx-menu';
  
  // آیکون‌ها
  var icons = {
    eye: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    money: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13 5.4 5M7 13l-.7 3.5h11.4M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 17v5M9 3h6l-1 7 3 3H7l3-3Z"/></svg>',
    toggle: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M1 1l22 22M17.9 17.9A10 10 0 0 1 3.4 6.1M9.9 4.2A10 10 0 0 1 22 12c0 2.2-.7 4.2-1.9 5.9"/></svg>',
    filter: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/></svg>',
    print: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>',
    del: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'
  };
  
  var html = '';
  items.forEach(function(item) {
    if (item.sep) {
      html += '<div class="sep"></div>';
    } else {
      var disabled = item.disabled ? ' disabled style="opacity:.4;pointer-events:none"' : '';
      var danger = item.danger ? ' class="danger"' : '';
      var icon = icons[item.icon] || '';
      html += '<button data-ctx="' + item.act + '"' + danger + disabled + '>' + icon + ' ' + item.label + '</button>';
    }
  });
  menu.innerHTML = html;
  
  document.body.appendChild(menu);
  
  // موقعیت‌یابی هوشمند
  var rect = anchorEl.getBoundingClientRect();
  var menuHeight = menu.offsetHeight;
  var menuWidth = menu.offsetWidth;
  var windowHeight = window.innerHeight;
  var windowWidth = window.innerWidth;
  
  // محاسبه top
  var top = rect.bottom + 4;
  if (top + menuHeight > windowHeight - 20) {
    // منو از پایین بیرون می‌زند → بالای دکمه باز شود
    top = rect.top - menuHeight - 4;
    if (top < 20) {
      // اگر بالا هم جا نشد → وسط صفحه
      top = Math.max(20, (windowHeight - menuHeight) / 2);
    }
  }
  
  // محاسبه left
  var left = rect.right - menuWidth;
  if (left < 8) left = 8;
  if (left + menuWidth > windowWidth - 8) left = windowWidth - menuWidth - 8;
  
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
  
  menu.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-ctx]');
    if (!btn || btn.disabled) return;
    closeContextMenu();
    callback(btn.dataset.ctx);
  });
}

function showAccount(id) {
  var acc = accountById(id);
  if (!acc) return;
  
  var b = accountBalance(id);
  var typeInfo = ACCOUNT_TYPES[acc.type] || ACCOUNT_TYPES.other;
  var color = balColorForAccount(b, acc.type);
  
  // شناسه مشتری/فراهم‌کننده (oldId یا id)
  var entityId = acc.oldId || acc.id;
  
  // محاسبه مجموع بردگی و آوردگی
  var totalDebt = 0;  // مجموع بردگی
  var totalPayment = 0;  // مجموع آوردگی
  
  // برای مشتری
  if (acc.type === 'customer') {
    DB.sales.forEach(function(s) { 
      if (s.customerId === entityId) {
        totalDebt += m2(s.total);
      }
    });
    DB.payments.forEach(function(p) { 
      if (p.customerId === entityId) {
        totalPayment += m2(p.amount);
      }
    });
  }
  
  // برای فراهم‌کننده
  if (acc.type === 'supplier') {
    DB.purchases.forEach(function(p) { 
      if (p.supplierId === entityId) {
        totalDebt += m2(p.total);
      }
    });
    DB.supplierPayments.forEach(function(p) { 
      if (p.supplierId === entityId) {
        totalPayment += m2(p.amount);
      }
    });
  }
  
  // accountAdjustments برای همه انواع
  DB.accountAdjustments.forEach(function(a) { 
    if (a.accountId === id) {
      if (a.delta > 0) totalDebt += m2(a.delta);
      else totalPayment += Math.abs(m2(a.delta));
    }
  });
  
  // جمع‌آوری تراکنش‌ها
  var txns = [];
  
  // برای مشتری
  if (acc.type === 'customer') {
    DB.sales.forEach(function(s) { 
      if (s.customerId === entityId) {
        txns.push({
          id: 'sale_' + s.id,
          date: s.date,
          note: 'فاکتور ' + toFa(s.no),
          delta: m2(s.total),
          withTreasury: true
        });
      }
    });
    DB.payments.forEach(function(p) { 
      if (p.customerId === entityId) {
        txns.push({
          id: 'pay_' + p.id,
          date: p.date,
          note: p.note || 'آوردگی',
          delta: -m2(p.amount),
          withTreasury: p.withTreasury !== false
        });
      }
    });
  }
  
  // برای فراهم‌کننده
  if (acc.type === 'supplier') {
    DB.purchases.forEach(function(p) { 
      if (p.supplierId === entityId) {
        txns.push({
          id: 'pur_' + p.id,
          date: p.date,
          note: 'فاکتور خرید ' + toFa(p.no),
          delta: m2(p.total),
          withTreasury: true
        });
      }
    });
    DB.supplierPayments.forEach(function(p) { 
      if (p.supplierId === entityId) {
        txns.push({
          id: 'spay_' + p.id,
          date: p.date,
          note: p.note || 'پرداخت',
          delta: -m2(p.amount),
          withTreasury: p.withTreasury !== false
        });
      }
    });
  }
  
  // accountAdjustments برای همه انواع
  DB.accountAdjustments.forEach(function(a) { 
    if (a.accountId === id) {
      txns.push({
        id: 'adj_' + a.id,
        date: a.date,
        note: a.note || 'تنظیم حساب',
        delta: m2(a.delta),
        withTreasury: a.withTreasury !== false
      });
    }
  });
  
  // مرتب‌سازی: جدید به قدیم
  txns.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  
  // اعمال فیلتر
  txns = filterTransactions(txns, id);
  
  var body = '';
  
  // هدر
  body += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">';
  body += '<button class="icon-btn" data-act="closeSheet" aria-label="بازگشت"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6"/></svg></button>';
  body += '<div style="flex:1">';
  body += '<div style="font-size:16px;font-weight:700">' + esc(acc.name) + '</div>';
  body += '<div style="font-size:11px;color:var(--muted);margin-top:1px">' + typeInfo.label + '</div>';
  body += '</div>';
  body += '<button class="icon-btn" data-act="accountMenu" data-id="' + id + '" aria-label="منو"><svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg></button>';
  body += '</div>';
  
  // اطلاعات کوتاه
  if (acc.phone || acc.address) {
    body += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">';
    if (acc.phone) {
      body += '<a href="tel:' + esc(acc.phone) + '" style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:var(--surface2);border-radius:6px;text-decoration:none;color:var(--primary);font-size:12px">';
      body += '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
      body += toFa(acc.phone);
      body += '</a>';
    }
    if (acc.address) {
      body += '<div style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:var(--surface2);border-radius:6px;font-size:12px;color:var(--ink)">';
      body += '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
      body += esc(acc.address);
      body += '</div>';
    }
    body += '</div>';
  }
  
  // کارت خلاصه (بردگی، آوردگی، بیلانس)
  body += '<div class="card" style="margin-bottom:10px;padding:16px;background:var(--surface2)">';
  
  // بیلانس لحظه‌ای (بزرگ و برجسته)
  body += '<div style="text-align:center;margin-bottom:14px">';
  body += '<div style="font-size:11px;color:var(--muted);margin-bottom:6px">بیلانس لحظه‌ای</div>';
  body += '<div class="tnum" style="font-size:28px;font-weight:800;color:' + color + ';direction:ltr;letter-spacing:-0.5px">' + (b < 0 ? '-' : '') + toFa(group(Math.abs(b))) + '</div>';
  body += '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + esc(DB.settings.currency) + '</div>';
  body += '</div>';
  
  // بردگی و آوردگی (کوچک‌تر)
  body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--border)">';
  
  // مجموع بردگی
  body += '<div style="text-align:center;padding:12px 8px;border-left:1px solid var(--border)">';
  body += '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">مجموع بردگی</div>';
  body += '<div class="tnum" style="font-size:15px;font-weight:700;color:var(--danger);direction:ltr">' + toFa(group(totalDebt)) + '</div>';
  body += '</div>';
  
  // مجموع آوردگی
  body += '<div style="text-align:center;padding:12px 8px">';
  body += '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">مجموع آوردگی</div>';
  body += '<div class="tnum" style="font-size:15px;font-weight:700;color:var(--success);direction:ltr">' + toFa(group(totalPayment)) + '</div>';
  body += '</div>';
  
  body += '</div>';
  body += '</div>';
  
  // اقدام‌های اصلی
  body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">';
  body += '<button class="btn success" data-act="accPayForm" data-id="' + id + '" style="padding:11px 6px;font-size:13px;font-weight:600">آوردگی</button>';
  body += '<button class="btn warning" data-act="accDebtForm" data-id="' + id + '" style="padding:11px 6px;font-size:13px;font-weight:600">بردگی</button>';
  body += '</div>';
  
  // تاریخچه
  body += '<div style="font-size:14px;font-weight:700;margin-bottom:10px">تاریخچه</div>';
  if (!txns.length) {
    body += '<div style="text-align:center;padding:32px 20px;color:var(--muted);font-size:13px">تراکنشی ثبت نشده</div>';
  } else {
    var runningBal = acc.opening || 0;
    var txnsWithBal = txns.slice().reverse().map(function(tx) {
      runningBal = m2(runningBal + tx.delta);
      return { tx: tx, bal: runningBal };
    }).reverse();
    
    txnsWithBal.slice(0, 20).forEach(function(item) {
      var tx = item.tx;
      var bal = item.bal;
      var isIn = tx.delta < 0;
      var amtColor = isIn ? 'var(--success)' : 'var(--danger)';
      var balColorV = balColorForAccount(bal, acc.type);
      
      body += '<div class="acc-tx-card">';
      body += '<div class="acc-tx-top">';
      body += '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">';
      body += '<div style="width:34px;height:34px;border-radius:50%;background:' + (isIn ? '#1b7f5a1a' : '#c0392b1a') + ';color:' + (isIn ? 'var(--success)' : 'var(--danger)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">';
      body += '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="' + (isIn ? 'M12 5v14M5 12l7 7 7-7' : 'M12 19V5M5 12l7-7 7 7') + '"/></svg>';
      body += '</div>';
      body += '<div style="flex:1;min-width:0">';
      body += '<div style="font-size:13px;font-weight:600;margin-bottom:2px">' + esc(tx.note || 'تراکنش') + '</div>';
      body += '<div style="font-size:11px;color:var(--muted);direction:ltr;display:inline-block">' + faDate(tx.date) + ' · ' + faTime(tx.date);
      if (tx.withTreasury === false) body += ' · بدون خزانه';
      body += '</div>';
      body += '</div>';
      body += '</div>';
      if (tx.id) {
        body += '<button class="acc-tx-more" data-act="accTxMenu" data-txid="' + tx.id + '" data-accid="' + id + '" aria-label="منو">';
        body += '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>';
        body += '</button>';
      }
      body += '</div>';
      body += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0 0;border-top:1px solid var(--line);margin-top:8px">';
      body += '<div style="font-size:11px;color:var(--muted)">بیلانس: <span class="tnum" style="font-weight:600;color:' + balColorV + ';direction:ltr">' + (bal < 0 ? '-' : '') + toFa(group(Math.abs(bal))) + '</span></div>';
      body += '<div class="tnum" style="font-size:15px;font-weight:800;color:' + amtColor + ';direction:ltr;letter-spacing:-0.3px">' + (isIn ? '+' : '-') + toFa(group(Math.abs(tx.delta))) + '</div>';
      body += '</div>';
      body += '</div>';
    });
    
    if (txnsWithBal.length > 20) {
      body += '<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px">و ' + toFa(txnsWithBal.length - 20) + ' تراکنش دیگر...</div>';
    }
  }
  
  sheet({ title: '', body: body, reopenCallback: function() { showAccount(id); } });
}

function editAccount(id) {
  var acc = accountById(id);
  if (!acc) return;
  
  var openingBal = Math.abs(acc.opening || 0);
  var openingType = (acc.opening || 0) < 0 ? 'credit' : 'debit';
  
  sheet({
    title: 'ویرایش حساب',
    body:
      fld('نام حساب', '<input class="input" id="editAccName" value="' + esc(acc.name) + '">') +
      fld('نوع حساب', '<select class="input" id="editAccType">' +
        Object.keys(ACCOUNT_TYPES).map(function(k) { return '<option value="' + k + '"' + (acc.type === k ? ' selected' : '') + '>' + ACCOUNT_TYPES[k].label + '</option>'; }).join('') +
      '</select>') +
      fld('شماره تماس', '<input class="input" id="editAccPhone" dir="ltr" inputmode="tel" value="' + esc(acc.phone || '') + '">') +
      fld('آدرس', '<input class="input" id="editAccAddress" value="' + esc(acc.address || '') + '">') +
      '<div class="card" style="margin-top:12px;padding:12px;background:var(--surface2)">' +
      '<div style="font-size:13px;font-weight:600;margin-bottom:8px">مانده اولیه</div>' +
      fld('مبلغ', '<input class="input tnum" id="editAccOpeningBal" inputmode="decimal" value="' + toFa(openingBal) + '">') +
      '<div class="seg" style="margin-top:8px">' +
      '<button class="' + (openingType === 'debit' ? 'on' : '') + '" data-act="editAccOpeningType" data-v="debit" id="editAccOpeningDebit">قرضدار</button>' +
      '<button class="' + (openingType === 'credit' ? 'on' : '') + '" data-act="editAccOpeningType" data-v="credit" id="editAccOpeningCredit">طلبکار</button>' +
      '</div></div>' +
      fld('توضیحات', '<textarea class="input" id="editAccNote" rows="2">' + esc(acc.note || '') + '</textarea>'),
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="saveEditAccount" data-id="' + id + '">ذخیره</button>'
  });
}
function showTransactionDetails(txid, accId) {
  var parts = txid.split("_");
  var kind = parts[0], tid = parts.slice(1).join("_");
  var acc = accountById(accId);
  var cur = esc(DB.settings.currency);
  
  var body = '';
  var rows = [];
  
  if (kind === 'sale') {
    var sale = DB.sales.find(function(s) { return s.id === tid; });
    if (!sale) return;
    rows.push(['نوع', 'فاکتور فروش']);
    rows.push(['شماره فاکتور', toFa(sale.no)]);
    rows.push(['تاریخ', faDate(sale.date) + ' · ' + faTime(sale.date)]);
    rows.push(['مبلغ کل', toFa(group(sale.total)) + ' ' + cur]);
    rows.push(['پرداخت شده', toFa(group(sale.paid)) + ' ' + cur]);
    rows.push(['باقی‌مانده', toFa(group(sale.due)) + ' ' + cur]);
    if (sale.discount) rows.push(['تخفیف', toFa(group(sale.discount)) + ' ' + cur]);
    if (sale.note) rows.push(['یادداشت', sale.note]);
    
    if (sale.items && sale.items.length) {
      body += '<div style="margin-bottom:12px"><div style="font-size:13px;font-weight:700;margin-bottom:8px">اقلام فاکتور</div>';
      sale.items.forEach(function(it) {
        body += '<div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--surface2);border-radius:8px;margin-bottom:4px;font-size:12px">';
        body += '<span>' + esc(it.name) + ' × ' + toFa(it.qty) + ' ' + esc(it.unit || '') + '</span>';
        body += '<span class="tnum" style="direction:ltr">' + toFa(group(m2(it.qty * it.price))) + '</span>';
        body += '</div>';
      });
      body += '</div>';
    }
  } else if (kind === 'pur') {
    var pur = DB.purchases.find(function(p) { return p.id === tid; });
    if (!pur) return;
    rows.push(['نوع', 'فاکتور خرید']);
    rows.push(['شماره فاکتور', toFa(pur.no)]);
    rows.push(['تاریخ', faDate(pur.date) + ' · ' + faTime(pur.date)]);
    rows.push(['مبلغ کل', toFa(group(pur.total)) + ' ' + cur]);
    rows.push(['پرداخت شده', toFa(group(pur.paid)) + ' ' + cur]);
    rows.push(['باقی‌مانده', toFa(group(pur.due)) + ' ' + cur]);
    if (pur.freight) rows.push(['حمل و نقل', toFa(group(pur.freight)) + ' ' + cur]);
    if (pur.note) rows.push(['یادداشت', pur.note]);
    
    if (pur.items && pur.items.length) {
      body += '<div style="margin-bottom:12px"><div style="font-size:13px;font-weight:700;margin-bottom:8px">اقلام فاکتور</div>';
      pur.items.forEach(function(it) {
        body += '<div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--surface2);border-radius:8px;margin-bottom:4px;font-size:12px">';
        body += '<span>' + esc(it.name) + ' × ' + toFa(it.qty) + ' ' + esc(it.unit || '') + '</span>';
        body += '<span class="tnum" style="direction:ltr">' + toFa(group(m2(it.qty * it.cost))) + '</span>';
        body += '</div>';
      });
      body += '</div>';
    }
  } else if (kind === 'pay') {
    var pay = DB.payments.find(function(p) { return p.id === tid; });
    if (!pay) return;
    rows.push(['نوع', 'آوردگی (پرداخت مشتری)']);
    rows.push(['مبلغ', toFa(group(pay.amount)) + ' ' + cur]);
    rows.push(['تاریخ', faDate(pay.date) + ' · ' + faTime(pay.date)]);
    if (pay.note) rows.push(['یادداشت', pay.note]);
    rows.push(['خزانه', pay.withTreasury !== false ? 'با خزانه' : 'بدون خزانه']);
  } else if (kind === 'spay') {
    var spay = DB.supplierPayments.find(function(p) { return p.id === tid; });
    if (!spay) return;
    rows.push(['نوع', 'پرداخت به فراهم‌کننده']);
    rows.push(['مبلغ', toFa(group(spay.amount)) + ' ' + cur]);
    rows.push(['تاریخ', faDate(spay.date) + ' · ' + faTime(spay.date)]);
    if (spay.note) rows.push(['یادداشت', spay.note]);
  } else if (kind === 'adj') {
    var adj = DB.accountAdjustments.find(function(a) { return a.id === tid; });
    if (!adj) return;
    var isDebt = adj.delta > 0;
    rows.push(['نوع', isDebt ? 'بردگی (افزایش بدهی)' : 'آوردگی (کاهش بدهی)']);
    rows.push(['مبلغ', toFa(group(Math.abs(adj.delta))) + ' ' + cur]);
    rows.push(['تاریخ', faDate(adj.date) + ' · ' + faTime(adj.date)]);
    if (adj.note) rows.push(['یادداشت', adj.note]);
    rows.push(['خزانه', adj.withTreasury !== false ? 'با خزانه' : 'بدون خزانه']);
  }
  
  // ساخت جدول جزئیات
  var detailHtml = '<div class="card" style="padding:0;overflow:hidden;margin-bottom:12px">';
  rows.forEach(function(r, i) {
    detailHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;' + (i < rows.length - 1 ? 'border-bottom:1px solid var(--line)' : '') + '">';
    detailHtml += '<span style="font-size:12px;color:var(--muted)">' + r[0] + '</span>';
    // اگر شامل currency است، direction:ltr اضافه کن
    if (String(r[1]).includes(cur)) {
      detailHtml += '<span style="font-size:13px;font-weight:600;text-align:left;max-width:60%;direction:ltr;display:inline-block">' + esc(String(r[1])) + '</span>';
    } else {
      detailHtml += '<span style="font-size:13px;font-weight:600;text-align:left;max-width:60%">' + esc(String(r[1])) + '</span>';
    }
    detailHtml += '</div>';
  });
  detailHtml += '</div>';
  
  sheet({
    title: 'جزئیات تراکنش',
    body: detailHtml + body,
    foot: '<button class="btn outline" data-act="closeSheet">بستن</button>'
  });
}

function editTransaction(txid, accId) {
  var parts = txid.split("_");
  var kind = parts[0], tid = parts.slice(1).join("_");
  
  var tx = null;
  if (kind === "pay") {
    tx = DB.payments.find(function(p) { return p.id === tid; });
  } else if (kind === "spay") {
    tx = DB.supplierPayments.find(function(p) { return p.id === tid; });
  } else if (kind === "adj") {
    tx = DB.accountAdjustments.find(function(a) { return a.id === tid; });
  } else {
    toast("این تراکنش قابل ویرایش نیست", "warn");
    return;
  }
  
  if (!tx) return;
  
  var isIn = kind === "pay" || kind === "spay" || (kind === "adj" && tx.delta < 0);
  var amount = (kind === "pay" || kind === "spay") ? tx.amount : Math.abs(tx.delta);
  var note = tx.note || "";
  var date = tx.date ? tx.date.split("T")[0] : todayInput();
  
  sheet({
    title: "ویرایش تراکنش",
    body:
      fld("نوع", '<div class="seg"><button class="' + (isIn ? 'on' : '') + '" data-act="editTxType" data-v="income" id="editTxTypeIncome">آوردگی</button><button class="' + (!isIn ? 'on' : '') + '" data-act="editTxType" data-v="expense" id="editTxTypeExpense">بردگی</button></div>') +
      fld("مبلغ", '<input class="input tnum" id="editTxAmount" inputmode="decimal" value="' + toFa(amount) + '">') +
      fld("تاریخ", '<input class="input" type="text" readonly id="editTxDate" data-iso="' + date + '" value="' + esc(faDate(date)) + '" data-act="openEditTxDatePicker" style="cursor:pointer;background:var(--surface)">') +
      fld("یادداشت", '<input class="input" id="editTxNote" value="' + esc(note) + '">'),
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn" data-act="saveEditTransaction" data-txid="' + txid + '" data-accid="' + accId + '">ذخیره</button>'
  });
}

/* openEditTxDatePicker — در بخش ابزارها ادغام شد */

var SUPP_CTX_ACTIONS = {
  openSupplier: function (id) { showSupplier(id); },
  editSupplier: function (id) { customerForm(supplierById(id), 'supp'); },
  suppPayForm: function (id) { suppPayForm(id); },
  suppDebtForm: function (id) {
    var c = supplierById(id); if (!c) return;
    var b = supplierBalance(id);
    sheet({
      title: 'بردگی — ' + c.name,
      body: '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">مانده فعلی</span><b class="tnum">' + money(b) + '</b></div></div>' +
        fld('مبلغ', '<input class="input tnum" id="suppDebtAmount" inputmode="decimal" data-focus value="' + toFa(Math.max(0, b)) + '">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('یادداشت', '<input class="input" id="suppDebtNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn warning" data-act="saveSuppDebt" data-id="' + id + '">ثبت</button>'
    });
  },
  callSupplier: function (id) {
    var c = supplierById(id); if (!c) return;
    if (!c.phone) return toast('شماره تماس ندارد', 'warn');
    window.open('tel:' + c.phone, '_self');
  },
  waSupplier: function (id) {
    var c = supplierById(id); if (!c) return;
    if (!c.phone) return toast('شماره تماس ندارد', 'warn');
    var b = supplierBalance(id);
    var txt = '📋 خلاصه حساب\n' +
      'فراهم‌کننده: ' + c.name + '\n' +
      'فروشگاه: ' + DB.settings.shop + '\n' +
      'مانده: ' + toFa(group(b)) + '\n' +
      (b > 0 ? 'وضعیت: ما قرضداریم' : b < 0 ? 'وضعیت: طلبکار' : 'وضعیت: تسویه') + '\n' +
      'تاریخ: ' + faDateLong();
    var link = 'https://wa.me/' + encodeURIComponent(toEn(c.phone).replace(/^0+/, '93')) + '?text=' + encodeURIComponent(txt);
    window.open(link, '_blank');
  },
  copyPhoneSupplier: function (id) {
    var c = supplierById(id); if (!c) return;
    if (!c.phone) return toast('شماره تماس ندارد', 'warn');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(c.phone).then(function () { toast('شماره کپی شد: ' + toFa(c.phone), 'ok'); });
    } else { toast('مرورگر کپی را پشتیبانی نمی‌کند', 'warn'); }
  },
  filterAccount: function (id) { showAccountFilter(id, 'supplier'); },
  printAccount: function (id) { printAccount(id); },
  delSupplier: function (id) {
    requirePin(function () {
      confirmBox('حذف فراهم‌کننده', 'فراهم‌کننده و سابقهٔ پرداخت‌ها حذف می‌شود. ادامه؟', function () {
        DB.suppliers = DB.suppliers.filter(function (x) { return x.id !== id; });
        DB.supplierPayments = DB.supplierPayments.filter(function (x) { return x.supplierId !== id; });
        DB.accountAdjustments = DB.accountAdjustments.filter(function (x) { return !(x.kind === 'supp' && x.supplierId === id); });
        save(); render(); toast('فراهم‌کننده حذف شد', 'ok');
      });
    });
  }
};

var CTX_ACTIONS = {
  openCustomer: function (id) { showCustomer(id); },
  editCustomer: function (id) { customerForm(customerById(id), 'cust'); },
  payForm: function (id) { payForm(id); },
  borrowGoods: function (id) { PRESELECT_CUSTOMER = id; go('sale'); },
  debtForm: function (id) {
    var c = customerById(id); if (!c) return;
    var b = customerBalance(id);
    sheet({
      title: 'بردگی — ' + c.name,
      body: '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">مانده فعلی</span><b class="tnum">' + money(b) + '</b></div></div>' +
        fld('مبلغ', '<input class="input tnum" id="debtAmount" inputmode="decimal" data-focus value="' + toFa(Math.max(0, b)) + '">') +
        fld('خزانه', '<div class="seg"><button class="on" data-act="payTreasury" data-v="yes" id="payTrYes">با خزانه</button><button data-act="payTreasury" data-v="no" id="payTrNo">بدون خزانه</button></div>') +

        fld('یادداشت', '<input class="input" id="debtNote" placeholder="اختیاری">'),
      foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn warning" data-act="saveDebt" data-id="' + id + '">ثبت</button>'
    });
  },
  callCustomer: function (id) {
    var c = customerById(id); if (!c) return;
    if (!c.phone) return toast('شماره تماس ندارد', 'warn');
    window.open('tel:' + c.phone, '_self');
  },
  waCustomer: function (id) {
    var c = customerById(id); if (!c) return;
    if (!c.phone) return toast('شماره تماس ندارد', 'warn');
    var b = customerBalance(id);
    var link = buildWhatsappLink(c, b);
    if (link) window.open(link, '_blank');
  },
  copyPhone: function (id) {
    var c = customerById(id); if (!c) return;
    if (!c.phone) return toast('شماره تماس ندارد', 'warn');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(c.phone).then(function () { toast('شماره کپی شد: ' + toFa(c.phone), 'ok'); });
    } else { toast('مرورگر کپی را پشتیبانی نمی‌کند', 'warn'); }
  },
  shareAccount: function (id) {
    var c = customerById(id); if (!c) return;
    var b = customerBalance(id);
    var txt = '📋 خلاصه حساب\n' +
      'مشتری: ' + c.name + '\n' +
      'فروشگاه: ' + DB.settings.shop + '\n' +
      'مانده: ' + toFa(group(b)) + '\n' +
      (b > 0 ? 'وضعیت: بردگی' : b < 0 ? 'وضعیت: آوردگی' : 'وضعیت: تسویه') + '\n' +
      (c.phone ? 'شماره: ' + c.phone + '\n' : '') +
      'تاریخ: ' + faDateLong();
    if (navigator.share) navigator.share({ title: 'خلاصه حساب ' + c.name, text: txt }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('خلاصه کپی شد', 'ok'); });
    else toast('مرورگر اشتراک‌گذاری ندارد', 'warn');
  },
  togglePin: function (id) {
    var c = customerById(id); if (!c) return;
    c.pinned = !c.pinned;
    save(); render();
    toast(c.pinned ? 'حساب پین شد' : 'پین برداشته شد', 'ok');
  },
  toggleDisable: function (id) {
    var c = customerById(id); if (!c) return;
    c.disabled = !c.disabled;
    save(); render();
    toast(c.disabled ? 'حساب غیرفعال شد' : 'حساب فعال شد', 'ok');
  },
  filterAccount: function (id) { showAccountFilter(id, 'customer'); },
  printAccount: function (id) { printAccount(id); },
  delCustomer: function (id) {
    requirePin(function () {
      confirmBox('حذف مشتری', 'مشتری و سابقهٔ پرداخت‌هایش حذف می‌شود. این کار برگشت ندارد!', function () {
        DB.customers = DB.customers.filter(function (c) { return c.id !== id; });
        DB.payments = DB.payments.filter(function (p) { return p.customerId !== id; });
        DB.accountAdjustments = DB.accountAdjustments.filter(function (a) { return !(a.kind === 'cust' && a.customerId === id); });
        save(); render(); toast('مشتری حذف شد', 'ok');
      });
    });
  }
};

/* ساخت لینک واتساپ برای یادآوری بردگی */
function buildWhatsappLink(customer, amount) {
  if (!customer.phone) return null;
  var phone = toEn(customer.phone).replace(/[^0-9]/g, '');
  // تبدیل شماره محلی به بین‌المللی (افغانستان: 0 → 93، ایران: 0 → 98)
  if (phone.startsWith('0')) {
    if (phone.length >= 10 && phone.length <= 11) {
      // افغانستان: 07xxxxxxxx → 937xxxxxxxx
      phone = '93' + phone.slice(1);
    } else {
      // ایران یا سایر: 0 → 98
      phone = '98' + phone.slice(1);
    }
  }
  var template = DB.settings.whatsappTemplate || 'سلام {customer}، بردگی شما نزد {shop} مبلغ {amount} است. لطفاً تسویه فرمایید.';
  var message = template
    .replace(/\{shop\}/g, DB.settings.shop || '')
    .replace(/\{customer\}/g, customer.name || '')
    .replace(/\{amount\}/g, toFa(group(amount)));
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
}

function receiptText(s) {
  var t = DB.settings.shop + '\n';
  t += 'فاکتور ' + toFa(s.no) + ' — ' + faDate(s.date) + '\n';
  if (s.customerName) t += 'مشتری: ' + s.customerName + '\n';
  t += '------------------\n';
  s.items.forEach(function (it) { t += it.name + ' × ' + qtyTxt(it.qty) + ' = ' + money(m2(it.price) * num(it.qty)) + '\n'; });
  t += '------------------\n';
  if (s.discount) t += 'تخفیف: ' + money(s.discount) + '\n';
  t += 'قابل پرداخت: ' + money(s.total) + '\n';
  t += 'آوردگی: ' + money(s.paid) + '\n';
  if (s.due > 0) t += 'باقی: ' + money(s.due) + '\n';
  if (DB.settings.footer) t += DB.settings.footer;
  return t;
}

/* ویرایش فاکتور */
function editSale(id) {
  var s = DB.sales.find(function (x) { return x.id === id; }); if (!s) return;
  EDIT_ID = id;
  var opts = '<option value="">— مشتری نقدی —</option>';
  DB.accounts.forEach(function (acc) { 
    if (acc.type === 'customer' && !acc.disabled) {
      var custId = acc.oldId || acc.id;
      opts += '<option value="' + custId + '"' + (s.customerId === custId ? ' selected' : '') + '>' + esc(acc.name) + '</option>';
    }
  });
  var itemsHtml = s.items.map(function (it) { return '<div class="r"><span>' + esc(it.name) + ' × ' + qtyTxt(it.qty) + '</span><span>' + money(m2(it.price) * num(it.qty)) + '</span></div>'; }).join('');
  sheet({
    title: 'ویرایش فاکتور ' + toFa(s.no),
    body: '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px">' + 
      '<div style="font-size:11px;color:var(--warning);margin-bottom:8px;padding:6px;background:#fff3cd;border-radius:4px">⚠ اقلام فاکتور قابل ویرایش نیستند. برای تغییر اقلام، فاکتور را حذف و دوباره ثبت کنید.</div>' +
      itemsHtml + '<hr><div class="r"><span>جمع اقلام</span><span class="tnum">' + money(s.subtotal) + '</span></div></div>' +
      fld('مشتری', '<select class="input" id="edCustomer">' + opts + '</select>') +
      '<div class="row2">' + fld('تخفیف', '<input class="input tnum" id="edDiscount" inputmode="decimal" data-focus value="' + toFa(s.discount) + '">') + fld('پرداختی', '<input class="input tnum" id="edPaid" inputmode="decimal" value="' + toFa(s.paid) + '">') + '</div>' +
      '<div id="edSummary" style="font-size:13px;color:var(--muted)"></div>',
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn success" data-act="saveEditSale" data-id="' + id + '">ذخیره</button>',
    onOpen: function () { updateEditSale(); }
  });
}
function updateEditSale() {
  var box = $('#edSummary'); if (!box) return;
  var s = DB.sales.find(function (x) { return x.id === EDIT_ID; }); if (!s) return;
  var disc = num($('#edDiscount').value), total = m2(s.subtotal - disc); if (total < 0) total = 0;
  var paid = Math.min(num($('#edPaid').value), total), due = m2(total - paid);
  box.innerHTML = '<div style="display:flex;justify-content:space-between;padding:2px 0"><span>قابل پرداخت</span><b class="tnum" style="color:var(--ink)">' + money(total) + '</b></div>' +
    '<div style="display:flex;justify-content:space-between;padding:2px 0"><span>باقی (بردگی)</span><b class="tnum" style="color:' + (due > 0 ? 'var(--danger)' : 'var(--success)') + '">' + money(due) + '</b></div>';
}

/* برگشت کالا */
function returnValueOf(s, ret) {
  var ratio = s.subtotal > 0 ? (s.total / s.subtotal) : 1, itemSub = 0;
  s.items.forEach(function (it, i) { itemSub += m2(it.price) * (ret[i] || 0); });
  itemSub = m2(itemSub);
  return { itemSub: itemSub, value: Math.min(m2(itemSub * ratio), s.total) };
}
function returnSheet(id) {
  var s = DB.sales.find(function (x) { return x.id === id; }); if (!s) return;
  RETURN_ID = id; RET = s.items.map(function () { return 0; });
  var rows = s.items.map(function (it, i) {
    return '<div class="cart-line"><div class="mid"><div class="t">' + esc(it.name) + '</div><div class="s tnum">' + money(it.price) + ' × ' + qtyTxt(it.qty) + ' ' + esc(it.unit || '') + '</div></div>' +
      '<div class="stepper"><button data-act="retMinus" data-i="' + i + '">−</button><input class="tnum" id="ret_' + i + '" data-on="retQty" data-i="' + i + '" value="۰" inputmode="decimal"><button data-act="retPlus" data-i="' + i + '">+</button></div></div>';
  }).join('');
  sheet({
    title: 'برگشت کالا — فاکتور ' + toFa(s.no),
    body: '<div class="card" style="box-shadow:none;background:var(--surface2);margin-bottom:12px"><div style="font-size:12.5px;color:var(--muted)">تعداد برگشتی هر قلم را مشخص کنید. موجودی انبار برمی‌گردد و صندوق/آوردگی اصلاح می‌شود.</div></div>' + rows + '<div id="retSummary" style="font-size:13px;color:var(--muted);margin-top:8px"></div>',
    foot: '<button class="btn outline" data-act="closeSheet">انصراف</button><button class="btn danger" data-act="saveReturn" data-id="' + id + '">تأیید برگشت</button>',
    onOpen: function () { updateReturn(); }
  });
}
function updateReturn() {
  var box = $('#retSummary'); if (!box) return;
  var s = DB.sales.find(function (x) { return x.id === RETURN_ID; }); if (!s) return;
  if (!RET.some(function (q) { return q > 0; })) { box.innerHTML = '<div style="padding:4px 0;color:var(--muted)">هنوز کالایی برای برگشت انتخاب نشده.</div>'; return; }
  s.items.forEach(function (it, i) { RET[i] = Math.max(0, Math.min(num(RET[i]), num(it.qty))); });
  var r = returnValueOf(s, RET), rem = r.value, due = s.due, paid = s.paid;
  var cutDue = Math.min(due, rem); rem -= cutDue; var cutPaid = Math.min(paid, rem); rem -= cutPaid;
  var h = '<div style="display:flex;justify-content:space-between;padding:2px 0"><span>مبلغ برگشتی</span><b class="tnum" style="color:var(--ink)">' + money(r.value) + '</b></div>';
  if (cutDue > 0) h += '<div style="display:flex;justify-content:space-between;padding:2px 0"><span>کسر از آوردگی مشتری</span><b class="tnum" style="color:var(--success)">' + money(cutDue) + '</b></div>';
  if (cutPaid > 0) h += '<div style="display:flex;justify-content:space-between;padding:2px 0"><span>پرداخت به مشتری</span><b class="tnum" style="color:var(--danger)">' + money(cutPaid) + '</b></div>';
  box.innerHTML = h;
}
function doReturn(id) {
  var s = DB.sales.find(function (x) { return x.id === id; }); 
  if (!s) return;
  
  // اعتبارسنجی: تعداد برگشتی نمی‌تواند بیشتر از qty اصلی باشد
  s.items.forEach(function (it, i) { 
    RET[i] = Math.max(0, Math.min(num(RET[i]), num(it.qty))); 
  });
  
  var totalRet = RET.reduce(function (a, b) { return a + b; }, 0); 
  if (totalRet <= 0) { 
    toast('کالایی انتخاب نشده', 'warn'); 
    return; 
  }
  
  // محاسبه مبلغ برگشتی
  var r = returnValueOf(s, RET);
  var due = s.due;
  var paid = s.paid;
  var rem = r.value;
  
  // منطق cutDue و cutPaid (حفظ شده)
  var cutDue = Math.min(due, rem); 
  due -= cutDue; 
  rem -= cutDue; 
  
  var cutPaid = Math.min(paid, rem); 
  paid -= cutPaid; 
  rem -= cutPaid;
  
  // 1. برگرداندن موجودی و کاهش qty در s.items
  var parts = [];
  s.items.forEach(function (it, i) { 
    var q = RET[i]; 
    if (q > 0) { 
      applyStockChange(it.pid, q, 'return', 'برگشت فاکتور ' + s.no, 'برگشت');
      parts.push(it.name + ' × ' + qtyTxt(q));
      
      // کاهش qty در s.items
      it.qty = m2(num(it.qty) - q);
    } 
  });
  
  // 2. حذف اقلام با qty = 0 از لیست
  s.items = s.items.filter(function (it) { 
    return num(it.qty) > 0; 
  });
  
  // 3. ثبت تراکنش خزانه out برای cutPaid
  if (cutPaid > 0) {
    addTreasury('out', cutPaid, 'برگشت فاکتور ' + s.no, 'نقد', new Date().toISOString(), 'پرداخت به مشتری بابت برگشت', 'return');
  }
  
  // 4. به‌روزرسانی فاکتور
  s.subtotal = m2(s.subtotal - r.itemSub); 
  s.total = m2(s.total - r.value); 
  s.due = m2(due); 
  s.paid = m2(paid);
  
  // 5. یادداشت برگشت
  s.note = (s.note ? s.note + '  ' : '') + '• برگشت: ' + parts.join('، ') + ' (' + money(r.value) + ')';
  
  // 6. ذخیره و نمایش
  save(); 
  render(); 
  
  var msg = 'برگشت ثبت شد — موجودی برگشت';
  if (cutPaid > 0) {
    msg += '، ' + money(cutPaid) + ' به مشتری پرداخت شد';
  }
  toast(msg, 'ok');
}

/* بستن صندوق */
function todayInputSafe() { return todayInput(); }
function closingSheet() {
  sheet({
    title: 'بستن صندوق',
    body: '<div class="no-print" style="margin-bottom:12px">' + fld('روز مورد نظر', '<input class="input" type="text" readonly id="clDate" data-iso="' + todayInputSafe() + '" data-on="clDate" data-focus value="' + esc(faDate(todayInputSafe())) + '" data-act="openClDatePicker" style="cursor:pointer;background:var(--surface)">') + '</div>' +
      '<div class="receipt" id="clReport"></div>' +
      '<div class="no-print" style="margin-top:12px">' + fld('نقد شمارش‌شده', '<input class="input tnum" id="clCounted" data-on="clCounted" inputmode="decimal" placeholder="۰">') + '</div>',
    foot: '<button class="btn outline" data-act="closeSheet">بستن</button><button class="btn success" data-act="printClosing">چاپ صورت‌مجلس</button>',
    onOpen: function () { updateClosing(); }
  });
}
/**
 * صورت‌مجلس روزانه (Day Closing)
 * 
 * فرمول نقد سیستم (expected):
 * expected = cashSales + payments - expenses - supplierPayments - purchasesPaid + treasuryManualIn - treasuryManualOut
 * 
 * منبع حقیقت:
 * - sales.paid: فروش نقدی
 * - payments: آوردگی از مشتری
 * - expenses: مصارف
 * - supplierPayments: پرداخت به فراهم‌کننده
 * - purchases.paid: خرید نقدی
 * - treasury (source === 'manual'): ورود/خروج دستی خزانه
 * 
 * توجه:
 * - treasury با sourceهای sale/payment/expense فقط برای تاریخچه هستند و در expected شمرده نمی‌شوند
 * - این جلوگیری از دوبار شمردن فروش نقدی (یک‌بار از sales.paid و یک‌بار از treasury in)
 * 
 * تعریف واحد «نقد سیستم»:
 * نقد سیستم = مجموع همه جریان‌های نقدی از sales/payments/expenses/purchases/supplierPayments + ورود/خروج دستی خزانه
 */
function dayClosing(d) {
  var key = dayKey(d), cashSales = 0, creditSales = 0, count = 0, payments = 0, expenses = 0;
  var supplierPayments = 0, purchasesPaid = 0, treasuryIn = 0, treasuryOut = 0;
  
  // فروش‌ها
  DB.sales.forEach(function (s) { 
    if (dayKey(new Date(s.date)) !== key) return; 
    count++; 
    cashSales += m2(s.paid); 
    creditSales += m2(s.due); 
  });
  
  // آوردگی از مشتری
  DB.payments.forEach(function (p) { 
    if (dayKey(new Date(p.date)) === key) payments += m2(p.amount); 
  });
  
  // مصارف
  DB.expenses.forEach(function (e) { 
    if (dayKey(new Date(e.date)) === key) expenses += m2(e.amount); 
  });
  
  // پرداخت به فراهم‌کننده
  DB.supplierPayments.forEach(function (p) { 
    if (dayKey(new Date(p.date)) === key) supplierPayments += m2(p.amount); 
  });
  
  // خرید نقدی
  DB.purchases.forEach(function (p) { 
    if (dayKey(new Date(p.date)) === key) purchasesPaid += m2(p.paid); 
  });
  
  // تراکنش‌های دستی خزانه (فقط source === 'manual')
  DB.treasury.forEach(function (t) {
    if (dayKey(new Date(t.date)) !== key) return;
    if (t.source === 'manual') {
      if (t.type === 'in') treasuryIn += m2(t.amount);
      else if (t.type === 'out') treasuryOut += m2(t.amount);
    }
  });
  
  // فرمول نقد سیستم
  var expected = m2(cashSales + payments - expenses - supplierPayments - purchasesPaid + treasuryIn - treasuryOut);
  
  return { 
    key: key, 
    count: count, 
    cashSales: cashSales, 
    creditSales: creditSales, 
    payments: payments, 
    expenses: expenses,
    supplierPayments: supplierPayments,
    purchasesPaid: purchasesPaid,
    treasuryIn: treasuryIn,
    treasuryOut: treasuryOut,
    expected: expected 
  };
}
function updateClosing() {
  var rep = $('#clReport'); if (!rep) return;
  var d = parseInputDate($('#clDate').value), c = dayClosing(d), counted = num($('#clCounted').value), diff = m2(counted - c.expected), st = DB.settings;
  var h = '<div style="text-align:center"><b style="font-size:16px">' + esc(st.shop) + '</b></div>';
  if (st.address) h += '<div style="text-align:center;font-size:11.5px;color:var(--muted)">' + esc(st.address) + '</div>';
  if (st.phone) h += '<div style="text-align:center;font-size:11.5px;color:var(--muted)">' + toFa(st.phone) + '</div>';
  h += '<hr><div class="r"><span>صورت‌مجلس صندوق</span><span>' + faDate(d) + '</span></div><hr>';
  h += '<div class="r"><span>تعداد فاکتور</span><span class="tnum">' + toFa(c.count) + '</span></div>';
  h += '<div class="r"><span>فروش نقدی</span><span class="tnum">' + money(c.cashSales) + '</span></div>';
  h += '<div class="r"><span>فروش بردگی</span><span class="tnum">' + money(c.creditSales) + '</span></div>';
  h += '<div class="r"><span>آوردگی از مشتری</span><span class="tnum">' + money(c.payments) + '</span></div>';
  h += '<div class="r"><span>مصارف</span><span class="tnum">' + money(c.expenses) + '</span></div>';
  
  // موارد جدید
  if (c.supplierPayments > 0) {
    h += '<div class="r"><span>پرداخت به فراهم‌کننده</span><span class="tnum">' + money(c.supplierPayments) + '</span></div>';
  }
  if (c.purchasesPaid > 0) {
    h += '<div class="r"><span>خرید نقدی</span><span class="tnum">' + money(c.purchasesPaid) + '</span></div>';
  }
  if (c.treasuryIn > 0) {
    h += '<div class="r"><span>ورود دستی خزانه</span><span class="tnum">' + money(c.treasuryIn) + '</span></div>';
  }
  if (c.treasuryOut > 0) {
    h += '<div class="r"><span>خروج دستی خزانه</span><span class="tnum">' + money(c.treasuryOut) + '</span></div>';
  }
  
  h += '<hr>';
  h += '<div class="r" style="font-size:15px;font-weight:800"><span>نقد سیستم (انتظاری)</span><span class="tnum">' + money(c.expected) + '</span></div>';
  h += '<div class="r"><span>نقد شمارش‌شده</span><span class="tnum">' + money(counted) + '</span></div>';
  var dc = diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--ink)';
  var dt = diff > 0 ? 'فزونی' : diff < 0 ? 'کسری' : 'مطابقت';
  h += '<div class="r" style="font-weight:800;color:' + dc + '"><span>' + dt + '</span><span class="tnum" style="direction:ltr;display:inline-block">' + (diff < 0 ? '-' : '') + toFa(group(Math.abs(diff))) + ' ' + esc(DB.settings.currency) + '</span></div>';
  if (st.footer) h += '<hr><div style="text-align:center;font-size:12px;color:var(--muted)">' + esc(st.footer) + '</div>';
  rep.innerHTML = h;
}

/* خروجی CSV */
function csvCell(v) { v = String(v == null ? '' : v); if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"'; return v; }
function download(filename, text, mime) {
  var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
}
function exportSalesCSV() {
  if (!DB.sales.length) return toast('فاکتوری برای خروجی نیست', 'warn');
  var rows = [['شماره', 'تاریخ', 'مشتری', 'جمع', 'تخفیف', 'قابل‌پرداخت', 'پرداخت', 'بردگی', 'یادداشت']];
  DB.sales.forEach(function (s) { rows.push([s.no, faDate(s.date), s.customerName || 'نقدی', s.subtotal, s.discount, s.total, s.paid, s.due, s.note]); });
  var csv = '﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\n');
  download('hamgam-sales-' + dayKey() + '.csv', csv);
  toast('خروجی CSV ساخته شد', 'ok');
}

/* چاپ (با در نظر گرفتن چاپگر حرارتی) */
function doPrint() {
  if (DB.settings.printer === 'thermal') document.documentElement.classList.add('thermal');
  window.print();
  setTimeout(function () { document.documentElement.classList.remove('thermal'); }, 600);
}

/* داده نمونه */
function seed() {
  var now = Date.now();
  var P = [
    ['روغن حبیب ۵ لیتری', 'روغن', 'قوطی', 480, 560, 12],
    ['برنج سیله ۲۴ کیلو', 'برنج', 'بوجی', 2100, 2450, 6],
    ['بوره (شکر) کیلو', 'شیرینی', 'کیلو', 42, 55, 40],
    ['چای احمد ۵۰۰ گرم', 'چای', 'بسته', 165, 210, 18],
    ['نمک بسته‌ای', 'ادویه', 'بسته', 12, 20, 2],
    ['ماکارونی', 'خشکبار', 'بسته', 28, 40, 25]
  ];
  P.forEach(function (r) { DB.products.push({ id: uid('prd'), name: r[0], category: r[1], unit: r[2], cost: r[3], price: r[4], stock: r[5], min: 3, barcode: '', createdAt: new Date(now).toISOString() }); });
  DB.categories = ['روغن', 'برنج', 'شیرینی', 'چای', 'ادویه', 'خشکبار'];
  var C = [['احمد ولی', '0700123456'], ['کریمه جان', '0788554433'], ['دکان نور', '0744887766']];
  C.forEach(function (r) { DB.customers.push({ id: uid('cus'), name: r[0], phone: r[1], opening: 0, note: '', createdAt: new Date(now).toISOString() }); });
  var S = [['تأمین‌کنندهٔ مرکزی', '0700999888']];
  S.forEach(function (r) { DB.suppliers.push({ id: uid('sup'), name: r[0], phone: r[1], opening: 0, note: '', createdAt: new Date(now).toISOString() }); });
  // دو فاکتور نمونه + یک ورود کالا + یک آوردگی
  for (var k = 0; k < 2; k++) {
    var p1 = DB.products[k], p2 = DB.products[k + 2];
    var items = [{ pid: p1.id, name: p1.name, unit: p1.unit, qty: 2, price: p1.price, cost: p1.cost }, { pid: p2.id, name: p2.name, unit: p2.unit, qty: 3, price: p2.price, cost: p2.cost }];
    var sub = m2(items.reduce(function (a, it) { return a + it.price * it.qty; }, 0));
    var paid = k === 0 ? sub : m2(sub / 2);
    DB.counters.sale++;
    DB.sales.push({ id: uid('sal'), no: DB.counters.sale, date: new Date(now - k * 36e5).toISOString(), customerId: k === 0 ? null : DB.customers[0].id, customerName: k === 0 ? '' : DB.customers[0].name, items: items, subtotal: sub, discount: 0, total: sub, paid: paid, due: m2(sub - paid), note: '' });
    items.forEach(function (it) { var p = productById(it.pid); if (p) { p.stock = m2(num(p.stock) - it.qty); addStockMove('sale', it.pid, -it.qty, 'فاکتور ' + DB.counters.sale); } });
  }
  // ورود کالا نمونه
  var gp = DB.products[1];
  DB.counters.purchase++;
  DB.purchases.push({ id: uid('pur'), no: DB.counters.purchase, date: new Date(now - 72e5).toISOString(), supplierId: DB.suppliers[0].id, supplierName: DB.suppliers[0].name, items: [{ pid: gp.id, name: gp.name, unit: gp.unit, qty: 4, cost: gp.cost }], freight: 0, other: 0, total: m2(4 * gp.cost), paid: m2(4 * gp.cost), due: 0, note: 'ورود اولیه' });
  gp.stock = m2(num(gp.stock) + 4); addStockMove('purchase', gp.id, 4, 'ورود از ' + DB.suppliers[0].name);
}

/* ══════════════ ۸) راه‌اندازی ══════════════ */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', DB.settings.theme === 'dark' ? 'dark' : 'light');
  var mt = document.querySelector('meta[name="theme-color"]');
  if (mt) mt.setAttribute('content', DB.settings.theme === 'dark' ? '#0C1417' : '#0F4C5C');
}
var ON = {
  qProduct: function (v) { qProduct = v; softRender(); },
  qCustomer: function (v) { qCustomer = v; softRender(); },
  qSupplier: function (v) { qSupplier = v; softRender(); },
  qty: function (v, el) { 
    var i = +el.dataset.i; 
    if (!cart[i]) return; 
    var newQty = Math.max(0, num(v));
    var p = productById(cart[i].pid);
    if (p && newQty > num(p.stock)) {
      toast('موجودی ' + p.name + ' کافی نیست (فقط ' + toFa(p.stock) + ' ' + esc(p.unit || '') + ')', 'warn');
      el.value = toFa(cart[i].qty); // برگرداندن مقدار قبلی
      return;
    }
    cart[i].qty = newQty; 
  },
  cartPrice: function (v, el) { var i = +el.dataset.i; if (!cart[i]) return; cart[i].price = Math.max(0, m2(num(v))); },
  invCustomer: function (v) {
    invoiceCustomer = v;
    // به‌روزرسانی قیمت‌های سبد بر اساس مشتری
    cart.forEach(function (c) {
      var lastPrice = getLastPriceForCustomer(c.pid, v);
      if (lastPrice !== null) c.price = lastPrice;
    });
    render();
  },
  invDate: function (v) { 
    // اگر ISO date در dataset وجود دارد، از آن استفاده کن
    var input = document.querySelector('[data-on=invDate]');
    if (input && input.dataset.isoDate) {
      invoiceDate = input.dataset.isoDate;
    } else {
      invoiceDate = v;
    }
  },
  invNote: function (v) { invoiceNote = v; },
  invDiscount: function (v) { invoiceDiscount = Math.max(0, m2(num(v))); },
  invPaid: function (v) { invoicePaid = Math.max(0, m2(num(v))); },
  qAccount: function (v) { qAccount = v; render(); },
  accTypeFilterSelect: function (el) { accTypeFilter = el.value; render(); },
  qProductAdd: function (v) { qProductAdd = v; renderAddProductList(); },
  ckCustomer: function (v) {
    CHECKOUT_CUSTOMER = v;
    // به‌روزرسانی قیمت‌های سبد بر اساس مشتری انتخاب‌شده
    cart.forEach(function (c) {
      var lastPrice = getLastPriceForCustomer(c.pid, v);
      if (lastPrice !== null) {
        c.price = lastPrice;
      }
    });
    updateCheckout();
  },
  setShop: function (v) { DB.settings.shop = v; $('#shopName').textContent = v || 'فروشگاه هم‌گام'; save(); },
  setCurrency: function (v) { DB.settings.currency = v; save(); },
  setPhone: function (v) { DB.settings.phone = v; save(); },
  setAddress: function (v) { DB.settings.address = v; save(); },
  setFooter: function (v) { DB.settings.footer = v; save(); },
  setWhatsappTemplate: function (v) { DB.settings.whatsappTemplate = v; save(); },
  setMonths: function (v) { DB.settings.months = v; save(); render(); },
  setPrinter: function (v) { DB.settings.printer = v; save(); },
  purProductSel: function (v) {
    var box = $('#purNewBox'); if (box) box.style.display = (v === '__new__' ? 'block' : 'none');
    // پر کردن خودکار قیمت خرید قبلی وقتی کالا انتخاب شد
    if (v && v !== '__new__') {
      var p = productById(v);
      if (p && p.cost > 0) {
        var costInput = $('#purCost');
        if (costInput && num(costInput.value) === 0) costInput.value = toFa(p.cost);
      }
    }
    updatePurchase();
  },
  purCalc: function () { updatePurchase(); },
  clDate: function (v) { updateClosing(); },
  clCounted: function (v) { updateClosing(); },
  edDiscount: function (v) { updateEditSale(); },
  edPaid: function (v) { updateEditSale(); },
  retQty: function (v, el) { var i = +el.dataset.i; RET[i] = num(v); updateReturn(); },
  filterTypeChange: function (v, el) {
    // ذخیره مقدار select در draft
    var accountId = el.dataset.acc;
    if (!accountId) return;
    if (!_accountFilterDraft[accountId]) _accountFilterDraft[accountId] = {};
    _accountFilterDraft[accountId].type = v;
  },
  whFilter: function () { renderWH(); }
};
var softTimer = null;
function softRender() {
  clearTimeout(softTimer);
  softTimer = setTimeout(function () {
    var active = document.activeElement;
    var name = active && active.dataset ? active.dataset.on : null;
    var selStart = -1, selEnd = -1;
    var scrollTop = 0;
    if (name) {
      try {
        selStart = active.selectionStart;
        selEnd = active.selectionEnd;
      } catch (e) { /* input types like number don't support selectionStart */ }
      scrollTop = active.scrollTop || 0;
    }
    render(true);
    if (name) {
      var again = document.querySelector('[data-on="' + name + '"]');
      if (again) {
        again.focus();
        if (selStart >= 0) {
          try { again.setSelectionRange(selStart, selEnd); } catch (e) {}
        }
        again.scrollTop = scrollTop;
      }
    }
  }, 180);
}
// ══════════════════════════════════════════════════════════════
// ثبت Service Worker برای PWA
// ══════════════════════════════════════════════════════════════
var deferredPrompt; // ذخیره event نصب

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registered with scope:', registration.scope);
      })
      .catch(function(error) {
        console.log('ServiceWorker registration failed:', error);
      });
  }
}

// شنونده برای نصب PWA
window.addEventListener('beforeinstallprompt', function(e) {
  // جلوگیری از نمایش prompt پیش‌فرض
  e.preventDefault();
  // ذخیره event برای استفاده بعدی
  deferredPrompt = e;
  console.log('beforeinstallprompt fired');
});

// تابع نصب برنامه
function installApp() {
  if (!deferredPrompt) {
    toast('برنامه قبلاً نصب شده یا مرورگر پشتیبانی نمی‌کند', 'warn');
    return;
  }
  
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(choiceResult) {
    if (choiceResult.outcome === 'accepted') {
      toast('برنامه با موفقیت نصب شد', 'ok');
    } else {
      toast('نصب لغو شد', 'warn');
    }
    deferredPrompt = null;
  });
}

// تابع اضافه کردن event listener ها
function setupEventListeners() {
  document.querySelectorAll('.tab').forEach(function (t) { 
    t.addEventListener('click', function () { go(t.dataset.go); }); 
  });
  $('#themeBtn').addEventListener('click', function () { 
    DB.settings.theme = DB.settings.theme === 'dark' ? 'light' : 'dark'; 
    applyTheme(); 
    save(); 
  });
  $('#brandBtn').addEventListener('click', function () { go('home'); });
  window.addEventListener('popstate', function () { 
    if (sheetRoot.innerHTML) { closeSheet(); history.pushState(null, ''); } 
  });
  history.pushState(null, '');
}

function init() {
  viewEl = $('#view'); sheetRoot = $('#sheetRoot'); toastRoot = $('#toastRoot');
  load(); applyTheme();
  
  // اضافه کردن event listener های اصلی
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el) return; var fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el); }
  });
  document.addEventListener('input', function (e) {
    var el = e.target; if (!el.dataset || !el.dataset.on) return;
    var fn = ON[el.dataset.on]; if (fn) fn(el.value, el);
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.on === 'setMonths') ON.setMonths(el.value);
    if (el.dataset && el.dataset.on === 'setPrinter') ON.setPrinter(el.value);
    if (el.dataset && el.dataset.on === 'clDate') ON.clDate(el.value);
    if (el.dataset && el.dataset.on === 'ckCustomer') ON.ckCustomer(el.value);
  });
  
  registerServiceWorker(); // ثبت Service Worker برای PWA
  
  // خواندن route از URL hash (برای حفظ صفحه هنگام refresh)
  var validRoutes = ['home', 'sale', 'stock', 'accounts', 'treasury', 'more'];
  var hashRoute = location.hash.replace('#', '');
  if (validRoutes.indexOf(hashRoute) >= 0) route = hashRoute;
  
  // شنونده تغییر hash (دکمه back/forward مرورگر)
  window.addEventListener('hashchange', function() {
    var newRoute = location.hash.replace('#', '');
    if (validRoutes.indexOf(newRoute) >= 0 && newRoute !== route) {
      route = newRoute;
      if (route === 'sale' && !cart.length) resetInvoice();
      render();
    }
  });
  
  // اضافه کردن event listener های UI
  setupEventListeners();
  
  render();
}

/* ══════════════ تعیین رنگ صفر بر اساس آخرین تراکنش ══════════════ */
function lastTxColor(customerId) {
  // بررسی آخرین تراکنش مشتری
  var lastDate = null;
  var lastType = null; // 'debt' یا 'payment'
  
  // بررسی فاکتورها
  DB.sales.forEach(function(s) {
    if (s.customerId === customerId) {
      if (!lastDate || new Date(s.date) > new Date(lastDate)) {
        lastDate = s.date;
        lastType = 'debt';
      }
    }
  });
  
  // بررسی پرداخت‌ها
  DB.payments.forEach(function(p) {
    if (p.customerId === customerId) {
      if (!lastDate || new Date(p.date) > new Date(lastDate)) {
        lastDate = p.date;
        lastType = 'payment';
      }
    }
  });
  
  // اگر آخرین تراکنش پرداخت بود → سبز (چون قرضدار بود و پول آورد)
  // اگر آخرین تراکنش بدهی بود → قرمز (چون قرضدار شد)
  if (lastType === 'payment') return 'var(--success)';
  if (lastType === 'debt') return 'var(--danger)';
  return 'var(--muted)';
}

function lastTxColorSupplier(supplierId) {
  // بررسی آخرین تراکنش فراهم‌کننده
  var lastDate = null;
  var lastType = null; // 'debt' یا 'payment'
  
  // بررسی خریدها
  DB.purchases.forEach(function(p) {
    if (p.supplierId === supplierId) {
      if (!lastDate || new Date(p.date) > new Date(lastDate)) {
        lastDate = p.date;
        lastType = 'debt';
      }
    }
  });
  
  // بررسی پرداخت‌ها
  DB.supplierPayments.forEach(function(p) {
    if (p.supplierId === supplierId) {
      if (!lastDate || new Date(p.date) > new Date(lastDate)) {
        lastDate = p.date;
        lastType = 'payment';
      }
    }
  });
  
  if (lastType === 'payment') return 'var(--success)';
  if (lastType === 'debt') return 'var(--danger)';
  return 'var(--muted)';
}

/* ══════════════ چاپ صورت‌حساب ══════════════ */

// ══════════════════════════════════════════════════════════════
// اجرای سیستم احراز هویت
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired');
  initAuth();
});

// تابع اجرای برنامه اصلی بعد از ورود موفق
function initMainApp() {
  console.log('initMainApp called');
  if (typeof init === 'function') {
    init();
  }
}
