/* ============================================================
   DICO ERP - HRM Module
   Halaman dikonversi dari file PHP ke template literals:
     dashboard.php  -> pageHrmDashboard()   (kini: dashboard analitik, lihat HrmDashboard di bawah)
     karyawan.php   -> pageHrmEmployees()   (kini: pengelola data karyawan, terhubung API)
     cuti.php       -> pageHrmLeaves()
     event.php      -> pageHrmEvents()
     registrasi.php -> pageHrmRegistrations()
   ============================================================ */

// Penanda diagnostik: muncul di Console (F12) jika hrm.js berhasil dimuat & dijalankan.
if (window.console) console.info('[HRM] hrm.js dimuat');

// Lokasi API HRM, relatif terhadap erp/index.html (ubah jika folder berbeda).
var HRM_API_BASE = 'modules/hrm/api/';

// Register routes
registerRoute('#hrm/dashboard', pageHrmDashboard);
registerRoute('#hrm/employees', pageHrmEmployees);
registerRoute('#hrm/leaves', pageHrmLeaves);

// PAGE: Data Karyawan (pengelola data karyawan, lihat HrmEmployees di bawah) ----
function pageHrmEmployees() {
  var id = 'hre-root-' + (++HrmEmployees.seq);
  HrmEmployees.whenReady(id);
  return `<div id="${id}" class="hre"><p style="padding:24px;color:#6b7280">Memuat data karyawan…</p></div>`;
}

/* ============================================================
   Pengelola Data Karyawan
   Sumber data : HRM_API_BASE + 'get_employees.php'  (GET)
   Tambah data : HRM_API_BASE + 'add_employee.php'   (POST, JSON)
   Ubah        : HRM_API_BASE + 'update_employee.php'  (PATCH, JSON)
   Hapus       : HRM_API_BASE + 'delete_employee.php?id=N' (DELETE)
   Tampilan hanya berubah setelah server menjawab sukses (tidak ada perubahan palsu).
   Semua nama diawali "hre" / "Hre" agar tidak bentrok dengan modul lain.
   ============================================================ */
