registerRoute('#crm/dashboard', pageDashboardCRM);
registerRoute('#crm/customers', pageCrmCustomers);
registerRoute('#crm/interactions', pageCrmInteractions);
registerRoute('#crm/events', pageCrmEvents);
registerRoute('#crm/registrations', pageCrmRegistrations);

function pageDashboardCRM() {
    setTimeout(loadDashboardCRM,100);
    setTimeout(loadLatestCustomers,100);
    setTimeout(loadLatestInteractions,100);

    return `
        <div style="margin-bottom:24px">
            <h1>Dashboard CRM</h1>
            <p class="text-muted">
                Ringkasan Customer Relationship Management.
            </p>
        </div>

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
            gap:20px;
            margin-bottom:24px;
        ">

            <div class="card">
                <p class="text-muted" style="font-size:13px;font-weight:bold;margin-bottom:8px">
                    Total Customer
                </p>
                <h2 id="totalCustomer" style="color:var(--primary)">0</h2>
            </div>

            <div class="card">
                <p class="text-muted" style="font-size:13px;margin-bottom:8px">
                    Total Event
                </p>
                <h2 style="color:var(--success)">0</h2>
            </div>

            <div class="card">
                <p class="text-muted" style="font-size:13px;margin-bottom:8px">
                    Total Interaksi
                </p>
                <h2 id="totalInteraksi" style="color:var(--warning)">0</h2>
            </div>

            <div class="card">
                <p class="text-muted" style="font-size:13px;margin-bottom:8px">
                    Total Registrasi
                </p>
                <h2 id="totalRegistrasi" style="color:var(--danger)">0</h2>
            </div>

        </div>

        <div
    style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:20px;
    "
>

    <div class="card">

        <h3
            style="
                font-weight:700;
                margin-bottom:20px;
            "
        >
            Customer Terbaru
        </h3>

        <div id="latestCustomer">

            Loading...

        </div>

    </div>

    <div class="card">

        <h3
            style="
                font-weight:700;
                margin-bottom:20px;
            "
        >
            Interaksi Terbaru
        </h3>

        <div id="latestInteraction">

            Loading...

        </div>

    </div>

</div>
    `;
}

async function loadDashboardCRM(){

    try{

        const res = await fetch("modules/crm/api/get_dashboard.php");

        const json = await res.json();

        if(!json.success) return;

        document.getElementById("totalCustomer").innerText =
            json.total_customer;

        document.getElementById("totalInteraksi").innerText =
            json.total_interaksi;

        document.getElementById("totalRegistrasi").innerText =
            json.total_registrasi;

    }catch(err){

        console.error(err);

    }

}

async function loadLatestCustomers(){

    const box = document.getElementById("latestCustomer");

    if(!box) return;

    box.innerHTML = "Loading...";

    try{

        const res = await fetch(
            "modules/crm/api/get_latest_customers.php"
        );

        const json = await res.json();

        if(!json.success){

            box.innerHTML = "Gagal memuat data.";

            return;

        }

        if(json.data.length === 0){

            box.innerHTML = "Belum ada customer.";

            return;

        }

        let html = "";

        json.data.forEach(item=>{

            html += `
                <div
                    style="
                        padding:12px 0;
                        border-bottom:1px solid #eee;
                    "
                >

                    <div style="font-weight:700;">
                        ${item.nama}
                    </div>

                    <div
                        style="
                            color:#777;
                            font-size:13px;
                        "
                    >
                        ${item.instansi || "-"}
                    </div>

                </div>
            `;

        });

        box.innerHTML = html;

    }catch(err){

        box.innerHTML = "Terjadi kesalahan.";

        console.error(err);

    }

}

async function loadLatestInteractions(){

    const box = document.getElementById("latestInteraction");

    if(!box) return;

    box.innerHTML = "Loading...";

    try{

        const res = await fetch(
            "modules/crm/api/get_latest_interactions.php"
        );

        const json = await res.json();

        if(!json.success){

            box.innerHTML = "Gagal memuat data.";

            return;

        }

        if(json.data.length === 0){

            box.innerHTML = "Belum ada interaksi.";

            return;

        }

        let html = "";

        json.data.forEach(item=>{

            html += `
                <div
                    style="
                        padding:12px 0;
                        border-bottom:1px solid #eee;
                    "
                >

                    <div style="font-weight:700;">
                        ${item.nama} <span style="font-size:11px;padding:2px 6px;background:#e0f2fe;color:#0369a1;border-radius:4px;margin-left:6px">${item.keperluan}</span>
                    </div>

                    <div
                        style="
                            color:#555;
                            font-size:13px;
                            margin-top:4px;
                        "
                    >
                        ${item.pesan || "-"}
                    </div>

                </div>
            `;

        });

        box.innerHTML = html;

    }catch(err){

        box.innerHTML = "Terjadi kesalahan.";

        console.error(err);

    }

}

