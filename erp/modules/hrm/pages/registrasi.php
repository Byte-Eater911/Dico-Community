<div class="page-heading"><div><h1>Registrasi Peserta</h1><p>Contoh daftar peserta event.</p></div><button class="primary-button" id="showRegistrationForm">+ Registrasi Peserta</button></div>
<div class="panel form-panel" id="registrationFormPanel" hidden>
    <h2>Registrasi peserta (demo)</h2>
    <form id="registrationForm" class="form-grid">
        <label>Nama peserta<input name="name" required placeholder="Nama lengkap"></label>
        <label>Nama event<input name="event" required placeholder="Nama event"></label>
        <label>Email<input name="email" type="email" required placeholder="nama@email.com"></label>
        <div class="form-actions"><button class="primary-button" type="submit">Tambahkan ke tabel</button></div>
    </form>
    <p class="help-text">Data hanya ditampilkan sementara dan tidak disimpan ke database.</p>
</div>
<div class="panel table-panel">
    <div class="table-heading"><h2>Peserta Terdaftar</h2><span class="muted">Data contoh</span></div>
    <div class="table-wrap">
        <table id="registrationTable">
            <thead><tr><th>Nama</th><th>Event</th><th>Email</th><th>Status</th></tr></thead>
            <tbody><tr><td>Rina Putri</td><td>Pelatihan Komunikasi</td><td>rina@example.com</td><td><span class="tag tag-green">Terdaftar</span></td></tr></tbody>
        </table>
    </div>
</div>