var HrmEmployees = (function () {
  var seq = 0;
  var STATUSES = ['Aktif', 'Cuti', 'Nonaktif'];
  var PAGE_SIZE = 10;

  var FIELDS = [
    { key: 'nik', label: 'NIK', type: 'text', required: true, ph: 'Contoh: EMP-004' },
    { key: 'name', label: 'Nama lengkap', type: 'text', required: true, ph: 'Contoh: Siti Aminah' },
    { key: 'position', label: 'Jabatan', type: 'text', required: true, ph: 'Contoh: Staf HR' },
    { key: 'department', label: 'Departemen', type: 'text', ph: 'Contoh: Teknologi' },
    { key: 'email', label: 'Email', type: 'email', required: true, ph: 'nama@email.com' },
    { key: 'phone', label: 'No. telepon', type: 'tel', ph: '0812xxxxxxx' },
    { key: 'join_date', label: 'Tanggal bergabung', type: 'date' },
    { key: 'salary', label: 'Gaji pokok (Rp)', type: 'number', ph: 'Contoh: 5000000', attrs: 'min="0" step="any" inputmode="decimal"' },
    { key: 'status', label: 'Status', type: 'select', options: STATUSES }
  ];

  var ICONS = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    left: '<polyline points="15 18 9 12 15 6"/>',
    right: '<polyline points="9 18 15 12 9 6"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'
  };

  function ic(name, size) {
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">' + (ICONS[name] || '') + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
    if (!m) return '';
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function tone(status) {
    return status === 'Aktif' ? 'success' : status === 'Cuti' ? 'warn' : status === 'Nonaktif' ? 'danger' : 'neutral';
  }

  function badge(status) {
    return status ? '<span class="hre-badge hre-badge-' + tone(status) + '">' + esc(status) + '</span>' : '<span class="hre-dash">—</span>';
  }

  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    return esc(((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase());
  }

  /* ---------- Gaya (disisipkan sekali) ---------- */
  function injectStyle() {
    if (document.getElementById('hre-style')) return;
    var st = document.createElement('style');
    st.id = 'hre-style';
    st.textContent = `
.hre{--navy:#0b1a3a;--blue:#2f8fff;--blue-d:#1c6fee;--line:#e6ebf2;--muted:#6b7280;--text:#1c2434;--danger:#e9475a;max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:20px;color:var(--text)}
.hre *,.hre *::before,.hre *::after,.hre-modal *{box-sizing:border-box}
.hre-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.hre-title{margin:0;font-size:24px;line-height:1.25;color:var(--navy)}
.hre-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.hre-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;line-height:1.2;cursor:pointer;transition:background 150ms,box-shadow 150ms}
.hre-btn:focus-visible,.hre-icon-btn:focus-visible,.hre-page-btn:focus-visible,.hre-th:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.hre-btn:disabled{opacity:.6;cursor:not-allowed}
.hre-btn-primary{background:#2f8fff;color:#fff}
.hre-btn-primary:hover:not(:disabled){background:#1c6fee;box-shadow:0 4px 12px rgba(47,143,255,.35)}
.hre-btn-ghost{background:#fff;color:#1c2434;border-color:#e6ebf2}
.hre-btn-ghost:hover:not(:disabled){background:#f6f9fe;border-color:#cfd9ea}
.hre-btn-sm{padding:8px 12px;font-size:13px}
.hre-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.hre-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.hre-stat span{display:block;font-size:13px;color:var(--muted)}
.hre-stat strong{font-size:26px;color:var(--navy);line-height:1.3}
.hre-card{background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 2px rgba(11,26,58,.04);min-width:0}
.hre-banner{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-radius:12px;font-size:13.5px;line-height:1.55;border:1px solid}
.hre-banner svg{margin-top:2px}
.hre-banner-demo{background:#eaf3ff;border-color:#b9d8ff;color:#0b2a5c}
.hre-banner-warn{background:#fff8e6;border-color:#f2dc9b;color:#6b4a06}
.hre-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line)}
.hre-search{position:relative;flex:1 1 260px;max-width:380px;display:block}
.hre-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#8a94a8;pointer-events:none}
.hre-search .hre-input{padding-left:38px}
.hre-input,.hre-select{width:100%;height:40px;padding:0 12px;border:1px solid #d9e0ec;border-radius:10px;background:#fff;font:inherit;font-size:14px;color:var(--text)}
.hre-select{width:auto;max-width:210px}
.hre-select-full{width:100%;max-width:none}
.hre-input:focus,.hre-select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(47,143,255,.14)}
.hre-input[aria-invalid="true"]{border-color:var(--danger)}
.hre-count{margin-left:auto;font-size:13px;color:var(--muted)}
.hre-table-wrap{overflow-x:auto;max-width:100%}
.hre-table{width:100%;border-collapse:collapse;font-size:14px}
.hre-table th{padding:11px 16px;text-align:left;font-size:12.5px;font-weight:600;color:#5b6780;background:#f8fafd;border-bottom:1px solid var(--line);white-space:nowrap}
.hre-table td{padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
.hre-table tbody tr:last-child td{border-bottom:0}
.hre-table tbody tr:hover td{background:#f8fbff}
.hre-th{background:none;border:0;padding:0;font:inherit;font-weight:600;color:inherit;cursor:pointer}
.hre-th:hover{color:var(--navy)}
.hre-arrow{color:var(--blue-d)}
.hre-name{display:flex;align-items:center;gap:12px;min-width:200px}
.hre-avatar{width:36px;height:36px;border-radius:50%;background:#e8f2ff;color:#1c6fee;display:grid;place-items:center;font-size:13px;font-weight:700;flex:none}
.hre-name strong{display:block;color:var(--navy)}
.hre-name small{color:var(--muted)}
.hre-td-actions{text-align:right;white-space:nowrap}
.hre-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:0;background:transparent;color:#4b5873;cursor:pointer}
.hre-icon-btn:hover{background:#eef3fb;color:var(--navy)}
.hre-icon-btn.hre-tone-danger{color:#c2263a}
.hre-icon-btn.hre-tone-danger:hover{background:#fde8eb;color:#c2263a}
.hre-btn-danger{background:#e9475a;color:#fff}
.hre-btn-danger:hover:not(:disabled){background:#d1364a}
.hre-btn-danger-soft{background:#fde8eb;color:#c2263a}
.hre-btn-danger-soft:hover{background:#fbd5db}
.hre-confirm{margin:0;line-height:1.6;font-size:14.5px}
.hre-dash{color:#a5adbb}
.hre-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.hre-badge-success{background:#e6f6ec;color:#15803d}
.hre-badge-warn{background:#fff1d6;color:#a15c07}
.hre-badge-danger{background:#fde8eb;color:#c2263a}
.hre-badge-neutral{background:#eaeef5;color:#4b5873}
.hre-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 20px;border-top:1px solid var(--line)}
.hre-pager-info{font-size:13px;color:var(--muted)}
.hre-pager-btns{display:flex;gap:4px}
.hre-page-btn{min-width:34px;height:34px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fff;border-radius:8px;font:inherit;font-size:13px;font-weight:600;color:#4b5873;cursor:pointer}
.hre-page-btn:hover:not(:disabled){background:#f2f7ff;border-color:#b9d8ff}
.hre-page-btn.is-active{background:var(--blue);border-color:var(--blue);color:#fff}
.hre-page-btn:disabled{opacity:.4;cursor:not-allowed}
.hre-empty{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:8px}
.hre-empty-ic{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:#eef3fb;color:#5b78a8;margin-bottom:4px}
.hre-empty h3{margin:0;font-size:16px;color:var(--navy)}
.hre-empty p{margin:0;max-width:460px;font-size:14px;color:var(--muted);line-height:1.55}
.hre-empty .hre-btn{margin-top:10px}
.hre-skel-wrap{padding:12px 20px}
.hre-skel-row{display:grid;grid-template-columns:1fr 2fr 1fr 1fr;gap:16px;padding:12px 0}
.hre-skel{display:block;height:14px;border-radius:6px;background:linear-gradient(90deg,#eef2f8 25%,#f7f9fc 50%,#eef2f8 75%);background-size:200% 100%;animation:hre-shimmer 1.4s infinite linear}
@keyframes hre-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.hre-modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,26,58,.55)}
.hre-modal{width:min(680px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(11,26,58,.3);color:#1c2434;font-size:14px}
.hre-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid #e6ebf2}
.hre-modal-head h2{margin:0;font-size:18px;color:#0b1a3a}
.hre-modal-body{padding:20px 22px;overflow-y:auto}
.hre-modal-foot{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:14px 22px;border-top:1px solid #e6ebf2}
.hre-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.hre-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.hre-field label{font-size:13px;font-weight:600;color:#34405a}
.hre-req{color:#e9475a}
.hre-err{font-size:12.5px;color:#e9475a}
.hre-form-error{margin-bottom:14px;padding:10px 14px;border-radius:10px;background:#fde8eb;color:#a31f31;font-size:13.5px}
.hre-form-error[hidden]{display:none}
.hre-dl{margin:0;display:flex;flex-direction:column}
.hre-dl-row{display:grid;grid-template-columns:160px minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid #e6ebf2}
.hre-dl-row:last-child{border-bottom:0}
.hre-dl dt{color:#6b7280}
.hre-dl dd{margin:0;overflow-wrap:anywhere}
#hre-toasts{position:fixed;right:20px;bottom:20px;z-index:1100;display:flex;flex-direction:column;gap:10px;max-width:min(440px,calc(100vw - 40px))}
.hre-toast{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:12px;color:#fff;font-size:14px;line-height:1.45;background:#0b1a3a;box-shadow:0 10px 30px rgba(11,26,58,.3);transition:opacity 250ms}
.hre-toast svg{margin-top:2px}
.hre-toast-success{background:#15803d}
.hre-toast-error{background:#c2263a}
.hre-toast.is-out{opacity:0}
@media (max-width:760px){
.hre-head>.hre-btn{width:100%}
.hre-title{font-size:21px}
.hre-toolbar{padding:14px}
.hre-search{max-width:none;flex-basis:100%}
.hre-select{flex:1 1 140px;max-width:none}
.hre-count{margin-left:0;width:100%}
.hre-form-grid{grid-template-columns:minmax(0,1fr)}
.hre-dl-row{grid-template-columns:minmax(0,1fr);gap:2px}
.hre-modal-foot .hre-btn{flex:1 1 auto}
.hre-pager{justify-content:center}
#hre-toasts{left:16px;right:16px;bottom:16px;max-width:none}
}
@media (prefers-reduced-motion:reduce){.hre-skel{animation:none}}
`;
    document.head.appendChild(st);
  }

  /* ---------- Komponen kecil: toast & modal ---------- */
  function toast(msg, type) {
    var box = document.getElementById('hre-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hre-toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var t = document.createElement('div');
    var kind = type || 'info';
    t.className = 'hre-toast hre-toast-' + kind;
    t.innerHTML = ic(kind === 'success' ? 'check' : kind === 'error' ? 'alert' : 'info', 18) + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
    }, kind === 'error' ? 6500 : 4500);
  }

  var escHandler = null;
  function closeModal() {
    var m = document.getElementById('hre-modal');
    if (m && m.parentNode) m.parentNode.removeChild(m);
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  function openModal(title, body, footer) {
    closeModal();
    var root = document.getElementById('modal-root') || document.body;
    var wrap = document.createElement('div');
    wrap.id = 'hre-modal';
    wrap.className = 'hre-modal-backdrop';
    wrap.innerHTML = '<div class="hre-modal" role="dialog" aria-modal="true" aria-labelledby="hre-modal-title">' +
      '<div class="hre-modal-head"><h2 id="hre-modal-title">' + esc(title) + '</h2>' +
      '<button type="button" class="hre-icon-btn" data-close aria-label="Tutup">' + ic('x', 18) + '</button></div>' +
      '<div class="hre-modal-body">' + body + '</div>' +
      (footer ? '<div class="hre-modal-foot">' + footer + '</div>' : '') + '</div>';
    root.appendChild(wrap);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) closeModal(); });
    wrap.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-close]')) closeModal(); });
    escHandler = function (e) { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', escHandler);
    var first = wrap.querySelector('input,select,textarea');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return wrap;
  }

  /* ---------- API ---------- */
  function api(path, opts) {
    var o = opts || {};
    return fetch(HRM_API_BASE + path, {
      method: o.method || 'GET',
      headers: Object.assign({ Accept: 'application/json' }, o.headers || {}),
      body: o.body,
      credentials: 'same-origin'
    }).then(function (res) {
      return res.text().then(function (txt) {
        var json = null;
        try { json = txt ? JSON.parse(txt) : null; } catch (e) { /* bukan JSON */ }
        if (!json || typeof json.success !== 'boolean') {
          var bad = new Error('Respons server tidak valid (HTTP ' + res.status + '). Pastikan Apache/PHP aktif dan file ' + path + ' ada di folder ' + HRM_API_BASE + '.');
          bad.status = res.status;
          throw bad;
        }
        if (!json.success) {
          var err = new Error(json.message || 'Permintaan gagal.');
          err.status = res.status;
          err.errors = json.errors || {};
          throw err;
        }
        return json;
      });
    }, function () {
      throw new Error('Tidak dapat menghubungi server. Periksa koneksi dan pastikan Apache (XAMPP) berjalan.');
    });
  }

  /* ---------- Validasi form (cermin validasi backend) ---------- */
  function validate(v) {
    var e = {};
    FIELDS.forEach(function (f) { if (f.required && !v[f.key]) e[f.key] = f.label + ' wajib diisi.'; });
    if (v.nik && !e.nik) {
      if (v.nik.length < 3 || v.nik.length > 32) e.nik = 'NIK harus 3–32 karakter.';
      else if (!/^[A-Za-z0-9][A-Za-z0-9.\-]*$/.test(v.nik)) e.nik = 'NIK hanya boleh berisi huruf, angka, titik, dan strip.';
    }
    if (v.name && !e.name && (v.name.length < 2 || v.name.length > 100)) e.name = 'Nama harus 2–100 karakter.';
    if (v.position && !e.position && (v.position.length < 2 || v.position.length > 100)) e.position = 'Jabatan harus 2–100 karakter.';
    if (v.department && v.department.length > 100) e.department = 'Departemen maksimal 100 karakter.';
    if (v.email && !e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Format email tidak valid.';
    if (v.phone && !/^[0-9+\-\s()]{6,20}$/.test(v.phone)) e.phone = 'Format nomor telepon tidak valid.';
    if (v.salary !== '' && v.salary != null) {
      if (!/^\d+(\.\d{1,2})?$/.test(v.salary)) e.salary = 'Gaji pokok harus berupa angka tidak negatif (maksimal 2 desimal).';
      else if (parseFloat(v.salary) > 9999999999.99) e.salary = 'Gaji pokok maksimal 9.999.999.999.';
    }
    return e;
  }

  /* ---------- Halaman ---------- */
  function mount(el) {
    injectStyle();
    closeModal();

    var S = { rows: [], meta: null, loading: true, error: null, q: '', status: '', dept: '', page: 1, sort: { key: 'name', dir: 'asc' } };

    el.innerHTML =
      '<header class="hre-head"><div><h1 class="hre-title">Data Karyawan</h1>' +
      '<p class="hre-sub">Kelola semua data karyawan DICO Community</p></div>' +
      '<button type="button" class="hre-btn hre-btn-primary" data-act="add">' + ic('plus') + 'Tambah Karyawan</button></header>' +
      '<div data-slot="banner"></div><div class="hre-stats" data-slot="stats"></div>' +
      '<section class="hre-card"><div data-slot="toolbar"></div><div data-slot="table"></div></section>';

    var slot = function (n) { return el.querySelector('[data-slot="' + n + '"]'); };

    /* --- muat data --- */
    function load() {
      S.loading = true;
      S.error = null;
      renderTable();
      return api('get_employees.php').then(function (json) {
        S.rows = (json.data && json.data.items) || [];
        S.meta = json.meta || null;
      }).catch(function (err) {
        S.rows = [];
        S.error = err;
      }).then(function () {
        S.loading = false;
        renderBanner();
        renderStats();
        renderToolbar();
        renderTable();
      });
    }

    function renderBanner() {
      var b = slot('banner');
      if (S.error) { b.innerHTML = ''; return; }
      b.innerHTML = S.meta && S.meta.source === 'mock'
        ? '<div class="hre-banner hre-banner-demo" role="status">' + ic('info', 20) + '<div><strong>Data sementara (mock).</strong> ' +
          'Daftar ini berasal dari penyimpanan sementara di server pengembangan, bukan database MySQL. Data dapat hilang sewaktu-waktu.</div></div>'
        : '';
    }

    function renderStats() {
      var c = function (s) { return S.rows.filter(function (r) { return r.status === s; }).length; };
      slot('stats').innerHTML = S.error ? '' :
        [['Total karyawan', S.rows.length], ['Aktif', c('Aktif')], ['Cuti', c('Cuti')], ['Nonaktif', c('Nonaktif')]]
          .map(function (x) { return '<div class="hre-stat"><span>' + x[0] + '</span><strong>' + x[1] + '</strong></div>'; }).join('');
    }

    function distinct(key) {
      var seen = {}, out = [];
      S.rows.forEach(function (r) {
        var v = String(r[key] == null ? '' : r[key]).trim();
        if (v && !seen[v]) { seen[v] = 1; out.push(v); }
      });
      return out.sort(function (a, b) { return a.localeCompare(b, 'id'); });
    }

    function renderToolbar() {
      if (S.error) { slot('toolbar').innerHTML = ''; return; }
      var opt = function (list, cur) {
        return list.map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
      };
      var depts = distinct('department');
      if (depts.indexOf(S.dept) < 0) S.dept = '';
      slot('toolbar').innerHTML =
        '<div class="hre-toolbar"><label class="hre-search">' + ic('search') +
        '<input type="search" class="hre-input" data-q value="' + esc(S.q) + '" placeholder="Cari NIK, nama, jabatan, atau email…" aria-label="Cari karyawan"></label>' +
        '<select class="hre-select" data-f="status" aria-label="Filter status"><option value="">Semua status</option>' + opt(distinct('status'), S.status) + '</select>' +
        (depts.length ? '<select class="hre-select" data-f="dept" aria-label="Filter departemen"><option value="">Semua departemen</option>' + opt(depts, S.dept) + '</select>' : '') +
        '<button type="button" class="hre-btn hre-btn-ghost hre-btn-sm" data-act="reset">Atur ulang</button>' +
        '<span class="hre-count" data-slot="count" aria-live="polite"></span></div>';
    }

    /* --- filter + urut --- */
    function filtered() {
      var q = S.q.trim().toLowerCase();
      var list = S.rows.filter(function (r) {
        if (S.status && r.status !== S.status) return false;
        if (S.dept && r.department !== S.dept) return false;
        if (!q) return true;
        return ['nik', 'name', 'position', 'department', 'email'].some(function (k) {
          return String(r[k] == null ? '' : r[k]).toLowerCase().indexOf(q) > -1;
        });
      });
      var k = S.sort.key, d = S.sort.dir === 'desc' ? -1 : 1;
      return list.slice().sort(function (a, b) {
        var x = String(a[k] == null ? '' : a[k]), y = String(b[k] == null ? '' : b[k]);
        if (!x && y) return 1;
        if (x && !y) return -1;
        return x.localeCompare(y, 'id', { numeric: true }) * d;
      });
    }

    function empty(icon, title, text, extra) {
      return '<div class="hre-empty"><div class="hre-empty-ic">' + ic(icon, 26) + '</div><h3>' + esc(title) + '</h3>' +
        (text ? '<p>' + esc(text) + '</p>' : '') + (extra || '') + '</div>';
    }

    /* --- tabel --- */
    function renderTable() {
      var box = slot('table');
      var cnt = el.querySelector('[data-slot="count"]');
      if (!box) return;

      if (S.loading) {
        var sk = '';
        for (var i = 0; i < 5; i++) sk += '<div class="hre-skel-row"><span class="hre-skel"></span><span class="hre-skel"></span><span class="hre-skel"></span><span class="hre-skel"></span></div>';
        box.innerHTML = '<div class="hre-skel-wrap" aria-busy="true">' + sk + '</div>';
        return;
      }
      if (S.error) {
        box.innerHTML = empty('alert', 'Data karyawan gagal dimuat', S.error.message,
          '<button type="button" class="hre-btn hre-btn-primary" data-act="reload">' + ic('refresh') + 'Coba lagi</button>');
        return;
      }
      if (!S.rows.length) {
        if (cnt) cnt.textContent = '0 data';
        box.innerHTML = empty('users', 'Belum ada data karyawan', 'Klik "Tambah Karyawan" untuk menambahkan data pertama.');
        return;
      }

      var list = filtered();
      var total = list.length;
      if (cnt) cnt.textContent = total === S.rows.length ? total + ' data' : total + ' dari ' + S.rows.length + ' data';
      if (!total) {
        box.innerHTML = empty('search', 'Tidak ada hasil', 'Tidak ada karyawan yang cocok dengan pencarian atau filter.',
          '<button type="button" class="hre-btn hre-btn-ghost" data-act="reset">Atur ulang pencarian</button>');
        return;
      }

      var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (S.page > pages) S.page = pages;
      var start = (S.page - 1) * PAGE_SIZE;
      var slice = list.slice(start, start + PAGE_SIZE);

      var cols = [['nik', 'NIK'], ['name', 'Nama'], ['department', 'Departemen'], ['position', 'Jabatan'], ['status', 'Status']];
      var th = cols.map(function (c) {
        var on = S.sort.key === c[0];
        return '<th scope="col" aria-sort="' + (on ? (S.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
          '<button type="button" class="hre-th" data-act="sort" data-key="' + c[0] + '">' + c[1] +
          '<span class="hre-arrow">' + (on ? (S.sort.dir === 'asc' ? ' ↑' : ' ↓') : '') + '</span></button></th>';
      }).join('');

      var tr = slice.map(function (r) {
        var id = esc(r.id);
        return '<tr><td>' + esc(r.nik) + '</td>' +
          '<td><div class="hre-name"><span class="hre-avatar">' + initials(r.name) + '</span><div><strong>' + esc(r.name) + '</strong><small>' + esc(r.email || '') + '</small></div></div></td>' +
          '<td>' + (r.department ? esc(r.department) : '<span class="hre-dash">—</span>') + '</td>' +
          '<td>' + esc(r.position) + '</td><td>' + badge(r.status) + '</td>' +
          '<td class="hre-td-actions">' +
          '<button type="button" class="hre-icon-btn" data-act="detail" data-id="' + id + '" title="Detail" aria-label="Lihat detail ' + esc(r.name) + '">' + ic('eye') + '</button>' +
          '<button type="button" class="hre-icon-btn" data-act="edit" data-id="' + id + '" title="Ubah" aria-label="Ubah ' + esc(r.name) + '">' + ic('edit') + '</button>' +
          '<button type="button" class="hre-icon-btn hre-tone-danger" data-act="delete" data-id="' + id + '" title="Hapus" aria-label="Hapus ' + esc(r.name) + '">' + ic('trash') + '</button>' +
          '</td></tr>';
      }).join('');

      var a = Math.max(1, S.page - 2), b = Math.min(pages, a + 4);
      a = Math.max(1, b - 4);
      var pg = '<button type="button" class="hre-page-btn" data-act="page" data-page="' + (S.page - 1) + '"' + (S.page <= 1 ? ' disabled' : '') + ' aria-label="Halaman sebelumnya">' + ic('left') + '</button>';
      for (var n = a; n <= b; n++) {
        pg += '<button type="button" class="hre-page-btn' + (n === S.page ? ' is-active' : '') + '" data-act="page" data-page="' + n + '"' + (n === S.page ? ' aria-current="page"' : '') + '>' + n + '</button>';
      }
      pg += '<button type="button" class="hre-page-btn" data-act="page" data-page="' + (S.page + 1) + '"' + (S.page >= pages ? ' disabled' : '') + ' aria-label="Halaman berikutnya">' + ic('right') + '</button>';

      box.innerHTML = '<div class="hre-table-wrap"><table class="hre-table"><thead><tr>' + th + '<th scope="col" style="text-align:right">Aksi</th></tr></thead><tbody>' + tr + '</tbody></table></div>' +
        '<div class="hre-pager"><span class="hre-pager-info">Menampilkan ' + (start + 1) + '–' + Math.min(start + PAGE_SIZE, total) + ' dari ' + total + ' data</span><div class="hre-pager-btns">' + pg + '</div></div>';
    }

    /* --- detail --- */
    function showDetail(r) {
      var rows = [
        ['NIK', esc(r.nik)], ['Nama lengkap', esc(r.name)], ['Jabatan', esc(r.position)],
        ['Departemen', r.department ? esc(r.department) : '<span class="hre-dash">—</span>'],
        ['Email', esc(r.email)], ['No. telepon', r.phone ? esc(r.phone) : '<span class="hre-dash">—</span>'],
        ['Tanggal bergabung', fmtDate(r.join_date) ? esc(fmtDate(r.join_date)) : '<span class="hre-dash">—</span>'],
        ['Gaji pokok', Number(r.salary) > 0 ? esc('Rp ' + Number(r.salary).toLocaleString('id-ID')) : '<span class="hre-dash">—</span>'],
        ['Status', badge(r.status)],
        ['Dibuat pada', r.created_at ? esc(r.created_at) : '<span class="hre-dash">—</span>']
      ].map(function (x) { return '<div class="hre-dl-row"><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var m = openModal('Detail karyawan', '<dl class="hre-dl">' + rows + '</dl>',
        '<button type="button" class="hre-btn hre-btn-ghost" data-close>Tutup</button>' +
        '<button type="button" class="hre-btn hre-btn-danger-soft" data-act="delete">' + ic('trash') + 'Hapus</button>' +
        '<button type="button" class="hre-btn hre-btn-primary" data-act="edit">' + ic('edit') + 'Ubah</button>');
      m.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');
        closeModal();
        if (act === 'edit') showForm(r); else if (act === 'delete') showDelete(r);
      });
    }

    /* --- tambah / ubah --- */
    function showForm(row) {
      var editing = !!row;
      var body = '<form id="hre-form" novalidate><div class="hre-form-error" data-form-error role="alert" hidden></div><div class="hre-form-grid">' +
        FIELDS.map(function (f) {
          var id = 'hre-f-' + f.key, ph = f.ph ? ' placeholder="' + esc(f.ph) + '"' : '', input;
          var val = editing && row[f.key] != null ? String(row[f.key]) : '';
          if (f.type === 'select') {
            var opts = f.options.slice();
            if (val && opts.indexOf(val) < 0) opts.unshift(val);
            input = '<select class="hre-select hre-select-full" id="' + id + '" name="' + f.key + '">' +
              opts.map(function (o) { return '<option value="' + esc(o) + '"' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
          } else {
            input = '<input class="hre-input" id="' + id + '" name="' + f.key + '" type="' + f.type + '"' + ph + (f.attrs ? ' ' + f.attrs : '') + ' value="' + esc(f.type === 'date' ? val.slice(0, 10) : val) + '">';
          }
          return '<div class="hre-field"><label for="' + id + '">' + esc(f.label) + (f.required ? ' <span class="hre-req" aria-hidden="true">*</span>' : '') + '</label>' +
            input + '<div class="hre-err" data-err="' + f.key + '"></div></div>';
        }).join('') + '</div></form>';

      var label = editing ? 'Simpan perubahan' : 'Simpan';
      var m = openModal(editing ? 'Ubah karyawan' : 'Tambah karyawan', body,
        '<button type="button" class="hre-btn hre-btn-ghost" data-close>Batal</button>' +
        '<button type="submit" form="hre-form" class="hre-btn hre-btn-primary" data-submit>' + label + '</button>');

      var form = m.querySelector('#hre-form'), submit = m.querySelector('[data-submit]'), formErr = m.querySelector('[data-form-error]');

      function showErrors(errs) {
        FIELDS.forEach(function (f) {
          var box = form.querySelector('[data-err="' + f.key + '"]'), inp = form.querySelector('[name="' + f.key + '"]');
          box.textContent = errs[f.key] || '';
          if (errs[f.key]) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
        });
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var values = {};
        FIELDS.forEach(function (f) { values[f.key] = form.querySelector('[name="' + f.key + '"]').value.trim(); });
        var errs = validate(values), keys = Object.keys(errs);
        formErr.hidden = true;
        showErrors(errs);
        if (keys.length) { form.querySelector('[name="' + keys[0] + '"]').focus(); return; }

        submit.disabled = true;
        submit.textContent = 'Menyimpan…';
        var req = editing
          ? api('update_employee.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ id: row.id }, values)) })
          : api('add_employee.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
        req.then(function (json) {
          closeModal();
          toast(json.message || (editing ? 'Data karyawan berhasil diperbarui.' : 'Karyawan berhasil ditambahkan.'), 'success');
          if (!editing) S.page = 1;
          return load();
        }).catch(function (err) {
          submit.disabled = false;
          submit.textContent = label;
          showErrors(err.errors || {});
          formErr.hidden = false;
          formErr.textContent = 'Data tidak tersimpan: ' + err.message;
        });
      });
    }

    /* --- hapus (dengan konfirmasi) --- */
    function showDelete(r) {
      var m = openModal('Hapus karyawan',
        '<p class="hre-confirm">Hapus <strong>' + esc(r.name) + '</strong> (NIK ' + esc(r.nik) + ')? Tindakan ini tidak dapat dibatalkan.</p>' +
        '<div class="hre-form-error" data-form-error role="alert" hidden style="margin:14px 0 0"></div>',
        '<button type="button" class="hre-btn hre-btn-ghost" data-close>Batal</button>' +
        '<button type="button" class="hre-btn hre-btn-danger" data-ok>Ya, hapus</button>');
      var ok = m.querySelector('[data-ok]'), err = m.querySelector('[data-form-error]');
      ok.addEventListener('click', function () {
        ok.disabled = true;
        ok.textContent = 'Menghapus…';
        api('delete_employee.php?id=' + encodeURIComponent(r.id), { method: 'DELETE' })
          .then(function (json) {
            closeModal();
            toast(json.message || 'Karyawan berhasil dihapus.', 'success');
            return load();
          })
          .catch(function (e) {
            ok.disabled = false;
            ok.textContent = 'Ya, hapus';
            err.hidden = false;
            err.textContent = 'Data tidak dihapus: ' + e.message;
          });
      });
    }

    /* --- event --- */
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-act]');
      if (!b || !el.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (act === 'add') return showForm(null);
      if (act === 'reload') return load();
      if (act === 'reset') { S.q = ''; S.status = ''; S.dept = ''; S.page = 1; renderToolbar(); return renderTable(); }
      if (act === 'sort') {
        var k = b.getAttribute('data-key');
        S.sort = S.sort.key === k ? { key: k, dir: S.sort.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' };
        return renderTable();
      }
      if (act === 'page') { var n = parseInt(b.getAttribute('data-page'), 10); if (n >= 1) { S.page = n; renderTable(); } return; }
      var id = b.getAttribute('data-id');
      var row = S.rows.filter(function (r) { return String(r.id) === id; })[0];
      if (!row) return;
      if (act === 'detail') showDetail(row);
      else if (act === 'edit') showForm(row);
      else if (act === 'delete') showDelete(row);
    });

    var timer;
    el.addEventListener('input', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-q')) return;
      var v = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(function () { S.q = v; S.page = 1; renderTable(); }, 180);
    });
    el.addEventListener('change', function (e) {
      var f = e.target.getAttribute && e.target.getAttribute('data-f');
      if (!f) return;
      S[f] = e.target.value;
      S.page = 1;
      renderTable();
    });

    load();
  }

  /* Router hanya mengembalikan string HTML; halaman diisi setelah elemennya ada di DOM. */
  function whenReady(id) {
    var tries = 0;
    (function poll() {
      var el = document.getElementById(id);
      if (el) return mount(el);
      if (++tries < 200) setTimeout(poll, 25);
    })();
  }

  return { seq: 0, whenReady: whenReady };
})();

/* ============================================================
   Pengelola Pengajuan Cuti
   Sumber data : HRM_API_BASE + 'manage_leaves.php'   (GET daftar, POST ajukan, PATCH ubah status)
   Daftar karyawan untuk form : HRM_API_BASE + 'get_employees.php'
   Tampilan hanya berubah setelah server menjawab sukses (tidak ada perubahan palsu).
   Semua nama diawali "hrl" / "Hrl" agar tidak bentrok dengan modul lain.
   ============================================================ */
var HrmLeaves = (function () {
  var seq = 0;
  var TYPES = ['Tahunan', 'Sakit', 'Izin'];
  var DEFAULT_QUOTA = 12;
  var PAGE_SIZE = 10;
  var LABEL = { Pending: 'Menunggu', Approved: 'Disetujui', Rejected: 'Ditolak' };
  var TONE = { Pending: 'warn', Approved: 'success', Rejected: 'danger' };

  var ICONS = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    left: '<polyline points="15 18 9 12 15 6"/>',
    right: '<polyline points="9 18 15 12 9 6"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'
  };

  function ic(name, size) {
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">' + (ICONS[name] || '') + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  function fmt(s) {
    var d = parseDate(s);
    return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  }

  function range(a, b) { return a === b ? fmt(a) : fmt(a) + ' – ' + fmt(b); }

  /** Hari cuti: Sabtu/Minggu tidak dihitung, kecuali cuti Sakit. (Aturan sama dengan backend.) */
  function countDays(a, b, type) {
    var d = parseDate(a), e = parseDate(b), n = 0;
    if (!d || !e || e < d) return 0;
    while (d <= e) {
      var w = d.getDay();
      if (type === 'Sakit' || (w !== 0 && w !== 6)) n++;
      d.setDate(d.getDate() + 1);
    }
    return n;
  }

  function daysOf(r) {
    return typeof r.days === 'number' ? r.days : countDays(r.start_date, r.end_date, r.leave_type);
  }

  function usedQuota(rows, name, year, skipId) {
    return rows.filter(function (r) {
      return r.employee_name === name && r.leave_type === 'Tahunan' && r.status !== 'Rejected' &&
        String(r.id) !== String(skipId) && String(r.start_date).slice(0, 4) === String(year);
    }).reduce(function (sum, r) { return sum + daysOf(r); }, 0);
  }

  function badge(status) {
    return '<span class="hrl-badge hrl-badge-' + (TONE[status] || 'neutral') + '">' + esc(LABEL[status] || status) + '</span>';
  }

  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    return esc(((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase());
  }

  /* ---------- Gaya (disisipkan sekali) ---------- */
  function injectStyle() {
    if (document.getElementById('hrl-style')) return;
    var st = document.createElement('style');
    st.id = 'hrl-style';
    st.textContent = `
.hrl{--navy:#0b1a3a;--blue:#2f8fff;--line:#e6ebf2;--muted:#6b7280;--text:#1c2434;--danger:#e9475a;max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:20px;color:var(--text)}
.hrl *,.hrl *::before,.hrl *::after,.hrl-modal *{box-sizing:border-box}
.hrl-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.hrl-title{margin:0;font-size:24px;line-height:1.25;color:var(--navy)}
.hrl-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.hrl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;line-height:1.2;cursor:pointer;transition:background 150ms,box-shadow 150ms}
.hrl-btn:focus-visible,.hrl-icon-btn:focus-visible,.hrl-page-btn:focus-visible,.hrl-th:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.hrl-btn:disabled{opacity:.6;cursor:not-allowed}
.hrl-btn-primary{background:#2f8fff;color:#fff}
.hrl-btn-primary:hover:not(:disabled){background:#1c6fee;box-shadow:0 4px 12px rgba(47,143,255,.35)}
.hrl-btn-ghost{background:#fff;color:#1c2434;border-color:#e6ebf2}
.hrl-btn-ghost:hover:not(:disabled){background:#f6f9fe;border-color:#cfd9ea}
.hrl-btn-ok{background:#15803d;color:#fff}
.hrl-btn-ok:hover:not(:disabled){background:#126c33}
.hrl-btn-danger{background:#e9475a;color:#fff}
.hrl-btn-danger:hover:not(:disabled){background:#d1364a}
.hrl-btn-sm{padding:8px 12px;font-size:13px}
.hrl-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.hrl-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.hrl-stat span{display:block;font-size:13px;color:var(--muted)}
.hrl-stat strong{font-size:26px;color:var(--navy);line-height:1.3}
.hrl-card{background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 2px rgba(11,26,58,.04);min-width:0}
.hrl-banner{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-radius:12px;font-size:13.5px;line-height:1.55;border:1px solid #b9d8ff;background:#eaf3ff;color:#0b2a5c}
.hrl-banner svg{margin-top:2px}
.hrl-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line)}
.hrl-search{position:relative;flex:1 1 260px;max-width:380px;display:block}
.hrl-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#8a94a8;pointer-events:none}
.hrl-search .hrl-input{padding-left:38px}
.hrl-input,.hrl-select{width:100%;height:40px;padding:0 12px;border:1px solid #d9e0ec;border-radius:10px;background:#fff;font:inherit;font-size:14px;color:var(--text)}
.hrl-textarea{height:auto;padding:10px 12px;resize:vertical;line-height:1.5}
.hrl-select{width:auto;max-width:210px}
.hrl-select-full{width:100%;max-width:none}
.hrl-input:focus,.hrl-select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(47,143,255,.14)}
.hrl-input[aria-invalid="true"],.hrl-select[aria-invalid="true"]{border-color:var(--danger)}
.hrl-count{margin-left:auto;font-size:13px;color:var(--muted)}
.hrl-table-wrap{overflow-x:auto;max-width:100%}
.hrl-table{width:100%;border-collapse:collapse;font-size:14px}
.hrl-table th{padding:11px 16px;text-align:left;font-size:12.5px;font-weight:600;color:#5b6780;background:#f8fafd;border-bottom:1px solid var(--line);white-space:nowrap}
.hrl-table td{padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
.hrl-table tbody tr:last-child td{border-bottom:0}
.hrl-table tbody tr:hover td{background:#f8fbff}
.hrl-th{background:none;border:0;padding:0;font:inherit;font-weight:600;color:inherit;cursor:pointer}
.hrl-th:hover{color:var(--navy)}
.hrl-arrow{color:#1c6fee}
.hrl-name{display:flex;align-items:center;gap:12px;min-width:180px}
.hrl-avatar{width:36px;height:36px;border-radius:50%;background:#e8f2ff;color:#1c6fee;display:grid;place-items:center;font-size:13px;font-weight:700;flex:none}
.hrl-name strong{display:block;color:var(--navy)}
.hrl-reason{max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hrl-nowrap{white-space:nowrap}
.hrl-td-actions{text-align:right;white-space:nowrap}
.hrl-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:0;background:transparent;color:#4b5873;cursor:pointer}
.hrl-icon-btn:hover{background:#eef3fb;color:var(--navy)}
.hrl-icon-btn.hrl-tone-ok{color:#15803d}
.hrl-icon-btn.hrl-tone-ok:hover{background:#e6f6ec}
.hrl-icon-btn.hrl-tone-danger{color:#c2263a}
.hrl-icon-btn.hrl-tone-danger:hover{background:#fde8eb}
.hrl-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.hrl-badge-success{background:#e6f6ec;color:#15803d}
.hrl-badge-warn{background:#fff1d6;color:#a15c07}
.hrl-badge-danger{background:#fde8eb;color:#c2263a}
.hrl-badge-neutral{background:#eaeef5;color:#4b5873}
.hrl-dash{color:#a5adbb}
.hrl-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 20px;border-top:1px solid var(--line)}
.hrl-pager-info{font-size:13px;color:var(--muted)}
.hrl-pager-btns{display:flex;gap:4px}
.hrl-page-btn{min-width:34px;height:34px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fff;border-radius:8px;font:inherit;font-size:13px;font-weight:600;color:#4b5873;cursor:pointer}
.hrl-page-btn:hover:not(:disabled){background:#f2f7ff;border-color:#b9d8ff}
.hrl-page-btn.is-active{background:var(--blue);border-color:var(--blue);color:#fff}
.hrl-page-btn:disabled{opacity:.4;cursor:not-allowed}
.hrl-empty{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:8px}
.hrl-empty-ic{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:#eef3fb;color:#5b78a8;margin-bottom:4px}
.hrl-empty h3{margin:0;font-size:16px;color:var(--navy)}
.hrl-empty p{margin:0;max-width:460px;font-size:14px;color:var(--muted);line-height:1.55}
.hrl-empty .hrl-btn{margin-top:10px}
.hrl-skel-wrap{padding:12px 20px}
.hrl-skel-row{display:grid;grid-template-columns:1fr 2fr 1fr 1fr;gap:16px;padding:12px 0}
.hrl-skel{display:block;height:14px;border-radius:6px;background:linear-gradient(90deg,#eef2f8 25%,#f7f9fc 50%,#eef2f8 75%);background-size:200% 100%;animation:hrl-shimmer 1.4s infinite linear}
@keyframes hrl-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.hrl-modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,26,58,.55)}
.hrl-modal{width:min(620px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(11,26,58,.3);color:#1c2434;font-size:14px}
.hrl-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid #e6ebf2}
.hrl-modal-head h2{margin:0;font-size:18px;color:#0b1a3a}
.hrl-modal-body{padding:20px 22px;overflow-y:auto}
.hrl-modal-foot{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:14px 22px;border-top:1px solid #e6ebf2}
.hrl-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.hrl-span2{grid-column:1/-1}
.hrl-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.hrl-field label{font-size:13px;font-weight:600;color:#34405a}
.hrl-req{color:#e9475a}
.hrl-err{font-size:12.5px;color:#e9475a}
.hrl-hint{padding:10px 14px;border-radius:10px;background:#f3f7fd;border:1px solid #e1e9f5;font-size:13px;color:#34405a;line-height:1.55}
.hrl-form-error{margin-top:14px;padding:10px 14px;border-radius:10px;background:#fde8eb;color:#a31f31;font-size:13.5px}
.hrl-form-error[hidden]{display:none}
.hrl-confirm{margin:0 0 14px;line-height:1.6;font-size:14.5px}
.hrl-dl{margin:0;display:flex;flex-direction:column}
.hrl-dl-row{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid #e6ebf2}
.hrl-dl-row:last-child{border-bottom:0}
.hrl-dl dt{color:#6b7280}
.hrl-dl dd{margin:0;overflow-wrap:anywhere}
#hrl-toasts{position:fixed;right:20px;bottom:20px;z-index:1100;display:flex;flex-direction:column;gap:10px;max-width:min(440px,calc(100vw - 40px))}
.hrl-toast{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:12px;color:#fff;font-size:14px;line-height:1.45;background:#0b1a3a;box-shadow:0 10px 30px rgba(11,26,58,.3);transition:opacity 250ms}
.hrl-toast svg{margin-top:2px}
.hrl-toast-success{background:#15803d}
.hrl-toast-error{background:#c2263a}
.hrl-toast.is-out{opacity:0}
@media (max-width:760px){
.hrl-head>.hrl-btn{width:100%}
.hrl-title{font-size:21px}
.hrl-toolbar{padding:14px}
.hrl-search{max-width:none;flex-basis:100%}
.hrl-select{flex:1 1 140px;max-width:none}
.hrl-count{margin-left:0;width:100%}
.hrl-form-grid{grid-template-columns:minmax(0,1fr)}
.hrl-dl-row{grid-template-columns:minmax(0,1fr);gap:2px}
.hrl-modal-foot .hrl-btn{flex:1 1 auto}
.hrl-pager{justify-content:center}
#hrl-toasts{left:16px;right:16px;bottom:16px;max-width:none}
}
@media (prefers-reduced-motion:reduce){.hrl-skel{animation:none}}
`;
    document.head.appendChild(st);
  }

  /* ---------- Komponen kecil: toast & modal ---------- */
  function toast(msg, type) {
    var box = document.getElementById('hrl-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hrl-toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var t = document.createElement('div');
    var kind = type || 'info';
    t.className = 'hrl-toast hrl-toast-' + kind;
    t.innerHTML = ic(kind === 'success' ? 'check' : kind === 'error' ? 'alert' : 'info', 18) + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
    }, kind === 'error' ? 6500 : 4500);
  }

  var escHandler = null;
  function closeModal() {
    var m = document.getElementById('hrl-modal');
    if (m && m.parentNode) m.parentNode.removeChild(m);
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  function openModal(title, body, footer) {
    closeModal();
    var root = document.getElementById('modal-root') || document.body;
    var wrap = document.createElement('div');
    wrap.id = 'hrl-modal';
    wrap.className = 'hrl-modal-backdrop';
    wrap.innerHTML = '<div class="hrl-modal" role="dialog" aria-modal="true" aria-labelledby="hrl-modal-title">' +
      '<div class="hrl-modal-head"><h2 id="hrl-modal-title">' + esc(title) + '</h2>' +
      '<button type="button" class="hrl-icon-btn" data-close aria-label="Tutup">' + ic('x', 18) + '</button></div>' +
      '<div class="hrl-modal-body">' + body + '</div>' +
      (footer ? '<div class="hrl-modal-foot">' + footer + '</div>' : '') + '</div>';
    root.appendChild(wrap);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) closeModal(); });
    wrap.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-close]')) closeModal(); });
    escHandler = function (e) { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', escHandler);
    var first = wrap.querySelector('input,select,textarea');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return wrap;
  }

  /* ---------- API ---------- */
  function api(path, opts) {
    var o = opts || {};
    return fetch(HRM_API_BASE + path, {
      method: o.method || 'GET',
      headers: Object.assign({ Accept: 'application/json' }, o.headers || {}),
      body: o.body,
      credentials: 'same-origin'
    }).then(function (res) {
      return res.text().then(function (txt) {
        var json = null;
        try { json = txt ? JSON.parse(txt) : null; } catch (e) { /* bukan JSON */ }
        if (!json || typeof json.success !== 'boolean') {
          var bad = new Error('Respons server tidak valid (HTTP ' + res.status + '). Pastikan Apache/PHP aktif dan file ' + path + ' ada di folder ' + HRM_API_BASE + '.');
          bad.status = res.status;
          throw bad;
        }
        if (!json.success) {
          var err = new Error(json.message || 'Permintaan gagal.');
          err.status = res.status;
          err.errors = json.errors || {};
          throw err;
        }
        return json;
      });
    }, function () {
      throw new Error('Tidak dapat menghubungi server. Periksa koneksi dan pastikan Apache (XAMPP) berjalan.');
    });
  }

  var JSON_HEADERS = { 'Content-Type': 'application/json' };

  /* ---------- Halaman ---------- */
  function mount(el) {
    injectStyle();
    closeModal();

    var S = { rows: [], emps: [], quota: DEFAULT_QUOTA, meta: null, loading: true, error: null, q: '', status: '', type: '', page: 1, sort: { key: 'start_date', dir: 'desc' } };

    el.innerHTML =
      '<header class="hrl-head"><div><h1 class="hrl-title">Pengajuan Cuti</h1>' +
      '<p class="hrl-sub">Ajukan, pantau, dan proses permohonan cuti karyawan</p></div>' +
      '<button type="button" class="hrl-btn hrl-btn-primary" data-act="add">' + ic('plus') + 'Ajukan Cuti</button></header>' +
      '<div data-slot="banner"></div><div class="hrl-stats" data-slot="stats"></div>' +
      '<section class="hrl-card"><div data-slot="toolbar"></div><div data-slot="table"></div></section>';

    var slot = function (n) { return el.querySelector('[data-slot="' + n + '"]'); };

    /* --- muat data --- */
    function load() {
      S.loading = true;
      S.error = null;
      renderTable();
      return api('manage_leaves.php').then(function (json) {
        S.rows = (json.data && json.data.items) || [];
        S.quota = (json.data && json.data.annual_quota) || DEFAULT_QUOTA;
        S.meta = json.meta || null;
      }).catch(function (err) {
        S.rows = [];
        S.error = err;
      }).then(function () {
        return api('get_employees.php').then(function (j) {
          S.emps = (j.data && j.data.items) || [];
        }).catch(function () { S.emps = null; });
      }).then(function () {
        S.loading = false;
        renderBanner();
        renderStats();
        renderToolbar();
        renderTable();
      });
    }

    function renderBanner() {
      var b = slot('banner');
      b.innerHTML = !S.error && S.meta && S.meta.source === 'mock'
        ? '<div class="hrl-banner" role="status">' + ic('info', 20) + '<div><strong>Data sementara (mock).</strong> ' +
          'Pengajuan disimpan di server pengembangan, bukan database MySQL. Data dapat hilang sewaktu-waktu.</div></div>'
        : '';
    }

    function renderStats() {
      var c = function (s) { return S.rows.filter(function (r) { return r.status === s; }).length; };
      slot('stats').innerHTML = S.error ? '' :
        [['Total pengajuan', S.rows.length], ['Menunggu', c('Pending')], ['Disetujui', c('Approved')], ['Ditolak', c('Rejected')]]
          .map(function (x) { return '<div class="hrl-stat"><span>' + x[0] + '</span><strong>' + x[1] + '</strong></div>'; }).join('');
    }

    function renderToolbar() {
      if (S.error) { slot('toolbar').innerHTML = ''; return; }
      var sel = function (list, cur) {
        return list.map(function (v) { return '<option value="' + esc(v[0]) + '"' + (v[0] === cur ? ' selected' : '') + '>' + esc(v[1]) + '</option>'; }).join('');
      };
      slot('toolbar').innerHTML =
        '<div class="hrl-toolbar"><label class="hrl-search">' + ic('search') +
        '<input type="search" class="hrl-input" data-q value="' + esc(S.q) + '" placeholder="Cari nama, jenis, atau alasan…" aria-label="Cari pengajuan cuti"></label>' +
        '<select class="hrl-select" data-f="status" aria-label="Filter status"><option value="">Semua status</option>' +
        sel(Object.keys(LABEL).map(function (k) { return [k, LABEL[k]]; }), S.status) + '</select>' +
        '<select class="hrl-select" data-f="type" aria-label="Filter jenis cuti"><option value="">Semua jenis</option>' +
        sel(TYPES.map(function (t) { return [t, t]; }), S.type) + '</select>' +
        '<button type="button" class="hrl-btn hrl-btn-ghost hrl-btn-sm" data-act="reset">Atur ulang</button>' +
        '<span class="hrl-count" data-slot="count" aria-live="polite"></span></div>';
    }

    /* --- filter + urut --- */
    function filtered() {
      var q = S.q.trim().toLowerCase();
      var list = S.rows.filter(function (r) {
        if (S.status && r.status !== S.status) return false;
        if (S.type && r.leave_type !== S.type) return false;
        if (!q) return true;
        return ['employee_name', 'leave_type', 'reason'].some(function (k) {
          return String(r[k] == null ? '' : r[k]).toLowerCase().indexOf(q) > -1;
        });
      });
      var k = S.sort.key, d = S.sort.dir === 'desc' ? -1 : 1;
      return list.slice().sort(function (a, b) {
        var x = String(a[k] == null ? '' : a[k]), y = String(b[k] == null ? '' : b[k]);
        var c = x.localeCompare(y, 'id', { numeric: true }) * d;
        return c !== 0 ? c : (b.id - a.id);
      });
    }

    function empty(icon, title, text, extra) {
      return '<div class="hrl-empty"><div class="hrl-empty-ic">' + ic(icon, 26) + '</div><h3>' + esc(title) + '</h3>' +
        (text ? '<p>' + esc(text) + '</p>' : '') + (extra || '') + '</div>';
    }

    /* --- tabel --- */
    function renderTable() {
      var box = slot('table');
      var cnt = el.querySelector('[data-slot="count"]');
      if (!box) return;

      if (S.loading) {
        var sk = '';
        for (var i = 0; i < 5; i++) sk += '<div class="hrl-skel-row"><span class="hrl-skel"></span><span class="hrl-skel"></span><span class="hrl-skel"></span><span class="hrl-skel"></span></div>';
        box.innerHTML = '<div class="hrl-skel-wrap" aria-busy="true">' + sk + '</div>';
        return;
      }
      if (S.error) {
        box.innerHTML = empty('alert', 'Data cuti gagal dimuat', S.error.message,
          '<button type="button" class="hrl-btn hrl-btn-primary" data-act="reload">' + ic('refresh') + 'Coba lagi</button>');
        return;
      }
      if (!S.rows.length) {
        if (cnt) cnt.textContent = '0 data';
        box.innerHTML = empty('calendar', 'Belum ada pengajuan cuti', 'Klik "Ajukan Cuti" untuk membuat pengajuan pertama.');
        return;
      }

      var list = filtered();
      var total = list.length;
      if (cnt) cnt.textContent = total === S.rows.length ? total + ' data' : total + ' dari ' + S.rows.length + ' data';
      if (!total) {
        box.innerHTML = empty('search', 'Tidak ada hasil', 'Tidak ada pengajuan yang cocok dengan pencarian atau filter.',
          '<button type="button" class="hrl-btn hrl-btn-ghost" data-act="reset">Atur ulang pencarian</button>');
        return;
      }

      var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (S.page > pages) S.page = pages;
      var start = (S.page - 1) * PAGE_SIZE;
      var slice = list.slice(start, start + PAGE_SIZE);

      var cols = [['employee_name', 'Nama'], ['leave_type', 'Jenis Cuti'], ['start_date', 'Tanggal']];
      var thSort = function (c) {
        var on = S.sort.key === c[0];
        return '<th scope="col" aria-sort="' + (on ? (S.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
          '<button type="button" class="hrl-th" data-act="sort" data-key="' + c[0] + '">' + c[1] +
          '<span class="hrl-arrow">' + (on ? (S.sort.dir === 'asc' ? ' ↑' : ' ↓') : '') + '</span></button></th>';
      };
      var th = thSort(cols[0]) + thSort(cols[1]) + thSort(cols[2]) + '<th scope="col">Durasi</th><th scope="col">Alasan</th>' + thSort(['status', 'Status']);

      var tr = slice.map(function (r) {
        var id = esc(r.id), nm = esc(r.employee_name);
        var acts = '<button type="button" class="hrl-icon-btn" data-act="detail" data-id="' + id + '" title="Detail" aria-label="Lihat detail cuti ' + nm + '">' + ic('eye') + '</button>';
        if (r.status === 'Pending') {
          acts += '<button type="button" class="hrl-icon-btn hrl-tone-ok" data-act="approve" data-id="' + id + '" title="Setujui" aria-label="Setujui cuti ' + nm + '">' + ic('check') + '</button>' +
            '<button type="button" class="hrl-icon-btn hrl-tone-danger" data-act="reject" data-id="' + id + '" title="Tolak" aria-label="Tolak cuti ' + nm + '">' + ic('x') + '</button>';
        }
        return '<tr><td><div class="hrl-name"><span class="hrl-avatar">' + initials(r.employee_name) + '</span><div><strong>' + nm + '</strong></div></div></td>' +
          '<td>' + esc(r.leave_type) + '</td><td class="hrl-nowrap">' + esc(range(r.start_date, r.end_date)) + '</td>' +
          '<td class="hrl-nowrap">' + daysOf(r) + ' hari</td>' +
          '<td><div class="hrl-reason" title="' + esc(r.reason) + '">' + esc(r.reason) + '</div></td>' +
          '<td>' + badge(r.status) + '</td><td class="hrl-td-actions">' + acts + '</td></tr>';
      }).join('');

      var a = Math.max(1, S.page - 2), b = Math.min(pages, a + 4);
      a = Math.max(1, b - 4);
      var pg = '<button type="button" class="hrl-page-btn" data-act="page" data-page="' + (S.page - 1) + '"' + (S.page <= 1 ? ' disabled' : '') + ' aria-label="Halaman sebelumnya">' + ic('left') + '</button>';
      for (var n = a; n <= b; n++) {
        pg += '<button type="button" class="hrl-page-btn' + (n === S.page ? ' is-active' : '') + '" data-act="page" data-page="' + n + '"' + (n === S.page ? ' aria-current="page"' : '') + '>' + n + '</button>';
      }
      pg += '<button type="button" class="hrl-page-btn" data-act="page" data-page="' + (S.page + 1) + '"' + (S.page >= pages ? ' disabled' : '') + ' aria-label="Halaman berikutnya">' + ic('right') + '</button>';

      box.innerHTML = '<div class="hrl-table-wrap"><table class="hrl-table"><thead><tr>' + th + '<th scope="col" style="text-align:right">Aksi</th></tr></thead><tbody>' + tr + '</tbody></table></div>' +
        '<div class="hrl-pager"><span class="hrl-pager-info">Menampilkan ' + (start + 1) + '–' + Math.min(start + PAGE_SIZE, total) + ' dari ' + total + ' data</span><div class="hrl-pager-btns">' + pg + '</div></div>';
    }

    /* --- detail --- */
    function showDetail(r) {
      var dash = '<span class="hrl-dash">—</span>';
      var rows = [
        ['Karyawan', esc(r.employee_name)], ['Jenis cuti', esc(r.leave_type)],
        ['Tanggal', esc(range(r.start_date, r.end_date))], ['Durasi', daysOf(r) + ' hari'],
        ['Alasan', esc(r.reason)], ['Status', badge(r.status)],
        ['Catatan HRM', r.review_note ? esc(r.review_note) : dash],
        ['Diajukan pada', r.created_at ? esc(r.created_at) : dash],
        ['Diproses pada', r.reviewed_at ? esc(r.reviewed_at) : dash]
      ].map(function (x) { return '<div class="hrl-dl-row"><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      var pending = r.status === 'Pending';
      var m = openModal('Detail pengajuan cuti', '<dl class="hrl-dl">' + rows + '</dl>',
        '<button type="button" class="hrl-btn hrl-btn-ghost" data-close>Tutup</button>' +
        (pending ? '<button type="button" class="hrl-btn hrl-btn-danger" data-act="reject">' + ic('x') + 'Tolak</button>' +
          '<button type="button" class="hrl-btn hrl-btn-ok" data-act="approve">' + ic('check') + 'Setujui</button>' : ''));
      m.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-act]');
        if (!b) return;
        showReview(r, b.getAttribute('data-act') === 'approve' ? 'Approved' : 'Rejected');
      });
    }

    /* --- setujui / tolak (dengan catatan) --- */
    function showReview(r, decision) {
      var approve = decision === 'Approved';
      var m = openModal(approve ? 'Setujui pengajuan cuti' : 'Tolak pengajuan cuti',
        '<p class="hrl-confirm">' + (approve ? 'Setujui' : 'Tolak') + ' cuti <strong>' + esc(r.employee_name) + '</strong> (' + esc(r.leave_type) + ', ' +
        esc(range(r.start_date, r.end_date)) + ', ' + daysOf(r) + ' hari)?</p>' +
        '<div class="hrl-field"><label for="hrl-note">Catatan HRM' + (approve ? ' (opsional)' : ' <span class="hrl-req" aria-hidden="true">*</span>') + '</label>' +
        '<textarea class="hrl-input hrl-textarea" id="hrl-note" rows="3" maxlength="255" placeholder="' + (approve ? 'Contoh: Disetujui, selamat berlibur.' : 'Tulis alasan penolakan') + '"></textarea>' +
        '<div class="hrl-err" data-err></div></div>' +
        '<div class="hrl-form-error" data-form-error role="alert" hidden></div>',
        '<button type="button" class="hrl-btn hrl-btn-ghost" data-close>Batal</button>' +
        '<button type="button" class="hrl-btn ' + (approve ? 'hrl-btn-ok' : 'hrl-btn-danger') + '" data-ok>' + (approve ? 'Ya, setujui' : 'Ya, tolak') + '</button>');
      var ok = m.querySelector('[data-ok]'), note = m.querySelector('#hrl-note'), fe = m.querySelector('[data-err]'), formErr = m.querySelector('[data-form-error]');
      var label = ok.textContent;
      ok.addEventListener('click', function () {
        var text = note.value.trim();
        fe.textContent = '';
        note.removeAttribute('aria-invalid');
        if (!approve && text.length < 3) {
          fe.textContent = 'Alasan penolakan wajib diisi (minimal 3 karakter).';
          note.setAttribute('aria-invalid', 'true');
          note.focus();
          return;
        }
        ok.disabled = true;
        ok.textContent = 'Menyimpan…';
        api('manage_leaves.php', { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ id: r.id, status: decision, review_note: text }) })
          .then(function (json) {
            closeModal();
            toast(approve ? 'Pengajuan cuti ' + r.employee_name + ' disetujui.' : 'Pengajuan cuti ' + r.employee_name + ' ditolak.', 'success');
            return load();
          })
          .catch(function (err) {
            ok.disabled = false;
            ok.textContent = label;
            formErr.hidden = false;
            formErr.textContent = 'Status tidak berubah: ' + err.message;
          });
      });
    }

    /* --- form ajukan cuti --- */
    function showForm() {
      var empList = (S.emps || []).filter(function (e) { return e.status !== 'Nonaktif'; });
      var today = new Date();
      var iso = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
      var blocked = S.emps === null ? 'Daftar karyawan gagal dimuat, jadi pengajuan belum bisa dibuat. Muat ulang halaman lalu coba lagi.'
        : (!empList.length ? 'Belum ada karyawan aktif. Tambahkan data karyawan terlebih dahulu.' : '');

      var body = '<form id="hrl-form" novalidate><div class="hrl-form-grid">' +
        '<div class="hrl-field hrl-span2"><label for="hrl-f-employee_name">Karyawan <span class="hrl-req" aria-hidden="true">*</span></label>' +
        '<select class="hrl-select hrl-select-full" id="hrl-f-employee_name" name="employee_name"><option value="">Pilih karyawan…</option>' +
        empList.map(function (e) { return '<option value="' + esc(e.name) + '">' + esc(e.name) + (e.position ? ' — ' + esc(e.position) : '') + '</option>'; }).join('') +
        '</select><div class="hrl-err" data-err="employee_name"></div></div>' +
        '<div class="hrl-field hrl-span2"><label for="hrl-f-leave_type">Jenis cuti <span class="hrl-req" aria-hidden="true">*</span></label>' +
        '<select class="hrl-select hrl-select-full" id="hrl-f-leave_type" name="leave_type">' +
        TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select><div class="hrl-err" data-err="leave_type"></div></div>' +
        '<div class="hrl-field"><label for="hrl-f-start_date">Tanggal mulai <span class="hrl-req" aria-hidden="true">*</span></label>' +
        '<input class="hrl-input" type="date" id="hrl-f-start_date" name="start_date" value="' + iso + '"><div class="hrl-err" data-err="start_date"></div></div>' +
        '<div class="hrl-field"><label for="hrl-f-end_date">Tanggal selesai <span class="hrl-req" aria-hidden="true">*</span></label>' +
        '<input class="hrl-input" type="date" id="hrl-f-end_date" name="end_date" value="' + iso + '"><div class="hrl-err" data-err="end_date"></div></div>' +
        '<div class="hrl-hint hrl-span2" data-info></div>' +
        '<div class="hrl-field hrl-span2"><label for="hrl-f-reason">Alasan <span class="hrl-req" aria-hidden="true">*</span></label>' +
        '<textarea class="hrl-input hrl-textarea" id="hrl-f-reason" name="reason" rows="3" maxlength="500" placeholder="Tulis alasan cuti"></textarea><div class="hrl-err" data-err="reason"></div></div>' +
        '</div><div class="hrl-form-error" data-form-error role="alert"' + (blocked ? '' : ' hidden') + '>' + esc(blocked) + '</div></form>';

      var m = openModal('Ajukan cuti', body,
        '<button type="button" class="hrl-btn hrl-btn-ghost" data-close>Batal</button>' +
        '<button type="submit" form="hrl-form" class="hrl-btn hrl-btn-primary" data-submit' + (blocked ? ' disabled' : '') + '>Kirim pengajuan</button>');

      var form = m.querySelector('#hrl-form'), submit = m.querySelector('[data-submit]'), formErr = m.querySelector('[data-form-error]'), info = m.querySelector('[data-info]');
      var KEYS = ['employee_name', 'leave_type', 'start_date', 'end_date', 'reason'];
      var val = function (k) { return form.querySelector('[name="' + k + '"]').value.trim(); };

      function updateInfo() {
        var n = val('employee_name'), t = val('leave_type'), a = val('start_date'), b = val('end_date'), parts = [];
        if (a && b && b >= a) parts.push('Durasi: <strong>' + countDays(a, b, t) + ' hari</strong> ' + (t === 'Sakit' ? '(termasuk akhir pekan)' : '(tanpa Sabtu/Minggu)'));
        if (t === 'Tahunan' && n) {
          var yr = a ? a.slice(0, 4) : String(new Date().getFullYear());
          parts.push('Sisa kuota tahunan ' + yr + ': <strong>' + (S.quota - usedQuota(S.rows, n, yr)) + ' dari ' + S.quota + ' hari</strong>');
        }
        info.innerHTML = parts.length ? parts.join('. ') + '.' : 'Pilih karyawan dan tanggal untuk melihat durasi dan sisa kuota.';
      }
      updateInfo();
      form.addEventListener('change', function (e) {
        if (e.target.name === 'start_date') {
          var end = form.querySelector('[name="end_date"]');
          if (!end.value || end.value < e.target.value) end.value = e.target.value;
        }
        updateInfo();
      });

      function showErrors(errs) {
        KEYS.forEach(function (k) {
          var box = form.querySelector('[data-err="' + k + '"]'), inp = form.querySelector('[name="' + k + '"]');
          box.textContent = errs[k] || '';
          if (errs[k]) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
        });
      }

      function validate(v) {
        var e = {};
        if (!v.employee_name) e.employee_name = 'Karyawan wajib dipilih.';
        if (!v.start_date) e.start_date = 'Tanggal mulai wajib diisi.';
        if (!v.end_date) e.end_date = 'Tanggal selesai wajib diisi.';
        if (v.start_date && v.end_date && v.end_date < v.start_date) e.end_date = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
        if (!v.reason) e.reason = 'Alasan wajib diisi.';
        else if (v.reason.length < 3) e.reason = 'Alasan minimal 3 karakter.';
        if (!e.start_date && !e.end_date && v.employee_name) {
          var days = countDays(v.start_date, v.end_date, v.leave_type);
          if (!days) e.start_date = 'Rentang tanggal hanya berisi akhir pekan.';
          else if (S.rows.some(function (r) { return r.employee_name === v.employee_name && r.status !== 'Rejected' && r.start_date <= v.end_date && r.end_date >= v.start_date; })) {
            e.start_date = v.employee_name + ' sudah punya pengajuan cuti pada rentang tanggal ini.';
          } else if (v.leave_type === 'Tahunan') {
            var left = S.quota - usedQuota(S.rows, v.employee_name, v.start_date.slice(0, 4));
            if (days > left) e.end_date = 'Kuota cuti tahunan tidak cukup (sisa ' + left + ' hari, diajukan ' + days + ' hari).';
          }
        }
        return e;
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (blocked) return;
        var values = {};
        KEYS.forEach(function (k) { values[k] = val(k); });
        var errs = validate(values), keys = Object.keys(errs);
        formErr.hidden = true;
        showErrors(errs);
        if (keys.length) { form.querySelector('[name="' + keys[0] + '"]').focus(); return; }

        submit.disabled = true;
        submit.textContent = 'Mengirim…';
        api('manage_leaves.php', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(values) })
          .then(function (json) {
            closeModal();
            toast('Pengajuan cuti ' + values.employee_name + ' berhasil dikirim.', 'success');
            S.page = 1;
            return load();
          })
          .catch(function (err) {
            submit.disabled = false;
            submit.textContent = 'Kirim pengajuan';
            showErrors(err.errors || {});
            formErr.hidden = false;
            formErr.textContent = 'Pengajuan tidak tersimpan: ' + err.message;
          });
      });
    }

    /* --- event --- */
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-act]');
      if (!b || !el.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (act === 'add') return showForm();
      if (act === 'reload') return load();
      if (act === 'reset') { S.q = ''; S.status = ''; S.type = ''; S.page = 1; renderToolbar(); return renderTable(); }
      if (act === 'sort') {
        var k = b.getAttribute('data-key');
        S.sort = S.sort.key === k ? { key: k, dir: S.sort.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' };
        return renderTable();
      }
      if (act === 'page') { var n = parseInt(b.getAttribute('data-page'), 10); if (n >= 1) { S.page = n; renderTable(); } return; }
      var id = b.getAttribute('data-id');
      var row = S.rows.filter(function (r) { return String(r.id) === id; })[0];
      if (!row) return;
      if (act === 'detail') showDetail(row);
      else if (act === 'approve') showReview(row, 'Approved');
      else if (act === 'reject') showReview(row, 'Rejected');
    });

    var timer;
    el.addEventListener('input', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-q')) return;
      var v = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(function () { S.q = v; S.page = 1; renderTable(); }, 180);
    });
    el.addEventListener('change', function (e) {
      var f = e.target.getAttribute && e.target.getAttribute('data-f');
      if (!f) return;
      S[f] = e.target.value;
      S.page = 1;
      renderTable();
    });

    load();
  }

  /* Router hanya mengembalikan string HTML; halaman diisi setelah elemennya ada di DOM. */
  function whenReady(id) {
    var tries = 0;
    (function poll() {
      var el = document.getElementById(id);
      if (el) return mount(el);
      if (++tries < 200) setTimeout(poll, 25);
    })();
  }

  return { seq: 0, whenReady: whenReady };
})();

