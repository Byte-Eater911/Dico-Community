registerRoute('#finance/accounts', pageFinAccounts);
registerRoute('#finance/transactions', pageFinTransactions);
registerRoute('#finance/journal', pageFinJournal);
registerRoute('#finance/dashboard', pageFinDashboard);
const FIN_API = 'modules/finance/api/';
const FIN_TYPES = {aset:'Aset', liabilitas:'Liabilitas', ekuitas:'Ekuitas', pendapatan:'Pendapatan', beban:'Beban'};
let finAccountsCache = [];
function finEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function finMoney(value) {
  return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value)||0);
}
function finDate(value) {
  if (!value) return '-';
  const d = new Date(value + (String(value).length === 10 ? 'T00:00:00' : ''));
  return isNaN(d) ? value : d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
}
function finLoading(cols, message='Memuat data...') {
  return `<tr><td colspan="${cols}" class="text-center text-muted" style="padding:28px">${message}</td></tr>`;
}
function finError(message) { toast(message || 'Terjadi kesalahan.', 'error'); }
async function finRequest(file, method='GET', payload=null) {
  let result;
  if (method === 'GET') result = await apiGet(FIN_API + file);
  else result = await apiPostJSON(FIN_API + file, payload || {});
  if (!result || result.success !== true) throw new Error(result?.message || 'Permintaan gagal.');
  return result.data;
}
function finModalTitle(title, subtitle='') {
  return `<div class="modal-header"><div class="modal-title">${title}</div>${subtitle ? `<p class="text-muted">${subtitle}</p>`:''}</div>`;
}
function finTypeOptions(selected='aset') {
  return Object.entries(FIN_TYPES).map(([v,l])=>`<option value="${v}" ${v===selected?'selected':''}>${l}</option>`).join('');
}
function finAccountOptions(selected='') {
  return finAccountsCache.map(a=>`<option value="${a.id}" ${String(a.id)===String(selected)?'selected':''}>${finEscape(a.kode_akun)} — ${finEscape(a.nama_akun)} (${FIN_TYPES[a.tipe]||a.tipe})</option>`).join('');
}
function finKpi(label, valueId, iconName, accent='blue', note='') {
  return `<div class="card fin-mini-card accent-${accent}"><div class="fin-card-top"><span class="fin-card-label">${label}</span><span class="fin-card-icon">${icon(iconName)}</span></div><strong class="fin-card-value" id="${valueId}">—</strong>${note ? `<span class="fin-card-sub">${note}</span>` : ''}</div>`;
}
function finTypeBadge(type) {
  return `<span class="fin-badge fin-badge-${finEscape(type)}">${FIN_TYPES[type] || finEscape(type)}</span>`;
}
function pageFinDashboard() {
  setTimeout(loadFinDashboard, 0);
  return `<div class="fin-page">
    <div class="fin-heading"><div><h1>Dashboard Keuangan</h1><p>Ringkasan lengkap kesehatan finansial perusahaan.</p></div></div>
    
    <!-- KPI Cards Row 1 -->
    <div class="fin-summary-grid">
      ${finKpi('Total Pendapatan','fin-total-pendapatan','arrow-up','green','Akumulasi pendapatan')}
      ${finKpi('Total Beban','fin-total-beban','arrow-down','red','Akumulasi beban operasional')}
      ${finKpi('Net Profit','fin-net-profit','pie-chart','blue','Keuntungan bersih')}
      ${finKpi('Total Transaksi','fin-total-transactions','finance','purple','Jumlah transaksi tercatat')}
    </div>
    <!-- Charts & Breakdowns Row -->
    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px;margin-top:20px">
      <!-- Pendapatan vs Beban Chart -->
      <div class="card" style="padding:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:700">Pendapatan vs Beban</h3>
            <p style="margin:4px 0 0;color:var(--text-secondary);font-size:13px">Perbandingan akumulasi finansial</p>
          </div>
        </div>
        <div id="fin-chart-profit" style="min-height:200px;display:flex;align-items:flex-end;justify-content:space-around;gap:12px"></div>
      </div>
      <!-- Akun by Type Breakdown -->
      <div class="card" style="padding:20px">
        <h3 style="margin:0 0 16px;font-size:16px;font-weight:700">Distribusi Akun</h3>
        <div id="fin-account-type-list" style="display:flex;flex-direction:column;gap:10px"></div>
      </div>
    </div>
    <!-- Transactions by Source Row -->
    <div class="card" style="padding:20px;margin-top:16px">
      <h3 style="margin:0 0 16px;font-size:16px;font-weight:700">Transaksi by Sumber Modul</h3>
      <div id="fin-tx-source-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px"></div>
    </div>
    <!-- Recent Transactions Table -->
    <div class="card fin-table-card" style="margin-top:16px">
      <div class="fin-table-heading">
        <div>
          <h2>Transaksi Terbaru</h2>
          <p>5 transaksi finansial paling baru</p>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="table" style="font-size:13px">
          <thead>
            <tr>
              <th>Kode Transaksi</th>
              <th>Tanggal</th>
              <th>Deskripsi</th>
              <th>Sumber</th>
              <th style="text-align:right">Nominal</th>
            </tr>
          </thead>
          <tbody id="fin-recent-tx-body">${finLoading(5,'Memuat...')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}
async function loadFinDashboard() {
  try {
    const res = await finRequest('get_dashboard.php', 'GET');
    if (!res.summary) throw new Error('Data summary tidak ada');
    
    const { summary, transactions_by_source, accounts_by_type, recent_transactions } = res;
    
    // Update KPI cards
    document.getElementById('fin-total-pendapatan').textContent = finMoney(summary.total_pendapatan);
    document.getElementById('fin-total-beban').textContent = finMoney(summary.total_beban);
    document.getElementById('fin-net-profit').textContent = finMoney(summary.net_profit);
    document.getElementById('fin-total-transactions').textContent = summary.total_transactions;
    
    // Render Pendapatan vs Beban Chart (SVG Bar Chart)
    const chartContainer = document.getElementById('fin-chart-profit');
    if (chartContainer) {
      const maxVal = Math.max(summary.total_pendapatan, summary.total_beban) || 1;
      const pendapatanHeight = (summary.total_pendapatan / maxVal) * 140;
      const bebanHeight = (summary.total_beban / maxVal) * 140;
      
      chartContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <div style="width:60px;height:${pendapatanHeight}px;background:linear-gradient(180deg, #10B981 0%, #059669 100%);border-radius:8px 8px 0 0;box-shadow:0 2px 8px rgba(16,185,129,0.2)"></div>
          <span style="font-weight:600;font-size:12px;color:var(--text-secondary)">Pendapatan</span>
          <strong style="color:#047857;font-size:14px">${finMoney(summary.total_pendapatan)}</strong>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <div style="width:60px;height:${bebanHeight}px;background:linear-gradient(180deg, #EF4444 0%, #DC2626 100%);border-radius:8px 8px 0 0;box-shadow:0 2px 8px rgba(239,68,68,0.2)"></div>
          <span style="font-weight:600;font-size:12px;color:var(--text-secondary)">Beban</span>
          <strong style="color:#b91c1c;font-size:14px">${finMoney(summary.total_beban)}</strong>
        </div>
      `;
    }
    
    // Render Accounts by Type
    const typeList = document.getElementById('fin-account-type-list');
    if (typeList) {
      if (accounts_by_type.length) {
        typeList.innerHTML = accounts_by_type.map(item => {
          const tipeLabel = FIN_TYPES[item.tipe] || item.tipe;
          const colors = {aset:'#2F8FFF',liabilitas:'#F59E0B',ekuitas:'#8B5CF6',pendapatan:'#10B981',beban:'#EF4444'};
          const color = colors[item.tipe] || '#6B7280';
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8fafc;border-radius:6px;border-left:3px solid ${color}">
              <span style="font-weight:500;font-size:13px">${finEscape(tipeLabel)}</span>
              <strong style="color:${color};font-size:14px;font-family:ui-monospace">${item.count}</strong>
            </div>
          `;
        }).join('');
      } else {
        typeList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin:0">Belum ada akun</p>';
      }
    }
    
    // Render Transactions by Source
    const sourceList = document.getElementById('fin-tx-source-list');
    if (sourceList) {
      if (transactions_by_source.length) {
        const colors = {manual:'#6B7280',event:'#2F8FFF',hrm_payroll:'#10B981',crm_invoice:'#F59E0B'};
        sourceList.innerHTML = transactions_by_source.map(item => {
          const color = colors[item.sumber_modul] || '#6B7280';
          const sourceLabel = item.sumber_modul === 'hrm_payroll' ? 'HRM Payroll' : item.sumber_modul === 'crm_invoice' ? 'CRM Invoice' : item.sumber_modul.charAt(0).toUpperCase() + item.sumber_modul.slice(1);
          return `
            <div style="padding:14px;background:linear-gradient(135deg, ${color}08 0%, ${color}04 100%);border:1px solid ${color}20;border-radius:8px;text-align:center">
              <div style="font-size:20px;font-weight:700;color:${color};font-family:var(--font-display)">${item.count}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;font-weight:500">${finEscape(sourceLabel)}</div>
            </div>
          `;
        }).join('');
      } else {
        sourceList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin:0">Belum ada transaksi</p>';
      }
    }
    
    // Render Recent Transactions Table
    const recentBody = document.getElementById('fin-recent-tx-body');
    if (recentBody) {
      if (recent_transactions.length) {
        recentBody.innerHTML = recent_transactions.map(tx => {
          const sourceColors = {manual:'#6B7280',event:'#2F8FFF',hrm_payroll:'#10B981',crm_invoice:'#F59E0B'};
          const sourceColor = sourceColors[tx.sumber_modul] || '#6B7280';
          return `
            <tr>
              <td><span class="fin-code">${finEscape(tx.kode_transaksi)}</span></td>
              <td>${finDate(tx.tgl_transaksi)}</td>
              <td>${finEscape(tx.deskripsi)}</td>
              <td><span class="fin-badge-source" style="background:${sourceColor}15;color:${sourceColor};border:1px solid ${sourceColor}30">${finEscape(tx.sumber_modul)}</span></td>
              <td style="text-align:right;font-weight:600;color:#047857">${finMoney(tx.nominal)}</td>
            </tr>
          `;
        }).join('');
      } else {
        recentBody.innerHTML = finLoading(5, 'Belum ada transaksi');
      }
    }
  } catch (e) {
    finError(e.message);
  }
}
function pageFinAccounts() {
  setTimeout(loadFinAccounts, 0);
  return `<div class="fin-page">
    <div class="flex-between fin-heading"><div><span class="fin-eyebrow">KEUANGAN / PENGATURAN</span><h1>Chart of Accounts</h1><p>Kelola akun-akun yang dipakai untuk pencatatan dan laporan keuangan.</p></div><button class="btn btn-primary" onclick="showFinAccountForm()">${icon('plus')} Tambah Akun</button></div>
    <div class="fin-summary-grid">${finKpi('Total akun','fin-account-count','finance','blue','Daftar akun tersedia')}${finKpi('Akun aset','fin-account-assets','dashboard','green','Kas, bank, dan aset')}${finKpi('Pendapatan & beban','fin-account-income-expense','calendar','purple','Akun operasional')}${finKpi('Total saldo aset','fin-account-assets-balance','wallet','green','Saldo bersih seluruh akun aset')}</div>
    <div class="card fin-table-card"><div class="fin-table-heading"><div><h2>Daftar akun</h2><p>Saldo ditampilkan khusus untuk akun dengan tipe Aset dan dihitung dari jurnal transaksi.</p></div><button class="btn btn-secondary btn-sm" onclick="loadFinAccounts()">${icon('refresh')} Muat ulang</button></div><div class="table-wrapper"><table class="table"><thead><tr><th>Kode Akun</th><th>Nama Akun</th><th>Tipe Akun</th><th style="text-align:right">Saldo</th><th>Aksi</th></tr></thead><tbody id="fin-accounts-body">${finLoading(5)}</tbody></table></div></div>
  </div>`;
}
async function loadFinAccounts() {
  const body=document.getElementById('fin-accounts-body'); if(!body)return;
  try {
    const data=await finRequest('get_accounts.php'); finAccountsCache=data.accounts||[];
    document.getElementById('fin-account-count').textContent=finAccountsCache.length;
    document.getElementById('fin-account-assets').textContent=finAccountsCache.filter(a=>a.tipe==='aset').length;
    document.getElementById('fin-account-income-expense').textContent=finAccountsCache.filter(a=>['pendapatan','beban'].includes(a.tipe)).length;
    const totalSaldoAset=finAccountsCache.filter(a=>a.tipe==='aset').reduce((sum,a)=>sum+Number(a.saldo||0),0);
    document.getElementById('fin-account-assets-balance').textContent=finMoney(totalSaldoAset);
    body.innerHTML=finAccountsCache.length?finAccountsCache.map(a=>`<tr><td><span class="fin-code">${finEscape(a.kode_akun)}</span></td><td><strong>${finEscape(a.nama_akun)}</strong></td><td>${finTypeBadge(a.tipe)}</td><td style="text-align:right;font-weight:600">${a.tipe==='aset'?finMoney(a.saldo):'—'}</td><td class="fin-actions"><button class="btn btn-secondary btn-sm" onclick="showFinAccountForm(${a.id})">${icon('edit')} Edit</button><button class="btn btn-danger btn-sm" onclick="deleteFinAccount(${a.id},'${finEscape(a.nama_akun).replace(/'/g,"\\'")}')">${icon('trash')} Hapus</button></td></tr>`).join(''):finLoading(5,'Belum ada akun keuangan.');
  } catch(e) { body.innerHTML=finLoading(4,finEscape(e.message)); }
}
async function showFinAccountForm(id=null) {
  try {
    if (!finAccountsCache.length) finAccountsCache=(await finRequest('get_accounts.php')).accounts||[];
    const account=finAccountsCache.find(a=>Number(a.id)===Number(id));
    openModal(`${finModalTitle(id?'Edit Akun':'Tambah Akun','Kode akun harus unik dan tipe akun menentukan kategorinya.')}
      <div class="form-group"><label class="form-label">Kode Akun</label><input class="form-input" id="fin-account-code" maxlength="20" value="${finEscape(account?.kode_akun||'')}" placeholder="Contoh: 103" required></div>
      <div class="form-group"><label class="form-label">Nama Akun</label><input class="form-input" id="fin-account-name" maxlength="100" value="${finEscape(account?.nama_akun||'')}" placeholder="Contoh: Kas Kecil" required></div>
      <div class="form-group"><label class="form-label">Tipe Akun</label><select class="form-select" id="fin-account-type">${finTypeOptions(account?.tipe||'aset')}</select></div>`,
      async()=>{const payload={id, kode_akun:document.getElementById('fin-account-code').value.trim(),nama_akun:document.getElementById('fin-account-name').value.trim(),tipe:document.getElementById('fin-account-type').value};
        try{await finRequest('save_account.php','POST',payload);toast('Akun berhasil disimpan.');await loadFinAccounts();return true;}catch(e){finError(e.message);return false;}});
  } catch(e){finError(e.message);}
}
async function deleteFinAccount(id,name) {
  if(!confirm(`Hapus akun "${name}"? Akun yang sudah digunakan pada jurnal tidak dapat dihapus.`))return;
  try{await finRequest('delete_account.php','POST',{id});toast('Akun berhasil dihapus.');await loadFinAccounts();}catch(e){finError(e.message);}
}
function pageFinTransactions() {
  setTimeout(loadFinTransactions,0);
  return `<div class="fin-page"><div class="flex-between mb-lg fin-heading"><div><h1>Transaksi</h1><p class="text-muted">Catat pemasukan dan pengeluaran beserta pasangan debit-kreditnya.</p></div><button class="btn btn-primary" onclick="showFinTransactionForm()">${icon('plus')} Tambah Transaksi</button></div>
    <div class="fin-summary-grid"><div class="card fin-mini-card"><span>Total Transaksi</span><strong id="fin-tx-count">—</strong></div><div class="card fin-mini-card"><span>Total Debit</span><strong id="fin-tx-debit">—</strong></div><div class="card fin-mini-card"><span>Total Kredit</span><strong id="fin-tx-credit">—</strong></div></div>
    <div class="card"><div class="table-wrapper"><table class="table"><thead><tr><th>Kode</th><th>Tanggal</th><th>Deskripsi</th><th>Sumber</th><th>Debit</th><th>Kredit</th><th>Aksi</th></tr></thead><tbody id="fin-transactions-body">${finLoading(7)}</tbody></table></div></div></div>`;
}
async function loadFinTransactions() {
 const body=document.getElementById('fin-transactions-body');if(!body)return;
 try{
  const data=await finRequest('get_transactions.php');const rows=data.transactions||[];
  document.getElementById('fin-tx-count').textContent=rows.length;
  document.getElementById('fin-tx-debit').textContent=finMoney(rows.reduce((s,r)=>s+Number(r.total_debit||0),0));
  document.getElementById('fin-tx-credit').textContent=finMoney(rows.reduce((s,r)=>s+Number(r.total_kredit||0),0));
  body.innerHTML=rows.length?rows.map(t=>`<tr><td><strong>${finEscape(t.kode_transaksi)}</strong></td><td>${finDate(t.tgl_transaksi)}</td><td>${finEscape(t.deskripsi)}</td><td><span class="badge badge-neutral">${finEscape(t.sumber_modul)}</span></td><td>${finMoney(t.total_debit)}</td><td>${finMoney(t.total_kredit)}</td><td class="fin-actions"><button class="btn btn-danger btn-sm" onclick="deleteFinTransaction(${t.id},'${finEscape(t.kode_transaksi)}')">${icon('trash')} Hapus</button></td></tr>`).join(''):finLoading(7,'Belum ada transaksi tercatat.');
 }catch(e){body.innerHTML=finLoading(7,finEscape(e.message));}
}
async function showFinTransactionForm() {
 try {
  if(!finAccountsCache.length)finAccountsCache=(await finRequest('get_accounts.php')).accounts||[];
  if(finAccountsCache.length<2){finError('Tambahkan minimal dua akun terlebih dahulu.');return;}
  const today=new Date().toISOString().slice(0,10);
  openModal(`${finModalTitle('Tambah Transaksi','Transaksi harus memiliki nilai debit dan kredit yang sama.')}
   <div class="form-group"><label class="form-label">Tanggal</label><input class="form-input" type="date" id="fin-tx-date" value="${today}" required></div>
   <div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="fin-tx-description" placeholder="Contoh: Pembayaran workshop AI" required></textarea></div>
   <div class="form-group"><label class="form-label">Sumber</label><select class="form-select" id="fin-tx-source"><option value="manual">Manual</option><option value="event">Event</option><option value="hrm_payroll">HRM Payroll</option><option value="crm_invoice">CRM Invoice</option></select></div>
   <div class="fin-journal-form"><div><h3>Debit</h3><div class="form-group"><label class="form-label">Akun Debit</label><select class="form-select" id="fin-tx-debit-account">${finAccountOptions()}</select></div><div class="form-group"><label class="form-label">Nominal (Rp)</label><input class="form-input" type="number" id="fin-tx-debit-amount" min="1" step="0.01" placeholder="100000" required></div></div>
   <div><h3>Kredit</h3><div class="form-group"><label class="form-label">Akun Kredit</label><select class="form-select" id="fin-tx-credit-account">${finAccountOptions(finAccountsCache[1]?.id)}</select></div><div class="form-group"><label class="form-label">Nominal (Rp)</label><input class="form-input" type="number" id="fin-tx-credit-amount" min="1" step="0.01" placeholder="100000" required></div></div></div>`,
   async()=>{const debit=Number(document.getElementById('fin-tx-debit-amount').value),credit=Number(document.getElementById('fin-tx-credit-amount').value);
    const payload={tgl_transaksi:document.getElementById('fin-tx-date').value,deskripsi:document.getElementById('fin-tx-description').value.trim(),sumber_modul:document.getElementById('fin-tx-source').value,debit_account_id:document.getElementById('fin-tx-debit-account').value,kredit_account_id:document.getElementById('fin-tx-credit-account').value,debit_nominal:debit,kredit_nominal:credit};
    if(!payload.tgl_transaksi||!payload.deskripsi||!debit||!credit){finError('Lengkapi semua data dan nominal harus lebih dari nol.');return false;}
    if(payload.debit_account_id===payload.kredit_account_id){finError('Akun debit dan kredit harus berbeda.');return false;}
    if(Math.abs(debit-credit)>0.009){finError('Nominal debit dan kredit harus sama.');return false;}
    try{await finRequest('add_transaction.php','POST',payload);toast('Transaksi berhasil disimpan.');await loadFinTransactions();return true;}catch(e){finError(e.message);return false;}
   });
  const debitInput=document.getElementById('fin-tx-debit-amount'),creditInput=document.getElementById('fin-tx-credit-amount');
  debitInput.addEventListener('input',()=>{if(!creditInput.value)creditInput.value=debitInput.value;});
 }catch(e){finError(e.message);}
}
async function deleteFinTransaction(id,code){
 if(!confirm(`Hapus transaksi ${code} beserta jurnalnya?`))return;
 try{await finRequest('delete_transaction.php','POST',{id});toast('Transaksi berhasil dihapus.');await loadFinTransactions();}catch(e){finError(e.message);}
}
function pageFinJournal() {
 setTimeout(loadFinJournal,0);
 return `<div class="fin-page"><div class="flex-between mb-lg fin-heading"><div><h1>Laporan Jurnal</h1><p class="text-muted">Rincian pencatatan debit dan kredit seluruh transaksi.</p></div><button class="btn btn-secondary" onclick="loadFinJournal()">Muat Ulang</button></div>
 <div class="fin-summary-grid"><div class="card fin-mini-card"><span>Total Debit</span><strong id="fin-journal-debit">—</strong></div><div class="card fin-mini-card"><span>Total Kredit</span><strong id="fin-journal-credit">—</strong></div><div class="card fin-mini-card"><span>Status Jurnal</span><strong id="fin-journal-status">—</strong></div></div>
 <div class="card"><div class="table-wrapper"><table class="table"><thead><tr><th>Tanggal</th><th>Kode Transaksi</th><th>Deskripsi</th><th>Akun</th><th>Debit</th><th>Kredit</th></tr></thead><tbody id="fin-journal-body">${finLoading(6)}</tbody></table></div></div></div>`;
}
async function loadFinJournal(){
 const body=document.getElementById('fin-journal-body');if(!body)return;
 try{const data=await finRequest('journal_report.php');const rows=data.entries||[];const debit=Number(data.total_debit||0),credit=Number(data.total_kredit||0);
 document.getElementById('fin-journal-debit').textContent=finMoney(debit);document.getElementById('fin-journal-credit').textContent=finMoney(credit);document.getElementById('fin-journal-status').textContent=Math.abs(debit-credit)<0.01?'Seimbang':'Periksa';
 document.getElementById('fin-journal-status').style.color=Math.abs(debit-credit)<0.01?'#10B981':'#EF4444';
 body.innerHTML=rows.length?rows.map(r=>`<tr><td>${finDate(r.tgl_transaksi)}</td><td><strong>${finEscape(r.kode_transaksi)}</strong></td><td>${finEscape(r.deskripsi)}</td><td>${finEscape(r.kode_akun)} — ${finEscape(r.nama_akun)}</td><td>${r.tipe==='debit'?finMoney(r.nominal):'—'}</td><td>${r.tipe==='kredit'?finMoney(r.nominal):'—'}</td></tr>`).join(''):finLoading(6,'Belum ada entri jurnal.');
 }catch(e){body.innerHTML=finLoading(6,finEscape(e.message));}
}
