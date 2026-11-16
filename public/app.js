/* =====================================================
   GadgetKu — Frontend SPA
   Role: admin | seller | pembeli (JWT disimpan di localStorage)
   ===================================================== */
const API = '/api';
const store = {
  get token() { return localStorage.getItem('gadgetku_token') || ''; },
  set token(v) { v ? localStorage.setItem('gadgetku_token', v) : localStorage.removeItem('gadgetku_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('gadgetku_user')); } catch { return null; } },
  set user(v) { v ? localStorage.setItem('gadgetku_user', JSON.stringify(v)) : localStorage.removeItem('gadgetku_user'); },
};

let settings = { store_name: 'GadgetKu', whatsapp_number: '6281200000000' };
const KATEGORI = ['Ponsel', 'Aksesori', 'Audio', 'Pengisian Daya', 'Wearable'];
let lastViewHash = '#/katalog';
let currentViewHash = '';

/* ---------- Util ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);
const normalizeWa = (v) => String(v || '').replace(/\D/g, '').replace(/^0/, '62');
const waLink = (number, text) => `https://wa.me/${normalizeWa(number)}?text=${encodeURIComponent(text)}`;

const svgPlaceholder = {
  'svg:ponsel': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5"/></svg>',
  'svg:aksesori': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>',
  'svg:audio': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>',
  'svg:pengisian': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M12.5 8l-2.5 4h4l-2.5 4"/></svg>',
  'svg:wearable': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="6" width="10" height="12" rx="3"/><line x1="9" y1="2.5" x2="9" y2="6"/><line x1="15" y1="2.5" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="21.5"/><line x1="15" y1="18" x2="15" y2="21.5"/></svg>',
  'svg:umum': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M4 16l4.5-4.5 3.5 3.5 3-3L20 16"/></svg>',
};
const CATEGORY_SVG = {
  Ponsel: 'svg:ponsel',
  Aksesori: 'svg:aksesori',
  Audio: 'svg:audio',
  'Pengisian Daya': 'svg:pengisian',
  Wearable: 'svg:wearable',
};

const svgOf = (p) => svgPlaceholder[p.image_url] || svgPlaceholder['svg:umum'];
const isUploadedImage = (url) => typeof url === 'string' && url.startsWith('/uploads/');

/* ---------- Ikon UI ---------- */
const I = {
  search: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l3 3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12"/><path d="M10 11v5M14 11v5"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.55 3.76 1.5 5.3L2 22l4.98-1.64a9.8 9.8 0 0 0 5.06 1.4c5.44 0 9.84-4.4 9.84-9.84S17.48 2 12.04 2Zm0 17.9a8 8 0 0 1-4.28-1.25l-.3-.19-3.02.99.96-2.94-.2-.31a8.06 8.06 0 1 1 6.84 3.7Zm4.4-6.04c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.19-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8.4 12 3 3 8.4v7.2L12 21l9-5.4V8.4Z"/><path d="M3.4 8.5 12 13.7l8.6-5.2"/><path d="M12 13.7V21"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 13.3 13.3 20.5a2 2 0 0 1-2.8 0L3 13V3h10l7.5 7.5a2 2 0 0 1 0 2.8Z"/><circle cx="8" cy="8" r="1.4"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9h18"/><path d="M16 14h2"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9" r="1.5"/><path d="M4 17l5-5 3.5 3.5 3-3L20 17"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.2-4.2A8 8 0 1 1 21 12Z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 14.5A6 6 0 0 1 21 20"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
  eye: '<svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  eyeOff: '<svg class="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 6.3A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.4 3.1"/><path d="M6.3 6.4C3.8 8.1 2.5 12 2.5 12S6 18 12 18c1.4 0 2.6-.3 3.8-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  door: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H4"/></svg>',
};

const CATEGORY_ICON = {
  Ponsel: svgPlaceholder['svg:ponsel'],
  Aksesori: svgPlaceholder['svg:aksesori'],
  Audio: svgPlaceholder['svg:audio'],
  'Pengisian Daya': svgPlaceholder['svg:pengisian'],
  Wearable: svgPlaceholder['svg:wearable'],
};

function mediaHtml(p, imgClass = '') {
  if (isUploadedImage(p.image_url)) {
    return `<img class="${imgClass}" src="${esc(p.image_url)}" alt="${esc(p.nama)}" loading="lazy" data-fallback />`;
  }
  return svgOf(p);
}

function productThumb(p) {
  return `<span class="produk-thumb">${isUploadedImage(p.image_url)
    ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" data-fallback />`
    : svgOf(p)}</span>`;
}

function attachImageFallbacks(root) {
  if (!root) return;
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      const fallback = document.createElement('span');
      fallback.className = 'img-fallback';
      fallback.innerHTML = svgPlaceholder['svg:umum'];
      img.replaceWith(fallback);
    }, { once: true });
  });
}

function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.innerHTML = `${isError ? '⚠' : '✓'} <span>${esc(msg)}</span>`;
  el.className = 'toast' + (isError ? ' error' : '');
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 3200);
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(store.token ? { Authorization: 'Bearer ' + store.token } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data;
}

/* ---------- Modal & dialog ---------- */
function openModal(html, { label = 'Dialog', className = '', onClose } = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-overlay">
    <div class="modal ${className}" role="dialog" aria-modal="true" aria-label="${esc(label)}">${html}</div>
  </div>`;
  document.body.classList.add('modal-open');

  const overlay = root.firstElementChild;
  const modal = overlay.firstElementChild;
  let closed = false;

  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); finish(undefined); } };
  function finish(result) {
    if (closed) return;
    closed = true;
    root.innerHTML = '';
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKey);
    if (onClose) onClose(result);
  }

  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) finish(undefined); });
  root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => finish(undefined)));
  document.addEventListener('keydown', onKey);
  setTimeout(() => {
    const first = modal.querySelector('input, select, textarea, button.btn, a.btn');
    if (first) first.focus();
  }, 60);

  return { root: modal, close: finish };
}

function confirmDialog({ title, message, confirmLabel = 'Hapus', cancelLabel = 'Batal', danger = true, icon = null }) {
  return new Promise((resolve) => {
    const dialog = openModal(`
      <div class="modal-icon ${danger ? 'danger' : ''}">${icon || (danger ? I.trash : I.check)}</div>
      <h2>${esc(title)}</h2>
      <p>${esc(message)}</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" data-cancel>${esc(cancelLabel)}</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmLabel)}</button>
      </div>`, { label: title, onClose: (result) => resolve(!!result) });
    dialog.root.querySelector('[data-cancel]').onclick = () => dialog.close(false);
    dialog.root.querySelector('[data-ok]').onclick = () => dialog.close(true);
  });
}

/* ---------- Auth helpers ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isEmail = (v) => EMAIL_RE.test(String(v || '').trim());
const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

function deviceId() {
  let id = localStorage.getItem('gadgetku_device_id');
  if (!id) {
    id = (window.crypto?.randomUUID?.() || `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
    localStorage.setItem('gadgetku_device_id', id);
  }
  return id;
}

function fieldError(input, message) {
  if (!input) return;
  const field = input.closest('.field') || input.parentElement;
  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid', 'true');
  let note = field.querySelector('.field-error');
  if (!note) {
    note = document.createElement('span');
    note.className = 'field-error';
    field.appendChild(note);
  }
  note.textContent = message;
}

function clearFieldError(input) {
  if (!input) return;
  const field = input.closest('.field') || input.parentElement;
  input.classList.remove('is-invalid');
  input.removeAttribute('aria-invalid');
  field.querySelector('.field-error')?.remove();
}

function passwordField({ id, label, placeholder = '••••••••', autocomplete = 'current-password', help = '' }) {
  return `<div class="field">
    <label for="${id}">${label}</label>
    <div class="password-field">
      <input id="${id}" type="password" placeholder="${placeholder}" autocomplete="${autocomplete}" />
      <button type="button" class="input-icon-btn" data-toggle-pass="${id}" aria-label="Tampilkan password" aria-pressed="false" title="Tampilkan password">${I.eye}</button>
    </div>
    ${help ? `<small class="input-help">${help}</small>` : ''}
  </div>`;
}

function bindPasswordToggles(root = document) {
  root.querySelectorAll('[data-toggle-pass]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = root.getElementById?.(btn.dataset.togglePass) || document.getElementById(btn.dataset.togglePass);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? I.eyeOff : I.eye;
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
      btn.title = show ? 'Sembunyikan password' : 'Tampilkan password';
      input.focus();
    });
  });
}

function bindDigitsOnly(root = document) {
  root.querySelectorAll('[data-digits-only]').forEach((input) => {
    const clean = () => {
      const next = input.value.replace(/\D/g, '');
      if (next !== input.value) {
        const pos = input.selectionStart - (input.value.length - next.length);
        input.value = next;
        try { input.setSelectionRange(Math.max(0, pos), Math.max(0, pos)); } catch { /* noop */ }
      }
      clearFieldError(input);
    };
    input.addEventListener('input', clean);
    input.addEventListener('paste', () => setTimeout(clean, 0));
  });
}

function backButton(label = 'Kembali') {
  return `<button type="button" class="back-btn" data-back>${I.arrowLeft}<span>${esc(label)}</span></button>`;
}

function goBack() {
  const target = lastViewHash && !['#/login', '#/daftar', '#/logout'].includes(lastViewHash) ? lastViewHash : '#/katalog';
  location.hash = target;
}

function bindBack(root = document) {
  root.querySelector('[data-back]')?.addEventListener('click', goBack);
}

/* ---------- Brand, tema & navigasi ---------- */
function updateBrand() {
  const name = settings.store_name || 'GadgetKu';
  document.getElementById('brand-name').textContent = name;
  const footer = document.getElementById('footer-store');
  if (footer) footer.textContent = name;
  document.title = `${name} — Etalase Digital Gadget & Aksesori`;
}

