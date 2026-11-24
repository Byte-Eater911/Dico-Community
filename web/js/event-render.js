(function () {
  "use strict";

  const D = window.DICO_EVENT_DATA;
  if (!D) return;

  const esc = (v) =>
    String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const initials = (name) =>
    String(name).split(",")[0].split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const priceHTML = (ev) => {
    if (ev.price === null || ev.price === undefined) return '<span class="event-card__price">Harga menyusul</span>';
    if (ev.price === 0) return '<span class="event-card__price event-card__price--free">Gratis</span>';
    return `<span class="event-card__price">${esc(D.fmtPrice(ev.price))}</span>`;
  };

  const imageHTML = (ev) => {
    const D = window.DICO_EVENT_DATA;
    const tag = `<span class="tag tag--${esc(ev.type)}">${esc((D.TYPE_LABEL[ev.type] || ev.type).toUpperCase())}</span>`;
    const status = D.isEnded(ev) ? '<span class="event-card__status">Selesai</span>' : "";
    if (ev.poster) {
      return `<div class="event-card__image event-card__image--poster">
              ${tag}${status}
              <img class="event-card__photo event-card__photo--poster" src="${esc(ev.poster)}" alt="Poster ${esc(ev.title)}" loading="lazy" />
            </div>`;
    }
    return `<div class="event-card__image">
              ${tag}${status}
              <i class="fa-solid ${esc(ev.icon || "fa-calendar-days")} event-card__image-icon"></i>
            </div>`;
  };

  const daftarLink = (ev) => {
    const D = window.DICO_EVENT_DATA;
    if (D.isEnded(ev)) {
      return `<span class="icon-btn icon-btn--ghost" title="Event sudah selesai" aria-disabled="true"><i class="fa-solid fa-check"></i></span>`;
    }
    return `<a href="login.html?next=daftar-event.html%3Fid%3D${encodeURIComponent(ev.id)}" class="icon-btn icon-btn--primary" aria-label="Daftar event ${esc(ev.title)}"><i class="fa-solid fa-arrow-right"></i></a>`;
  };

  const dataAttrs = (ev) => {
    const price = ev.price === 0 ? "free" : ev.price > 0 ? "paid" : "unknown";
    const speakerName = (ev.speaker && ev.speaker.name) ? ev.speaker.name : "";
    const dateStr = ev.date ? ev.date.substring(0, 10) : "";
    const venue = (ev.venue || "").toLowerCase();
    const searchText = [ev.title, ev.type, ev.venue, speakerName, ev.category || ""].join(" ").toLowerCase();
    return `data-category="${esc(ev.type)}" data-price="${price}" data-date="${esc(dateStr)}" data-venue="${esc(venue)}" data-speaker="${esc(speakerName.toLowerCase())}" data-search="${esc(searchText)}"`;
  };

  function homeCard(ev) {
    const speaker = ev.cardSpeaker || (ev.speaker && ev.speaker.name);
    const speakerHTML = speaker
      ? `<div class="event-card__speaker">
                <span class="avatar-sm">${esc(initials(speaker))}</span>
                <div>
                  <small>Dibawakan oleh</small>
                  <strong>${esc(speaker)}</strong>
                </div>
              </div>`
      : "";
    return `
          <article class="event-card" ${dataAttrs(ev)}>
            ${imageHTML(ev)}
            <div class="event-card__body">
              <h3 class="event-card__title">${esc(ev.title)}</h3>
              <div class="event-card__meta">
                <span><i class="fa-regular fa-calendar"></i> ${esc(D.fmtDateShort(ev.date))} | ${esc(ev.time)}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${esc(ev.venue)}</span>
              </div>
              ${speakerHTML}
              <div class="event-card__footer">
                ${priceHTML(ev)}
                ${daftarLink(ev)}
              </div>
            </div>
          </article>`;
  }

  function catalogCard(ev) {
    return `
              <article class="event-card" ${dataAttrs(ev)}>
                ${imageHTML(ev)}
                <div class="event-card__body">
                  <h3 class="event-card__title">${esc(ev.title)}</h3>
                  <div class="event-card__meta">
                    <span><i class="fa-regular fa-calendar"></i> ${esc(D.fmtDateShort(ev.date))}</span>
                    <span><i class="fa-regular fa-clock"></i> ${esc(ev.time)}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${esc(ev.venue)}</span>
                  </div>
                  <div class="event-card__footer">
                    ${priceHTML(ev)}
                    ${daftarLink(ev)}
                  </div>
                </div>
              </article>`;
  }

  const time = (ev) => new Date(ev.date).getTime();

  function renderAll() {
    const D = window.DICO_EVENT_DATA;
    if (!D || !D.EVENTS) return;

    const home = document.getElementById("homeEventGrid");
    if (home) {
      const featured = D.EVENTS.filter((e) => e.featured).slice(0, 4);
      const list = featured.length ? featured : D.EVENTS.slice(0, 4);
      home.innerHTML = list.map(homeCard).join("");
    }

    const catalog = document.getElementById("eventCatalog");
    if (catalog) {
      // yang akan datang (terdekat dulu), lalu yang sudah selesai (terbaru dulu)
      const upcoming = D.EVENTS.filter((e) => !D.isEnded(e)).sort((a, b) => time(a) - time(b));
      const past = D.EVENTS.filter((e) => D.isEnded(e)).sort((a, b) => time(b) - time(a));
      catalog.innerHTML = upcoming.concat(past).map(catalogCard).join("");

      populateEventFilters(D.EVENTS);
    }
  }

  function populateEventFilters(events) {
    const locSel = document.getElementById("filterLocation");
    if (locSel) {
      const venues = [...new Set(events.map(e => e.venue).filter(Boolean))].sort();
      const currentVal = locSel.value;
      locSel.innerHTML = '<option value="">Semua Lokasi</option>' +
        venues.map(v => `<option value="${esc(v.toLowerCase())}">${esc(v)}</option>`).join("");
      locSel.value = currentVal;
    }

    const spkSel = document.getElementById("filterSpeaker");
    if (spkSel) {
      const speakers = [...new Set(events.map(e => (e.speaker && e.speaker.name) ? e.speaker.name : "").filter(Boolean))].sort();
      const currentVal = spkSel.value;
      spkSel.innerHTML = '<option value="">Semua Pembicara</option>' +
        speakers.map(s => `<option value="${esc(s.toLowerCase())}">${esc(s)}</option>`).join("");
      spkSel.value = currentVal;
    }
  }

  if (window.DICO_EVENT_DATA && window.DICO_EVENT_DATA.EVENTS.length > 0) {
    renderAll();
  }

  document.addEventListener("DicoEventsLoaded", () => {
    renderAll();
    if (typeof initEventCatalog === "function") {
      initEventCatalog();
    }
  });
})();
