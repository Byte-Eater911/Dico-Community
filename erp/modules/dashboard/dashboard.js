registerRoute('#dashboard', pageDashboard);

let superadminData = null;

async function pageDashboard() {
  const user = getCurrentUser();

  if (user && user.role_name === 'HRM' && typeof pageHrmDashboard === 'function') {
    return pageHrmDashboard();
  }
  if (user && user.role_name === 'Finance' && typeof pageFinDashboard === 'function') {
    return pageFinDashboard();
  }
  if (user && user.role_name === 'CRM' && typeof pageDashboardCRM === 'function') {
    return pageDashboardCRM();
  }

  try {
    const res = await apiGet('api/dashboard_stats.php');
    if (res && res.success) {
      superadminData = res.data;
    }
  } catch (err) {
    console.error('Gagal memuat dashboard stats:', err);
  }

  const d = superadminData || {};
  const users = d.users || { total: 0, by_role: {} };
  const events = d.events || { total: 0, aktif: 0, berlangsung: 0, selesai: 0, by_category: [], occupancy: [], recent: [] };
  const regs = d.registrations || { total: 0, berhasil: 0, menunggu: 0, total_omzet: 0, recent: [] };
  const hrm = d.hrm || { total: 0, aktif: 0, pending_leaves: 0, recent_leaves: [] };
  const crm = d.crm || { total_customers: 0, total_interactions: 0, by_contact_type: {} };
  const fin = d.finance || { saldo_kas: 0, monthly_trend: [], recent_transactions: [] };
  const sys = d.system || { server_time: '-', db_status: 'Connected', php_version: '-', os: '-' };

  const monthly = fin.monthly_trend || [];
  const maxVal = Math.max(...monthly.map(m => Math.max(m.pemasukan, m.pengeluaran, 1)), 1000000);
  const chartHeight = 160;
  const chartWidth = 500;
  const barGroupWidth = monthly.length > 0 ? (chartWidth - 60) / monthly.length : 60;

  const svgBars = monthly.map((m, idx) => {
    const x = 40 + idx * barGroupWidth;
    const hIn = Math.round((m.pemasukan / maxVal) * 120);
    const hOut = Math.round((m.pengeluaran / maxVal) * 120);
    const yIn = 140 - hIn;
    const yOut = 140 - hOut;
    const label = m.bulan || '';
    return `
      <g>
        <rect x="${x + 6}" y="${yIn}" width="14" height="${hIn}" fill="#2f8fff" rx="3">
          <title>Pemasukan ${label}: ${fmtRp(m.pemasukan)}</title>
        </rect>
        <rect x="${x + 24}" y="${yOut}" width="14" height="${hOut}" fill="#e9475a" rx="3">
          <title>Pengeluaran ${label}: ${fmtRp(m.pengeluaran)}</title>
        </rect>
        <text x="${x + 22}" y="156" font-size="10" fill="#6b7280" text-anchor="middle">${label.slice(5)}</text>
      </g>
    `;
  }).join('');

  const catItems = events.by_category || [];
  const maxCat = Math.max(...catItems.map(c => c.total || 0), 1);
  const occupancyItems = events.occupancy || [];

  return `
    <div style="margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;">
      <div>
        <h1 style="font-size:26px;font-weight:700;color:#0b1a3a;margin:0 0 6px;">Ringkasan Eksekutif Sistem</h1>
        <p style="color:#64748b;margin:0;font-size:14px;">Pemantauan operasional lintas unit: Keuangan, Event, Personalia, dan Pelanggan</p>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:12px;color:#64748b;background:#ffffff;border:1px solid #e2e8f0;padding:6px 12px;border-radius:6px;">
          Pembaruan: <strong>${sys.server_time}</strong>
        </span>
        <button class="btn btn-outline" style="padding:6px 14px;font-size:13px;" onclick="renderRoute()">
          ${icon('refresh')} Segarkan
        </button>
      </div>
    </div>

    <!-- KPI UTAMA (6 KARTU MATRIKS) -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:28px;">
      <div class="card" style="padding:18px;border-left:4px solid #0b1a3a;">
        <span class="text-muted" style="font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Saldo Kas & Bank</span>
        <h2 style="font-size:22px;color:#0b1a3a;margin:8px 0 4px;">${fmtRp(fin.saldo_kas || 0)}</h2>
        <span style="font-size:12px;color:#64748b;">Kas Operasional (101)</span>
      </div>

      <div class="card" style="padding:18px;border-left:4px solid #16a34a;">
        <span class="text-muted" style="font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Omzet Tiket Event</span>
        <h2 style="font-size:22px;color:#16a34a;margin:8px 0 4px;">${fmtRp(regs.total_omzet || 0)}</h2>
        <span style="font-size:12px;color:#16a34a;">${regs.berhasil || 0} Tiket Terverifikasi</span>
      </div>

      <div class="card" style="padding:18px;border-left:4px solid #2f8fff;">
        <span class="text-muted" style="font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Event DICO</span>
        <h2 style="font-size:22px;color:#2f8fff;margin:8px 0 4px;">${events.total || 0} Event</h2>
        <span style="font-size:12px;color:#64748b;">${events.aktif || 0} Aktif &middot; ${events.berlangsung || 0} Berjalan</span>
      </div>

      <div class="card" style="padding:18px;border-left:4px solid #f59e0b;">
        <span class="text-muted" style="font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Registrasi Tertunda</span>
        <h2 style="font-size:22px;color:#f59e0b;margin:8px 0 4px;">${regs.menunggu || 0} Peserta</h2>
        <span style="font-size:12px;color:#f59e0b;">Menunggu Verifikasi</span>
      </div>

      <div class="card" style="padding:18px;border-left:4px solid #7c5cf0;">
        <span class="text-muted" style="font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Karyawan Aktif</span>
        <h2 style="font-size:22px;color:#7c5cf0;margin:8px 0 4px;">${hrm.aktif || 0} / ${hrm.total || 0}</h2>
        <span style="font-size:12px;color:${hrm.pending_leaves > 0 ? '#dc2626' : '#64748b'};">
          ${hrm.pending_leaves || 0} Pengajuan Cuti Pending
        </span>
      </div>

      <div class="card" style="padding:18px;border-left:4px solid #06b6d4;">
        <span class="text-muted" style="font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Basis Pelanggan (CRM)</span>
        <h2 style="font-size:22px;color:#06b6d4;margin:8px 0 4px;">${crm.total_customers || 0} Klien</h2>
        <span style="font-size:12px;color:#64748b;">${crm.total_interactions || 0} Riwayat Interaksi</span>
      </div>
    </div>

    <!-- SEKSI GRAFIK & ANALITIK DUA KOLOM -->
    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:20px;margin-bottom:28px;">
      <!-- GRAFIK ARUS KAS -->
      <div class="card" style="padding:22px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;color:#0b1a3a;margin:0 0 4px;">Tren Arus Kas 6 Bulan Terakhir</h3>
            <p style="font-size:13px;color:#64748b;margin:0;">Perbandingan nominal pemasukan (kredit) vs pengeluaran (debit)</p>
          </div>
          <div style="display:flex;gap:14px;font-size:12px;">
            <span style="display:inline-flex;align-items:center;gap:6px;color:#1e3a8a;">
              <span style="width:10px;height:10px;background:#2f8fff;border-radius:2px;display:inline-block;"></span> Masuk
            </span>
            <span style="display:inline-flex;align-items:center;gap:6px;color:#991b1b;">
              <span style="width:10px;height:10px;background:#e9475a;border-radius:2px;display:inline-block;"></span> Keluar
            </span>
          </div>
        </div>

        <div style="width:100%;overflow-x:auto;">
          <svg viewBox="0 0 ${chartWidth} ${chartHeight}" style="width:100%;min-width:420px;height:auto;display:block;">
            <line x1="30" y1="20" x2="${chartWidth}" y2="20" stroke="#f1f5f9" stroke-width="1" />
            <line x1="30" y1="60" x2="${chartWidth}" y2="60" stroke="#f1f5f9" stroke-width="1" />
            <line x1="30" y1="100" x2="${chartWidth}" y2="100" stroke="#f1f5f9" stroke-width="1" />
            <line x1="30" y1="140" x2="${chartWidth}" y2="140" stroke="#cbd5e1" stroke-width="1" />
            ${svgBars || '<text x="250" y="80" text-anchor="middle" fill="#94a3b8" font-size="12">Belum ada catatan mutasi</text>'}
          </svg>
        </div>
      </div>

      <!-- OKUPANSI EVENT & KOMPOSISI KATEGORI -->
      <div class="card" style="padding:22px;display:flex;flex-direction:column;gap:20px;">
        <!-- Okupansi Event Aktif (#2) -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div>
              <h3 style="font-size:15px;font-weight:700;color:#0b1a3a;margin:0 0 2px;">Tingkat Okupansi Event Aktif</h3>
              <p style="font-size:12px;color:#64748b;margin:0;">Rasio peserta terdaftar terhadap kuota kapasitas</p>
            </div>
            <a href="#event/workshops" style="font-size:12px;color:#2f8fff;text-decoration:none;font-weight:600;">Lihat Event &rarr;</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${occupancyItems.length > 0 ? occupancyItems.map(ev => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                  <span style="color:#1e293b;font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${ev.judul}">
                    ${ev.judul}
                  </span>
                  <span style="color:#64748b;font-weight:500;">
                    ${ev.peserta_terdaftar} / ${ev.kapasitas} (${ev.persentase}%)
                  </span>
                </div>
                <div style="height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;">
                  <div style="height:100%;width:${ev.persentase}%;background:${ev.persentase >= 80 ? '#16a34a' : ev.persentase >= 50 ? '#2f8fff' : '#f59e0b'};border-radius:3px;"></div>
                </div>
              </div>
            `).join('') : '<p class="text-muted" style="font-size:12px;margin:0;">Tidak ada event aktif yang berjalan saat ini.</p>'}
          </div>
        </div>

        <!-- Sebaran Kategori -->
        <div style="border-top:1px solid #f1f5f9;padding-top:14px;">
          <h3 style="font-size:15px;font-weight:700;color:#0b1a3a;margin:0 0 10px;">Sebaran Topik Event</h3>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${catItems.length > 0 ? catItems.slice(0, 4).map(c => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
                  <span style="color:#475569;">${c.kategori}</span>
                  <span style="color:#64748b;font-weight:600;">${c.total}</span>
                </div>
                <div style="height:5px;background:#f1f5f9;border-radius:3px;overflow:hidden;">
                  <div style="height:100%;width:${Math.round((c.total / maxCat) * 100)}%;background:#94a3b8;border-radius:3px;"></div>
                </div>
              </div>
            `).join('') : '<p class="text-muted" style="font-size:12px;margin:0;">Belum ada data topik event.</p>'}
          </div>
        </div>
      </div>
    </div>

    <!-- SEKSI TABEL OPERASIONAL (#1 MUTASI KEUANGAN, REGISTRASI, CUTI) -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px;margin-bottom:28px;">
      <!-- TABEL 1: MUTASI KEUANGAN TERBARU (#1) -->
      <div class="card" style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <h3 style="font-size:15px;font-weight:700;color:#0b1a3a;margin:0 0 2px;">Mutasi Keuangan Terbaru</h3>
            <p style="font-size:12px;color:#64748b;margin:0;">Catatan transaksi buku kas masuk & keluar</p>
          </div>
          <a href="#finance" style="font-size:12px;color:#2f8fff;text-decoration:none;font-weight:600;">Lihat Kas &rarr;</a>
        </div>
        <div class="table-wrapper">
          <table class="table" style="font-size:12px;">
            <thead>
              <tr>
                <th>Transaksi</th>
                <th>Tanggal</th>
                <th>Nominal</th>
                <th>Modul</th>
              </tr>
            </thead>
            <tbody>
              ${(fin.recent_transactions || []).length > 0 ? fin.recent_transactions.map(t => `
                <tr>
                  <td>
                    <strong style="color:#0b1a3a;">${t.kode_transaksi}</strong>
                    <div style="font-size:11px;color:#64748b;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${t.deskripsi || '-'}">
                      ${t.deskripsi || '-'}
                    </div>
                  </td>
                  <td style="white-space:nowrap;">${fmtDate(t.tgl_transaksi)}</td>
                  <td style="white-space:nowrap;font-weight:600;color:${t.tipe === 'debit' ? '#16a34a' : '#0b1a3a'};">
                    ${fmtRp(t.total_nominal || 0)}
                  </td>
                  <td>
                    <span class="badge" style="background:#f1f5f9;color:#475569;font-size:11px;">
                      ${t.sumber_modul || 'manual'}
                    </span>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="text-center text-muted" style="padding:20px;">Belum ada mutasi transaksi keuangan</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABEL 2: REGISTRASI PESERTA TERBARU -->
      <div class="card" style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <h3 style="font-size:15px;font-weight:700;color:#0b1a3a;margin:0 0 2px;">Registrasi Peserta Terbaru</h3>
            <p style="font-size:12px;color:#64748b;margin:0;">Tiket event yang baru terdaftar</p>
          </div>
          <a href="#event/registrations" style="font-size:12px;color:#2f8fff;text-decoration:none;font-weight:600;">Semua Peserta &rarr;</a>
        </div>
        <div class="table-wrapper">
          <table class="table" style="font-size:12px;">
            <thead>
              <tr>
                <th>Peserta</th>
                <th>Event</th>
                <th>Nominal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(regs.recent || []).length > 0 ? regs.recent.map(r => `
                <tr>
                  <td>
                    <strong>${r.nama_peserta}</strong>
                    <div style="font-size:11px;color:#64748b;">${r.email_peserta}</div>
                  </td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.event_judul || '-'}">
                    ${r.event_judul || '-'}
                  </td>
                  <td style="white-space:nowrap;font-weight:600;">${fmtRp(r.total_bayar || 0)}</td>
                  <td>${statusBadge(r.status_pembayaran)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="text-center text-muted" style="padding:20px;">Belum ada registrasi baru</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABEL 3: PENGAJUAN CUTI PENDING -->
      <div class="card" style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <h3 style="font-size:15px;font-weight:700;color:#0b1a3a;margin:0 0 2px;">Pengajuan Cuti Karyawan</h3>
            <p style="font-size:12px;color:#64748b;margin:0;">Menunggu persetujuan personalia</p>
          </div>
          <a href="#hrm/leaves" style="font-size:12px;color:#2f8fff;text-decoration:none;font-weight:600;">Kelola Cuti &rarr;</a>
        </div>
        <div class="table-wrapper">
          <table class="table" style="font-size:12px;">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Jenis</th>
                <th>Rentang</th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              ${(hrm.recent_leaves || []).length > 0 ? hrm.recent_leaves.map(l => `
                <tr>
                  <td>
                    <strong>${l.nama_karyawan}</strong>
                    <div style="font-size:11px;color:#64748b;">${l.position || '-'}</div>
                  </td>
                  <td><span class="badge" style="background:#f1f5f9;color:#334155;">${l.tipe_cuti}</span></td>
                  <td style="white-space:nowrap;">${fmtDate(l.tgl_mulai)}</td>
                  <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${l.alasan || '-'}">
                    ${l.alasan || '-'}
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="text-center text-muted" style="padding:20px;">Tidak ada pengajuan cuti yang menunggu verifikasi</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PANEL STATUS TEKNIS & SERVER (#3) -->
    <div class="card" style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h3 style="font-size:15px;font-weight:700;color:#0b1a3a;margin:0 0 2px;">Status Teknis & Lingkungan Server</h3>
          <p style="font-size:12px;color:#64748b;margin:0;">Pemantauan infrastruktur backend, database, dan pembagian hak akses sistem</p>
        </div>
        <span class="badge" style="background:#dcfce7;color:#166534;font-size:12px;padding:5px 12px;font-weight:600;">
          Status Sistem: Normal
        </span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:16px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;">
          <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;display:block;">Koneksi Database</span>
          <strong style="font-size:14px;color:#16a34a;margin-top:2px;display:block;">${sys.db_status || 'Connected'} (MySQL / MariaDB)</strong>
        </div>

        <div style="background:#ffffff;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;">
          <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;display:block;">PHP Runtime & Platform</span>
          <strong style="font-size:14px;color:#0b1a3a;margin-top:2px;display:block;">PHP ${sys.php_version} (${sys.os})</strong>
        </div>

        <div style="background:#ffffff;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;">
          <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;display:block;">Waktu Server</span>
          <strong style="font-size:14px;color:#0b1a3a;margin-top:2px;display:block;">${sys.server_time}</strong>
        </div>

        <div style="background:#ffffff;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;">
          <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;display:block;">Total Akun Internal</span>
          <strong style="font-size:14px;color:#0b1a3a;margin-top:2px;display:block;">${users.total || 0} Pengguna Aktif</strong>
        </div>
      </div>

      <div style="padding-top:12px;border-top:1px solid #e2e8f0;display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
        <span style="font-size:12px;color:#64748b;font-weight:600;margin-right:6px;">Distribusi Akun per Role:</span>
        ${Object.entries(users.by_role || {}).map(([role, count]) => `
          <span style="font-size:12px;background:#ffffff;border:1px solid #cbd5e1;padding:3px 10px;border-radius:6px;color:#334155;">
            ${role}: <strong>${count}</strong>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}
