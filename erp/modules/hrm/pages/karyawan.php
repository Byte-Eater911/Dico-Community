<div class="page-heading">
    <div><h1>Data Karyawan</h1><p>Contoh tampilan daftar karyawan.</p></div>
    <button class="primary-button" id="showEmployeeForm">+ Tambah Karyawan</button>
</div>

<div class="panel form-panel" id="employeeFormPanel" hidden>
    <h2>Tambah karyawan (demo)</h2>
    <form id="employeeForm" class="form-grid">
        <label>Nama lengkap<input name="name" required placeholder="Contoh: Siti Aminah"></label>
        <label>Jabatan<input name="position" required placeholder="Contoh: Staf HR"></label>
        <label>Email<input name="email" type="email" required placeholder="nama@email.com"></label>
        <div class="form-actions"><button class="primary-button" type="submit">Tambahkan ke tabel</button></div>
    </form>
    <p class="help-text">Data hanya ditambahkan ke tampilan browser dan tidak disimpan ke database.</p>
</div>

<div class="panel table-panel">
    <div class="table-heading"><h2>Daftar Karyawan</h2><span class="muted">Data contoh</span></div>
    <div class="table-wrap">
        <table id="employeeTable">
            <thead><tr><th>Nama</th><th>Jabatan</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>
                <tr><td>Andi Pratama</td><td>HR Officer</td><td>andi@example.com</td><td><span class="tag tag-green">Aktif</span></td></tr>
                <tr><td>Siti Aminah</td><td>Administrator</td><td>siti@example.com</td><td><span class="tag tag-green">Aktif</span></td></tr>
                <tr><td>Budi Santoso</td><td>Finance Staff</td><td>budi@example.com</td><td><span class="tag tag-gray">Cuti</span></td></tr>
            </tbody>
        </table>
    </div>
</div>
