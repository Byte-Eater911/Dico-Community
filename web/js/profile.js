(async function () {
  "use strict";

  const API = window.DicoAPI;
  if (!API) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[c]);

  const nameEl = $("#profileName");
  const emailEl = $("#profileEmail");
  const user = await API.ambilUserSaatIni();
  if (user) {
    nameEl.textContent = user.nama;
    emailEl.textContent = user.email;
  }

  const listBox = $("#regList");
  if (!listBox) return;

  try {
    const json = await fetch("api/registration.php?action=profile&_=" + Date.now(), { credentials: "include", cache: "no-store" }).then(r => r.json());
    if (!json.success) throw new Error(json.message || "Gagal ambil data");
    const data = json.data || [];
    renderRegistrations(data);
  } catch (e) {
    listBox.innerHTML = `<div class="profile-empty"><i class="fa-solid fa-exclamation-triangle profile-empty__icon"></i><h3>Gagal memuat data</h3><p>${esc(e.message)}</p></div>`;
  }

  function fmtDate(iso) {
    if (!iso) return "-";
    try {
      const d = new Date(iso.replace(/-/g, "/"));
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return iso;
    }
  }

  function statusBadge(status) {
    const map = {
      terdaftar: { label: "Terdaftar", class: "reg-badge--gray" },
      menunggu_pembayaran: { label: "Menunggu Bayar", class: "reg-badge--warn" },
      menunggu_verifikasi: { label: "Verifikasi Panitia", class: "reg-badge--info" },
      terverifikasi: { label: "Terverifikasi", class: "reg-badge--success" },
      ditolak: { label: "Ditolak", class: "reg-badge--error" },
    };
    const b = map[status] || { label: status, class: "reg-badge--gray" };
    return `<span class="reg-badge ${b.class}">${b.label}</span>`;
  }

  function renderRegistrations(regs) {
    if (!regs.length) {
      listBox.innerHTML = `
        <div class="profile-empty">
          <i class="fa-solid fa-circle-info profile-empty__icon"></i>
          <h3>Belum ada pendaftaran</h3>
          <p>Mulai daftar event di halaman <a href="event.html">Event</a>.</p>
        </div>`;
      return;
    }

    const html = regs.map((r) => {
      const stripeClass = {
        terdaftar: "reg-badge--gray",
        menunggu_pembayaran: "reg-badge--warn",
        menunggu_verifikasi: "reg-badge--info",
        terverifikasi: "reg-badge--success",
        ditolak: "reg-badge--error",
      }[r.status] || "reg-badge--gray";

      const ev = window.DICO_EVENT_DATA && window.DICO_EVENT_DATA.EVENTS.find(e => String(e.id) === String(r.eventId));
      const evTitle = (ev ? ev.title : r.eventTitle) || "Event";
      const evDate = (ev ? ev.date : r.eventDate) || "";
      const regCode = r.id ? 'TIK-' + r.id : '';

      return `
        <div class="reg-card" data-id="${esc(r.id)}" data-status="${esc(r.status)}">
          <div class="reg-card__stripe reg-card__stripe--${stripeClass.replace('reg-badge--', '')}"></div>
          <div class="reg-card__body">
            <div class="reg-card__head">
              <h3 class="reg-card__title">${esc(evTitle)}</h3>
              <div class="reg-card__code">${esc(regCode)}</div>
            </div>
            <div class="reg-card__meta">
              <div class="reg-card__meta-item"><i class="fa-solid fa-calendar-days"></i> ${esc(fmtDate(evDate))}</div>
              <div class="reg-card__meta-item"><i class="fa-solid fa-user"></i> ${esc(r.nama)}</div>
              ${r.instansi ? `<div class="reg-card__meta-item"><i class="fa-solid fa-building"></i> ${esc(r.instansi)}</div>` : ''}
            </div>
            <div class="reg-card__footer">
              ${statusBadge(r.status)}
              <div class="reg-card__actions">
                <button class="btn--sm-ticket btn--sm-ticket--outline" data-action="ticket">
                  <i class="fa-solid fa-ticket"></i> Lihat Tiket
                </button>
              </div>
            </div>
          </div>
        </div>`;
    }).join("\n");
    listBox.innerHTML = html;

    $$('[data-action="ticket"]', listBox).forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.reg-card');
        const id = card.dataset.id;
        const reg = regs.find(x => x.id === id);
        openTicketModal(reg);
      });
    });
  }

  const modal = $("#ticketModal");
  const modalContent = $("#ticketContent");
  const modalClose = $$("#ticketClose, #ticketClose2");
  const modalPrint = $("#ticketPrint");

  function mapStatusToBanner(status) {
    const map = {
      terdaftar: { text: "Pendaftaran Berhasil", icon: "fa-circle-check", class: "ticket-card__status-banner--gray" },
      menunggu_pembayaran: { text: "Menunggu Pembayaran", icon: "fa-clock", class: "ticket-card__status-banner--warn" },
      menunggu_verifikasi: { text: "Menunggu Verifikasi Panitia", icon: "fa-hourglass-half", class: "ticket-card__status-banner--info" },
      terverifikasi: { text: "Pembayaran Terverifikasi", icon: "fa-circle-check", class: "ticket-card__status-banner--success" },
      ditolak: { text: "Bukti Pembayaran Ditolak", icon: "fa-circle-xmark", class: "ticket-card__status-banner--error" },
    };
    return map[status] || { text: status, icon: "fa-circle-info", class: "ticket-card__status-banner--gray" };
  }

  function openTicketModal(reg) {
    if (!reg) return;
    const banner = mapStatusToBanner(reg.status);

    const ev = window.DICO_EVENT_DATA && window.DICO_EVENT_DATA.EVENTS.find(e => String(e.id) === String(reg.eventId));
    const evTitle = (ev ? ev.title : reg.eventTitle) || "Event";
    const evDate = (ev ? ev.date : reg.eventDate) || "";
    const evVenue = (ev ? ev.venue : reg.eventVenue) || "";
    const regCode = 'TIK-' + reg.id;

    const html = `
      <div class="ticket-card">
        <div class="ticket-card__header">
          <div class="ticket-card__brand">
            <div class="ticket-card__logo-wrap">
              <img src="assets/images/logo-dico.png" alt="DICO" class="ticket-card__logo" />
            </div>
            <span class="ticket-card__badge-type">TIKET RESMI</span>
          </div>
          <h2 class="ticket-card__title">${esc(evTitle)}</h2>
          <div class="ticket-card__event-meta">
            <span><i class="fa-regular fa-calendar-days"></i> ${esc(fmtDate(evDate))}</span>
            ${evVenue ? `<span><i class="fa-solid fa-location-dot"></i> ${esc(evVenue)}</span>` : ""}
          </div>
        </div>
        <div class="ticket-card__body">
          <dl class="ticket-dl">
            <dt>Nama Peserta</dt><dd>${esc(reg.nama)}</dd>
            <dt>Email</dt><dd>${esc(reg.email)}</dd>
            <dt>No. WhatsApp</dt><dd>${esc(reg.wa || "-")}</dd>
            <dt>Instansi</dt><dd>${esc(reg.instansi || "-")}</dd>
            <dt>Jenis Pendaftar</dt><dd>${esc(reg.jenis || "Peserta")}</dd>
            <dt>Total Bayar</dt><dd class="ticket-dl__price">${reg.amount > 0 ? "Rp " + Number(reg.amount).toLocaleString('id-ID') : "Gratis"}</dd>
          </dl>
          <hr class="ticket-card__divider" />
          <div class="ticket-card__code-wrap">
            <span class="ticket-card__code-label">KODE PENDAFTARAN / TIKET</span>
            <div class="ticket-card__code">${esc(regCode)}</div>
          </div>
        </div>
        <div class="ticket-card__status-banner ${banner.class}">
          <i class="fa-solid ${banner.icon}"></i> ${banner.text}
        </div>
      </div>`;

    modalContent.innerHTML = html;
    modal.hidden = false;
    setTimeout(() => modalClose[0].focus(), 0);
  }

  modalClose.forEach(el => el.addEventListener('click', () => { modal.hidden = true; }));

  modalPrint.addEventListener('click', () => {
    const prev = document.body.innerHTML;
    document.body.innerHTML = modalContent.innerHTML;
    window.print();
    document.body.innerHTML = prev;
    location.reload();
  });
})();