// ---- PAGE: Pengajuan Cuti (pengelola pengajuan cuti, lihat HrmLeaves di atas) ----
function pageHrmLeaves() {
  var id = 'hrl-root-' + (++HrmLeaves.seq);
  HrmLeaves.whenReady(id);
  return `<div id="${id}" class="hrl"><p style="padding:24px;color:#6b7280">Memuat data cuti…</p></div>`;
}

/* ============================================================
   HrmKit - perangkat bersama untuk halaman Event & Registrasi
   (ikon, gaya, toast, modal, pemanggil API, pager). Semua kelas CSS
   berawalan "hk-" agar tidak bentrok dengan modul lain.
   ============================================================ */
var HrmKit = (function () {
  var ICONS = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    left: '<polyline points="15 18 9 12 15 6"/>',
    right: '<polyline points="9 18 15 12 9 6"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'
  };

  function ic(name, size) {
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">' + (ICONS[name] || '') + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
    if (!m) return '';
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtDateTime(v) {
    var m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/.exec(String(v || ''));
    return m ? fmtDate(m[1]) + ', ' + m[2] + ':' + m[3] : fmtDate(v);
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    return esc(((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase());
  }

  /* ---------- Gaya (disisipkan sekali) ---------- */
  function injectStyle() {
    if (document.getElementById('hk-style')) return;
    var st = document.createElement('style');
    st.id = 'hk-style';
    st.textContent = `
.hk{--navy:#0b1a3a;--blue:#2f8fff;--line:#e6ebf2;--muted:#6b7280;--text:#1c2434;--danger:#e9475a;max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:20px;color:var(--text)}
.hk *,.hk *::before,.hk *::after,.hk-modal *{box-sizing:border-box}
.hk-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.hk-title{margin:0;font-size:24px;line-height:1.25;color:var(--navy)}
.hk-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.hk-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;line-height:1.2;cursor:pointer;transition:background 150ms,box-shadow 150ms}
.hk-btn:focus-visible,.hk-icon-btn:focus-visible,.hk-page-btn:focus-visible,.hk-th:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.hk-btn:disabled{opacity:.6;cursor:not-allowed}
.hk-btn-primary{background:#2f8fff;color:#fff}
.hk-btn-primary:hover:not(:disabled){background:#1c6fee;box-shadow:0 4px 12px rgba(47,143,255,.35)}
.hk-btn-ghost{background:#fff;color:#1c2434;border-color:#e6ebf2}
.hk-btn-ghost:hover:not(:disabled){background:#f6f9fe;border-color:#cfd9ea}
.hk-btn-danger{background:#e9475a;color:#fff}
.hk-btn-danger:hover:not(:disabled){background:#d1364a}
.hk-btn-sm{padding:8px 12px;font-size:13px}
.hk-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.hk-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.hk-stat span{display:block;font-size:13px;color:var(--muted)}
.hk-stat strong{font-size:26px;color:var(--navy);line-height:1.3}
.hk-card{background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 2px rgba(11,26,58,.04);min-width:0}
.hk-banner{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-radius:12px;font-size:13.5px;line-height:1.55;border:1px solid #b9d8ff;background:#eaf3ff;color:#0b2a5c}
.hk-banner svg{margin-top:2px}
.hk-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line)}
.hk-search{position:relative;flex:1 1 260px;max-width:380px;display:block}
.hk-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#8a94a8;pointer-events:none}
.hk-search .hk-input{padding-left:38px}
.hk-input,.hk-select{width:100%;height:40px;padding:0 12px;border:1px solid #d9e0ec;border-radius:10px;background:#fff;font:inherit;font-size:14px;color:var(--text)}
.hk-textarea{height:auto;padding:10px 12px;resize:vertical;line-height:1.5}
.hk-select{width:auto;max-width:230px}
.hk-select-full{width:100%;max-width:none}
.hk-input:focus,.hk-select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(47,143,255,.14)}
.hk-input[aria-invalid="true"],.hk-select[aria-invalid="true"]{border-color:var(--danger)}
.hk-count{margin-left:auto;font-size:13px;color:var(--muted)}
.hk-table-wrap{overflow-x:auto;max-width:100%}
.hk-table{width:100%;border-collapse:collapse;font-size:14px}
.hk-table th{padding:11px 16px;text-align:left;font-size:12.5px;font-weight:600;color:#5b6780;background:#f8fafd;border-bottom:1px solid var(--line);white-space:nowrap}
.hk-table td{padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
.hk-table tbody tr:last-child td{border-bottom:0}
.hk-table tbody tr:hover td{background:#f8fbff}
.hk-th{background:none;border:0;padding:0;font:inherit;font-weight:600;color:inherit;cursor:pointer}
.hk-th:hover{color:var(--navy)}
.hk-arrow{color:#1c6fee}
.hk-name{display:flex;align-items:center;gap:12px;min-width:200px}
.hk-avatar{width:36px;height:36px;border-radius:50%;background:#e8f2ff;color:#1c6fee;display:grid;place-items:center;font-size:13px;font-weight:700;flex:none}
.hk-name strong{display:block;color:var(--navy)}
.hk-name small{color:var(--muted)}
.hk-nowrap{white-space:nowrap}
.hk-td-actions{text-align:right;white-space:nowrap}
.hk-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:0;background:transparent;color:#4b5873;cursor:pointer}
.hk-icon-btn:hover{background:#eef3fb;color:var(--navy)}
.hk-icon-btn.hk-tone-danger{color:#c2263a}
.hk-icon-btn.hk-tone-danger:hover{background:#fde8eb}
.hk-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.hk-badge-success{background:#e6f6ec;color:#15803d}
.hk-badge-warn{background:#fff1d6;color:#a15c07}
.hk-badge-danger{background:#fde8eb;color:#c2263a}
.hk-badge-info{background:#e3f0ff;color:#1c5fc0}
.hk-badge-neutral{background:#eaeef5;color:#4b5873}
.hk-dash{color:#a5adbb}
.hk-chip{display:inline-block;padding:2px 9px;border-radius:6px;background:#eef3fb;color:#4b5873;font-size:12px;font-weight:600}
.hk-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 20px;border-top:1px solid var(--line)}
.hk-pager-info{font-size:13px;color:var(--muted)}
.hk-pager-btns{display:flex;gap:4px}
.hk-page-btn{min-width:34px;height:34px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);background:#fff;border-radius:8px;font:inherit;font-size:13px;font-weight:600;color:#4b5873;cursor:pointer}
.hk-page-btn:hover:not(:disabled){background:#f2f7ff;border-color:#b9d8ff}
.hk-page-btn.is-active{background:var(--blue);border-color:var(--blue);color:#fff}
.hk-page-btn:disabled{opacity:.4;cursor:not-allowed}
.hk-empty{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:8px}
.hk-empty-ic{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:#eef3fb;color:#5b78a8;margin-bottom:4px}
.hk-empty h3{margin:0;font-size:16px;color:var(--navy)}
.hk-empty p{margin:0;max-width:460px;font-size:14px;color:var(--muted);line-height:1.55}
.hk-empty .hk-btn{margin-top:10px}
.hk-skel-wrap{padding:12px 20px}
.hk-skel-row{display:grid;grid-template-columns:1fr 2fr 1fr 1fr;gap:16px;padding:12px 0}
.hk-skel{display:block;height:14px;border-radius:6px;background:linear-gradient(90deg,#eef2f8 25%,#f7f9fc 50%,#eef2f8 75%);background-size:200% 100%;animation:hk-shimmer 1.4s infinite linear}
@keyframes hk-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.hk-evgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;padding:20px}
.hk-ev{display:flex;flex-direction:column;gap:10px;border:1px solid var(--line);border-radius:14px;padding:16px 18px;background:#fff;min-width:0}
.hk-ev:hover{border-color:#b9d8ff;box-shadow:0 4px 14px rgba(47,143,255,.1)}
.hk-ev-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.hk-ev-date{font-size:12.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#1c6fee}
.hk-ev-title{margin:0;font-size:17px;line-height:1.35;color:var(--navy);overflow-wrap:anywhere}
.hk-ev-meta{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--muted)}
.hk-ev-meta li{display:inline-flex;align-items:center;gap:6px}
.hk-ev-desc{margin:0;font-size:13.5px;line-height:1.55;color:#4b5873;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.hk-ev-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:10px;border-top:1px solid var(--line)}
.hk-ev-count{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#4b5873}
.hk-modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,26,58,.55)}
.hk-modal{width:min(640px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(11,26,58,.3);color:#1c2434;font-size:14px}
.hk-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid #e6ebf2}
.hk-modal-head h2{margin:0;font-size:18px;color:#0b1a3a}
.hk-modal-body{padding:20px 22px;overflow-y:auto}
.hk-modal-foot{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:14px 22px;border-top:1px solid #e6ebf2}
.hk-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.hk-span2{grid-column:1/-1}
.hk-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.hk-field label{font-size:13px;font-weight:600;color:#34405a}
.hk-req{color:#e9475a}
.hk-err{font-size:12.5px;color:#e9475a}
.hk-form-error{margin-top:14px;padding:10px 14px;border-radius:10px;background:#fde8eb;color:#a31f31;font-size:13.5px}
.hk-form-error[hidden]{display:none}
.hk-confirm{margin:0;line-height:1.6;font-size:14.5px}
.hk-dl{margin:0;display:flex;flex-direction:column}
.hk-dl-row{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid #e6ebf2}
.hk-dl-row:last-child{border-bottom:0}
.hk-dl dt{color:#6b7280}
.hk-dl dd{margin:0;overflow-wrap:anywhere}
.hk-plist{list-style:none;margin:0;padding:0;max-height:200px;overflow-y:auto;border:1px solid #e6ebf2;border-radius:10px}
.hk-plist li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border-bottom:1px solid #e6ebf2}
.hk-plist li:last-child{border-bottom:0}
.hk-plist small{display:block;color:#6b7280}
.hk-h3{margin:18px 0 8px;font-size:14px;color:#0b1a3a}
#hk-toasts{position:fixed;right:20px;bottom:20px;z-index:1100;display:flex;flex-direction:column;gap:10px;max-width:min(440px,calc(100vw - 40px))}
.hk-toast{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:12px;color:#fff;font-size:14px;line-height:1.45;background:#0b1a3a;box-shadow:0 10px 30px rgba(11,26,58,.3);transition:opacity 250ms}
.hk-toast svg{margin-top:2px}
.hk-toast-success{background:#15803d}
.hk-toast-error{background:#c2263a}
.hk-toast.is-out{opacity:0}
@media (max-width:760px){
.hk-head>.hk-btn{width:100%}
.hk-title{font-size:21px}
.hk-toolbar{padding:14px}
.hk-search{max-width:none;flex-basis:100%}
.hk-select{flex:1 1 140px;max-width:none}
.hk-count{margin-left:0;width:100%}
.hk-evgrid{grid-template-columns:minmax(0,1fr);padding:14px}
.hk-form-grid{grid-template-columns:minmax(0,1fr)}
.hk-dl-row{grid-template-columns:minmax(0,1fr);gap:2px}
.hk-modal-foot .hk-btn{flex:1 1 auto}
.hk-pager{justify-content:center}
#hk-toasts{left:16px;right:16px;bottom:16px;max-width:none}
}
@media (prefers-reduced-motion:reduce){.hk-skel{animation:none}}
`;
    document.head.appendChild(st);
  }

  /* ---------- Toast & modal ---------- */
  function toast(msg, type) {
    var box = document.getElementById('hk-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hk-toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var t = document.createElement('div');
    var kind = type || 'info';
    t.className = 'hk-toast hk-toast-' + kind;
    t.innerHTML = ic(kind === 'success' ? 'check' : kind === 'error' ? 'alert' : 'info', 18) + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
    }, kind === 'error' ? 6500 : 4500);
  }

  var escHandler = null;
  function closeModal() {
    var m = document.getElementById('hk-modal');
    if (m && m.parentNode) m.parentNode.removeChild(m);
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  function openModal(title, body, footer) {
    closeModal();
    var root = document.getElementById('modal-root') || document.body;
    var wrap = document.createElement('div');
    wrap.id = 'hk-modal';
    wrap.className = 'hk-modal-backdrop';
    wrap.innerHTML = '<div class="hk-modal" role="dialog" aria-modal="true" aria-labelledby="hk-modal-title">' +
      '<div class="hk-modal-head"><h2 id="hk-modal-title">' + esc(title) + '</h2>' +
      '<button type="button" class="hk-icon-btn" data-close aria-label="Tutup">' + ic('x', 18) + '</button></div>' +
      '<div class="hk-modal-body">' + body + '</div>' +
      (footer ? '<div class="hk-modal-foot">' + footer + '</div>' : '') + '</div>';
    root.appendChild(wrap);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) closeModal(); });
    wrap.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-close]')) closeModal(); });
    escHandler = function (e) { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', escHandler);
    var first = wrap.querySelector('input,select,textarea');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return wrap;
  }

  /* ---------- API ---------- */
  var JSON_HEADERS = { 'Content-Type': 'application/json' };

  function api(path, opts) {
    var o = opts || {};
    return fetch(HRM_API_BASE + path, {
      method: o.method || 'GET',
      headers: Object.assign({ Accept: 'application/json' }, o.headers || {}),
      body: o.body,
      credentials: 'same-origin'
    }).then(function (res) {
      return res.text().then(function (txt) {
        var json = null;
        try { json = txt ? JSON.parse(txt) : null; } catch (e) { /* bukan JSON */ }
        if (!json || typeof json.success !== 'boolean') {
          var bad = new Error('Respons server tidak valid (HTTP ' + res.status + '). Pastikan Apache/PHP aktif dan file ' + path + ' ada di folder ' + HRM_API_BASE + '.');
          bad.status = res.status;
          throw bad;
        }
        if (!json.success) {
          var err = new Error(json.message || 'Permintaan gagal.');
          err.status = res.status;
          err.errors = json.errors || {};
          throw err;
        }
        return json;
      });
    }, function () {
      throw new Error('Tidak dapat menghubungi server. Periksa koneksi dan pastikan Apache (XAMPP) berjalan.');
    });
  }

  /* ---------- Potongan tampilan bersama ---------- */
  function empty(icon, title, text, extra) {
    return '<div class="hk-empty"><div class="hk-empty-ic">' + ic(icon, 26) + '</div><h3>' + esc(title) + '</h3>' +
      (text ? '<p>' + esc(text) + '</p>' : '') + (extra || '') + '</div>';
  }

  function skeleton() {
    var sk = '';
    for (var i = 0; i < 5; i++) sk += '<div class="hk-skel-row"><span class="hk-skel"></span><span class="hk-skel"></span><span class="hk-skel"></span><span class="hk-skel"></span></div>';
    return '<div class="hk-skel-wrap" aria-busy="true">' + sk + '</div>';
  }

  function pager(page, size, total) {
    var pages = Math.max(1, Math.ceil(total / size));
    var start = (page - 1) * size;
    var a = Math.max(1, page - 2), b = Math.min(pages, a + 4);
    a = Math.max(1, b - 4);
    var pg = '<button type="button" class="hk-page-btn" data-act="page" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="Halaman sebelumnya">' + ic('left') + '</button>';
    for (var n = a; n <= b; n++) {
      pg += '<button type="button" class="hk-page-btn' + (n === page ? ' is-active' : '') + '" data-act="page" data-page="' + n + '"' + (n === page ? ' aria-current="page"' : '') + '>' + n + '</button>';
    }
    pg += '<button type="button" class="hk-page-btn" data-act="page" data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + ' aria-label="Halaman berikutnya">' + ic('right') + '</button>';
    return '<div class="hk-pager"><span class="hk-pager-info">Menampilkan ' + (start + 1) + '–' + Math.min(start + size, total) + ' dari ' + total + ' data</span><div class="hk-pager-btns">' + pg + '</div></div>';
  }

  /* Router hanya mengembalikan string HTML; halaman diisi setelah elemennya ada di DOM. */
  function whenReady(id, mountFn) {
    var tries = 0;
    (function poll() {
      var el = document.getElementById(id);
      if (el) return mountFn(el);
      if (++tries < 200) setTimeout(poll, 25);
    })();
  }

  return {
    ic: ic, esc: esc, fmtDate: fmtDate, fmtDateTime: fmtDateTime, todayISO: todayISO, initials: initials,
    injectStyle: injectStyle, toast: toast, openModal: openModal, closeModal: closeModal,
    api: api, JSON_HEADERS: JSON_HEADERS, empty: empty, skeleton: skeleton, pager: pager, whenReady: whenReady, seq: 0
  };
})();

