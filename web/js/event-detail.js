(function () {
  "use strict";

  const { EVENTS, TYPE_LABEL, parseDate, fmtDateLong, fmtDateShort, fmtPrice, isEnded, isRegClosed } = window.DICO_EVENT_DATA;

  const registerHref = (ev) => ev.registerUrl || "daftar-event.html?id=" + encodeURIComponent(ev.id);

  const ORGANIZER = {
    name: "DICO - Digital Creative Community",
    logo: "assets/images/logo-dico.png",
    about:
      "DICO (Digital Creative Community) adalah komunitas digital yang berfokus pada pengembangan potensi individu dan mendorong pertumbuhan ekosistem digital di Indonesia.",
    email: "info@dicocommunity.org",
    phone: "+62 812 3456 7890",
    phoneHref: "+6281234567890",
    city: "Yogyakarta, Indonesia",
  };

  const BENEFITS = [
    { icon: "fa-user-tie", title: "Ilmu langsung dari ahli", text: "Dapatkan ilmu langsung dari para ahli di bidangnya." },
    { icon: "fa-book-open", title: "Materi berkualitas", text: "Akses materi eksklusif yang relevan dan up-to-date." },
    { icon: "fa-award", title: "Sertifikat", text: "Tingkatkan nilai tambah untuk kariermu." },
    { icon: "fa-people-group", title: "Jaringan luas", text: "Bertemu dan terhubung dengan komunitas profesional." },
  ];

  const $ = (sel, root = document) => root.querySelector(sel);

  const esc = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmtDeadline = (str) => {
    const d = new Date(str);
    const date = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const time = String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0");
    return date + ", " + time + " WIB";
  };

  const initials = (name) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const detailUrl = (id) => "event-detail.html?id=" + encodeURIComponent(id);

  function renderBanner(ev, ended, closed) {
    const status = ended
      ? '<span class="ed-status ed-status--ended"><i class="fa-solid fa-circle-check"></i> Event telah berakhir</span>'
      : closed
      ? '<span class="ed-status ed-status--ended"><i class="fa-solid fa-lock"></i> Pendaftaran ditutup</span>'
      : '<span class="ed-status ed-status--open"><i class="fa-solid fa-circle"></i> Pendaftaran dibuka</span>';

    const media = ev.banner
      ? `<img class="ed-banner__img" src="${esc(ev.banner)}" alt="Banner ${esc(ev.title)}" />`
      : ev.poster
      ? `<img class="ed-banner__img ed-banner__img--blur" src="${esc(ev.poster)}" alt="" aria-hidden="true" />
         <span class="ed-banner__deco ed-banner__deco--dots" aria-hidden="true"></span>
         <span class="ed-banner__deco ed-banner__deco--slash" aria-hidden="true"></span>
         <i class="fa-solid ${esc(ev.icon)} ed-banner__icon" aria-hidden="true"></i>`
      : `<span class="ed-banner__deco ed-banner__deco--dots" aria-hidden="true"></span>
         <span class="ed-banner__deco ed-banner__deco--slash" aria-hidden="true"></span>
         <i class="fa-solid ${esc(ev.icon)} ed-banner__icon" aria-hidden="true"></i>
         <span class="ed-banner__placeholder"><i class="fa-regular fa-image"></i> Banner event menyusul</span>`;

    return `
      <div class="ed-banner ed-banner--${esc(ev.type)}">
        ${media}
        ${status}
      </div>`;
  }

  function renderSpeaker(ev) {
    if (!ev.speaker) {
      return `
        <div class="ed-person ed-person--placeholder">
          <span class="ed-avatar ed-avatar--empty"><i class="fa-regular fa-user"></i></span>
          <div class="ed-person__body">
            <h3>Pembicara akan segera diumumkan</h3>
            <p>Informasi pembicara untuk event ini belum tersedia. Pantau terus halaman ini atau media sosial DICO untuk pembaruan.</p>
          </div>
        </div>`;
    }
    const sp = ev.speaker;
    const role = sp.role || "Pembicara DICO";
    const skills = (sp.skills || []).map((s) => `<span class="skill-tag skill-tag--blue">${esc(s)}</span>`).join("");
    const more = sp.moreSkills ? `<span class="skill-tag skill-tag--more">+${esc(sp.moreSkills)}</span>` : "";
    const skillsHTML = skills ? `<p class="ed-person__label">Keahlian</p><div class="ed-person__skills">${skills}${more}</div>` : "";
    const bio = !skills && sp.bio ? `<p>${esc(sp.bio)}</p>` : !skills ? "<p>Profil lengkap pembicara akan segera ditambahkan.</p>" : "";
    const avatar = sp.photo
      ? `<img class="ed-avatar ed-avatar--photo" src="${esc(sp.photo)}" alt="Foto ${esc(sp.name)}" loading="lazy" />`
      : `<span class="ed-avatar" aria-hidden="true">${esc(initials(sp.name))}</span>`;
    const link = sp.expertId ? `<a class="ed-link" href="expert.html">Lihat semua expert <i class="fa-solid fa-arrow-right"></i></a>` : "";
    return `
      <div class="ed-person">
        ${avatar}
        <div class="ed-person__body">
          <small>Pembicara</small>
          <h3>${esc(sp.name)}</h3>
          <p class="ed-person__role">${esc(role)}</p>
          ${bio}
          ${skillsHTML}
          ${link}
        </div>
      </div>`;
  }

  function renderVenue(ev) {
    const online = ev.mode === "online";
    return `
      <div class="ed-venue">
        <span class="ed-venue__icon"><i class="fa-solid ${online ? "fa-video" : "fa-location-dot"}"></i></span>
        <div class="ed-venue__body">
          <span class="ed-chip ${online ? "ed-chip--blue" : "ed-chip--teal"}">${online ? "Online" : "Offline (tatap muka)"}</span>
          <h3>${esc(ev.venue)}</h3>
          <p>${
            online
              ? "Event diikuti secara online. Informasi tautan akses akan diumumkan oleh penyelenggara."
              : "Alamat lengkap dan petunjuk lokasi akan diinformasikan oleh penyelenggara."
          }</p>
        </div>
      </div>`;
  }

  function renderOrganizer() {
    const o = ORGANIZER;
    return `
      <div class="ed-organizer">
        <span class="ed-organizer__logo"><img src="${esc(o.logo)}" alt="Logo DICO" /></span>
        <div class="ed-organizer__body">
          <h3>${esc(o.name)}</h3>
          <p>${esc(o.about)}</p>
          <ul class="ed-organizer__contact">
            <li><i class="fa-regular fa-envelope"></i> <a href="mailto:${esc(o.email)}">${esc(o.email)}</a></li>
            <li><i class="fa-solid fa-phone"></i> <a href="tel:${esc(o.phoneHref)}">${esc(o.phone)}</a></li>
            <li><i class="fa-solid fa-location-dot"></i> ${esc(o.city)}</li>
          </ul>
          <div class="ed-organizer__actions">
            <a class="ed-btn ed-btn--ghost ed-btn--sm" href="about.html">Tentang DICO</a>
            <a class="ed-btn ed-btn--ghost ed-btn--sm" href="kontak.html">Hubungi Penyelenggara</a>
          </div>
        </div>
      </div>`;
  }

  function renderShare(ev) {
    const url = encodeURIComponent(location.href);
    const text = encodeURIComponent(ev.title + " — DICO");
    return `
      <div class="ed-share" aria-label="Bagikan event">
        <a class="ed-share__btn ed-share__btn--wa" target="_blank" rel="noopener" aria-label="Bagikan ke WhatsApp" href="https://wa.me/?text=${text}%20${url}"><i class="fa-brands fa-whatsapp"></i></a>
        <a class="ed-share__btn ed-share__btn--fb" target="_blank" rel="noopener" aria-label="Bagikan ke Facebook" href="https://www.facebook.com/sharer/sharer.php?u=${url}"><i class="fa-brands fa-facebook-f"></i></a>
        <a class="ed-share__btn ed-share__btn--x" target="_blank" rel="noopener" aria-label="Bagikan ke X" href="https://twitter.com/intent/tweet?text=${text}&url=${url}"><i class="fa-brands fa-x-twitter"></i></a>
        <a class="ed-share__btn ed-share__btn--in" target="_blank" rel="noopener" aria-label="Bagikan ke LinkedIn" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}"><i class="fa-brands fa-linkedin-in"></i></a>
        <button class="ed-share__btn ed-share__btn--copy" type="button" id="edCopyLink" aria-label="Salin tautan"><i class="fa-solid fa-link"></i></button>
      </div>`;
  }

  function renderRelated(ev) {
    const upcoming = EVENTS.filter((e) => e.id !== ev.id && !isEnded(e));
    upcoming.sort((a, b) => (b.type === ev.type) - (a.type === ev.type) || parseDate(a.date) - parseDate(b.date));
    const items = upcoming.slice(0, 3);
    if (!items.length) return "";
    const cards = items
      .map(
        (e) => `
        <article class="event-card">
          <div class="event-card__image">
            <span class="tag tag--${esc(e.type)}">${esc(TYPE_LABEL[e.type].toUpperCase())}</span>
            <i class="fa-solid ${esc(e.icon)} event-card__image-icon"></i>
          </div>
          <div class="event-card__body">
            <h3 class="event-card__title">${esc(e.title)}</h3>
            <div class="event-card__meta">
              <span><i class="fa-regular fa-calendar"></i> ${esc(fmtDateShort(e.date))} | ${esc(e.time)}</span>
              <span><i class="fa-solid fa-location-dot"></i> ${esc(e.venue)}</span>
            </div>
            <div class="event-card__footer">
              <span class="event-card__price ${e.price === 0 ? "event-card__price--free" : ""}">${esc(fmtPrice(e.price))}</span>
              <a href="${detailUrl(e.id)}" class="icon-btn icon-btn--primary" aria-label="Lihat detail ${esc(e.title)}"><i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </div>
        </article>`
      )
      .join("");
    return `
      <section class="ed-related">
        <div class="container">
          <div class="ed-related__head">
            <div>
              <span class="eyebrow">EVENT LAINNYA</span>
              <h2 class="section-title">Kamu Mungkin Tertarik</h2>
            </div>
            <a class="ed-link" href="event.html">Lihat Semua Event <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="event-grid ed-related__grid">${cards}</div>
        </div>
      </section>`;
  }

  function renderEvent(ev) {
    const ended = isEnded(ev) || ev.status === 'selesai';
    const closed = isRegClosed(ev) || ev.status === 'selesai' || ev.status === 'draft';
    const free = ev.price === 0;
    const priceCls = free ? "is-free" : ev.price == null ? "is-text" : "";
    const registerBtn = closed
      ? `<span class="ed-btn ed-btn--primary ed-btn--block is-disabled" aria-disabled="true"><i class="fa-solid fa-lock"></i> Pendaftaran Ditutup</span>`
      : `<a class="ed-btn ed-btn--primary ed-btn--block" href="${registerHref(ev)}">Daftar Event <i class="fa-solid fa-arrow-right"></i></a>`;
    const registerBar = closed
      ? `<span class="ed-btn ed-btn--primary is-disabled" aria-disabled="true">Ditutup</span>`
      : `<a class="ed-btn ed-btn--primary" href="${registerHref(ev)}">Daftar Event</a>`;

    const benefits = BENEFITS.map(
      (b) => `
        <li class="ed-benefit">
          <span class="ed-benefit__icon"><i class="fa-solid ${b.icon}"></i></span>
          <div><h4>${esc(b.title)}</h4><p>${esc(b.text)}</p></div>
        </li>`
    ).join("");

    const speakerName = ev.speaker ? esc(ev.speaker.name) : "Akan diumumkan";

    return `
      <section class="ed-top">
        <div class="container">
          <nav class="ed-breadcrumb" aria-label="Breadcrumb">
            <a href="index.html">Beranda</a>
            <i class="fa-solid fa-chevron-right"></i>
            <a href="event.html">Event</a>
            <i class="fa-solid fa-chevron-right"></i>
            <span aria-current="page">${esc(ev.title)}</span>
          </nav>
          ${renderBanner(ev, ended, closed)}
        </div>
      </section>

      <section class="ed-body">
        <div class="container ed-layout">
          <article class="ed-main">
            <header class="ed-head">
              <span class="ed-type ed-type--inline ed-type--${esc(ev.type)}">${esc(TYPE_LABEL[ev.type])}</span>
              <h1 class="ed-title">${esc(ev.title)}</h1>
              <p class="ed-by">Diselenggarakan oleh <a href="about.html">DICO</a> <span class="ed-dot"></span> <span>${esc(ev.category)}</span></p>

              <ul class="ed-quick">
                <li><i class="fa-regular fa-calendar"></i><div><small>Tanggal</small><strong>${esc(fmtDateShort(ev.date))}</strong></div></li>
                <li><i class="fa-regular fa-clock"></i><div><small>Waktu</small><strong>${esc(ev.time)}</strong></div></li>
                <li><i class="fa-solid ${ev.mode === "online" ? "fa-video" : "fa-location-dot"}"></i><div><small>Lokasi</small><strong>${esc(ev.venue)}</strong></div></li>
                <li><i class="fa-solid fa-ticket"></i><div><small>Tiket</small><strong class="${priceCls}">${esc(fmtPrice(ev.price))}</strong></div></li>
              </ul>
            </header>

            <section class="ed-section" id="deskripsi">
              <h2 class="ed-section__title">Tentang Event</h2>
              ${ev.description.map((p) => `<p class="ed-text">${esc(p)}</p>`).join("")}
            </section>

            ${
              ev.poster
                ? `<section class="ed-section" id="poster">
              <h2 class="ed-section__title">Poster Event</h2>
              <a class="ed-poster" href="${esc(ev.poster)}" target="_blank" rel="noopener" aria-label="Buka poster ukuran penuh">
                <img src="${esc(ev.poster)}" alt="Poster ${esc(ev.title)}" loading="lazy" />
              </a>
              <p class="ed-poster-note">Klik poster untuk membuka ukuran penuh.</p>
            </section>`
                : ""
            }

            <section class="ed-section" id="benefit">
              <h2 class="ed-section__title">Yang Akan Kamu Dapatkan</h2>
              <ul class="ed-benefits">${benefits}</ul>
            </section>

            <section class="ed-section" id="pembicara">
              <h2 class="ed-section__title">Informasi Pembicara</h2>
              ${renderSpeaker(ev)}
            </section>

            <section class="ed-section" id="venue">
              <h2 class="ed-section__title">Lokasi / Venue</h2>
              ${renderVenue(ev)}
            </section>

            <section class="ed-section" id="organizer">
              <h2 class="ed-section__title">Penyelenggara</h2>
              ${renderOrganizer()}
            </section>
          </article>

          <aside class="ed-aside">
            <div class="ed-card">
              <div class="ed-card__price">
                <small>Harga tiket</small>
                <strong class="${priceCls}">${esc(fmtPrice(ev.price))}</strong>
              </div>
              ${registerBtn}

              <dl class="ed-info">
                <div><dt>Tanggal &amp; Waktu</dt><dd class="ed-info__lines"><span>${esc(fmtDateLong(ev.date))}</span><span>${esc(ev.time)}</span></dd></div>
                <div><dt>Lokasi</dt><dd>${esc(ev.venue)}</dd></div>
                <div><dt>Jenis Event</dt><dd><span class="ed-chip">${esc(TYPE_LABEL[ev.type])}</span> <span class="ed-chip ${ev.mode === "online" ? "ed-chip--blue" : "ed-chip--teal"}">${ev.mode === "online" ? "Online" : "Offline"}</span></dd></div>
                <div><dt>Kategori Event</dt><dd><span class="ed-chip">${esc(ev.category)}</span></dd></div>
                ${ev.capacity ? `<div><dt>Kapasitas Maksimal</dt><dd>${esc(ev.capacity)} peserta</dd></div>` : ""}
                ${ev.regDeadline ? `<div><dt>Batas Pendaftaran</dt><dd class="ed-info__lines"><span>${esc(fmtDeadline(ev.regDeadline))}</span></dd></div>` : ""}
                <div><dt>Pembicara</dt><dd>${speakerName}</dd></div>
                <div><dt>Penyelenggara</dt><dd>DICO</dd></div>
              </dl>

              <div class="ed-card__share">
                <h4>Bagikan ke Teman</h4>
                ${renderShare(ev)}
              </div>
            </div>
          </aside>
        </div>
      </section>

      ${renderRelated(ev)}

      <div class="ed-bar" role="region" aria-label="Pendaftaran event">
        <div class="ed-bar__price"><small>Harga tiket</small><strong class="${priceCls}">${esc(fmtPrice(ev.price))}</strong></div>
        ${registerBar}
      </div>`;
  }

  function renderNotFound() {
    return `
      <section class="ed-body">
        <div class="container ed-state">
          <span class="ed-state__icon"><i class="fa-regular fa-calendar-xmark"></i></span>
          <h1>Event tidak ditemukan</h1>
          <p>Event yang kamu cari tidak tersedia atau tautannya sudah tidak berlaku.</p>
          <a class="ed-btn ed-btn--primary" href="event.html">Lihat Semua Event</a>
        </div>
      </section>`;
  }

  function showToast(message) {
    const toast = $("#edToast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove("is-show");
      toast.hidden = true;
    }, 2200);
  }

  function copyLink() {
    const url = location.href;
    const done = () => showToast("Tautan event disalin");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, () => fallbackCopy(url, done));
    } else {
      fallbackCopy(url, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {
      showToast("Gagal menyalin, salin dari kolom alamat browser");
    }
    document.body.removeChild(ta);
  }

  function renderPage() {
    const root = $("#eventDetailRoot");
    if (!root) return;

    const D = window.DICO_EVENT_DATA;
    const events = (D && D.EVENTS) || [];
    const id = new URLSearchParams(location.search).get("id");
    const ev = events.find((e) => String(e.id) === String(id));

    if (!ev) {
      document.title = "Event tidak ditemukan | DICO - Digital Creative Community";
      root.innerHTML = renderNotFound();
      return;
    }

    document.title = ev.title + " | DICO - Digital Creative Community";
    const meta = $('meta[name="description"]');
    if (meta) meta.setAttribute("content", ev.title + " — " + fmtDateLong(ev.date) + ", " + ev.time + ". " + ev.venue + ".");

    root.innerHTML = renderEvent(ev);
    document.body.classList.add("has-ed-bar");

    const copyBtn = $("#edCopyLink");
    if (copyBtn) copyBtn.addEventListener("click", copyLink);
  }

  function init() {
    if (window.DICO_EVENT_DATA && window.DICO_EVENT_DATA.EVENTS.length > 0) {
      renderPage();
    } else {
      document.addEventListener("DicoEventsLoaded", renderPage, { once: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