async function loadSettings() {
  try { settings = await api('/settings'); } catch { /* pakai default */ }
  updateBrand();
}

function renderNav() {
  const user = store.user;
  const links = [['#/katalog', 'Etalase']];
  if (user?.role === 'admin') {
    links.push(['#/dashboard', 'Dashboard'], ['#/kelola-user', 'Kelola Pengguna'], ['#/pesanan', 'Pesanan'], ['#/pengaturan', 'Pengaturan']);
  } else if (user?.role === 'seller') {
    links.push(['#/dashboard', 'Toko Saya'], ['#/pesanan', 'Pesanan'], ['#/pengaturan', 'Pengaturan']);
  } else if (user?.role === 'pembeli') {
    links.push(['#/pesanan', 'Pesanan Saya'], ['#/profil', 'Profil']);
  }
  links.push(user ? ['#/logout', 'Keluar'] : ['#/login', 'Masuk']);

  document.getElementById('nav').innerHTML = links
    .map(([href, label]) => `<a href="${href}" data-href="${href}" title="${href === '#/logout' && user ? esc(`Keluar dari akun ${user.nama}`) : ''}">${label}</a>`)
    .join('');

  const rolePill = document.getElementById('role-pill');
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'seller' ? 'Seller' : 'Pembeli';
  rolePill.hidden = false;
  rolePill.className = `role-pill role-${user?.role || 'pembeli'}`;
  rolePill.innerHTML = `<span class="dot"></span>${user ? roleLabel : 'Pembeli · Tamu'}`;
  rolePill.title = user ? `${roleLabel} — ${user.nama}` : 'Mode pembeli tanpa login';

  document.getElementById('dashboard-link').hidden = !(user && user.role !== 'pembeli');
  setActiveNav();
}

function setActiveNav() {
  const current = location.hash || '#/katalog';
  document.querySelectorAll('.nav a').forEach((a) => {
    const href = a.dataset.href;
    const active = href === current || (href === '#/katalog' && current === '');
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

const themeBtn = document.getElementById('theme-toggle');
function applyTheme(dark, persist) {
  document.body.classList.toggle('dark', dark);
  themeBtn.setAttribute('aria-pressed', String(dark));
  themeBtn.setAttribute('aria-label', dark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
  if (persist) localStorage.setItem('gadgetku_theme', dark ? 'dark' : 'light');
}
applyTheme(localStorage.getItem('gadgetku_theme') === 'dark', false);
themeBtn.addEventListener('click', () => applyTheme(!document.body.classList.contains('dark'), true));

/* =====================================================
   VIEW: Katalog (semua pengguna, termasuk tamu)
   ===================================================== */
const katalogState = { search: '', kategori: '', sort: 'unggulan', products: [], all: [] };

function productCardHtml(p) {
  const stok = Number(p.stok);
  const level = stok === 0 ? 'is-out' : stok <= 5 ? 'is-low' : '';
  const stockText = stok === 0 ? 'Stok habis' : `Stok ${stok} unit${stok <= 5 ? ' · menipis' : ''}`;
  return `
    <article class="product-card" data-detail="${p.id}" tabindex="0" role="button" aria-label="Lihat detail ${esc(p.nama)}">
      <div class="product-media">
        ${mediaHtml(p)}
        <div class="product-badges">
          ${p.unggulan ? '<span class="badge badge-unggulan">★ Unggulan</span>' : ''}
          ${stok === 0 ? '<span class="badge badge-habis">Stok habis</span>' : ''}
        </div>
      </div>
      <div class="product-body">
        <span class="chip chip-category">${esc(p.kategori)}</span>
        <h3>${esc(p.nama)}</h3>
        <p class="product-desc">${esc(p.deskripsi || 'Tanpa deskripsi.')}</p>
        <div class="product-price">${rupiah(p.harga)}</div>
        <div class="product-stock ${level}">
          <span class="dot"></span>${stockText}
          <span class="seller" title="${esc(p.seller_nama || '')}">${esc(p.seller_nama || '')}</span>
        </div>
        <button type="button" class="btn btn-wa" data-pesan="${p.id}" ${stok === 0 ? 'disabled' : ''}>
          ${I.wa} ${stok === 0 ? 'Stok Habis' : 'Pesan via WhatsApp'}
        </button>
      </div>
    </article>`;
}

function bindKatalogCards(container) {
  attachImageFallbacks(container);
  container.querySelectorAll('.product-card').forEach((card) => {
    const open = () => openProductDetail(Number(card.dataset.detail));
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-pesan]')) return;
      open();
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('[data-pesan]')) {
        e.preventDefault();
        open();
      }
    });
  });
  container.querySelectorAll('[data-pesan]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const p = katalogState.all.find((x) => x.id === Number(btn.dataset.pesan));
      if (p) openProductDetail(p.id);
    });
  });
}