/* ============================================================
   Dashboard HRM
   Sumber data (semua endpoint HRM yang sudah ada, tanpa endpoint baru):
     get_employees.php, manage_leaves.php, manage_events.php, manage_registrations.php
   Angka & diagram dihitung di browser dari data yang sama dengan halaman
   Karyawan, Cuti, Event, dan Registrasi, sehingga selalu konsisten.
   Bagian yang datanya gagal dimuat menampilkan keterangan sendiri;
   bagian lain tetap tampil. Diagram digambar dengan SVG (tanpa library).
   ============================================================ */
var HrmDashboard = (function () {
  var K = HrmKit, ic = K.ic, esc = K.esc;
  var C = { navy: '#0b1a3a', blue: '#2f8fff', teal: '#14b8a6', amber: '#f59e0b', red: '#e9475a', green: '#16a34a', gray: '#94a3b8', purple: '#7c5cf0' };
  var LEAVE_LABEL = { Pending: 'Menunggu', Approved: 'Disetujui', Rejected: 'Ditolak' };
  var LEAVE_COLOR = { Pending: C.amber, Approved: C.green, Rejected: C.red };
  var LEAVE_TONE = { Pending: 'warn', Approved: 'success', Rejected: 'danger' };
  var EMP_COLOR = { Aktif: C.green, Cuti: C.amber, Nonaktif: C.gray };
  var TYPE_COLOR = { Tahunan: C.blue, Sakit: C.teal, Izin: C.purple };
  var REG_TONE = { Terdaftar: 'info', Hadir: 'success', Dibatalkan: 'danger' };

  var ARROW = '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>';
  function arrow() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">' + ARROW + '</svg>';
  }

  function injectStyle() {
    if (document.getElementById('hd-style')) return;
    var st = document.createElement('style');
    st.id = 'hd-style';
    st.textContent = `
.hd-bar{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.hd-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.hd-pill{padding:3px 10px;border-radius:999px;background:#eaf3ff;color:#1c5fc0;font-weight:600;font-size:12px}
.hd-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.hd-kpi{position:relative;display:flex;gap:14px;align-items:flex-start;padding:18px 20px;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;min-width:0}
.hd-kpi::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--acc)}
.hd-kpi-ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;flex:none;background:var(--tint);color:var(--acc)}
.hd-kpi-t{min-width:0}
.hd-kpi-l{display:block;font-size:13px;color:var(--muted)}
.hd-kpi-n{display:block;font-size:30px;line-height:1.2;font-weight:700;color:var(--navy)}
.hd-kpi-s{display:block;margin-top:2px;font-size:12.5px;color:var(--muted)}
.hd-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}
.hd-c4{grid-column:span 4}.hd-c5{grid-column:span 5}.hd-c6{grid-column:span 6}.hd-c7{grid-column:span 7}.hd-c8{grid-column:span 8}
.hd-panel{display:flex;flex-direction:column;min-width:0;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 2px rgba(11,26,58,.04)}
.hd-ph{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:16px 20px 0}
.hd-ph h2{margin:0;font-size:15px;color:var(--navy)}
.hd-ph small{display:block;margin-top:2px;font-size:12.5px;font-weight:400;color:var(--muted)}
.hd-link{display:inline-flex;align-items:center;gap:6px;flex:none;padding:4px 0;border:0;background:none;font:inherit;font-size:13px;font-weight:600;color:#1c6fee;cursor:pointer}
.hd-link:hover{text-decoration:underline}
.hd-link:focus-visible{outline:2px solid var(--blue);outline-offset:2px;border-radius:4px}
.hd-pb{padding:14px 20px 18px;flex:1}
.hd-flush{padding:6px 0 4px}
.hd-na{padding:28px 20px;text-align:center;color:var(--muted);font-size:13.5px}
.hd-na strong{display:block;margin-bottom:4px;color:var(--navy)}
.hd-chart svg{display:block;width:100%;height:auto}
.hd-chart text{font-family:inherit}
.hd-ax{font-size:11px;fill:#6b7280}
.hd-tot{font-size:11.5px;font-weight:700;fill:#0b1a3a}
.hd-lg{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 8px;padding:0;list-style:none;font-size:12.5px;color:#4b5873}
.hd-lg li{display:inline-flex;align-items:center;gap:6px}
.hd-dot{width:10px;height:10px;border-radius:3px;flex:none}
.hd-donut{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.hd-donut svg{width:150px;height:150px;flex:none}
.hd-d-num{font-size:34px;font-weight:700;fill:#0b1a3a;text-anchor:middle}
.hd-d-lbl{font-size:12.5px;fill:#6b7280;text-anchor:middle}
.hd-donut .hd-lg{flex:1 1 140px;flex-direction:column;gap:9px;margin:0}
.hd-donut .hd-lg li{width:100%;justify-content:flex-start}
.hd-donut .hd-lg b{margin-left:auto;color:#0b1a3a}
.hd-donut .hd-lg em{font-style:normal;color:#8a94a8;font-size:12px;min-width:38px;text-align:right}
.hd-hb{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.hd-hb-top{display:flex;justify-content:space-between;gap:10px;font-size:13.5px;margin-bottom:5px}
.hd-hb-top span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.hd-hb-top strong{color:#0b1a3a}
.hd-hb-track{height:9px;border-radius:99px;background:#eef2f8;overflow:hidden}
.hd-hb-track span{display:block;height:100%;border-radius:99px}
.hd-hb small{display:block;margin-top:4px;font-size:12px;color:var(--muted)}
.hd-att{list-style:none;margin:0;padding:0}
.hd-att li{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)}
.hd-att li:first-child{padding-top:2px}
.hd-att li:last-child{border-bottom:0;padding-bottom:0}
.hd-att-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:none}
.hd-att-warn{background:#fff1d6;color:#a15c07}
.hd-att-info{background:#e3f0ff;color:#1c5fc0}
.hd-att-ok{background:#e6f6ec;color:#15803d}
.hd-att-err{background:#fde8eb;color:#c2263a}
.hd-att p{margin:0;font-size:13.5px;line-height:1.5;color:var(--text)}
.hd-att .hd-link{padding:2px 0 0}
.hd-agenda{list-style:none;margin:0;padding:0}
.hd-agenda li{display:flex;gap:14px;align-items:center;padding:12px 20px;border-bottom:1px solid var(--line)}
.hd-agenda li:last-child{border-bottom:0}
.hd-date{width:50px;flex:none;text-align:center;border-radius:10px;background:#eaf3ff;color:#1c5fc0;padding:6px 0;line-height:1.1}
.hd-date b{display:block;font-size:20px}
.hd-date span{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.hd-ag-t{min-width:0;flex:1}
.hd-ag-t strong{display:block;color:var(--navy);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hd-ag-t small{color:var(--muted);font-size:12.5px}
.hd-ag-n{flex:none;font-size:12.5px;color:#4b5873;display:inline-flex;align-items:center;gap:5px}
.hd-panel .hk-table th:first-child,.hd-panel .hk-table td:first-child{padding-left:20px}
.hd-panel .hk-table th:last-child,.hd-panel .hk-table td:last-child{padding-right:20px}
.hd-panel .hk-name{min-width:0}
.hd-panel .hk-avatar{width:30px;height:30px;font-size:12px}
.hd-sk{height:96px;border-radius:14px}
@media (max-width:1180px){.hd-c4{grid-column:span 6}.hd-c5,.hd-c6,.hd-c7,.hd-c8{grid-column:span 12}}
@media (max-width:760px){.hd-c4{grid-column:span 12}.hd-ph,.hd-pb{padding-left:16px;padding-right:16px}.hd-agenda li{padding-left:16px;padding-right:16px}}
`;
    document.head.appendChild(st);
  }

  /* ---------- Helper hitung ---------- */
  function countBy(list, fn) {
    var o = {};
    list.forEach(function (r) { var k = fn(r); o[k] = (o[k] || 0) + 1; });
    return o;
  }
  function pct(n, total) { return total ? Math.round(n / total * 100) + '%' : '0%'; }
  function num(n) { return Number(n).toLocaleString('id-ID'); }
  function addDays(iso, n) {
    var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function rangeText(a, b) { return a === b ? K.fmtDate(a) : K.fmtDate(a) + ' – ' + K.fmtDate(b); }
  function niceTop(n) { return n <= 4 ? 4 : Math.ceil(n / 4) * 4; }

  /* ---------- Diagram ---------- */
  function legend(items) {
    return '<ul class="hd-lg">' + items.map(function (s) {
      return '<li><span class="hd-dot" style="background:' + s.color + '"></span>' + esc(s.label) + '</li>';
    }).join('') + '</ul>';
  }

  function donut(segs, centerLabel, ariaLabel) {
    var total = segs.reduce(function (a, s) { return a + s.value; }, 0);
    var R = 70, CIRC = 2 * Math.PI * R, acc = 0, rings = '';
    segs.forEach(function (s) {
      if (!s.value) return;
      var len = s.value / total * CIRC;
      rings += '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="' + s.color + '" stroke-width="26" stroke-dasharray="' + len.toFixed(2) + ' ' + (CIRC - len).toFixed(2) +
        '" stroke-dashoffset="' + (-acc).toFixed(2) + '" transform="rotate(-90 100 100)"><title>' + esc(s.label) + ': ' + s.value + ' (' + pct(s.value, total) + ')</title></circle>';
      acc += len;
    });
    var svg = '<svg viewBox="0 0 200 200" role="img" aria-label="' + esc(ariaLabel) + '"><circle cx="100" cy="100" r="' + R + '" fill="none" stroke="#eef2f8" stroke-width="26"/>' + rings +
      '<text x="100" y="104" class="hd-d-num">' + num(total) + '</text><text x="100" y="124" class="hd-d-lbl">' + esc(centerLabel) + '</text></svg>';
    var lg = '<ul class="hd-lg">' + segs.map(function (s) {
      return '<li><span class="hd-dot" style="background:' + s.color + '"></span>' + esc(s.label) + '<b>' + num(s.value) + '</b><em>' + pct(s.value, total) + '</em></li>';
    }).join('') + '</ul>';
    return '<div class="hd-donut">' + svg + lg + '</div>';
  }

  /* Kolom bertumpuk: months = [{label, Approved, Pending, Rejected}] */
  function columns(months) {
    var W = 640, H = 270, L = 34, R = 8, T = 18, B = 30, iw = W - L - R, ih = H - T - B;
    var order = ['Approved', 'Pending', 'Rejected'];
    var max = 0;
    months.forEach(function (m) { max = Math.max(max, m.Approved + m.Pending + m.Rejected); });
    var top = niceTop(max), step = top / 4, out = '';
    for (var i = 0; i <= 4; i++) {
      var y = T + ih - ih * i / 4;
      out += '<line x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '" stroke="' + (i ? '#e6ebf2' : '#cfd9ea') + '" stroke-width="1"/>' +
        '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" class="hd-ax">' + (i * step) + '</text>';
    }
    var slot = iw / months.length, bw = Math.min(48, slot * 0.5);
    months.forEach(function (m, idx) {
      var x = L + slot * idx + (slot - bw) / 2, base = T + ih, total = m.Approved + m.Pending + m.Rejected;
      order.forEach(function (k) {
        var h = m[k] / top * ih;
        if (!h) return;
        base -= h;
        out += '<rect x="' + x.toFixed(1) + '" y="' + base.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + LEAVE_COLOR[k] + '" rx="2"><title>' + esc(m.label) + ' · ' + LEAVE_LABEL[k] + ': ' + m[k] + '</title></rect>';
      });
      if (total) out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (base - 6).toFixed(1) + '" text-anchor="middle" class="hd-tot">' + total + '</text>';
      out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" class="hd-ax">' + esc(m.label) + '</text>';
    });
    if (!max) out += '<text x="' + (L + iw / 2) + '" y="' + (T + ih / 2) + '" text-anchor="middle" class="hd-ax" style="font-size:13px">Belum ada pengajuan pada periode ini</text>';
    return '<div class="hd-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Diagram batang pengajuan cuti per bulan berdasarkan status">' + out + '</svg></div>';
  }

  /* Batang horizontal: items = [{label, value, color, sub}] */
  function hbars(items) {
    var max = items.reduce(function (a, s) { return Math.max(a, s.value); }, 1);
    return '<ul class="hd-hb">' + items.map(function (s) {
      return '<li><div class="hd-hb-top"><span title="' + esc(s.label) + '">' + esc(s.label) + '</span><strong>' + num(s.value) + '</strong></div>' +
        '<div class="hd-hb-track"><span style="width:' + (s.value / max * 100).toFixed(1) + '%;background:' + (s.color || C.blue) + '"></span></div>' +
        (s.sub ? '<small>' + esc(s.sub) + '</small>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  /* ---------- Kerangka panel ---------- */
  function panel(cls, title, sub, body, link) {
    return '<section class="hd-panel ' + cls + '"><div class="hd-ph"><div><h2>' + esc(title) + '</h2>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>' +
      (link ? '<button type="button" class="hd-link" data-go="' + esc(link[1]) + '">' + esc(link[0]) + arrow() + '</button>' : '') + '</div>' + body + '</section>';
  }
  function na(what) {
    return '<div class="hd-na"><strong>Data ' + esc(what) + ' tidak tersedia</strong>Server tidak menjawab. Klik "Muat ulang" di bagian atas.</div>';
  }
  function none(text) { return '<div class="hd-na">' + esc(text) + '</div>'; }

  function kpi(color, tint, icon, label, value, sub) {
    return '<article class="hd-kpi" style="--acc:' + color + ';--tint:' + tint + '"><div class="hd-kpi-ic">' + ic(icon, 22) + '</div><div class="hd-kpi-t">' +
      '<span class="hd-kpi-l">' + esc(label) + '</span><span class="hd-kpi-n">' + value + '</span><span class="hd-kpi-s">' + esc(sub) + '</span></div></article>';
  }

  /* ---------- Halaman ---------- */
  function mount(el) {
    K.injectStyle();
    injectStyle();
    K.closeModal();

    var D = { emps: null, leaves: null, events: null, regs: null, mock: false, at: null, failed: [] };

    function skeleton() {
      el.innerHTML = '<header class="hd-bar"><div><h1 class="hk-title">Dashboard HRM</h1><p class="hk-sub">Memuat ringkasan…</p></div></header>' +
        '<div class="hd-kpis">' + [1, 2, 3, 4].map(function () { return '<div class="hd-sk hk-skel"></div>'; }).join('') + '</div>' +
        '<div class="hk-card">' + K.skeleton() + '</div>';
    }

    function load() {
      skeleton();
      D.mock = false;
      D.failed = [];
      var jobs = [['get_employees.php', 'emps', 'karyawan'], ['manage_leaves.php', 'leaves', 'cuti']];
      return Promise.all(jobs.map(function (j) {
        return K.api(j[0]).then(function (json) {
          D[j[1]] = (json.data && json.data.items) || [];
          if (json.meta && json.meta.source === 'mock') D.mock = true;
        }).catch(function () { D[j[1]] = null; D.failed.push(j[2]); });
      })).then(function () { D.at = new Date(); render(); });
    }

    function render() {
      var E = D.emps, L = D.leaves, today = K.todayISO();
      var html = '';

      /* --- header --- */
      var now = D.at;
      var dateTxt = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      var timeTxt = ('0' + now.getHours()).slice(-2) + '.' + ('0' + now.getMinutes()).slice(-2);
      html += '<header class="hd-bar"><div><h1 class="hk-title">Dashboard HRM</h1><p class="hk-sub">Ringkasan sumber daya manusia dan cuti</p></div>' +
        '<div class="hd-meta">' + (D.mock ? '<span class="hd-pill" title="Data berasal dari penyimpanan sementara di server pengembangan, bukan MySQL.">Data sementara (mock)</span>' : '') +
        '<span>' + esc(dateTxt) + ' · diperbarui ' + timeTxt + '</span>' +
        '<button type="button" class="hk-btn hk-btn-ghost hk-btn-sm" data-act="reload">' + ic('refresh') + 'Muat ulang</button></div></header>';

      /* --- turunan data --- */
      var empBy = E ? countBy(E, function (e) { return e.status || 'Aktif'; }) : {};
      var leaveBy = L ? countBy(L, function (l) { return l.status; }) : {};

      /* --- KPI --- */
      var k = '';
      k += E ? kpi(C.blue, '#eaf3ff', 'users', 'Total Karyawan', num(E.length), (empBy.Aktif || 0) + ' aktif · ' + (empBy.Cuti || 0) + ' cuti · ' + (empBy.Nonaktif || 0) + ' nonaktif')
             : kpi(C.gray, '#eef2f8', 'users', 'Total Karyawan', '–', 'Data tidak tersedia');
      k += L ? kpi(C.amber, '#fff1d6', 'clock', 'Cuti Menunggu Persetujuan', num(leaveBy.Pending || 0), 'dari ' + num(L.length) + ' total pengajuan')
             : kpi(C.gray, '#eef2f8', 'clock', 'Cuti Menunggu Persetujuan', '–', 'Data tidak tersedia');
      html += '<div class="hd-kpis">' + k + '</div>';

      /* --- Baris A: tren cuti + perlu perhatian --- */
      var trend;
      if (!L) trend = na('cuti');
      else {
        var now0 = new Date(), months = [];
        for (var i = -3; i <= 2; i++) {
          var d = new Date(now0.getFullYear(), now0.getMonth() + i, 1);
          months.push({ key: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2), label: d.toLocaleDateString('id-ID', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(2), Approved: 0, Pending: 0, Rejected: 0 });
        }
        L.forEach(function (l) {
          var m = months.filter(function (x) { return x.key === String(l.start_date).slice(0, 7); })[0];
          if (m && m[l.status] != null) m[l.status]++;
        });
        trend = '<div class="hd-pb">' + legend([{ label: 'Disetujui', color: C.green }, { label: 'Menunggu', color: C.amber }, { label: 'Ditolak', color: C.red }]) + columns(months) + '</div>';
      }
      html += '<div class="hd-grid">' + panel('hd-c8', 'Tren Pengajuan Cuti', 'Jumlah pengajuan per bulan (berdasarkan tanggal mulai cuti)', trend, ['Kelola cuti', '#hrm/leaves']);

      var att = [];
      if (D.failed.length) att.push(['err', 'alert', 'Sebagian data gagal dimuat: ' + D.failed.join(', ') + '.', 'Muat ulang', 'reload']);
      if (L && leaveBy.Pending) att.push(['warn', 'clock', num(leaveBy.Pending) + ' pengajuan cuti menunggu persetujuan.', 'Tinjau', '#hrm/leaves']);
      if (E) {
        var nodept = E.filter(function (e) { return !String(e.department || '').trim(); }).length;
        if (nodept) att.push(['info', 'users', num(nodept) + ' karyawan belum memiliki data departemen.', 'Lengkapi', '#hrm/employees']);
      }
      var attBody = att.length
        ? '<ul class="hd-att">' + att.map(function (a) {
            var go = a[4] === 'reload' ? 'data-act="reload"' : 'data-go="' + esc(a[4]) + '"';
            return '<li><span class="hd-att-ic hd-att-' + a[0] + '">' + ic(a[1], 18) + '</span><div><p>' + esc(a[2]) + '</p><button type="button" class="hd-link" ' + go + '>' + esc(a[3]) + arrow() + '</button></div></li>';
          }).join('') + '</ul>'
        : '<ul class="hd-att"><li><span class="hd-att-ic hd-att-ok">' + ic('check', 18) + '</span><div><p>Tidak ada hal yang perlu ditindaklanjuti saat ini.</p></div></li></ul>';
      html += panel('hd-c4', 'Perlu Perhatian', 'Ringkasan tindak lanjut untuk HRM', '<div class="hd-pb">' + attBody + '</div>') + '</div>';

      /* --- Baris B: tiga diagram komposisi --- */
      var dEmp = !E ? na('karyawan') : !E.length ? none('Belum ada data karyawan.') :
        '<div class="hd-pb">' + donut(['Aktif', 'Cuti', 'Nonaktif'].map(function (s) { return { label: s, value: empBy[s] || 0, color: EMP_COLOR[s] }; }), 'karyawan', 'Diagram komposisi karyawan menurut status') + '</div>';
      var dDept;
      if (!E) dDept = na('karyawan');
      else if (!E.length) dDept = none('Belum ada data karyawan.');
      else {
        var deptBy = countBy(E, function (e) { return String(e.department || '').trim() || 'Belum diisi'; });
        var deptItems = Object.keys(deptBy).map(function (n) { return { label: n, value: deptBy[n], color: n === 'Belum diisi' ? C.gray : C.blue }; })
          .sort(function (a, b) { return b.value - a.value; }).slice(0, 6);
        dDept = '<div class="hd-pb">' + hbars(deptItems) + '</div>';
      }
      var dType;
      if (!L) dType = na('cuti');
      else if (!L.length) dType = none('Belum ada pengajuan cuti.');
      else {
        var typeBy = countBy(L, function (l) { return l.leave_type; });
        dType = '<div class="hd-pb">' + donut(Object.keys(typeBy).map(function (t) { return { label: t, value: typeBy[t], color: TYPE_COLOR[t] || C.gray }; }), 'pengajuan', 'Diagram pengajuan cuti menurut jenis') + '</div>';
      }
      html += '<div class="hd-grid">' +
        panel('hd-c4', 'Komposisi Karyawan', 'Berdasarkan status kepegawaian', dEmp, ['Data karyawan', '#hrm/employees']) +
        panel('hd-c4', 'Karyawan per Departemen', 'Enam departemen terbesar', dDept) +
        panel('hd-c4', 'Pengajuan Cuti per Jenis', 'Seluruh pengajuan', dType) + '</div>';

      /* --- Baris C: cuti terbaru --- */
      var recent;
      if (!L) recent = na('cuti');
      else if (!L.length) recent = none('Belum ada pengajuan cuti.');
      else {
        var rows = L.slice().sort(function (a, b) { return String(b.created_at) < String(a.created_at) ? -1 : 1; }).slice(0, 5).map(function (l) {
          return '<tr><td><div class="hk-name"><span class="hk-avatar">' + K.initials(l.employee_name) + '</span><strong>' + esc(l.employee_name) + '</strong></div></td>' +
            '<td>' + esc(l.leave_type) + '</td><td class="hk-nowrap">' + esc(rangeText(l.start_date, l.end_date)) + '</td>' +
            '<td><span class="hk-badge hk-badge-' + (LEAVE_TONE[l.status] || 'neutral') + '">' + esc(LEAVE_LABEL[l.status] || l.status) + '</span></td></tr>';
        }).join('');
        recent = '<div class="hd-flush"><div class="hk-table-wrap"><table class="hk-table"><thead><tr><th scope="col">Karyawan</th><th scope="col">Jenis</th><th scope="col">Tanggal</th><th scope="col">Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
      }
      html += '<div class="hd-grid">' +
        panel('hd-c12', 'Pengajuan Cuti Terbaru', 'Lima pengajuan terakhir', recent, ['Lihat semua', '#hrm/leaves']) + '</div>';

      el.innerHTML = html;
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-go],[data-act]');
      if (!b || !el.contains(b)) return;
      if (b.getAttribute('data-act') === 'reload') return load();
      var go = b.getAttribute('data-go');
      if (go && typeof navigateTo === 'function') navigateTo(go);
    });

    load();
  }

  return { mount: mount };
})();

// ---- PAGE: Dashboard HRM ----
function pageHrmDashboard() {
  var id = 'hk-db-root-' + (++HrmKit.seq);
  HrmKit.whenReady(id, HrmDashboard.mount);
  return `<div id="${id}" class="hk hd"><p style="padding:24px;color:#6b7280">Memuat dashboard…</p></div>`;
}

