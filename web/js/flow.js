(function () {
  "use strict";

  const API = window.DicoAPI;
  const ED = window.DICO_EVENT_DATA;
  if (!API) return;

  const PAYMENT_INFO = {
    bank: "BCA",
    noRekening: "8710456923",
    atasNama: "Bima Sakti Prabandaru",
    qrisImage: "assets/images/qris-dico.jpeg",
    batasWaktu: "1x24 jam setelah mendaftar",
    kontakBantuan: "+62 812 3456 7890",
    kontakBantuanHref: "+6281234567890",
  };

  const JENIS_PENDAFTAR = ["Mahasiswa", "Pelajar (SMA/SMK)", "Dosen / Guru", "Umum / Profesional"];
  const MAX_FILE = 2 * 1024 * 1024;
  const ALLOWED_FILE = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) =>
    String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const param = (k) => new URLSearchParams(location.search).get(k);
  const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
  const currentPage = () => (location.pathname.split("/").pop() || "index.html") + location.search;
  // hanya izinkan tujuan redirect berupa halaman lokal (cegah open redirect)
  const safeNext = (n) => (n && /^[a-z0-9-]+\.html(\?[^\s]*)?$/i.test(n) ? n : null);
  const fmtDateTime = (iso) => {
    try {
      return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(/\./g, ".");
    } catch (e) {
      return iso;
    }
  };
  const fmtSize = (b) => (b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1024 / 1024).toFixed(1) + " MB");

  const getEvent = (id) => (ED ? ED.EVENTS.find((e) => String(e.id) === String(id)) : null);

  async function requireLogin() {
    const user = await API.ambilUserSaatIni();
    if (!user) {
      location.replace("login.html?next=" + encodeURIComponent(currentPage()));
      return null;
    }
    return user;
  }

  function fieldOf(input) {
    return input.closest(".field");
  }
  function setError(input, msg) {
    const f = fieldOf(input);
    if (!f) return;
    f.classList.toggle("has-error", !!msg);
    const p = $(".field__error", f);
    if (p) p.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function clearErrors(form) {
    $$(".field", form).forEach((f) => f.classList.remove("has-error"));
    $$(".field__control", form).forEach((i) => i.setAttribute("aria-invalid", "false"));
  }
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const isWa = (v) => /^(\+62|62|0)8[0-9]{7,12}$/.test(v.replace(/[\s-]/g, ""));
  function showAlert(el, msg) {
    if (!el) return;
    el.textContent = msg || "";
    el.hidden = !msg;
  }
  function setBusy(btn, busy, textBusy) {
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.textContent;
      btn.textContent = textBusy || "Memproses...";
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.label || btn.textContent;
      btn.disabled = false;
    }
  }
  function bindPasswordToggles(root) {
    $$("[data-toggle-pass]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.togglePass);
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Sembunyikan" : "Lihat";
      });
    });
  }

  function stepsHTML(current, paid) {
    const labels = paid ? ["Login", "Formulir", "Pembayaran", "Konfirmasi"] : ["Login", "Formulir", "Konfirmasi"];
    return `<ol class="flow-steps" aria-label="Tahapan pendaftaran">${labels
      .map((l, i) => {
        const n = i + 1;
        const cls = n < current ? "is-done" : n === current ? "is-current" : "";
        return `<li class="flow-step ${cls}" ${n === current ? 'aria-current="step"' : ""}><span class="flow-step__num">${n < current ? "&#10003;" : n}</span><span class="flow-step__label">${esc(l)}</span></li>`;
      })
      .join("")}</ol>`;
  }

  function eventSummaryHTML(ev, amount) {
    const online = ev.mode === "online";
    const price = amount !== undefined ? amount : ev.price;
    return `
      <aside class="flow-aside">
        <div class="sum-card">
          <span class="ed-type ed-type--inline ed-type--${esc(ev.type)}">${esc(ED.TYPE_LABEL[ev.type])}</span>
          <h3 class="sum-card__title">${esc(ev.title)}</h3>
          <dl class="sum-list">
            <div><dt>Tanggal</dt><dd>${esc(ED.fmtDateLong(ev.date))}</dd></div>
            <div><dt>Waktu</dt><dd>${esc(ev.time)}</dd></div>
            <div><dt>Lokasi</dt><dd>${esc(ev.venue)} <span class="ed-chip ${online ? "ed-chip--blue" : "ed-chip--teal"}">${online ? "Online" : "Offline"}</span></dd></div>
          </dl>
          <div class="sum-total">
            <span>${price > 0 ? "Total pembayaran" : "Biaya pendaftaran"}</span>
            <strong class="${price > 0 ? "" : "is-free"}">${price > 0 ? esc(rupiah(price)) : "Gratis"}</strong>
          </div>
          <a class="sum-link" href="event-detail.html?id=${encodeURIComponent(ev.id)}">Lihat detail event</a>
        </div>
      </aside>`;
  }

  function stateHTML(icon, title, text, actions) {
    return `
      <div class="flow-state">
        <span class="flow-state__icon">${icon}</span>
        <h1>${esc(title)}</h1>
        <p>${esc(text)}</p>
        <div class="flow-state__actions">${actions || ""}</div>
      </div>`;
  }
  const ICON_WARN = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_CLOCK = '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const ICON_X = '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  function statusMeta(status) {
    const S = API.STATUS;
    const map = {
      [S.TERDAFTAR]: { label: "Terdaftar", tone: "success", icon: ICON_CHECK, title: "Pendaftaran berhasil!", text: "Kamu sudah terdaftar di event ini. Simpan kode pendaftaranmu dan sampai jumpa di acara." },
      [S.MENUNGGU_PEMBAYARAN]: { label: "Menunggu pembayaran", tone: "warn", icon: ICON_CLOCK, title: "Pendaftaran tersimpan", text: "Selesaikan pembayaran dan unggah bukti transfer supaya pendaftaranmu bisa diverifikasi panitia." },
      [S.MENUNGGU_VERIFIKASI]: { label: "Menunggu verifikasi panitia", tone: "info", icon: ICON_CLOCK, title: "Bukti pembayaran diterima", text: "Panitia akan memeriksa pembayaranmu. Status pendaftaran akan diperbarui setelah diverifikasi." },
      [S.TERVERIFIKASI]: { label: "Pembayaran terverifikasi", tone: "success", icon: ICON_CHECK, title: "Pendaftaran terkonfirmasi", text: "Pembayaranmu sudah diverifikasi. Sampai jumpa di acara!" },
      [S.DITOLAK]: { label: "Bukti pembayaran ditolak", tone: "error", icon: ICON_X, title: "Bukti pembayaran ditolak", text: "Bukti pembayaranmu belum dapat diterima. Silakan unggah ulang bukti yang jelas dan sesuai." },
    };
    return map[status] || map[S.TERDAFTAR];
  }

  async function initLogin() {
    const next = safeNext(param("next"));
    const goNext = () => location.replace(next || "index.html");

    const existing = await API.ambilUserSaatIni();
    if (existing) return goNext();

    const tabMasuk = $("#tabMasuk");
    const tabDaftar = $("#tabDaftar");
    const formLogin = $("#formLogin");
    const formDaftar = $("#formDaftar");
    const title = $("#authTitle");
    const sub = $("#authSub");
    const notice = $("#authNotice");
    const demo = $("#authDemo");
    if (demo) demo.hidden = !API.DEMO_MODE;

    if (next && /^daftar-event\.html/.test(next) && ED) {
      const id = new URLSearchParams(next.split("?")[1] || "").get("id");
      const ev = getEvent(id);
      if (ev) {
        notice.innerHTML = "Masuk atau buat akun dulu untuk mendaftar: <strong>" + esc(ev.title) + "</strong>";
        notice.hidden = false;
      }
    }

    function setMode(mode) {
      const daftar = mode === "daftar";
      formLogin.hidden = daftar;
      formDaftar.hidden = !daftar;
      tabMasuk.classList.toggle("is-active", !daftar);
      tabDaftar.classList.toggle("is-active", daftar);
      tabMasuk.setAttribute("aria-selected", String(!daftar));
      tabDaftar.setAttribute("aria-selected", String(daftar));
      title.textContent = daftar ? "Buat akun baru" : "Masuk ke akunmu";
      sub.textContent = daftar ? "Isi data berikut. Akun ini dipakai untuk mendaftar semua event DICO." : "Gunakan email dan password yang kamu daftarkan.";
      document.title = (daftar ? "Daftar Akun" : "Masuk") + " | DICO - Digital Creative Community";
    }
    tabMasuk.addEventListener("click", () => setMode("masuk"));
    tabDaftar.addEventListener("click", () => setMode("daftar"));
    $$("[data-switch]").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        setMode(a.dataset.switch);
      })
    );
    setMode(param("mode") === "daftar" ? "daftar" : "masuk");
    bindPasswordToggles(document);

    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors(formLogin);
      showAlert($("#loginError"), "");
      const email = $("#loginEmail");
      const pass = $("#loginPassword");
      let ok = true;
      if (!email.value.trim()) { setError(email, "Email wajib diisi."); ok = false; }
      else if (!isEmail(email.value.trim())) { setError(email, "Format email belum benar."); ok = false; }
      if (!pass.value) { setError(pass, "Password wajib diisi."); ok = false; }
      if (!ok) return;
      const btn = $("#loginSubmit");
      setBusy(btn, true, "Memeriksa...");
      try {
        await API.login({ email: email.value, password: pass.value });
        goNext();
      } catch (err) {
        if (err.code === "STAFF_REDIRECT") return;
        showAlert($("#loginError"), err.message || "Gagal masuk. Coba lagi.");
        setBusy(btn, false);
      }
    });

    formDaftar.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors(formDaftar);
      showAlert($("#daftarError"), "");
      const nama = $("#regNama"), email = $("#regEmail"), wa = $("#regWa"), p1 = $("#regPassword"), p2 = $("#regPassword2");
      const instansi = $("#regInstansi"), minatProduk = $("#regMinat");
      let ok = true;
      if (nama.value.trim().length < 3) { setError(nama, "Nama lengkap minimal 3 karakter."); ok = false; }
      if (!email.value.trim()) { setError(email, "Email wajib diisi."); ok = false; }
      else if (!isEmail(email.value.trim())) { setError(email, "Format email belum benar."); ok = false; }
      if (!wa.value.trim()) { setError(wa, "Nomor WhatsApp wajib diisi."); ok = false; }
      else if (!isWa(wa.value.trim())) { setError(wa, "Nomor tidak valid (contoh: 0812 3456 7890)."); ok = false; }
      if (p1.value.length < 8) { setError(p1, "Password minimal 8 karakter."); ok = false; }
      if (!p2.value) { setError(p2, "Ulangi password."); ok = false; }
      else if (p1.value !== p2.value) { setError(p2, "Password tidak sama."); ok = false; }
      if (!ok) return;
      const btn = $("#daftarSubmit");
      setBusy(btn, true, "Membuat akun...");
      try {
        await API.daftarAkun({ nama: nama.value, email: email.value, wa: wa.value, instansi: instansi.value, minat_produk: minatProduk.value, password: p1.value });
        goNext();
      } catch (err) {
        showAlert($("#daftarError"), err.message || "Gagal membuat akun. Coba lagi.");
        setBusy(btn, false);
      }
    });
  }

  async function initDaftarEvent() {
    const root = $("#flowRoot");
    const backBtn = '<a class="flow-btn flow-btn--primary" href="event.html">Lihat Semua Event</a>';
    const ev = getEvent(param("id"));
    if (!ev) {
      root.innerHTML = stateHTML(ICON_WARN, "Event tidak ditemukan", "Event yang ingin kamu daftar tidak tersedia atau tautannya sudah tidak berlaku.", backBtn);
      return;
    }
    document.title = "Daftar: " + ev.title + " | DICO - Digital Creative Community";

    const user = await requireLogin();
    if (!user) return;

    if (ev.status === 'selesai') {
      root.innerHTML = stateHTML(ICON_WARN, "Event sudah selesai", "Event ini sudah berakhir. Pendaftaran tidak dapat dilakukan lagi.", `<a class="flow-btn flow-btn--primary" href="event.html">Lihat Event Lain</a>`);
      return;
    }
    if (ev.status === 'draft') {
      root.innerHTML = stateHTML(ICON_WARN, "Event belum dibuka", "Event ini masih dalam tahap persiapan dan belum dibuka untuk pendaftaran.", `<a class="flow-btn flow-btn--primary" href="event.html">Lihat Event Lain</a>`);
      return;
    }

    if (ev.price === null || ev.price === undefined) {
      root.innerHTML = stateHTML(ICON_WARN, "Pendaftaran belum dibuka", "Biaya pendaftaran untuk event ini belum diumumkan. Silakan cek kembali nanti.", `<a class="flow-btn flow-btn--primary" href="event-detail.html?id=${encodeURIComponent(ev.id)}">Kembali ke Detail Event</a>`);
      return;
    }
    if (ED.isRegClosed(ev)) {
      root.innerHTML = stateHTML(ICON_WARN, "Pendaftaran ditutup", ED.isEnded(ev) ? "Event ini sudah selesai sehingga pendaftaran tidak dapat dilakukan." : "Batas waktu pendaftaran event ini sudah lewat.", `<a class="flow-btn flow-btn--primary" href="event.html">Lihat Event Lain</a>`);
      return;
    }

    const paid = ev.price > 0;
    const exist = await API.cariPendaftaran(ev.id);
    if (exist) {
      root.innerHTML = `
        ${stepsHTML(2, paid)}
        <div class="flow-layout">
          <div class="flow-card">
            <div class="flow-alert flow-alert--info">Kamu sudah terdaftar di event ini (kode <strong>${esc(exist.id)}</strong>).</div>
            <p class="flow-muted">Satu akun hanya dapat mendaftar satu kali untuk setiap event. Kamu bisa melihat status pendaftaranmu di halaman konfirmasi.</p>
            <a class="flow-btn flow-btn--primary" href="konfirmasi.html?reg=${encodeURIComponent(exist.id)}">Lihat Pendaftaran Saya</a>
          </div>
          ${eventSummaryHTML(ev)}
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="flow-head">
        <h1 class="flow-title">Formulir Pendaftaran</h1>
        <p class="flow-sub">Lengkapi data berikut untuk mendaftar ${esc(ED.TYPE_LABEL[ev.type].toLowerCase())} ini.</p>
      </div>
      ${stepsHTML(2, paid)}
      <div class="flow-layout">
        <form class="flow-card" id="formDaftarEvent" novalidate>
          <div class="flow-alert flow-alert--error" id="regError" role="alert" hidden></div>
          <div class="field">
            <label class="field__label" for="fNama">Nama lengkap</label>
            <input class="field__control" id="fNama" type="text" autocomplete="name" value="${esc(user.nama)}" />
            <p class="field__error"></p>
          </div>
          <div class="field-row">
            <div class="field">
              <label class="field__label" for="fEmail">Email</label>
              <input class="field__control" id="fEmail" type="email" autocomplete="email" value="${esc(user.email)}" />
              <p class="field__error"></p>
            </div>
            <div class="field">
              <label class="field__label" for="fWa">No. WhatsApp</label>
              <input class="field__control" id="fWa" type="tel" autocomplete="tel" value="${esc(user.wa)}" placeholder="0812 3456 7890" />
              <p class="field__error"></p>
            </div>
          </div>
          <div class="field">
            <label class="field__label" for="fInstansi">Asal kampus / instansi</label>
            <input class="field__control" id="fInstansi" type="text" placeholder="Contoh: Universitas BSI Kampus Yogyakarta" />
            <p class="field__error"></p>
          </div>
          <div class="field">
            <label class="field__label" for="fJenis">Jenis pendaftar</label>
            <select class="field__control" id="fJenis">
              <option value="">Pilih jenis pendaftar</option>
              ${JENIS_PENDAFTAR.map((j) => `<option value="${esc(j)}">${esc(j)}</option>`).join("")}
            </select>
            <p class="field__error"></p>
          </div>
          <div class="field">
            <label class="check"><input type="checkbox" id="fSetuju" /> <span>Saya menyatakan data di atas benar dan menyetujui <a href="kontak.html" target="_blank" rel="noopener">Syarat &amp; Ketentuan</a> DICO.</span></label>
            <p class="field__error"></p>
          </div>
          <div class="flow-actions">
            <a class="flow-btn flow-btn--ghost" href="event-detail.html?id=${encodeURIComponent(ev.id)}">Kembali</a>
            <button class="flow-btn flow-btn--primary" type="submit" id="regSubmit">${paid ? "Lanjut ke Pembayaran" : "Kirim Pendaftaran"}</button>
          </div>
        </form>
        ${eventSummaryHTML(ev)}
      </div>`;

    const form = $("#formDaftarEvent");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors(form);
      showAlert($("#regError"), "");
      const nama = $("#fNama"), email = $("#fEmail"), wa = $("#fWa"), instansi = $("#fInstansi"), jenis = $("#fJenis"), setuju = $("#fSetuju");
      let ok = true;
      if (nama.value.trim().length < 3) { setError(nama, "Nama lengkap minimal 3 karakter."); ok = false; }
      if (!isEmail(email.value.trim())) { setError(email, "Format email belum benar."); ok = false; }
      if (!isWa(wa.value.trim())) { setError(wa, "Nomor WhatsApp tidak valid (contoh: 0812 3456 7890)."); ok = false; }
      if (instansi.value.trim().length < 2) { setError(instansi, "Asal kampus / instansi wajib diisi."); ok = false; }
      if (!jenis.value) { setError(jenis, "Pilih jenis pendaftar."); ok = false; }
      if (!setuju.checked) { setError(setuju, "Centang persetujuan untuk melanjutkan."); ok = false; }
      if (!ok) {
        const firstErr = $(".field.has-error .field__control, .field.has-error input", form);
        if (firstErr) firstErr.focus();
        return;
      }
      const btn = $("#regSubmit");
      setBusy(btn, true, "Mengirim...");
      try {
        const { registration } = await API.kirimPendaftaran({
          eventId: ev.id,
          nama: nama.value,
          email: email.value,
          wa: wa.value,
          instansi: instansi.value,
          jenis: jenis.value,
          amount: ev.price,
        });
        location.href = (paid ? "pembayaran.html?reg=" : "konfirmasi.html?reg=") + encodeURIComponent(registration.id);
      } catch (err) {
        if (err.code === "UNAUTHENTICATED") return location.replace("login.html?next=" + encodeURIComponent(currentPage()));
        showAlert($("#regError"), err.message || "Gagal mengirim pendaftaran. Coba lagi.");
        setBusy(btn, false);
      }
    });
  }

  async function loadRegistration(root) {
    const user = await requireLogin();
    if (!user) return null;
    const id = param("reg");
    try {
      const { registration } = await API.ambilPendaftaran(id);
      const ev = getEvent(registration.eventId);
      if (!ev) throw new Error("Event tidak ditemukan.");
      return { user, reg: registration, ev };
    } catch (err) {
      if (err.code === "UNAUTHENTICATED") { location.replace("login.html?next=" + encodeURIComponent(currentPage())); return null; }
      root.innerHTML = stateHTML(ICON_WARN, "Data pendaftaran tidak ditemukan", "Kode pendaftaran tidak valid atau bukan milik akun ini.", '<a class="flow-btn flow-btn--primary" href="event.html">Lihat Semua Event</a>');
      return null;
    }
  }

  async function initPembayaran() {
    const root = $("#flowRoot");
    const data = await loadRegistration(root);
    if (!data) return;
    const { reg, ev } = data;
    const S = API.STATUS;

    if (reg.amount <= 0 || ![S.MENUNGGU_PEMBAYARAN, S.DITOLAK].includes(reg.status)) {
      location.replace("konfirmasi.html?reg=" + encodeURIComponent(reg.id));
      return;
    }
    document.title = "Pembayaran | DICO - Digital Creative Community";
    const info = PAYMENT_INFO;
    const row = (label, value) => `<div><dt>${esc(label)}</dt><dd>${value ? esc(value) : '<span class="pay-empty">Belum diisi panitia</span>'}</dd></div>`;
    const rejected = reg.status === S.DITOLAK;

    root.innerHTML = `
      <div class="flow-head">
        <h1 class="flow-title">Pembayaran</h1>
        <p class="flow-sub">Transfer sesuai total pembayaran, lalu unggah bukti transfer.</p>
      </div>
      ${stepsHTML(3, true)}
      <div class="flow-layout">
        <div class="flow-card">
          ${rejected ? '<div class="flow-alert flow-alert--error">Bukti pembayaran sebelumnya ditolak. Silakan unggah ulang bukti yang jelas dan sesuai.</div>' : ""}
          <div class="pay-total"><span>Total yang harus dibayar</span><strong>${esc(rupiah(reg.amount))}</strong></div>

          <h2 class="flow-h2">Cara pembayaran</h2>
          <div class="pay-methods">
            <div class="pay-method">
              <h3>Transfer Bank</h3>
              <dl class="pay-list">
                ${row("Bank", info.bank)}
                ${row("No. Rekening", info.noRekening)}
                ${row("Atas nama", info.atasNama)}
                ${info.batasWaktu ? row("Batas waktu", info.batasWaktu) : ""}
              </dl>
            </div>
            <div class="pay-method">
              <h3>QRIS</h3>
              ${info.qrisImage ? `<img class="pay-qris" src="${esc(info.qrisImage)}" alt="QRIS pembayaran" />` : '<div class="pay-qris pay-qris--empty">QRIS panitia akan ditampilkan di sini</div>'}
            </div>
          </div>

          <h2 class="flow-h2">Unggah bukti transfer</h2>
          <form id="formBayar" novalidate>
            <div class="flow-alert flow-alert--error" id="payError" role="alert" hidden></div>
            <label class="upload" for="proofInput" id="uploadZone">
              <input id="proofInput" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden />
              <span class="upload__icon">&#8682;</span>
              <span class="upload__text"><strong>Pilih file</strong> bukti transfer</span>
              <span class="upload__hint">JPG, PNG, WEBP, atau PDF. Maksimal 2 MB.</span>
            </label>
            <div class="upload-file" id="uploadFile" hidden></div>
            <div class="flow-actions">
              <a class="flow-btn flow-btn--ghost" href="konfirmasi.html?reg=${encodeURIComponent(reg.id)}">Bayar nanti</a>
              <button class="flow-btn flow-btn--primary" type="submit" id="paySubmit" disabled>Kirim Bukti Pembayaran</button>
            </div>
          </form>
          <p class="flow-muted pay-help">Butuh bantuan? Hubungi panitia di <a href="tel:${esc(info.kontakBantuanHref)}">${esc(info.kontakBantuan)}</a>.</p>
        </div>
        ${eventSummaryHTML(ev, reg.amount)}
      </div>`;

    const input = $("#proofInput");
    const zone = $("#uploadZone");
    const fileBox = $("#uploadFile");
    const submit = $("#paySubmit");
    const errBox = $("#payError");
    let chosen = null;
    let previewUrl = null;

    function reset() {
      chosen = null;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      fileBox.hidden = true;
      fileBox.innerHTML = "";
      zone.hidden = false;
      submit.disabled = true;
    }

    input.addEventListener("change", () => {
      showAlert(errBox, "");
      const f = input.files && input.files[0];
      if (!f) return reset();
      if (!ALLOWED_FILE.includes(f.type)) { input.value = ""; reset(); showAlert(errBox, "Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF."); return; }
      if (f.size > MAX_FILE) { input.value = ""; reset(); showAlert(errBox, "Ukuran file terlalu besar. Maksimal 2 MB."); return; }
      chosen = f;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
      zone.hidden = true;
      fileBox.hidden = false;
      fileBox.innerHTML = `
        ${previewUrl ? `<img class="upload-file__thumb" src="${previewUrl}" alt="Pratinjau bukti transfer" />` : '<span class="upload-file__thumb upload-file__thumb--pdf">PDF</span>'}
        <div class="upload-file__meta"><strong>${esc(f.name)}</strong><span>${esc(fmtSize(f.size))}</span></div>
        <button class="upload-file__remove" type="button" id="removeFile">Ganti</button>`;
      $("#removeFile").addEventListener("click", () => { input.value = ""; reset(); });
      submit.disabled = false;
    });

    $("#formBayar").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!chosen) { showAlert(errBox, "Pilih file bukti transfer terlebih dahulu."); return; }
      setBusy(submit, true, "Mengunggah...");
      try {
        await API.unggahBuktiBayar(reg.id, chosen);
        location.href = "konfirmasi.html?reg=" + encodeURIComponent(reg.id);
      } catch (err) {
        if (err.code === "UNAUTHENTICATED") return location.replace("login.html?next=" + encodeURIComponent(currentPage()));
        showAlert(errBox, err.message || "Gagal mengunggah bukti. Coba lagi.");
        setBusy(submit, false);
      }
    });
  }

  async function initKonfirmasi() {
    const root = $("#flowRoot");
    const data = await loadRegistration(root);
    if (!data) return;
    const { reg, ev } = data;
    const S = API.STATUS;
    const paid = reg.amount > 0;
    const meta = statusMeta(reg.status);
    document.title = "Konfirmasi Pendaftaran | DICO - Digital Creative Community";

    const needPay = reg.status === S.MENUNGGU_PEMBAYARAN || reg.status === S.DITOLAK;
    const online = ev.mode === "online";

    root.innerHTML = `
      ${stepsHTML(paid ? 4 : 3, paid).replace(/is-current/g, "is-done")}
      <div class="cf">
        <div class="cf-hero cf-hero--${meta.tone}">
          <span class="cf-hero__icon">${meta.icon}</span>
          <h1>${esc(meta.title)}</h1>
          <p>${esc(meta.text)}</p>
          <span class="cf-badge cf-badge--${meta.tone}">${esc(meta.label)}</span>
        </div>

        <div class="flow-card cf-card">
          <div class="cf-code">
            <span>Kode pendaftaran</span>
            <strong id="cfCode">${esc(reg.id)}</strong>
            <button class="cf-copy" type="button" id="cfCopy">Salin</button>
          </div>

          <h2 class="flow-h2">Ringkasan</h2>
          <dl class="cf-list">
            <div><dt>Event</dt><dd>${esc(ev.title)} <span class="ed-chip">${esc(ED.TYPE_LABEL[ev.type])}</span></dd></div>
            <div><dt>Tanggal &amp; waktu</dt><dd>${esc(ED.fmtDateLong(ev.date))}, ${esc(ev.time)}</dd></div>
            <div><dt>Lokasi</dt><dd>${esc(ev.venue)} (${online ? "Online" : "Offline"})</dd></div>
            <div><dt>Nama peserta</dt><dd>${esc(reg.nama)}</dd></div>
            <div><dt>Email</dt><dd>${esc(reg.email)}</dd></div>
            <div><dt>No. WhatsApp</dt><dd>${esc(reg.wa)}</dd></div>
            <div><dt>Asal kampus / instansi</dt><dd>${esc(reg.instansi)} <span class="flow-muted">(${esc(reg.jenis)})</span></dd></div>
            <div><dt>${paid ? "Total pembayaran" : "Biaya"}</dt><dd>${paid ? esc(rupiah(reg.amount)) : '<span class="is-free">Gratis</span>'}</dd></div>
            ${reg.payment ? `<div><dt>Bukti pembayaran</dt><dd>${esc(reg.payment.fileName)} <span class="flow-muted">(${esc(fmtSize(reg.payment.size))}, dikirim ${esc(fmtDateTime(reg.payment.uploadedAt))})</span></dd></div>` : ""}
            <div><dt>Didaftarkan pada</dt><dd>${esc(fmtDateTime(reg.createdAt))}</dd></div>
          </dl>

          <div class="flow-actions flow-actions--end">
            ${needPay ? `<a class="flow-btn flow-btn--primary" href="pembayaran.html?reg=${encodeURIComponent(reg.id)}">${reg.status === S.DITOLAK ? "Unggah Ulang Bukti" : "Selesaikan Pembayaran"}</a>` : ""}
            <a class="flow-btn flow-btn--ghost" href="event.html">Lihat Event Lain</a>
            <a class="flow-btn ${needPay ? "flow-btn--ghost" : "flow-btn--primary"}" href="index.html">Kembali ke Beranda</a>
          </div>
        </div>
      </div>`;

    const copy = $("#cfCopy");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(reg.id);
        copy.textContent = "Tersalin";
      } catch (e) {
        copy.textContent = "Salin manual";
      }
      setTimeout(() => (copy.textContent = "Salin"), 1800);
    });
  }

  function boot() {
    const b = document.body.classList;
    if (b.contains("page-login")) return initLogin();

    const initFlow = () => {
      if (b.contains("page-daftar-event")) initDaftarEvent();
      else if (b.contains("page-pembayaran")) initPembayaran();
      else if (b.contains("page-konfirmasi")) initKonfirmasi();
    };

    if (ED && ED.EVENTS.length > 0) initFlow();
    else document.addEventListener("DicoEventsLoaded", initFlow, { once: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