async function viewKatalog() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="page-loading"><span class="spinner"></span><p>Menyiapkan etalase…</p></div>';

  try { settings = await api('/settings'); } catch { /* default */ }
  updateBrand();

  let all;
  try { all = await api('/products'); } catch (e) {
    app.innerHTML = `<div class="empty-state"><strong>Gagal memuat katalog</strong>${esc(e.message)}</div>`;
    return;
  }
  katalogState.all = all;

  const totalStok = all.reduce((sum, p) => sum + Number(p.stok || 0), 0);
  const jumlahKategori = new Set(all.map((p) => p.kategori)).size;
  const unggulan = all.filter((p) => p.unggulan).slice(0, 3);
  const ready = all.filter((p) => Number(p.stok) > 0).length;
  const readyPct = all.length ? Math.round((ready / all.length) * 100) : 0;
  const countFor = (k) => all.filter((p) => p.kategori === k).length;

  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">${I.sparkle} Tech essentials</span>
        <h1 class="hero-title">Gadget harian,<br><span class="accent">siap kirim</span> hari ini.</h1>
        <p class="hero-lead">Temukan ponsel, aksesori, audio, dan wearable pilihan dari ${esc(settings.store_name)}. Pesan langsung lewat WhatsApp, tanpa keranjang dan tanpa ribet.</p>
        <div class="hero-actions">
          <button type="button" class="btn btn-primary" id="hero-explore">${I.box} Jelajahi Koleksi</button>
          <button type="button" class="btn btn-outline" id="hero-chat">${I.chat} Chat Admin</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><strong>${all.length}</strong><span>Produk aktif</span></div>
          <div class="hero-stat"><strong>${totalStok}</strong><span>Unit siap kirim</span></div>
          <div class="hero-stat"><strong>${jumlahKategori}</strong><span>Kategori pilihan</span></div>
        </div>
      </div>
      <aside class="hero-panel" aria-label="Ringkasan stok toko">
        <div class="hero-panel-head">
          <span class="hero-panel-icon">${I.box}</span>
          <div><strong>Status Toko</strong><span>Diperbarui otomatis</span></div>
        </div>
        <div class="hero-panel-row"><span>Produk tersedia</span><strong class="num">${ready} / ${all.length}</strong></div>
        <div class="hero-panel-row"><span>Stok siap kirim</span><strong class="num">${totalStok} unit</strong></div>
        <div class="hero-panel-row"><span>Produk unggulan</span><strong class="num">${all.filter((p) => p.unggulan).length}</strong></div>
        <div class="hero-meter" aria-hidden="true"><span style="width:${readyPct}%"></span></div>
        <p class="hero-panel-foot">${readyPct}% katalog siap dipesan sekarang.</p>
      </aside>
    </section>

    ${unggulan.length ? `
      <section class="featured-block">
        <div class="catalog-head">
          <div><span class="eyebrow">${I.sparkle} Pilihan editor</span><h2>Rekomendasi Unggulan</h2><p>Produk favorit yang paling sering dicari.</p></div>
        </div>
        <div class="featured-grid" id="featured-grid">${unggulan.map(productCardHtml).join('')}</div>
      </section>` : ''}

    <section id="katalog">
      <div class="catalog-head">
        <div><h2>Semua Produk</h2><p id="result-count">Memuat produk…</p></div>
      </div>

      <div class="catalog-controls">
        <div class="search-box">
          <span class="search-icon">${I.search}</span>
          <input id="q" type="search" placeholder="Cari nama atau deskripsi produk…" value="${esc(katalogState.search)}" aria-label="Cari produk" autocomplete="off" />
          <button type="button" class="search-clear" id="q-clear" aria-label="Hapus pencarian" ${katalogState.search ? '' : 'hidden'}>×</button>
        </div>
        <div class="filter-pills" role="group" aria-label="Filter kategori">
          <button type="button" class="filter-pill ${katalogState.kategori ? '' : 'active'}" data-kategori="">
            Semua <span class="count">${all.length}</span>
          </button>
          ${KATEGORI.map((k) => `
            <button type="button" class="filter-pill ${katalogState.kategori === k ? 'active' : ''}" data-kategori="${k}">
              ${CATEGORY_ICON[k]} ${k} <span class="count">${countFor(k)}</span>
            </button>`).join('')}
        </div>
        <select id="f-sort" class="sort-select" aria-label="Urutkan produk">
          <option value="unggulan" ${katalogState.sort === 'unggulan' ? 'selected' : ''}>Unggulan dulu</option>
          <option value="harga_asc" ${katalogState.sort === 'harga_asc' ? 'selected' : ''}>Harga terendah</option>
          <option value="harga_desc" ${katalogState.sort === 'harga_desc' ? 'selected' : ''}>Harga tertinggi</option>
          <option value="nama" ${katalogState.sort === 'nama' ? 'selected' : ''}>Nama A–Z</option>
        </select>
      </div>

      <div id="daftar" class="grid-produk"></div>
    </section>`;

  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) bindKatalogCards(featuredGrid);

  async function load() {
    const params = new URLSearchParams({ search: katalogState.search, kategori: katalogState.kategori, sort: katalogState.sort });
    try {
      katalogState.products = await api('/products?' + params);
    } catch (e) {
      toast(e.message, true);
      return;
    }
    const el = document.getElementById('daftar');
    document.getElementById('result-count').textContent = `${katalogState.products.length} produk ditemukan`;
    if (!katalogState.products.length) {
      el.innerHTML = `<div class="empty-state"><strong>Produk tidak ditemukan</strong>Coba kata kunci lain atau pilih kategori berbeda.</div>`;
      return;
    }
    el.innerHTML = katalogState.products.map(productCardHtml).join('');
    bindKatalogCards(el);
  }

  let searchTimer;
  const q = document.getElementById('q');
  q.addEventListener('input', () => {
    katalogState.search = q.value;
    document.getElementById('q-clear').hidden = !q.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 160);
  });
  document.getElementById('q-clear').onclick = () => {
    q.value = '';
    katalogState.search = '';
    document.getElementById('q-clear').hidden = true;
    q.focus();
    load();
  };
  document.getElementById('f-sort').addEventListener('change', (e) => { katalogState.sort = e.target.value; load(); });
  document.querySelectorAll('.filter-pill[data-kategori]').forEach((pill) => {
    pill.addEventListener('click', () => {
      katalogState.kategori = pill.dataset.kategori;
      document.querySelectorAll('.filter-pill[data-kategori]').forEach((x) => {
        x.classList.toggle('active', x === pill);
        x.setAttribute('aria-pressed', String(x === pill));
      });
      load();
    });
  });

  document.getElementById('hero-explore').onclick = () => {
    document.getElementById('katalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  document.getElementById('hero-chat').onclick = () => {
    const number = normalizeWa(settings.whatsapp_number);
    if (!number) return toast('Nomor WhatsApp toko belum diatur.', true);
    window.open(waLink(number, `Halo ${settings.store_name}, saya ingin bertanya tentang produk di etalase.`), '_blank');
  };

  await load();
}

function openProductDetail(id) {
  const p = katalogState.all.find((x) => x.id === id) || katalogState.products.find((x) => x.id === id);
  if (!p) return;
  const user = store.user;
  const stok = Number(p.stok);
  const level = stok === 0 ? 'is-out' : stok <= 5 ? 'is-low' : '';
  const stockText = stok === 0 ? 'Stok habis' : `Stok ${stok} unit${stok <= 5 ? ' · menipis' : ''}`;
  const canOrder = user?.role === 'pembeli' && stok > 0;

  const media = isUploadedImage(p.image_url)
    ? `<img src="${esc(p.image_url)}" alt="${esc(p.nama)}" data-fallback />`
    : svgOf(p);

  const orderBlock = canOrder ? `
    <div class="pm-order">
      <div class="qty-stepper">
        <button type="button" id="qty-minus" aria-label="Kurangi jumlah">−</button>
        <input id="qty" type="number" min="1" max="${stok}" step="1" value="1" aria-label="Jumlah pesanan" />
        <button type="button" id="qty-plus" aria-label="Tambah jumlah">+</button>
      </div>
      <span class="muted" style="font-size:12px">maks. ${stok} unit</span>
    </div>
    <button type="button" class="btn btn-wa btn-block" id="detail-order">${I.wa} Pesan via WhatsApp</button>`
    : `<p class="input-help">${!user ? 'Masuk sebagai pembeli untuk memesan produk ini.' : user.role !== 'pembeli' ? 'Pemesanan via WhatsApp hanya tersedia untuk akun pembeli.' : 'Stok sedang habis. Silakan cek lagi nanti.'}</p>
       ${!user ? '<a class="btn btn-primary btn-block" href="#/login" data-close>Masuk untuk memesan</a>' : ''}`;

  const modal = openModal(`
    <div class="product-modal">
      <div class="pm-media">
        ${media}
        <button type="button" class="icon-btn pm-close" data-close aria-label="Tutup detail">${I.close}</button>
      </div>
      <div class="pm-content">
        <span class="chip chip-category">${esc(p.kategori)}</span>
        ${p.unggulan ? '<span class="badge badge-unggulan" style="margin-left:6px">★ Unggulan</span>' : ''}
        <h2 class="pm-title">${esc(p.nama)}</h2>
        <p class="pm-desc">${esc(p.deskripsi || 'Tanpa deskripsi.')}</p>
        <div class="pm-price">${rupiah(p.harga)}</div>
        <div class="pm-meta">
          <span class="product-stock ${level}"><span class="dot"></span>${stockText}</span>
          <span>Dijual oleh ${esc(p.seller_nama || 'toko')}</span>
        </div>
        ${orderBlock}
      </div>
    </div>`, { label: `Detail ${p.nama}`, className: 'modal-lg' });

  attachImageFallbacks(modal.root);

  if (!canOrder) return;
  const qty = modal.root.querySelector('#qty');
  const clampQty = () => {
    const n = Math.round(Number(qty.value));
    qty.value = String(Math.min(stok, Math.max(1, Number.isFinite(n) && n > 0 ? n : 1)));
  };
  modal.root.querySelector('#qty-minus').onclick = () => { qty.value = String(Math.max(1, Number(qty.value) - 1)); };
  modal.root.querySelector('#qty-plus').onclick = () => { qty.value = String(Math.min(stok, Number(qty.value) + 1)); };
  qty.addEventListener('change', clampQty);
  modal.root.querySelector('#detail-order').onclick = async (e) => {
    clampQty();
    const ok = await pesanProduk(p.id, e.currentTarget, Number(qty.value));
    if (ok) modal.close();
  };
}

async function pesanProduk(productId, btn, qty = 1) {
  const user = store.user;
  if (!user) { toast('Silakan masuk sebagai pembeli untuk memesan.', true); location.hash = '#/login'; return false; }
  if (user.role !== 'pembeli') { toast('Pemesanan hanya untuk akun pembeli.', true); return false; }
  const n = Number(qty);
  if (!Number.isInteger(n) || n < 1) { toast('Jumlah tidak valid.', true); return false; }
  btn.disabled = true;
  try {
    const { wa_link, order_id } = await api('/orders', { method: 'POST', body: { product_id: productId, qty: n } });
    toast(`Pesanan #${order_id} dicatat. Membuka WhatsApp…`);
    window.open(wa_link, '_blank');
    return true;
  } catch (e) {
    toast(e.message, true);
    return false;
  } finally {
    btn.disabled = false;
  }
}

/* =====================================================
   VIEW: Login & Register
   ===================================================== */
function authBrand() {
  return `<div class="auth-brand">
    <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="6" y="2.5" width="12" height="19" rx="3"/><line x1="10" y1="18.5" x2="14" y2="18.5"/><path d="M9 8.5h6"/></svg></span>
    <strong style="font-family:var(--font-display);font-size:17px">${esc(settings.store_name)}</strong>
  </div>`;
}

function viewLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      ${backButton()}
      <div class="auth-wrap card">
        ${authBrand()}
        <h2 class="auth-title">Masuk ke ${esc(settings.store_name)}</h2>
        <p class="auth-sub">Pilih cara masuk. Pembeli bisa langsung mulai tanpa akun.</p>

        <div class="auth-tabs" role="tablist" aria-label="Cara masuk">
          <button type="button" class="auth-tab is-active" role="tab" aria-selected="true" data-tab="pembeli" id="tab-btn-pembeli">Pembeli</button>
          <button type="button" class="auth-tab" role="tab" aria-selected="false" data-tab="staff" id="tab-btn-staff">Admin / Seller</button>
        </div>

        <div id="panel-pembeli" role="tabpanel" aria-labelledby="tab-btn-pembeli">
          <div class="guest-card">
            <span class="guest-icon">${I.users}</span>
            <div>
              <strong>Masuk cepat sebagai pembeli</strong>
              <p>Tanpa email, tanpa password. Langsung pesan produk lewat WhatsApp.</p>
            </div>
          </div>
          <button type="button" id="btn-guest" class="btn btn-primary btn-block">${I.arrowRight} Masuk sebagai Pembeli</button>
          <p class="auth-switch">Ingin riwayat pesanan tersimpan permanen? <a href="#/daftar">Daftar akun</a></p>
        </div>

        <form id="panel-staff" role="tabpanel" aria-labelledby="tab-btn-staff" hidden novalidate>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" placeholder="nama@email.com" autocomplete="email" inputmode="email" />
          </div>
          ${passwordField({ id: 'password', label: 'Password', autocomplete: 'current-password' })}
          <button type="submit" id="btn-login" class="btn btn-primary btn-block" style="margin-top:6px">Masuk</button>
          <p class="auth-note">Akun admin &amp; seller dikelola oleh pemilik toko. Lupa password? Hubungi admin.</p>
        </form>
      </div>
    </div>`;

  const root = document.querySelector('.auth-page');
  bindBack(root);
  bindPasswordToggles(root);

  const tabs = root.querySelectorAll('.auth-tab');
  const panelPembeli = root.querySelector('#panel-pembeli');
  const panelStaff = root.querySelector('#panel-staff');
  const setTab = (tab) => {
    tabs.forEach((t) => {
      const active = t.dataset.tab === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    panelPembeli.hidden = tab !== 'pembeli';
    panelStaff.hidden = tab !== 'staff';
    if (tab === 'staff') root.querySelector('#email').focus({ preventScroll: true });
  };
  tabs.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));

  const emailInput = root.querySelector('#email');
  const passInput = root.querySelector('#password');
  [emailInput, passInput].forEach((input) => input.addEventListener('input', () => clearFieldError(input)));

  root.querySelector('#btn-guest').onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.textContent = 'Menyiapkan sesi…';
    try {
      const { token, user } = await api('/auth/guest', { method: 'POST', body: { device_id: deviceId() } });
      store.token = token;
      store.user = user;
      toast(`Halo, ${user.nama}! Selamat berbelanja.`);
      renderNav();
      location.hash = '#/katalog';
    } catch (err) {
      toast(err.message, true);
      btn.disabled = false;
      btn.innerHTML = original;
    }
  };

  root.querySelector('#panel-staff').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = root.querySelector('#btn-login');
    const email = emailInput.value.trim();
    const password = passInput.value;
    let valid = true;
    clearFieldError(emailInput);
    clearFieldError(passInput);
    if (!email) { fieldError(emailInput, 'Email wajib diisi.'); valid = false; }
    else if (!isEmail(email)) { fieldError(emailInput, 'Format email tidak valid, contoh: nama@email.com'); valid = false; }
    if (!password) { fieldError(passInput, 'Password wajib diisi.'); valid = false; }
    if (!valid) {
      root.querySelector('.is-invalid')?.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Memproses…';
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } });
      store.token = token; store.user = user;
      toast(`Selamat datang, ${user.nama}!`);
      location.hash = user.role === 'pembeli' ? '#/katalog' : '#/dashboard';
      renderNav();
    } catch (err) {
      toast(err.message, true);
      fieldError(passInput, 'Email atau password salah.');
      btn.disabled = false;
      btn.textContent = 'Masuk';
    }
  });
}

function viewDaftar() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      ${backButton()}
      <div class="auth-wrap card">
        ${authBrand()}
        <h2 class="auth-title">Buat akun pembeli</h2>
        <p class="auth-sub">Pesan produk favoritmu langsung lewat WhatsApp.</p>
        <div class="field"><label for="nama">Nama Lengkap</label><input id="nama" placeholder="Minimal 3 karakter" autocomplete="name" /></div>
        <div class="field"><label for="email">Email</label><input id="email" type="email" placeholder="nama@email.com" autocomplete="email" inputmode="email" /></div>
        <div class="field">
          <label for="wa">No. WhatsApp (opsional)</label>
          <input id="wa" placeholder="081234567890" inputmode="numeric" autocomplete="tel" data-digits-only maxlength="15" />
          <small class="input-help">Hanya angka. Awalan 0 otomatis menjadi 62 saat memesan.</small>
        </div>
        ${passwordField({ id: 'password', label: 'Password', placeholder: 'Minimal 6 karakter', autocomplete: 'new-password' })}
        <button id="btn-daftar" class="btn btn-primary btn-block" style="margin-top:6px">Daftar</button>
        <p class="auth-switch">Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
      </div>
    </div>`;

  const root = document.querySelector('.auth-page');
  bindBack(root);
  bindPasswordToggles(root);
  bindDigitsOnly(root);

  const el = (id) => root.querySelector('#' + id);
  ['nama', 'email', 'wa', 'password'].forEach((id) => {
    el(id).addEventListener('input', () => clearFieldError(el(id)));
  });

  root.querySelector('#btn-daftar').onclick = async (e) => {
    const btn = e.currentTarget;
    const nama = el('nama').value.trim();
    const email = el('email').value.trim();
    const wa = el('wa').value.trim();
    const password = el('password').value;
    let valid = true;
    ['nama', 'email', 'wa', 'password'].forEach((id) => clearFieldError(el(id)));

    if (nama.length < 3) { fieldError(el('nama'), 'Nama minimal 3 karakter.'); valid = false; }
    if (!email) { fieldError(el('email'), 'Email wajib diisi.'); valid = false; }
    else if (!isEmail(email)) { fieldError(el('email'), 'Format email tidak valid, contoh: nama@email.com'); valid = false; }
    if (wa && (wa.length < 9 || wa.length > 15)) { fieldError(el('wa'), 'Nomor WhatsApp harus 9–15 digit angka.'); valid = false; }
    if (password.length < 6) { fieldError(el('password'), 'Password minimal 6 karakter.'); valid = false; }
    if (!valid) {
      root.querySelector('.is-invalid')?.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Memproses…';
    try {
      const { token, user } = await api('/auth/register', {
        method: 'POST',
        body: { nama, email, password, wa_number: wa },
      });
      store.token = token; store.user = user;
      toast('Pendaftaran berhasil!');
      location.hash = '#/katalog';
      renderNav();
    } catch (err) {
      toast(err.message, true);
      btn.disabled = false;
      btn.textContent = 'Daftar';
    }
  };
}

async function logout() {
  const user = store.user;
  if (!user) { location.hash = '#/katalog'; return; }
  const restore = currentViewHash || '#/katalog';

  const ok = await confirmDialog({
    title: 'Yakin ingin keluar?',
    message: `Kamu akan keluar dari akun ${user.nama}. Kamu bisa masuk lagi kapan saja.`,
    confirmLabel: 'Ya, keluar',
    cancelLabel: 'Tetap di sini',
    danger: false,
    icon: I.door,
  });
  if (!ok) {
    location.hash = restore;
    return;
  }

  store.token = '';
  store.user = '';
  toast('Anda telah keluar.');
  renderNav();
  location.hash = '#/katalog';
}

/* =====================================================
   VIEW: Dashboard (admin & seller)
   ===================================================== */
