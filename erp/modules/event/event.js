let eventsList = [];
let registrationsList = [];
let categoriesList = [];
let workshopsList = [];
let eventFilterStatus = '';
let eventFilterCategory = '';
let eventSearchQuery = '';
// Debounce helper
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
// Helper: Check user role
function canEditEvent() {
  const user = getCurrentUser();
  return user && ['Superadmin', 'Event Manager'].includes(user.role_name);
}
function canViewRegistrations() {
  const user = getCurrentUser();
  return user && ['Superadmin', 'Event Manager'].includes(user.role_name);
}
registerRoute('#event/workshops', pageEventWorkshops);
registerRoute('#event/registrations', pageEventRegistrations);
async function pageEventWorkshops() {
  await loadEvents();
  
  const isEditMode = canEditEvent();
  
  setTimeout(() => {
    const searchInput = document.getElementById('eventSearchInput');
    const categoryFilter = document.getElementById('eventCategoryFilter');
    const statusFilter = document.getElementById('eventStatusFilter');
    
    // Debounced search to avoid re-render on each keystroke (300ms delay)
    const debouncedRender = debounce(() => {
      renderRoute();
      // Restore focus after re-render
      setTimeout(() => {
        const el = document.getElementById('eventSearchInput');
        if (el) el.focus();
      }, 0);
    }, 300);
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        eventSearchQuery = e.target.value;
        debouncedRender();
      });
    }
    
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        eventFilterCategory = e.target.value;
        renderRoute();
      });
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        eventFilterStatus = e.target.value;
        renderRoute();
      });
    }
  }, 0);
  
  return `
    <div class="flex-between mb-lg">
      <div>
        <h1>Data Event</h1>
        <p class="text-muted">Kelola workshop, seminar, dan webinar DICO Community${!isEditMode ? ' (Mode Lihat Saja)' : ''}</p>
      </div>
      ${isEditMode ? `<button class="btn btn-primary" onclick="openAddEventModal()">${icon('plus')} Tambah Event</button>` : ''}
    </div>
    <div class="card mb-lg">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
        <input type="text" class="form-input" placeholder="Cari judul event..." id="eventSearchInput" value="${eventSearchQuery}">
        <select class="form-select" id="eventCategoryFilter">
          <option value="">Semua Kategori</option>
          ${categoriesList.map(c => `<option value="${c.nama_kategori}"${eventFilterCategory === c.nama_kategori ? ' selected' : ''}>${c.nama_kategori}</option>`).join('')}
        </select>
        <select class="form-select" id="eventStatusFilter">
          <option value="">Semua Status</option>
          <option value="draft"${eventFilterStatus === 'draft' ? ' selected' : ''}>Draft</option>
          <option value="aktif"${eventFilterStatus === 'aktif' ? ' selected' : ''}>Aktif</option>
          <option value="berlangsung"${eventFilterStatus === 'berlangsung' ? ' selected' : ''}>Berlangsung</option>
          <option value="selesai"${eventFilterStatus === 'selesai' ? ' selected' : ''}>Selesai</option>
        </select>
      </div>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Kategori</th>
              <th>Tanggal</th>
              <th>Lokasi</th>
              <th>Harga</th>
              <th>Status</th>
              ${isEditMode ? '<th>Aksi</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${getFilteredEvents().map(e => `
              <tr>
                <td>${e.judul}</td>
                <td>${e.nama_kategori || '-'}</td>
                <td>${fmtDate(e.tgl_mulai)}</td>
                <td>${e.lokasi}</td>
                <td>${fmtRp(e.harga || 0)}</td>
                <td>${statusBadge(e.status)}</td>
                ${isEditMode ? `<td style="display:flex;gap:8px">
                  <button class="btn" style="padding:6px 10px;font-size:12px" onclick="openEditEventModal(${e.id})" title="Edit Status">${icon('edit')}</button>
                  <button class="btn btn-danger" style="padding:6px 10px;font-size:12px" onclick="deleteEvent(${e.id})" title="Hapus">${icon('trash')}</button>
                </td>` : ''}
              </tr>
            `).join('') || `<tr><td colspan="${isEditMode ? 7 : 6}" class="text-center text-muted" style="padding:40px">Belum ada data event</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