function pageCrmCustomers() {
    setTimeout(loadCustomers,100);
    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
            <div>
                <h1>Data Customer</h1>
                <p class="text-muted">
                    Kelola data customer DICO Community.
                </p>
            </div>
            <button class="btn btn-primary" onclick="openCustomerModal()">
                + Tambah Customer
            </button>
        </div>

        <div class="card">
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama</th>
                            <th>Email</th>
                            <th>No HP</th>
                            <th>Perusahaan</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="customerTableBody">
                        <tr>
                        <td colspan="7" style="text-align:center"> Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openCustomerModal(data = null){
    const isEdit = !!data;
    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">${isEdit ? 'Edit Customer' : 'Tambah Customer'}</h3>
        </div>
        <form id="customerForm">
            <input type="hidden" id="customerId" name="id" value="${data ? data.id : ''}">
            <div class="form-group">
                <label class="form-label">Nama Lengkap <span style="color:red">*</span></label>
                <input type="text" name="nama" class="form-input" placeholder="Contoh: Budi Santoso" value="${data ? (data.nama || '') : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Email <span style="color:red">*</span></label>
                <input type="email" name="email" class="form-input" placeholder="nama@email.com" value="${data ? (data.email || '') : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">No HP <span style="color:red">*</span></label>
                <input type="text" name="no_hp" class="form-input" placeholder="08123456789" value="${data ? (data.no_hp || '') : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Instansi / Perusahaan</label>
                <input type="text" name="instansi" class="form-input" placeholder="Contoh: Universitas Indraprasta PGRI" value="${data ? (data.instansi || '') : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Minat Produk</label>
                <input type="text" name="minat_produk" class="form-input" placeholder="Contoh: Workshop, Event, dll" value="${data ? (data.minat_produk || '') : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Status Prospek</label>
                <select name="status_prospek" class="form-select">
                    <option value="cold" ${data && data.status_prospek === 'cold' ? 'selected' : ''}>Baru (Cold)</option>
                    <option value="warm" ${data && data.status_prospek === 'warm' ? 'selected' : ''}>Aktif (Warm)</option>
                    <option value="hot" ${data && data.status_prospek === 'hot' ? 'selected' : ''}>Prospek (Hot)</option>
                    <option value="deal" ${data && data.status_prospek === 'deal' ? 'selected' : ''}>Selesai (Deal)</option>
                </select>
            </div>
        </form>
    `, saveCustomer);
}

function closeCustomerModal(){
    closeModal();
}

async function saveCustomer(){
    const form = document.getElementById("customerForm");
    const formData = new FormData(form);
    const id = document.getElementById("customerId").value;
    let url = "modules/crm/api/add_customer.php";
    if(id) url = "modules/crm/api/update_customer.php";
    const res = await fetch(url, { method:"POST", body:formData });
    const json = await res.json();
    if(json.success){
        alert(json.message);
        closeCustomerModal();
        form.reset();
        document.getElementById("customerId").value = "";
        loadCustomers();
        loadDashboardCRM();
    } else {
        alert(json.message);
    }
}

async function editCustomer(id){
    try{
        const res = await fetch(`modules/crm/api/get_customer.php?id=${id}`);
        const json = await res.json();
        if(!json.success){
            alert(json.message);
            return;
        }
        openCustomerModal(json.data);
    }catch(err){
        console.error(err);
        alert("Gagal mengambil data customer.");
    }
}

async function loadCustomers(){

    const tbody = document.getElementById("customerTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center">
                Loading...
            </td>
        </tr>
    `;

    try{

        const res = await fetch("modules/crm/api/get_customers.php");

        const json = await res.json();

        if(!json.success){

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        ${json.message}
                    </td>
                </tr>
            `;

            return;

        }

        if(json.data.length===0){

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Belum ada data customer
                    </td>
                </tr>
            `;

            return;

        }

        let html="";

        json.data.forEach((item,index)=>{

            let warna="#d1fae5";
            let teks="#065f46";

            if(item.status_prospek=="cold"){
                warna="#fee2e2";
                teks="#991b1b";
            }

            if(item.status_prospek=="warm"){
                warna="#fef3c7";
                teks="#92400e";
            }

            if(item.status_prospek=="hot"){
                warna="#dbeafe";
                teks="#1e40af";
            }

            if(item.status_prospek=="deal"){
                warna="#dcfce7";
                teks="#166534";
            }

            html+=`
            <tr>

                <td>${index+1}</td>

                <td>${item.nama}</td>

                <td>${item.email}</td>

                <td>${item.no_hp}</td>

                <td>${item.instansi??'-'}</td>

                <td>

                    <span
                        style="
                        background:${warna};
                        color:${teks};
                        padding:4px 10px;
                        border-radius:20px;
                        font-size:12px;
                        font-weight:bold;
                        "
                    >
                        ${item.status_prospek}
                    </span>

                </td>

                <td>

                    <button
                        class="btn btn-warning btn-sm"
                        onclick="editCustomer(${item.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="deleteCustomer(${item.id})"
                    >
                        Hapus
                    </button>

                </td>

            </tr>
            `;

        });

        tbody.innerHTML=html;

    }catch(err){

        tbody.innerHTML=`
        <tr>
            <td colspan="7">
                ${err}
            </td>
        </tr>
        `;

    }

}

async function deleteCustomer(id){

    if(!confirm("Yakin ingin menghapus customer ini?")){
        return;
    }

    const formData = new FormData();

    formData.append("id", id);

    const res = await fetch(
        "modules/crm/api/delete_customer.php",
        {
            method:"POST",
            body:formData
        }
    );

    const json = await res.json();

    if(json.success){

        alert(json.message);

        loadCustomers();
        loadDashboardCRM();

    }else{

        alert(json.message);

    }

}

async function loadInteractions(){

    const tbody = document.getElementById("interactionTableBody");

    if(!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center">
                Loading...
            </td>
        </tr>
    `;

    try{

        const res = await fetch("modules/crm/api/get_interactions.php");

        const json = await res.json();

        if(!json.success){

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">${json.message}</td>
                </tr>
            `;
            return;

        }

        if(json.data.length === 0){

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">Belum ada data.</td>
                </tr>
            `;
            return;

        }

        let html = "";

        json.data.forEach((item,index)=>{

            html += `
                <tr>

                    <td>${index+1}</td>

                    <td>${item.nama}</td>

                    <td>${item.email}</td>

                    <td>${item.keperluan}</td>

                    <td>${item.pesan}</td>

                    <td>

                        <button
                            class="btn btn-warning btn-sm"
                            onclick="editInteraction(${item.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="deleteInteraction(${item.id})"
                        >
                            Hapus
                        </button>

                    </td>

                </tr>
            `;

        });

        tbody.innerHTML = html;

    }catch(err){

        console.error(err);

        tbody.innerHTML = `
            <tr>
                <td colspan="6">${err}</td>
            </tr>
        `;

    }

}

function pageCrmInteractions() {
    setTimeout(loadInteractions,100);
    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">

            <div>
                <h1>Log Interaksi</h1>
                <p class="text-muted">
                    Riwayat komunikasi dengan customer.
                </p>
            </div>

            <button
                class="btn btn-primary"
                onclick="openInteractionModal()"
            >
                + Tambah Interaksi
            </button>

        </div>

        <div class="card">

            <table class="table">

    <thead>

        <tr>

            <th>No</th>
            <th>Nama</th>
            <th>Email</th>
            <th>Keperluan</th>
            <th>Pesan</th>
            <th>Aksi</th>

        </tr>

    </thead>

    <tbody id="interactionTableBody">

        <tr>

            <td colspan="6" style="text-align:center">

                Loading...

            </td>

        </tr>

    </tbody>

</table>

        </div>
    `;
}

async function openInteractionModal(data = null){
    const isEdit = !!data;
    
    let customerOptions = '<option value="">Pilih Customer</option>';
    try {
        const res = await fetch("modules/crm/api/get_customers.php");
        const json = await res.json();
        if(json.success && Array.isArray(json.data)){
            customerOptions += json.data.map(c => `
                <option value="${c.id}" ${data && Number(data.customer_id) === Number(c.id) ? 'selected' : ''}>
                    ${c.nama} (${c.email})
                </option>
            `).join('');
        }
    } catch(e) {
        console.error(e);
    }

    openModal(`
        <div class="modal-header">
            <h3 class="modal-title">${isEdit ? 'Edit Interaksi' : 'Tambah Interaksi'}</h3>
        </div>
        <form id="interactionForm">
            <input type="hidden" id="interactionId" name="id" value="${data ? data.id : ''}">
            <div class="form-group">
                <label class="form-label">Customer <span style="color:red">*</span></label>
                <select id="customerSelect" name="customer_id" class="form-select" required>
                    ${customerOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Tipe Kontak <span style="color:red">*</span></label>
                <select name="tipe_kontak" class="form-select" required>
                    <option value="WhatsApp" ${data && data.tipe_kontak === 'WhatsApp' ? 'selected' : ''}>WhatsApp</option>
                    <option value="Email" ${data && data.tipe_kontak === 'Email' ? 'selected' : ''}>Email</option>
                    <option value="Telepon" ${data && data.tipe_kontak === 'Telepon' ? 'selected' : ''}>Telepon</option>
                    <option value="Meeting" ${data && data.tipe_kontak === 'Meeting' ? 'selected' : ''}>Meeting</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Catatan Interaksi</label>
                <textarea name="catatan" class="form-textarea" rows="4" placeholder="Masukkan ringkasan atau catatan hasil interaksi...">${data ? (data.catatan || '') : ''}</textarea>
            </div>
        </form>
    `, saveInteraction);
}

function closeInteractionModal(){
    closeModal();
}

async function saveInteraction() {
    const form = document.getElementById("interactionForm");
    const formData = new FormData(form);
    const id = document.getElementById("interactionId").value;
    let url = "modules/crm/api/add_interactions.php";
    if(id) {
        url = "modules/crm/api/update_interaction.php";
    }

    const res = await fetch(url, {
        method: "POST",
        body: formData
    });

    const json = await res.json();

    if(json.success){
        alert(json.message);
        form.reset();
        loadInteractions();
        closeModal();
    }else{
        alert(json.message);
    }
}

async function editInteraction(id){
    try{
        const res = await fetch(`modules/crm/api/get_interaction.php?id=${id}`);
        const json = await res.json();
        if(!json.success){
            alert(json.message);
            return;
        }
        await openInteractionModal(json.data);
    }catch(err){
        console.error(err);
        alert("Gagal mengambil data interaksi.");
    }
}

async function deleteInteraction(id){

    if(!confirm("Yakin ingin menghapus interaksi ini?")){
        return;
    }

    const formData = new FormData();

    formData.append("id", id);

    const res = await fetch(
        "modules/crm/api/delete_interaction.php",
        {
            method:"POST",
            body:formData
        }
    );

    const json = await res.json();

    if(json.success){

        alert(json.message);

        loadInteractions();

    }else{

        alert(json.message);

    }

}

function pageCrmEvents() {

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">

            <div>
                <h1>Data Event</h1>
                <p class="text-muted">
                    Kelola event CRM.
                </p>
            </div>

            <button class="btn btn-primary">
                + Tambah Event
            </button>

        </div>

        <div class="card">

            <table class="table">

                <thead>

                    <tr>
                        <th>No</th>
                        <th>Nama Event</th>
                        <th>Lokasi</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>

                </thead>

                <tbody>

                    <tr>
                        <td>1</td>
                        <td>Workshop ERP</td>
                        <td>Jakarta</td>
                        <td>20-10-2026</td>
                        <td>Akan Datang</td>
                        <td>Edit | Hapus</td>
                    </tr>

                </tbody>

            </table>

        </div>
    `;
}

function pageCrmRegistrations() {

    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">

            <div>
                <h1>Registrasi Event</h1>
                <p class="text-muted">
                    Kelola registrasi customer pada event.
                </p>
            </div>

            <button class="btn btn-primary">
                + Tambah Registrasi
            </button>

        </div>

        <div class="card">

            <table class="table">

                <thead>

                    <tr>
                        <th>No</th>
                        <th>Customer</th>
                        <th>Event</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>

                </thead>

                <tbody>

                    <tr>
                        <td>1</td>
                        <td>Andi Saputra</td>
                        <td>Workshop ERP</td>
                        <td>12-10-2026</td>
                        <td>Disetujui</td>
                        <td>Edit | Hapus</td>
                    </tr>

                </tbody>

            </table>

        </div>
    `;
}