async function viewDashboard() {
  const user = store.user;
  const app = document.getElementById('app');
  app.innerHTML = '<div class="page-loading"><span class="spinner"></span><p>Memuat dashboard…</p></div>';

  let stats;
  let products;
  try {
    [stats, settings, products] = await Promise.all([
      api('/stats'),
      api('/settings'),
      api('/products/mine/list'),
    ]);
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><strong>Dashboard gagal dimuat</strong>${esc(e.message)}</div>`;
    return;
  }
  updateBrand();

  const isSeller = user.role === 'seller';
  const $ = (id) => document.getElementById(id);
  let editId = null;
  let imageUrl = 'svg:ponsel';
  const invState = { q: '', filter: 'semua' };

  const inventoryValue = products.reduce((sum, p) => sum + Number(p.harga) * Number(p.stok), 0);
  const featuredCount = products.filter((p) => p.unggulan).length;
  const lowCount = products.filter((p) => Number(p.stok) <= 5).length;

  app.innerHTML = `
    <div class="page-head dash-head">
      <div>
        <span class="eyebrow">${isSeller ? 'Seller workspace' : 'Admin workspace'}</span>
        <h1 class="page-title">${isSeller ? 'Toko Saya' : 'Dashboard Admin'}</h1>
        <p class="page-subtitle">Kelola inventaris, stok, gambar, dan kontak WhatsApp toko dalam satu tempat.</p>
      </div>
      <div class="page-actions">
        <button type="button" id="btn-refresh" class="btn btn-outline">${I.refresh} Muat Ulang</button>
        <button type="button" id="btn-tambah" class="btn btn-primary">${I.plus} Tambah Produk</button>
      </div>
    </div>

    <section class="kpi-grid" aria-label="Ringkasan toko">
      <div class="kpi-card kpi-blue">
        <span class="kpi-icon">${I.box}</span>
        <div class="kpi-body"><span>Total Produk</span><strong id="kpi-produk">${stats.total_produk}</strong><small id="kpi-produk-meta">${featuredCount} produk unggulan</small></div>
      </div>
      <div class="kpi-card kpi-indigo">
        <span class="kpi-icon">${I.layers}</span>
        <div class="kpi-body"><span>Total Stok Unit</span><strong id="kpi-stok">${stats.total_stok}</strong><small id="kpi-stok-meta" class="${lowCount ? 'warn' : ''}">${lowCount ? `${lowCount} produk stok menipis` : 'Semua stok aman'}</small></div>
      </div>
      <div class="kpi-card kpi-green">
        <span class="kpi-icon">${I.tag}</span>
        <div class="kpi-body"><span>Kategori Aktif</span><strong id="kpi-kategori">${stats.jumlah_kategori}</strong><small>dari ${KATEGORI.length} kategori</small></div>
      </div>
      <div class="kpi-card kpi-gold">
        <span class="kpi-icon">${I.wallet}</span>
        <div class="kpi-body"><span>Estimasi Nilai Inventaris</span><strong id="kpi-inventaris">${rupiah(inventoryValue)}</strong><small>harga jual × stok saat ini</small></div>
      </div>
    </section>

    <section class="card settings-card">
      <div class="section-head">
        <div><h2>Pengaturan Toko</h2><p>Nama toko dan nomor WhatsApp dipakai di seluruh etalase.</p></div>
        <span class="status-chip"><span class="dot"></span> WhatsApp aktif</span>
      </div>
      <div class="settings-layout">
        <div class="settings-form">
          <div class="field">
            <label for="set-nama">Nama Toko</label>
            <input id="set-nama" value="${esc(settings.store_name || '')}" placeholder="Nama toko" maxlength="60" />
          </div>
          <div class="field">
            <label for="set-wa">Nomor WhatsApp</label>
            <input id="set-wa" value="${esc(settings.whatsapp_number || '')}" placeholder="081234567890" inputmode="numeric" data-digits-only maxlength="15" />
            <small class="input-help">Awalan 0 otomatis diubah menjadi 62. Karakter non-digit dihapus.</small>
          </div>
          <div class="actions">
            <button type="button" id="btn-simpan-set" class="btn btn-primary">Simpan Pengaturan</button>
            <button type="button" id="btn-uji-wa" class="btn btn-outline">${I.wa} Uji Tautan WA</button>
          </div>
        </div>
        <div class="wa-preview" aria-label="Pratinjau chat WhatsApp">
          <div class="wa-preview-top">
            <span class="wa-avatar" id="wa-avatar">G</span>
            <div><strong id="wa-preview-name">${esc(settings.store_name || 'GadgetKu')}</strong><small id="wa-number">+${esc(normalizeWa(settings.whatsapp_number))}</small></div>
            ${I.wa}
          </div>
          <div class="wa-chat">
            <span class="wa-day">Hari ini</span>
            <div class="wa-bubble">
              <p id="wa-bubble-text">Halo ${esc(settings.store_name || 'GadgetKu')}, saya mau pesan produk gadget. Apakah stoknya masih tersedia?</p>
              <span class="wa-time">10.24 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12l4 4L14 8"/><path d="M10 12l4 4L22 8"/></svg></span>
            </div>
          </div>
          <div class="wa-input"><span>Ketik pesan</span>${I.chat}</div>
        </div>
      </div>
    </section>

    <section class="card inventory-card" id="inventory">
      <div class="section-head">
        <div><h2>Inventaris Produk</h2><p id="table-count">Memuat produk…</p></div>
        <div class="inventory-search">
          <span class="search-icon">${I.search}</span>
          <input id="inv-search" type="search" placeholder="Cari produk di tabel…" aria-label="Cari produk di inventaris" autocomplete="off" />
          <button type="button" class="search-clear" id="inv-clear" aria-label="Hapus pencarian inventaris" hidden>×</button>
        </div>
      </div>
      <div class="inventory-toolbar">
        <div class="filter-pills" role="group" aria-label="Filter inventaris">
          <button type="button" class="filter-pill active" data-filter="semua">Semua <span class="count" id="count-semua">0</span></button>
          <button type="button" class="filter-pill" data-filter="menipis">Menipis / Habis <span class="count" id="count-menipis">0</span></button>
          <button type="button" class="filter-pill" data-filter="unggulan">Unggulan <span class="count" id="count-unggulan">0</span></button>
        </div>
      </div>
      <div class="table-wrap desktop-only">
        <table id="tabel-produk" class="data-table">
          <thead><tr><th>Produk</th><th>Harga</th><th>Stok</th><th>Unggulan</th><th>Aksi</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="inventory-cards" id="inventory-cards"></div>
    </section>

    <div class="drawer-backdrop" id="drawer-backdrop" hidden></div>
    <aside class="drawer" id="product-drawer" aria-hidden="true" aria-label="Form produk">
      <div class="drawer-head">
        <div>
          <h2 id="form-title">Tambah Produk</h2>
          <p id="form-subtitle">Lengkapi data untuk menambah produk baru.</p>
        </div>
        <button type="button" class="icon-btn" id="drawer-close" aria-label="Tutup form">${I.close}</button>
      </div>
      <div class="drawer-body">
        <div class="field">
          <label for="p-nama">Nama Produk</label>
          <input id="p-nama" placeholder="Contoh: Power Bank 10.000 mAh" autocomplete="off" maxlength="80" />
          <span class="input-help">Minimal 3 karakter, gunakan nama generik non-merek.</span>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="p-kategori">Kategori</label>
            <select id="p-kategori">${KATEGORI.map((k) => `<option>${k}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label for="p-harga">Harga (Rp)</label>
            <input id="p-harga" type="number" min="0" step="1000" placeholder="0" inputmode="numeric" />
          </div>
        </div>
        <div class="price-preview"><span>Pratinjau harga</span><strong id="harga-preview">Rp 0</strong></div>
        <div class="field-row">
          <div class="field">
            <label for="p-stok">Stok (unit)</label>
            <input id="p-stok" type="number" min="0" step="1" placeholder="0" inputmode="numeric" />
          </div>
          <div class="field">
            <label>Status</label>
            <div class="checkbox-row" style="padding-top:9px">
              <input id="p-unggulan" type="checkbox" />
              <label for="p-unggulan">Produk unggulan</label>
            </div>
            <span class="field-note">Tampil di sorotan etalase.</span>
          </div>
        </div>
        <div class="field">
          <label for="p-desc">Deskripsi</label>
          <textarea id="p-desc" rows="3" placeholder="Deskripsi singkat produk…" maxlength="400"></textarea>
        </div>
        <div class="field">
          <label>Gambar Produk</label>
          <div class="upload-box" id="upload-box">
            <div class="upload-preview" id="upload-preview"></div>
            <div class="upload-info">
              <p class="upload-title" id="upload-title">Ilustrasi bawaan</p>
              <p class="input-help">JPG, PNG, WebP, atau GIF · maks. 3 MB</p>
              <div class="upload-actions">
                <label for="p-file" class="btn btn-outline btn-sm">${I.image} Unggah Gambar</label>
                <input type="file" id="p-file" accept="image/jpeg,image/png,image/webp,image/gif" hidden />
                <button type="button" class="btn btn-ghost btn-sm" id="btn-default-img">Gunakan Ilustrasi Bawaan</button>
              </div>
            </div>
          </div>
          <p class="drop-hint">Bisa juga tarik &amp; lepas gambar ke kotak di atas.</p>
          <div class="swatch-row" id="swatches">
            ${Object.keys(svgPlaceholder).map((k) => `<button type="button" class="swatch" data-swatch="${k}" title="Ilustrasi ${k.replace('svg:', '')}" aria-label="Gunakan ilustrasi ${k.replace('svg:', '')}">${svgPlaceholder[k]}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="drawer-foot">
        <button type="button" id="btn-batal" class="btn btn-outline">Batal</button>
        <button type="button" id="btn-simpan" class="btn btn-primary">Simpan Produk</button>
      </div>
    </aside>`;

  /* ---------- Drawer ---------- */
  const drawer = $('product-drawer');
  const backdrop = $('drawer-backdrop');
  let backdropTimer;

  function openDrawer() {
    clearTimeout(backdropTimer);
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add('is-open');
      drawer.classList.add('is-open');
    });
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    setTimeout(() => $('p-nama').focus(), 180);
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    backdropTimer = setTimeout(() => { if (!drawer.classList.contains('is-open')) backdrop.hidden = true; }, 280);
  }

  backdrop.addEventListener('click', closeDrawer);
  $('drawer-close').onclick = closeDrawer;
  drawer.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  /* ---------- Preview gambar ---------- */
  function updateSwatches() {
    $('swatches').querySelectorAll('[data-swatch]').forEach((b) => {
      b.classList.toggle('active', b.dataset.swatch === imageUrl);
    });
  }

  function renderPreview() {
    const box = $('upload-preview');
    if (!box) return;
    box.classList.remove('is-uploading');
    if (isUploadedImage(imageUrl)) {
      box.innerHTML = `<img src="${esc(imageUrl)}" alt="Pratinjau gambar produk" />`;
      const img = box.querySelector('img');
      if (img) img.onerror = () => { imageUrl = 'svg:umum'; renderPreview(); };
      $('upload-title').textContent = 'Gambar yang diunggah';
    } else {
      box.innerHTML = `<div class="preview-svg">${svgPlaceholder[imageUrl] || svgPlaceholder['svg:umum']}</div>`;
      $('upload-title').textContent = 'Ilustrasi bawaan';
    }
    updateSwatches();
  }

  function updatePricePreview() {
    const value = Number($('p-harga').value);
    $('harga-preview').textContent = rupiah(Number.isFinite(value) && value > 0 ? value : 0);
  }

  async function handleFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) return toast('Gunakan gambar JPG, PNG, WebP, atau GIF.', true);
    if (file.size > 3 * 1024 * 1024) return toast('Ukuran gambar maksimal 3 MB.', true);

    $('upload-preview').classList.add('is-uploading');
    $('upload-title').textContent = 'Mengunggah gambar…';
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(API + '/uploads', {
        method: 'POST',
        headers: store.token ? { Authorization: 'Bearer ' + store.token } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah gambar.');
      imageUrl = data.url;
      $('p-file').value = '';
      toast('Gambar berhasil diunggah.');
    } catch (e) {
      toast(e.message, true);
    } finally {
      renderPreview();
    }
  }

  function resetForm() {
    editId = null;
    imageUrl = 'svg:ponsel';
    ['p-nama', 'p-harga', 'p-stok', 'p-desc'].forEach((id) => { $(id).value = ''; });
    ['p-nama', 'p-harga', 'p-stok'].forEach((id) => $(id).classList.remove('is-invalid'));
    $('p-kategori').selectedIndex = 0;
    $('p-unggulan').checked = false;
    $('p-file').value = '';
    $('form-title').textContent = 'Tambah Produk';
    $('form-subtitle').textContent = 'Lengkapi data untuk menambah produk baru.';
    $('btn-simpan').textContent = 'Simpan Produk';
    updatePricePreview();
    renderPreview();
  }

  function fillForm(p) {
    editId = p.id;
    $('p-nama').value = p.nama;
    $('p-kategori').value = p.kategori;
    $('p-harga').value = p.harga;
    $('p-stok').value = p.stok;
    $('p-desc').value = p.deskripsi || '';
    $('p-unggulan').checked = !!p.unggulan;
    ['p-nama', 'p-harga', 'p-stok'].forEach((id) => $(id).classList.remove('is-invalid'));
    $('p-file').value = '';
    imageUrl = p.image_url || 'svg:umum';
    $('form-title').textContent = 'Edit Produk';
    $('form-subtitle').textContent = `Perbarui data “${p.nama}”.`;
    $('btn-simpan').textContent = 'Simpan Perubahan';
    updatePricePreview();
    renderPreview();
    openDrawer();
  }

  /* ---------- Inventaris ---------- */
  const stockLevel = (stok) => (stok === 0 ? { cls: 'is-out', label: 'Habis' } : stok <= 5 ? { cls: 'is-low', label: 'Menipis' } : { cls: '', label: 'Aman' });

  function stockControlHtml(p) {
    const stok = Number(p.stok);
    const level = stockLevel(stok);
    return `<div class="stock-cell">
      <div class="stock-control">
        <button type="button" data-stock="-1" data-id="${p.id}" aria-label="Kurangi stok ${esc(p.nama)}" ${stok <= 0 ? 'disabled' : ''}>−</button>
        <span class="qty">${stok}</span>
        <button type="button" data-stock="1" data-id="${p.id}" aria-label="Tambah stok ${esc(p.nama)}">+</button>
      </div>
      <span class="stock-label ${level.cls}"><span class="dot"></span>${level.label}</span>
    </div>`;
  }

  function switchHtml(p) {
    return `<label class="switch" title="Tandai sebagai unggulan">
      <input type="checkbox" data-featured="${p.id}" ${p.unggulan ? 'checked' : ''} aria-label="Unggulan untuk ${esc(p.nama)}" />
      <span class="track"></span>
    </label>`;
  }

  function rowActionsHtml(p) {
    return `<div class="row-actions">
      <button type="button" class="btn btn-outline btn-icon" data-edit="${p.id}" aria-label="Edit ${esc(p.nama)}" title="Edit produk">${I.edit}</button>
      <button type="button" class="btn btn-danger btn-icon" data-hapus="${p.id}" aria-label="Hapus ${esc(p.nama)}" title="Hapus produk">${I.trash}</button>
    </div>`;
  }

  function productMetaHtml(p) {
    return `<div class="produk-cell">
      ${productThumb(p)}
      <div class="produk-meta"><strong>${esc(p.nama)}</strong><span>${esc(p.kategori)} · ${Number(p.stok)} unit</span></div>
    </div>`;
  }

  function renderInventory() {
    const q = invState.q.toLowerCase().trim();
    const visible = products.filter((p) => {
      if (invState.filter === 'menipis' && Number(p.stok) > 5) return false;
      if (invState.filter === 'unggulan' && !p.unggulan) return false;
      if (q && !`${p.nama} ${p.kategori} ${p.deskripsi || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });

    $('count-semua').textContent = products.length;
    $('count-menipis').textContent = products.filter((p) => Number(p.stok) <= 5).length;
    $('count-unggulan').textContent = products.filter((p) => p.unggulan).length;
    $('table-count').textContent = `${visible.length} dari ${products.length} produk ditampilkan`;

    const empty = `<div class="empty-state"><strong>Tidak ada produk</strong>${products.length ? 'Coba ubah filter atau kata kunci pencarian.' : 'Tambahkan produk pertama lewat tombol + Tambah Produk.'}</div>`;

    const tbody = $('tabel-produk').querySelector('tbody');
    tbody.innerHTML = visible.length ? visible.map((p) => `
      <tr>
        <td>${productMetaHtml(p)}</td>
        <td class="nowrap num">${rupiah(p.harga)}</td>
        <td>${stockControlHtml(p)}</td>
        <td>${switchHtml(p)}</td>
        <td>${rowActionsHtml(p)}</td>
      </tr>`).join('') : `<tr><td colspan="5">${empty}</td></tr>`;

    const cards = $('inventory-cards');
    cards.innerHTML = visible.length ? visible.map((p) => {
      const stok = Number(p.stok);
      return `<article class="inv-card">
        <div class="inv-card-top">${productMetaHtml(p)}</div>
        <div class="inv-card-mid">
          <span class="inv-card-price num">${rupiah(p.harga)}</span>
          ${stockControlHtml(p)}
        </div>
        <div class="inv-card-actions">
          <span class="inv-feature">${switchHtml(p)} Unggulan</span>
          ${rowActionsHtml(p)}
        </div>
      </article>`;
    }).join('') : empty;

    attachImageFallbacks($('inventory'));

    $('kpi-inventaris').textContent = rupiah(products.reduce((sum, p) => sum + Number(p.harga) * Number(p.stok), 0));
    $('kpi-produk-meta').textContent = `${products.filter((p) => p.unggulan).length} produk unggulan`;
    const low = products.filter((p) => Number(p.stok) <= 5).length;
    const meta = $('kpi-stok-meta');
    meta.textContent = low ? `${low} produk stok menipis` : 'Semua stok aman';
    meta.classList.toggle('warn', low > 0);
  }

  const productPayload = (p, overrides = {}) => ({
    nama: p.nama,
    kategori: p.kategori,
    harga: Number(p.harga),
    stok: Number(p.stok),
    deskripsi: p.deskripsi || '',
    image_url: p.image_url,
    unggulan: !!p.unggulan,
    ...overrides,
  });

  async function loadProduk() {
    products = await api('/products/mine/list');
    renderInventory();
  }

  async function loadStats() {
    const s = await api('/stats');
    $('kpi-produk').textContent = s.total_produk;
    $('kpi-stok').textContent = s.total_stok;
    $('kpi-kategori').textContent = s.jumlah_kategori;
  }

  const byId = (id) => products.find((p) => p.id === Number(id));

  $('inventory').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      const p = byId(editBtn.dataset.edit);
      if (p) fillForm(p);
      return;
    }

    const delBtn = e.target.closest('[data-hapus]');
    if (delBtn) {
      const p = byId(delBtn.dataset.hapus);
      if (!p) return;
      const ok = await confirmDialog({
        title: 'Hapus produk?',
        message: `“${p.nama}” akan dihapus permanen dari inventaris. Tindakan ini tidak dapat dibatalkan.`,
        confirmLabel: 'Hapus produk',
      });
      if (!ok) return;
      try {
        await api('/products/' + p.id, { method: 'DELETE' });
        if (editId === p.id) { resetForm(); closeDrawer(); }
        toast('Produk dihapus.');
        await Promise.all([loadProduk(), loadStats()]);
      } catch (err) {
        toast(err.message, true);
      }
      return;
    }

    const stockBtn = e.target.closest('[data-stock]');
    if (stockBtn) {
      const p = byId(stockBtn.dataset.id);
      if (!p) return;
      const next = Math.max(0, Number(p.stok) + Number(stockBtn.dataset.stock));
      if (next === Number(p.stok)) return;
      $('inventory').querySelectorAll(`[data-stock][data-id="${p.id}"]`).forEach((b) => { b.disabled = true; });
      try {
        const updated = await api('/products/' + p.id, { method: 'PUT', body: productPayload(p, { stok: next }) });
        Object.assign(p, updated);
        renderInventory();
        await loadStats();
      } catch (err) {
        toast(err.message, true);
        renderInventory();
      }
    }
  });

  $('inventory').addEventListener('change', async (e) => {
    const toggle = e.target.closest('[data-featured]');
    if (!toggle) return;
    const p = byId(toggle.dataset.featured);
    if (!p) return;
    toggle.disabled = true;
    try {
      const updated = await api('/products/' + p.id, { method: 'PUT', body: productPayload(p, { unggulan: toggle.checked }) });
      Object.assign(p, updated);
      renderInventory();
      toast(toggle.checked ? 'Produk ditandai unggulan.' : 'Status unggulan dilepas.');
    } catch (err) {
      toast(err.message, true);
      renderInventory();
    }
  });

  $('inv-search').addEventListener('input', (e) => {
    invState.q = e.target.value;
    $('inv-clear').hidden = !e.target.value;
    renderInventory();
  });
  $('inv-clear').onclick = () => {
    $('inv-search').value = '';
    invState.q = '';
    $('inv-clear').hidden = true;
    renderInventory();
    $('inv-search').focus();
  };
  document.querySelectorAll('.filter-pill[data-filter]').forEach((pill) => {
    pill.addEventListener('click', () => {
      invState.filter = pill.dataset.filter;
      document.querySelectorAll('.filter-pill[data-filter]').forEach((x) => x.classList.toggle('active', x === pill));
      renderInventory();
    });
  });

  /* ---------- Form handlers ---------- */
  $('btn-tambah').onclick = () => { resetForm(); openDrawer(); };
  $('btn-batal').onclick = closeDrawer;
  $('p-file').onchange = (e) => handleFile(e.target.files?.[0]);
  $('p-harga').addEventListener('input', () => { updatePricePreview(); $('p-harga').classList.remove('is-invalid'); });
  ['p-nama', 'p-stok'].forEach((id) => $(id).addEventListener('input', () => $(id).classList.remove('is-invalid')));

  $('swatches').addEventListener('click', (e) => {
    const swatch = e.target.closest('[data-swatch]');
    if (!swatch) return;
    imageUrl = swatch.dataset.swatch;
    $('p-file').value = '';
    renderPreview();
  });
  $('btn-default-img').onclick = () => {
    imageUrl = CATEGORY_SVG[$('p-kategori').value] || 'svg:umum';
    $('p-file').value = '';
    renderPreview();
  };

  const dropBox = $('upload-box');
  ['dragenter', 'dragover'].forEach((evt) => dropBox.addEventListener(evt, (e) => {
    e.preventDefault();
    dropBox.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach((evt) => dropBox.addEventListener(evt, (e) => {
    e.preventDefault();
    dropBox.classList.remove('is-dragging');
  }));
  dropBox.addEventListener('drop', (e) => handleFile(e.dataTransfer?.files?.[0]));

  $('btn-refresh').onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await Promise.all([loadProduk(), loadStats()]);
      toast('Data dimuat ulang.');
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
    }
  };

  $('btn-simpan').onclick = async (e) => {
    const btn = e.currentTarget;
    const body = {
      nama: $('p-nama').value.trim(),
      kategori: $('p-kategori').value,
      harga: Number($('p-harga').value),
      stok: Number($('p-stok').value),
      deskripsi: $('p-desc').value.trim(),
      image_url: imageUrl,
      unggulan: $('p-unggulan').checked,
    };

    if (body.nama.length < 3) { $('p-nama').classList.add('is-invalid'); $('p-nama').focus(); return toast('Nama produk minimal 3 karakter.', true); }
    if (!Number.isFinite(body.harga) || body.harga < 0) { $('p-harga').classList.add('is-invalid'); $('p-harga').focus(); return toast('Harga harus angka >= 0.', true); }
    if (!Number.isInteger(body.stok) || body.stok < 0) { $('p-stok').classList.add('is-invalid'); $('p-stok').focus(); return toast('Stok harus bilangan bulat >= 0.', true); }

    const wasEdit = Boolean(editId);
    btn.disabled = true;
    btn.textContent = 'Menyimpan…';
    try {
      if (wasEdit) await api('/products/' + editId, { method: 'PUT', body });
      else await api('/products', { method: 'POST', body });
      toast(wasEdit ? 'Produk diperbarui.' : 'Produk ditambahkan.');
      resetForm();
      closeDrawer();
      await Promise.all([loadProduk(), loadStats()]);
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = editId ? 'Simpan Perubahan' : 'Simpan Produk';
    }
  };

  /* ---------- Pengaturan toko ---------- */
  function updateWaPreview() {
    const name = $('set-nama').value.trim() || 'GadgetKu';
    const number = normalizeWa($('set-wa').value);
    $('wa-preview-name').textContent = name;
    $('wa-avatar').textContent = (name[0] || 'G').toUpperCase();
    $('wa-number').textContent = number ? `+${number}` : 'Nomor belum diisi';
    $('wa-bubble-text').textContent = `Halo ${name}, saya mau pesan produk gadget. Apakah stoknya masih tersedia?`;
  }
  $('set-nama').addEventListener('input', updateWaPreview);
  $('set-wa').addEventListener('input', updateWaPreview);

  $('btn-simpan-set').onclick = async (e) => {
    const btn = e.currentTarget;
    if (!$('set-nama').value.trim()) return toast('Nama toko wajib diisi.', true);
    if (normalizeWa($('set-wa').value).length < 9) return toast('Nomor WhatsApp tidak valid.', true);
    btn.disabled = true;
    btn.textContent = 'Menyimpan…';
    try {
      settings = await api('/settings', {
        method: 'PUT',
        body: { store_name: $('set-nama').value.trim(), whatsapp_number: $('set-wa').value },
      });
      $('set-nama').value = settings.store_name;
      $('set-wa').value = settings.whatsapp_number;
      updateBrand();
      updateWaPreview();
      toast('Pengaturan toko disimpan.');
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Simpan Pengaturan';
    }
  };

  $('btn-uji-wa').onclick = () => {
    const number = normalizeWa($('set-wa').value);
    if (number.length < 9) return toast('Isi nomor WhatsApp yang valid terlebih dahulu.', true);
    const name = $('set-nama').value.trim() || 'GadgetKu';
    window.open(waLink(number, `Halo ${name}, saya mau pesan produk gadget. Apakah stoknya masih tersedia?`), '_blank');
  };

  /* ---------- Inisialisasi ---------- */
  bindDigitsOnly($('set-wa').closest('.settings-card'));
  updatePricePreview();
  renderPreview();
  renderInventory();
}