async function pageEventRegistrations() {
  if (!canViewRegistrations()) {
    return `
      <div style="padding:40px;text-align:center;">
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;max-width:500px;margin:0 auto;">
          <i class="fa-solid fa-ban" style="font-size:48px;color:#dc2626;margin-bottom:12px;"></i>
          <h3 style="color:#991b1b;margin:0 0 8px;">Akses Ditolak</h3>
          <p style="color:#7f1d1d;margin:0;">Anda tidak memiliki izin untuk mengakses halaman Registrasi Peserta.</p>
        </div>
      </div>
    `;
  }
  await loadRegistrations();
  
  return `
    <div class="mb-lg">
      <div>
        <h1>Registrasi Peserta</h1>
        <p class="text-muted">Kelola daftar peserta yang mendaftar event</p>
      </div>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nama Peserta</th>
              <th>Email</th>
              <th>No HP</th>
              <th>Event</th>
              <th>Total Bayar</th>
              <th>Status Bayar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${registrationsList.map(r => `
              <tr>
                <td>${r.nama_peserta}</td>
                <td>${r.email_peserta}</td>
                <td>${r.no_hp || '-'}</td>
                <td>${r.workshop_judul || '-'}</td>
                <td>${fmtRp(r.total_bayar || 0)}</td>
                <td>${statusBadge(r.status_pembayaran)}</td>
                <td>
                  ${r.status_pembayaran === 'menunggu' ? 
                    `<button class="btn btn-primary" style="padding:6px 12px;font-size:12px" onclick="verifyPayment(${r.id})">Verifikasi</button>` : 
                    '<span class="text-muted">Selesai</span>'
                  }
                </td>
              </tr>
            `).join('') || '<tr><td colspan="7" class="text-center text-muted" style="padding:40px">Belum ada registrasi</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
function getFilteredEvents() {
  return eventsList.filter(e => {
    const matchSearch = e.judul.toLowerCase().includes(eventSearchQuery.toLowerCase());
    const matchCategory = eventFilterCategory === '' || e.nama_kategori === eventFilterCategory;
    const matchStatus = eventFilterStatus === '' || e.status === eventFilterStatus;
    return matchSearch && matchCategory && matchStatus;
  });
}
async function loadEvents() {
  try {
    const data = await apiGet('modules/event/api/get_events.php');
    if (data.success) {
      eventsList = data.data || [];
      categoriesList = data.categories || [];
    }
  } catch (e) {
    console.error('Error loading events:', e);
  }
}
async function loadRegistrations() {
  try {
    const data = await apiGet('modules/event/api/get_registrations.php');
    if (data.success) {
      registrationsList = data.data || [];
      workshopsList = data.workshops || [];
    }
  } catch (e) {
    console.error('Error loading registrations:', e);
  }
}
function openAddEventModal() {
  openModal(`
    <div class="modal-header">
      <h3 class="modal-title">${icon('plus')} Tambah Event Baru</h3>
    </div>
    <form id="formAddEvent" enctype="multipart/form-data" onsubmit="return false">
      <div class="form-group">
        <label class="form-label">Poster Event</label>
        <input type="file" id="m-poster" class="form-input" accept="image/*">
      </div>
      <div class="form-group">
        <label class="form-label">Judul Event <span style="color:red">*</span></label>
        <input type="text" id="m-judul" class="form-input" placeholder="Contoh: Visionary Ideas Summit" required>
      </div>
      <div class="form-group">
        <label class="form-label">Pendiri/Penyelenggara</label>
        <input type="text" id="m-pendiri" class="form-input" placeholder="Contoh: UrbanSpark Events">
      </div>
      <div class="form-group">
        <label class="form-label">Kategori</label>
        <select id="m-category" class="form-select">
          ${categoriesList.map(c => `<option value="${c.id}">${c.nama_kategori}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea id="m-deskripsi" class="form-textarea" rows="4" placeholder="Jelaskan tentang event..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Pembawa Materi</label>
        <input type="text" id="m-pembawa" class="form-input" placeholder="Contoh: Dr. Irvan Prasetya, Maya Kartika">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Waktu Mulai <span style="color:red">*</span></label>
          <input type="datetime-local" id="m-mulai" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Waktu Selesai <span style="color:red">*</span></label>
          <input type="datetime-local" id="m-selesai" class="form-input" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Lokasi <span style="color:red">*</span></label>
        <input type="text" id="m-lokasi" class="form-input" placeholder="Contoh: Convention Center, Jakarta" required>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="form-group">
          <label class="form-label">Kapasitas</label>
          <input type="number" id="m-kapasitas" class="form-input" value="100" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">Harga (Rp)</label>
          <input type="number" id="m-harga" class="form-input" value="0" min="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Tipe Event <span style="color:red">*</span></label>
        <select id="m-tipe" class="form-select" required>
          <option value="workshop">Workshop</option>
          <option value="seminar">Seminar</option>
          <option value="webinar">Webinar</option>
        </select>
      </div>
    </form>
  `, saveAddEvent);
}
function openEditEventModal(id) {
  const event = eventsList.find(e => Number(e.id) === Number(id));
  if (!event) { alert('Event tidak ditemukan'); return; }
  
  openModal(`
    <div class="modal-header">
      <h3 class="modal-title">${icon('edit')} Edit Status Event</h3>
    </div>
    <div class="form-group">
      <p><strong>${event.judul}</strong></p>
      <p class="text-muted" style="font-size:13px">${fmtDate(event.tgl_mulai)} - ${event.lokasi}</p>
    </div>
    <div class="form-group">
      <label class="form-label">Status Event</label>
      <select id="m-status" class="form-select">
        <option value="draft" ${event.status === 'draft' ? 'selected' : ''}>Draft</option>
        <option value="aktif" ${event.status === 'aktif' ? 'selected' : ''}>Aktif</option>
        <option value="berlangsung" ${event.status === 'berlangsung' ? 'selected' : ''}>Berlangsung</option>
        <option value="selesai" ${event.status === 'selesai' ? 'selected' : ''}>Selesai</option>
      </select>
    </div>
  `, () => saveEditEvent(id));
}
async function saveAddEvent() {
  const fd = new FormData();
  fd.append('judul', document.getElementById('m-judul').value);
  fd.append('category_id', document.getElementById('m-category').value);
  fd.append('pendiri_event', document.getElementById('m-pendiri').value);
  fd.append('deskripsi', document.getElementById('m-deskripsi').value);
  fd.append('pembawa_materi', document.getElementById('m-pembawa').value);
  fd.append('tgl_mulai', document.getElementById('m-mulai').value);
  fd.append('tgl_selesai', document.getElementById('m-selesai').value);
  fd.append('lokasi', document.getElementById('m-lokasi').value);
  fd.append('kapasitas', document.getElementById('m-kapasitas').value);
  fd.append('harga', document.getElementById('m-harga').value);
  fd.append('tipe_event', document.getElementById('m-tipe').value);
  
  const posterFile = document.getElementById('m-poster').files[0];
  if (posterFile) fd.append('poster', posterFile);
  if (!canEditEvent()) {
    toast('Akses ditolak: Anda tidak memiliki izin menambah event.', 'error');
    return false;
  }
  const res = await apiPost('modules/event/api/add_event.php', fd);
  if (res.success) {
    toast('Event berhasil ditambahkan', 'success');
    await loadEvents();
    renderRoute();
    return true;
  } else {
    toast(res.message || 'Gagal menyimpan event', 'error');
    return false;
  }
}
async function saveEditEvent(id) {
  if (!canEditEvent()) {
    toast('Akses ditolak: Anda tidak memiliki izin mengubah event.', 'error');
    return false;
  }
  const status = document.getElementById('m-status').value;
  const fd = buildFormData({ id, status });
  
  const res = await apiPost('modules/event/api/update_event.php', fd);
  if (res.success) {
    toast('Status event berhasil diubah', 'success');
    await loadEvents();
    renderRoute();
    return true;
  } else {
    toast(res.message || 'Gagal mengubah status', 'error');
    return false;
  }
}
async function deleteEvent(id) {
  if (!canEditEvent()) {
    toast('Akses ditolak: Anda tidak memiliki izin menghapus event.', 'error');
    return;
  }
  if (!confirm('Hapus event ini? Data registrasi peserta tidak akan dihapus.')) return;
  
  const fd = buildFormData({ id });
  const res = await apiPost('modules/event/api/delete_event.php', fd);
  if (res.success) {
    toast('Event berhasil dihapus', 'success');
    await loadEvents();
    renderRoute();
  } else {
    toast(res.message || 'Gagal menghapus event', 'error');
  }
}
async function verifyPayment(id) {
  if (!canEditEvent()) {
    toast('Akses ditolak: Anda tidak memiliki izin memverifikasi pembayaran.', 'error');
    return;
  }
  if (!confirm('Verifikasi pembayaran peserta ini?')) return;
  
  const fd = buildFormData({ id });
  const res = await apiPost('modules/event/api/verify_payment.php', fd);
  if (res.success) {
    toast('Pembayaran berhasil diverifikasi & tercatat di Finance', 'success');
    await loadRegistrations();
    renderRoute();
  } else {
    toast(res.message || 'Gagal verifikasi pembayaran', 'error');
  }
}
