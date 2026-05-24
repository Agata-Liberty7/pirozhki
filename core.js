// ─── Local storage helpers (used only for session/lang/cart) ─────────────────
const DB = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: k => localStorage.removeItem(k),
};

// ─── Default settings (used as fallback before Firebase loads) ───────────────
const DEFAULT_SETTINGS = {
  shopName: 'Пирожковая',
  shopTagline: 'Свежая выпечка каждый день',
  currency: 'EUR',
  logo: null,
  stripeKey: '',
  adminPassword: 'admin123',
  bizumNumber: '',
  revolutHandle: '',
  invoiceDetails: '',
  fontFamily: 'PT Sans',
  darkMode: 'system',
};

// In-memory cache (populated from Firebase on load)
window._settings = null;
window._catalog  = null;
window._clients  = null;

function getSettings() {
  return window._settings || Object.assign({}, DEFAULT_SETTINGS, DB.get('settings_cache') || {});
}
function saveSettingsCache(s) {
  window._settings = s;
  DB.set('settings_cache', s); // local cache for offline
}

// ─── Theme & Font ─────────────────────────────────────────────────────────────
function applyTheme() {
  const s = getSettings();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = s.darkMode === 'dark' || (s.darkMode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
}
function applyFont() {
  const s = getSettings();
  document.documentElement.style.setProperty('--font-body', (s.fontFamily||'PT Sans')+',sans-serif');
}

// ─── Currency ─────────────────────────────────────────────────────────────────
const CURRENCIES = {
  RUB: { symbol:'₽', pos:'after',  locale:'ru-RU' },
  EUR: { symbol:'€', pos:'after',  locale:'es-ES' },
  USD: { symbol:'$', pos:'before', locale:'en-US' },
  GBP: { symbol:'£', pos:'before', locale:'en-GB' },
  KZT: { symbol:'₸', pos:'after',  locale:'kk-KZ' },
};
function formatPrice(n) {
  const s = getSettings();
  const cur = CURRENCIES[s.currency] || CURRENCIES['EUR'];
  const num = new Intl.NumberFormat(cur.locale, { minimumFractionDigits:0, maximumFractionDigits:2 }).format(n);
  return cur.pos === 'before' ? cur.symbol+num : num+'\u00a0'+cur.symbol;
}

// ─── Cart (stays local per device) ───────────────────────────────────────────
function getCart()    { return DB.get('cart') || []; }
function saveCart(c)  { DB.set('cart', c); }

// ─── Auth (session stays local) ───────────────────────────────────────────────
function getCurrentUser()    { return DB.get('currentUser') || null; }
function setCurrentUser(u)   { DB.set('currentUser', u); }
function clearCurrentUser()  { DB.del('currentUser'); }

function clientPrice(basePrice) {
  const user = getCurrentUser();
  if (!user) return basePrice;
  return Math.round(basePrice * (user.coeff||1) * (1-(user.discount||0)/100) * 100) / 100;
}

function loginAdmin(password) {
  return password === getSettings().adminPassword;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, duration=2200) {
  let el = document.getElementById('toast');
  if (!el) { el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('show'), duration);
}

// ─── Loading overlay ─────────────────────────────────────────────────────────
function showLoading(msg='') {
  let el = document.getElementById('fb-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fb-loading';
    el.style.cssText = 'position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:16px';
    el.innerHTML = '<div style="font-size:48px">🥟</div><div style="font-size:16px;font-weight:700;color:var(--text2)" id="fb-loading-msg"></div>';
    document.body.appendChild(el);
  }
  document.getElementById('fb-loading-msg').textContent = msg;
  el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('fb-loading');
  if (el) el.style.display = 'none';
}

// ─── Service Worker ───────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/pirozhki/sw.js').catch(()=>{}); }