/* =====================================================
   VIEW: Kelola Pengguna (HANYA admin)
   ===================================================== */
async function viewKelolaUser() {
  const user = store.user;
  if (user.role !== 'admin') { location.hash = '#/katalog'; return; }
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${I.users} Akses & peran</span>
        <h1 class="page-title">Kelola Pengguna</h1>
        <p class="page-subtitle">Buat akun baru dan atur hak akses setiap pengguna.</p>
      </div>
    </div>
    <div class="two-col">
      <div class="card form-card">
        <h2>Buat Akun Baru</h2>
        <div class="field"><label for="u-nama">Nama</label><input id="u-nama" placeholder="Nama lengkap" autocomplete="off" /></div>
        <div class="field"><label for="u-email">Email</label><input id="u-email" type="email" placeholder="nama@email.com" /></div>
        <div class="field"><label for="u-pass">Password</label><input id="u-pass" type="password" placeholder="min. 6 karakter" autocomplete="new-password" /></div>
        <div class="field"><label for="u-role">Role (Hak Akses)</label>
          <select id="u-role">
            <option value="pembeli">Pembeli — belanja & pesan via WhatsApp</option>
            <option value="seller">Seller — kelola produk & pesanan toko sendiri</option>
            <option value="admin">Admin — akses penuh sistem</option>
          </select>
        </div>
        <button id="u-simpan" class="btn btn-primary btn-block">Buat Akun</button>
      </div>
      <div class="card table-card">
        <div class="section-head"><div><h2>Daftar Pengguna</h2><p id="user-count">Memuat…</p></div></div>
        <div class="table-wrap"><table id="tabel-user" class="data-table"></table></div>
      </div>
    </div>`;

  async function load() {
    const rows = await api('/users');
    document.getElementById('user-count').textContent = `${rows.length} akun terdaftar`;
    document.getElementById('tabel-user').innerHTML = `
      <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Daftar</th><th>Aksi</th></tr></thead>
      <tbody>${rows.map((u) => `
        <tr>
          <td><strong>${esc(u.nama)}</strong>${u.id === user.id ? ' <span class="chip">Anda</span>' : ''}</td>
          <td>${esc(u.email)}</td>
          <td><select class="role-select" data-role="${u.id}" ${u.id === user.id ? 'disabled' : ''} aria-label="Role ${esc(u.nama)}">
            ${['admin', 'seller', 'pembeli'].map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select></td>
          <td>${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
          <td>${u.id === user.id ? '<span class="text-muted">—</span>' : `<button type="button" class="btn btn-danger btn-sm" data-hapus="${u.id}">${I.trash} Hapus</button>`}</td>
        </tr>`).join('')}</tbody>`;

    document.querySelectorAll('[data-role]').forEach((s) => s.onchange = async () => {
      try { await api(`/users/${s.dataset.role}/role`, { method: 'PATCH', body: { role: s.value } }); toast('Role diperbarui.'); }
      catch (e) { toast(e.message, true); load(); }
    });
    document.querySelectorAll('[data-hapus]').forEach((b) => b.onclick = async () => {
      const ok = await confirmDialog({
        title: 'Hapus pengguna?',
        message: 'Pengguna ini beserta produk dan pesanannya akan dihapus permanen.',
        confirmLabel: 'Hapus pengguna',
      });
      if (!ok) return;
      try { await api('/users/' + b.dataset.hapus, { method: 'DELETE' }); toast('Pengguna dihapus.'); load(); }
      catch (e) { toast(e.message, true); }
    });
  }

  document.getElementById('u-simpan').onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await api('/users', {
        method: 'POST',
        body: {
          nama: document.getElementById('u-nama').value,
          email: document.getElementById('u-email').value,
          password: document.getElementById('u-pass').value,
          role: document.getElementById('u-role').value,
        },
      });
      toast('Akun dibuat.');
      ['u-nama', 'u-email', 'u-pass'].forEach((id) => (document.getElementById(id).value = ''));
      load();
    } catch (err) { toast(err.message, true); }
    finally { btn.disabled = false; }
  };

  await load();
}

/* =====================================================
   VIEW: Pesanan (admin: semua | seller: produknya | pembeli: miliknya)
   ===================================================== */
async function viewPesanan() {
  const user = store.user;
  const app = document.getElementById('app');
  const rows = await api('/orders');
  const bolehUbahStatus = user.role === 'admin' || user.role === 'seller';
  const STATUS = ['baru', 'diproses', 'dikirim', 'selesai', 'batal'];

  app.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${I.chart} Riwayat transaksi</span>
        <h1 class="page-title">${user.role === 'pembeli' ? 'Pesanan Saya' : 'Kelola Pesanan'}</h1>
        <p class="page-subtitle">${user.role === 'pembeli' ? 'Pantau status pesanan yang kamu buat lewat WhatsApp.' : 'Perbarui status pesanan agar pembeli tahu perkembangannya.'}</p>
      </div>
    </div>
    <div class="card table-card">
      <div class="section-head"><div><h2>Daftar Pesanan</h2><p>${rows.length} pesanan</p></div></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>${user.role === 'pembeli' ? 'Produk' : 'Pembeli / Produk'}</th><th>Qty</th><th>Total</th><th>Status</th><th>Tanggal</th>${bolehUbahStatus ? '<th>Aksi</th>' : ''}</tr></thead>
          <tbody>
            ${rows.map((o) => `
            <tr>
              <td class="num">${o.id}</td>
              <td>${user.role === 'pembeli' ? esc(o.product_nama) : `<strong>${esc(o.pembeli_nama)}</strong><br><small>${esc(o.product_nama)}</small>`}</td>
              <td class="num">${o.qty}</td>
              <td class="num">${rupiah(o.total)}</td>
              <td><span class="badge badge-${o.status}">${o.status}</span></td>
              <td>${new Date(o.created_at).toLocaleString('id-ID')}</td>
              ${bolehUbahStatus ? `<td><select data-status="${o.id}" aria-label="Status pesanan ${o.id}">
                ${STATUS.map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select></td>` : ''}
            </tr>`).join('') || `<tr><td colspan="7"><div class="empty-state"><strong>Belum ada pesanan</strong>Pesanan baru akan muncul di sini.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;

  document.querySelectorAll('[data-status]').forEach((s) => s.onchange = async () => {
    try { await api(`/orders/${s.dataset.status}/status`, { method: 'PUT', body: { status: s.value } }); toast('Status diperbarui.'); viewPesanan(); }
    catch (e) { toast(e.message, true); }
  });
}

/* =====================================================
   VIEW: Pengaturan Toko (admin & seller)
   ===================================================== */
async function viewPengaturan() {
  const user = store.user;
  if (!['admin', 'seller'].includes(user.role)) { location.hash = '#/katalog'; return; }
  const app = document.getElementById('app');
  settings = await api('/settings');
  updateBrand();

  app.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${I.chat} Identitas toko</span>
        <h1 class="page-title">Pengaturan Toko</h1>
        <p class="page-subtitle">Atur nama toko dan nomor WhatsApp yang dipakai pelanggan.</p>
      </div>
    </div>
    <div class="card">
      <div class="settings-layout">
        <div class="settings-form">
          <div class="field"><label for="s-nama">Nama Toko</label><input id="s-nama" value="${esc(settings.store_name)}" maxlength="60" /></div>
          <div class="field">
            <label for="s-wa">Nomor WhatsApp Toko</label>
            <input id="s-wa" value="${esc(settings.whatsapp_number)}" placeholder="081234567890 atau 62812..." inputmode="numeric" data-digits-only maxlength="15" />
            <small class="input-help">Nomor otomatis dinormalisasi: awalan <code>0</code> menjadi <code>62</code>, karakter non-digit dihapus.</small>
          </div>
          <div class="actions" style="display:flex;gap:10px;flex-wrap:wrap">
            <button id="s-simpan" class="btn btn-primary">Simpan Pengaturan</button>
            <button id="s-uji" class="btn btn-outline">${I.wa} Uji Tautan WA</button>
          </div>
        </div>
        <div class="wa-preview" aria-label="Pratinjau chat WhatsApp">
          <div class="wa-preview-top">
            <span class="wa-avatar" id="sp-avatar">G</span>
            <div><strong id="sp-name">${esc(settings.store_name)}</strong><small id="sp-number">+${esc(normalizeWa(settings.whatsapp_number))}</small></div>
            ${I.wa}
          </div>
          <div class="wa-chat">
            <span class="wa-day">Hari ini</span>
            <div class="wa-bubble">
              <p id="sp-bubble">Halo ${esc(settings.store_name)}, saya mau pesan produk gadget. Apakah stoknya masih tersedia?</p>
              <span class="wa-time">10.24 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12l4 4L14 8"/><path d="M10 12l4 4L22 8"/></svg></span>
            </div>
          </div>
          <div class="wa-input"><span>Ketik pesan</span>${I.chat}</div>
        </div>
      </div>
    </div>`;

  bindDigitsOnly(document.querySelector('#app'));
  const preview = () => {
    const name = document.getElementById('s-nama').value.trim() || 'GadgetKu';
    const number = normalizeWa(document.getElementById('s-wa').value);
    document.getElementById('sp-name').textContent = name;
    document.getElementById('sp-avatar').textContent = (name[0] || 'G').toUpperCase();
    document.getElementById('sp-number').textContent = number ? `+${number}` : 'Nomor belum diisi';
    document.getElementById('sp-bubble').textContent = `Halo ${name}, saya mau pesan produk gadget. Apakah stoknya masih tersedia?`;
  };
  document.getElementById('s-nama').addEventListener('input', preview);
  document.getElementById('s-wa').addEventListener('input', preview);

  document.getElementById('s-simpan').onclick = async (e) => {
    const btn = e.currentTarget;
    if (!document.getElementById('s-nama').value.trim()) return toast('Nama toko wajib diisi.', true);
    if (normalizeWa(document.getElementById('s-wa').value).length < 9) return toast('Nomor WhatsApp tidak valid.', true);
    btn.disabled = true;
    btn.textContent = 'Menyimpan…';
    try {
      settings = await api('/settings', {
        method: 'PUT',
        body: { store_name: document.getElementById('s-nama').value.trim(), whatsapp_number: document.getElementById('s-wa').value },
      });
      document.getElementById('s-nama').value = settings.store_name;
      document.getElementById('s-wa').value = settings.whatsapp_number;
      updateBrand();
      preview();
      toast('Pengaturan disimpan.');
    } catch (err) { toast(err.message, true); }
    finally { btn.disabled = false; btn.textContent = 'Simpan Pengaturan'; }
  };

  document.getElementById('s-uji').onclick = () => {
    const number = normalizeWa(document.getElementById('s-wa').value);
    if (number.length < 9) return toast('Isi nomor WhatsApp yang valid terlebih dahulu.', true);
    const name = document.getElementById('s-nama').value.trim() || 'GadgetKu';
    window.open(waLink(number, `Halo ${name}, saya mau pesan produk gadget. Apakah stoknya masih tersedia?`), '_blank');
  };
}

/* =====================================================
   VIEW: Profil (pembeli)
   ===================================================== */
async function viewProfil() {
  const user = store.user;
  const isGuest = /^tamu-.*@gadgetku\.local$/.test(user.email || '');
  document.getElementById('app').innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">${I.users} Akun saya</span>
        <h1 class="page-title">Profil Saya</h1>
        <p class="page-subtitle">Perbarui data kontak dan kata sandi akunmu.</p>
      </div>
    </div>
    <div class="auth-page">
      ${backButton('Kembali ke etalase')}
      <div class="auth-wrap card">
        ${isGuest ? `<div class="guest-note">
          <span class="guest-icon">${I.users}</span>
          <p><strong>Kamu masuk sebagai tamu.</strong> Data tersimpan di perangkat ini. <a href="#/daftar">Daftar akun</a> agar riwayat pesanan tersimpan permanen.</p>
        </div>` : ''}
        <div class="field">
          <label for="pr-email">Email</label>
          <input id="pr-email" value="${esc(user.email || '')}" readonly aria-readonly="true" />
          <small class="input-help">Email akun tidak dapat diubah.</small>
        </div>
        <div class="field"><label for="pr-nama">Nama</label><input id="pr-nama" value="${esc(user.nama)}" autocomplete="name" maxlength="60" /></div>
        <div class="field">
          <label for="pr-wa">No. WhatsApp</label>
          <input id="pr-wa" value="${esc(user.wa_number || '')}" placeholder="081234567890" inputmode="numeric" autocomplete="tel" data-digits-only maxlength="15" />
          <small class="input-help">Hanya angka, 9–15 digit.</small>
        </div>
        ${passwordField({ id: 'pr-pass', label: 'Password Baru (opsional)', placeholder: 'min. 6 karakter', autocomplete: 'new-password' })}
        <button id="pr-simpan" class="btn btn-primary btn-block" style="margin-top:6px">Simpan Perubahan</button>
      </div>
    </div>`;

  const root = document.querySelector('.auth-page');
  bindBack(root);
  bindPasswordToggles(root);
  bindDigitsOnly(root);

  const el = (id) => root.querySelector('#' + id);
  ['pr-nama', 'pr-wa', 'pr-pass'].forEach((id) => {
    el(id).addEventListener('input', () => clearFieldError(el(id)));
  });

  el('pr-simpan').onclick = async (e) => {
    const btn = e.currentTarget;
    const nama = el('pr-nama').value.trim();
    const wa = el('pr-wa').value.trim();
    const newPass = el('pr-pass').value;
    let valid = true;
    ['pr-nama', 'pr-wa', 'pr-pass'].forEach((id) => clearFieldError(el(id)));

    if (nama.length < 3) { fieldError(el('pr-nama'), 'Nama minimal 3 karakter.'); valid = false; }
    if (wa && (wa.length < 9 || wa.length > 15)) { fieldError(el('pr-wa'), 'Nomor WhatsApp harus 9–15 digit angka.'); valid = false; }
    if (newPass && newPass.length < 6) { fieldError(el('pr-pass'), 'Password minimal 6 karakter.'); valid = false; }
    if (!valid) {
      root.querySelector('.is-invalid')?.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Menyimpan…';
    try {
      const body = { nama, wa_number: wa };
      if (newPass) body.password = newPass;
      const { user: updated } = await api('/auth/me', { method: 'PUT', body });
      store.user = updated;
      renderNav();
      el('pr-pass').value = '';
      toast('Profil diperbarui.');
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Simpan Perubahan';
    }
  };
}

/* =====================================================
   Router
   ===================================================== */
const routes = {
  '#/katalog': viewKatalog,
  '#/login': viewLogin,
  '#/daftar': viewDaftar,
  '#/dashboard': viewDashboard,
  '#/kelola-user': viewKelolaUser,
  '#/pesanan': viewPesanan,
  '#/pengaturan': viewPengaturan,
  '#/profil': viewProfil,
  '#/logout': logout,
};

async function route() {
  const hash = location.hash || '#/katalog';
  const view = routes[hash] || viewKatalog;

  if (!['#/login', '#/daftar', '#/logout'].includes(hash) && hash !== currentViewHash) {
    lastViewHash = currentViewHash || '#/katalog';
    currentViewHash = hash;
  }

  // Bersihkan overlay dari view sebelumnya saat berpindah halaman
  const modalRoot = document.getElementById('modal-root');
  if (modalRoot.innerHTML) modalRoot.innerHTML = '';
  document.body.classList.remove('modal-open', 'drawer-open');
  renderNav();

  // Penjaga rute: view privat butuh login
  const isPrivate = ['#/dashboard', '#/kelola-user', '#/pesanan', '#/pengaturan', '#/profil'].includes(hash);
  if (isPrivate && !store.user) { toast('Silakan masuk terlebih dahulu.', true); location.hash = '#/login'; return; }

  // Penjaga rute per role
  const roleGuards = { '#/dashboard': ['admin', 'seller'], '#/kelola-user': ['admin'], '#/pengaturan': ['admin', 'seller'] };
  if (roleGuards[hash] && !roleGuards[hash].includes(store.user?.role)) {
    toast('Akses ditolak untuk role Anda.', true); location.hash = '#/katalog'; return;
  }

  try { await view(); } catch (e) { toast(e.message, true); }
  setActiveNav();
}

window.addEventListener('hashchange', route);

(async function init() {
  await loadSettings();
  renderNav();
  await route();
})();
