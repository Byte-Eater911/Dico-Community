document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initScrollTop();
  initExpertCatalog();
  initHomeCategoryPills();
  initHomeSearch();
  initCatalogSearch();
  initQuerySearch();

  if (window.DICO_EVENT_DATA && window.DICO_EVENT_DATA.EVENTS.length > 0) {
    initHeroCarousel();
    initEventCatalog();
  } else {
    document.addEventListener("DicoEventsLoaded", () => {
      initHeroCarousel();
      initEventCatalog();
    }, { once: true });
  }

  document.addEventListener("DicoExpertsLoaded", () => {
    initExpertsCarousel();
  }, { once: true });
  initExpertsCarousel();
});

function initHeroCarousel() {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  const SLIDE_PHOTOS = [
    { image: "assets/images/hero.jpeg", alt: "Pembicara DICO tampil di depan peserta seminar" },
    { image: "assets/images/hero2.jpeg", alt: "Peserta antusias mengikuti kegiatan DICO" },
    { image: "assets/images/hero3.jpeg", alt: "Suasana kegiatan komunitas DICO" },
  ];

  const D = window.DICO_EVENT_DATA;
  const byDate = (a, b) => D.parseDate(a.date) - D.parseDate(b.date);
  const upcoming = D ? D.EVENTS.filter((e) => !D.isEnded(e)).sort(byDate) : [];
  const pool = D ? (upcoming.length ? upcoming : D.EVENTS.slice().sort(byDate).reverse()) : [];

  const SLIDES = SLIDE_PHOTOS.map((photo, i) => {
    const ev = pool[i];
    if (!ev) return null;
    return {
      image: photo.image,
      alt: photo.alt,
      category: ev.type,
      eventId: ev.id,
      title: ev.title,
      date: D.fmtDateShort(ev.date),
      location: ev.venue,
    };
  }).filter(Boolean);

  if (!SLIDES.length) return;

  const TAG_LABELS = { seminar: "SEMINAR", webinar: "WEBINAR", workshop: "WORKSHOP" };
  const AUTOPLAY_MS = 5500;

  const dotsWrap = document.getElementById("heroDots");
  const cardTag = document.getElementById("heroCardTag");
  const cardTitle = document.getElementById("heroCardTitle");
  const cardLink = document.getElementById("heroCardLink");
  const cardDate = document.getElementById("heroCardDate");
  const cardLocation = document.getElementById("heroCardLocation");
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");

  if (slider.querySelectorAll(".hero__slide").length > 0) {
    renderCard(0);
    return;
  }

  SLIDES.forEach((slide, i) => {
    const slideEl = document.createElement("div");
    slideEl.className = "hero__slide" + (i === 0 ? " is-active" : "");
    const img = document.createElement("img");
    img.className = "hero__slide-photo";
    img.src = slide.image;
    img.alt = slide.alt;
    slideEl.appendChild(img);
    slider.appendChild(slideEl);
  });

  if (dotsWrap) {
    SLIDES.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hero__dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", `Ke slide ${i + 1}`);
      dot.addEventListener("click", () => goToSlide(i));
      dotsWrap.appendChild(dot);
    });
  }

  const slideEls = Array.from(slider.querySelectorAll(".hero__slide"));
  const dotEls = dotsWrap ? Array.from(dotsWrap.children) : [];

  let current = 0;
  let timer = null;

  function renderCard(index) {
    const data = SLIDES[index];
    if (!data) return;
    if (cardTag) {
      cardTag.textContent = TAG_LABELS[data.category] || data.category.toUpperCase();
      cardTag.className = "tag tag--" + data.category;
    }
    if (cardTitle) cardTitle.textContent = data.title;
    if (cardLink && data.eventId) cardLink.href = "event-detail.html?id=" + data.eventId;
    if (cardDate) cardDate.textContent = data.date;
    if (cardLocation) cardLocation.textContent = data.location;
  }

  function goToSlide(index) {
    const nextIndex = (index + SLIDES.length) % SLIDES.length;
    slideEls[current].classList.remove("is-active");
    if (dotEls[current]) dotEls[current].classList.remove("is-active");
    current = nextIndex;
    slideEls[current].classList.add("is-active");
    if (dotEls[current]) dotEls[current].classList.add("is-active");
    renderCard(current);
    restartAutoplay();
  }

  function nextSlide() { goToSlide(current + 1); }
  function prevSlide() { goToSlide(current - 1); }
  function startAutoplay() { timer = setInterval(nextSlide, AUTOPLAY_MS); }
  function restartAutoplay() { clearInterval(timer); startAutoplay(); }

  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", startAutoplay);

  renderCard(0);
  startAutoplay();
}

function initMobileNav() {
  const toggle = document.getElementById("navbarToggle");
  const nav = document.getElementById("navbarNav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => { nav.classList.toggle("is-open"); });
  nav.querySelectorAll(".navbar__link").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("is-open"));
  });
}

function initHomeCategoryPills() {
  const homeGrid = document.getElementById("homeEventGrid");
  if (!homeGrid) return;

  const pills = document.querySelectorAll(".category-pills .pill");
  if (!pills.length) return;

  function filterHome(category) {
    const cards = Array.from(homeGrid.querySelectorAll("article.event-card"));
    cards.forEach((card) => {
      const match = !category || category === "semua" || card.dataset.category === category;
      card.style.display = match ? "" : "none";
    });
  }

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      if (pill.classList.contains("pill--active")) {
        pill.classList.remove("pill--active");
        filterHome(null);
      } else {
        pills.forEach((p) => p.classList.remove("pill--active"));
        pill.classList.add("pill--active");
        filterHome(pill.dataset.category);
      }
    });
  });

  document.addEventListener("DicoEventsLoaded", () => {
    const active = document.querySelector(".category-pills .pill--active");
    if (active) filterHome(active.dataset.category);
  });
}

function initHomeSearch() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  if (!input || !btn || document.getElementById("eventCatalog") || document.getElementById("expertCatalog")) return;

  const runSearch = () => {
    const query = input.value.trim();
    if (!query) return;
    window.location.href = `event.html?q=${encodeURIComponent(query)}`;
  };
  btn.addEventListener("click", runSearch);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });
}

function initExpertsCarousel() {
  const track = document.getElementById("expertsTrack");
  const prevBtn = document.getElementById("expertPrev");
  const nextBtn = document.getElementById("expertNext");
  const dotsWrap = document.getElementById("expertsDots");
  if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

  const cards = Array.from(track.children);
  if (!cards.length) return;

  const getPerView = () => {
    const width = window.innerWidth;
    if (width <= 720) return 2;
    if (width <= 1024) return 3;
    return 5;
  };

  let perView = getPerView();
  let page = 0;
  const totalPages = () => Math.max(1, Math.ceil(cards.length / perView));

  function renderDots() {
    dotsWrap.innerHTML = "";
    for (let i = 0; i < totalPages(); i++) {
      const dot = document.createElement("span");
      if (i === page) dot.classList.add("is-active");
      dot.addEventListener("click", () => { page = i; update(); });
      dotsWrap.appendChild(dot);
    }
  }

  function update() {
    perView = getPerView();
    const maxPage = totalPages() - 1;
    if (page > maxPage) page = maxPage;
    const offsetPercent = page * (perView / cards.length) * 100;
    track.style.transform = `translateX(-${offsetPercent}%)`;
    renderDots();
  }

  prevBtn.addEventListener("click", () => { page = page > 0 ? page - 1 : totalPages() - 1; update(); });
  nextBtn.addEventListener("click", () => { page = page < totalPages() - 1 ? page + 1 : 0; update(); });
  window.addEventListener("resize", update);
  track.style.transition = "transform 0.3s ease";
  update();
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("is-visible", window.scrollY > 400);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initEventCatalog() {
  const catalog = document.getElementById("eventCatalog");
  if (!catalog) return;

  const getCards = () => Array.from(catalog.querySelectorAll("article.event-card"));
  const topPills = document.querySelectorAll(".category-pills .pill");
  const getCheckboxes = () => document.querySelectorAll("[data-filter-category]");
  const priceRadios = document.querySelectorAll('input[name="filterPrice"]');
  const filterDate = document.getElementById("filterDate");
  const filterLocation = document.getElementById("filterLocation");
  const filterSpeaker = document.getElementById("filterSpeaker");
  const searchInput = document.getElementById("searchInput");
  const resetBtn = document.getElementById("filterReset");
  const applyBtn = document.getElementById("applyFilter");

  catalog.addEventListener("click", (e) => {
    const btn = e.target.closest(".event-card__wishlist");
    if (!btn) return;
    btn.classList.toggle("is-active");
    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-regular");
      icon.classList.toggle("fa-solid");
    }
  });

  function getFilters() {
    const checkedBoxes = Array.from(getCheckboxes()).filter((box) => box.checked);
    const allBoxes = Array.from(getCheckboxes());
    const categories = checkedBoxes.length === 0 || checkedBoxes.length === allBoxes.length
      ? [] : checkedBoxes.map((box) => box.dataset.filterCategory);

    const price = (document.querySelector('input[name="filterPrice"]:checked') || {}).value || "all";
    const date = filterDate ? filterDate.value : "";
    const location = filterLocation ? filterLocation.value.toLowerCase() : "";
    const speaker = filterSpeaker ? filterSpeaker.value.toLowerCase() : "";
    const search = searchInput ? searchInput.value.trim().toLowerCase() : "";

    return { categories, price, date, location, speaker, search };
  }

  function applyFilters() {
    const { categories, price, date, location, speaker, search } = getFilters();
    const cards = getCards();
    let shown = 0;

    cards.forEach((card) => {
      const matchesCategory = categories.length === 0 || categories.includes(card.dataset.category);
      const matchesPrice = price === "all" || card.dataset.price === price;
      const matchesDate = !date || (card.dataset.date && card.dataset.date >= date);
      const matchesLocation = !location || (card.dataset.venue || "").includes(location);
      const matchesSpeaker = !speaker || (card.dataset.speaker || "").includes(speaker);
      const matchesSearch = !search || (card.dataset.search || "").includes(search) || card.textContent.toLowerCase().includes(search);

      const visible = matchesCategory && matchesPrice && matchesDate && matchesLocation && matchesSpeaker && matchesSearch;
      card.style.display = visible ? "" : "none";
      if (visible) shown++;
    });

    let empty = document.getElementById("catalogEmptyState");
    if (!empty) {
      empty = document.createElement("p");
      empty.id = "catalogEmptyState";
      empty.className = "catalog-empty-state";
      empty.textContent = "Tidak ada event yang sesuai dengan filter.";
      catalog.parentElement.appendChild(empty);
    }
    empty.hidden = shown !== 0;
  }

  topPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      topPills.forEach((p) => p.classList.remove("pill--active"));
      pill.classList.add("pill--active");

      const category = pill.dataset.category;
      const categories = category === "semua" ? [] : [category];

      Array.from(getCheckboxes()).forEach((box) => {
        box.checked = categories.length === 0 || categories.includes(box.dataset.filterCategory);
      });

      applyFilters();
    });
  });

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      applyFilters();
      const { categories } = getFilters();
      topPills.forEach((p) => p.classList.remove("pill--active"));
      if (categories.length === 0) {
        const semua = document.querySelector('.category-pills .pill[data-category="semua"]');
        if (semua) semua.classList.add("pill--active");
      } else if (categories.length === 1) {
        const match = document.querySelector(`.category-pills .pill[data-category="${categories[0]}"]`);
        if (match) match.classList.add("pill--active");
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      Array.from(getCheckboxes()).forEach((box) => (box.checked = true));
      priceRadios.forEach((radio) => (radio.checked = radio.value === "all"));
      if (filterDate) filterDate.value = "";
      if (filterLocation) filterLocation.value = "";
      if (filterSpeaker) filterSpeaker.value = "";
      if (searchInput) searchInput.value = "";

      topPills.forEach((p) => p.classList.remove("pill--active"));
      const semua = document.querySelector('.category-pills .pill[data-category="semua"]');
      if (semua) semua.classList.add("pill--active");

      const empty = document.getElementById("catalogEmptyState");
      if (empty) empty.hidden = true;

      getCards().forEach((card) => (card.style.display = ""));
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilters();
    });
  }

  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      applyFilters();
    });
  }
}

function initExpertCatalog() {
  const catalog = document.getElementById("expertCatalog");
  if (!catalog) return;

  const getCards = () => Array.from(catalog.querySelectorAll("article.expert-grid-card"));

  function applyExpertFilters() {
    const topPill = document.querySelector(".category-pills .pill--active");
    const activePillCat = topPill ? topPill.dataset.category : "semua";

    const checkedBoxes = Array.from(document.querySelectorAll("[data-filter-category]:checked"));
    const allBoxes = Array.from(document.querySelectorAll("[data-filter-category]"));

    // Prioritaskan top pills. Jika sidebar ada yang dicentang spesifik, gunakan sidebar.
    let categories = [];
    if (checkedBoxes.length > 0 && checkedBoxes.length < allBoxes.length) {
      categories = checkedBoxes.map((b) => b.dataset.filterCategory);
    } else if (activePillCat !== "semua") {
      categories = [activePillCat];
    }

    const searchInput = document.getElementById("searchInput");
    const search = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const cards = getCards();
    let shown = 0;
    cards.forEach((card) => {
      const cardCats = (card.dataset.category || "").split(" ");
      const matchesCat = categories.length === 0 || cardCats.some((c) => categories.includes(c));
      const matchesSearch = !search || (card.dataset.search || "").includes(search) || card.textContent.toLowerCase().includes(search);
      const visible = matchesCat && matchesSearch;
      card.style.display = visible ? "" : "none";
      if (visible) shown++;
    });

    let empty = document.getElementById("catalogEmptyState");
    if (!empty) {
      empty = document.createElement("p");
      empty.id = "catalogEmptyState";
      empty.className = "catalog-empty-state";
      empty.textContent = "Tidak ada expert yang sesuai.";
      catalog.parentElement.appendChild(empty);
    }
    empty.hidden = shown !== 0;
  }

  document.querySelectorAll(".category-pills .pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".category-pills .pill").forEach((p) => p.classList.remove("pill--active"));
      pill.classList.add("pill--active");
      document.querySelectorAll("[data-filter-category]").forEach((cb) => (cb.checked = false));
      applyExpertFilters();
    });
  });

  const applyBtn = document.getElementById("applyFilter");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      document.querySelectorAll(".category-pills .pill").forEach((p) => p.classList.remove("pill--active"));
      const semua = document.querySelector('.category-pills .pill[data-category="semua"]');
      if (semua) semua.classList.add("pill--active");
      applyExpertFilters();
    });
  }

  const resetBtn = document.getElementById("filterReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll("[data-filter-category]").forEach((cb) => (cb.checked = false));
      document.querySelectorAll(".category-pills .pill").forEach((p) => p.classList.remove("pill--active"));
      const semua = document.querySelector('.category-pills .pill[data-category="semua"]');
      if (semua) semua.classList.add("pill--active");
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = "";
      getCards().forEach((card) => (card.style.display = ""));
      const empty = document.getElementById("catalogEmptyState");
      if (empty) empty.hidden = true;
    });
  }

  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const mode = sortSelect.value;
      const cards = getCards();
      const sorted = cards.slice().sort((a, b) => {
        if (mode === "name") return (a.querySelector(".expert-grid-card__name")?.textContent || "").localeCompare(b.querySelector(".expert-grid-card__name")?.textContent || "", "id");
        if (mode === "skills") return Number(b.dataset.skills) - Number(a.dataset.skills) || Number(a.dataset.order) - Number(b.dataset.order);
        return Number(a.dataset.order) - Number(b.dataset.order);
      });
      sorted.forEach((card) => catalog.appendChild(card));
    });
  }

  const expertSearch = document.getElementById("searchInput");
  if (expertSearch && catalog) {
    const btn = document.getElementById("searchBtn");
    const run = () => applyExpertFilters();
    if (btn) btn.addEventListener("click", run);
    expertSearch.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
    expertSearch.addEventListener("input", run);
  }
}

function initCatalogSearch() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  const eventCatalog = document.getElementById("eventCatalog");
  const expertCatalog = document.getElementById("expertCatalog");

  if (eventCatalog && input && btn) {
    const run = () => {
      const applyBtn = document.getElementById("applyFilter");
      if (applyBtn) {
        applyBtn.click();
      } else {
        const q = input.value.trim().toLowerCase();
        const cards = Array.from(eventCatalog.querySelectorAll("article.event-card"));
        let shown = 0;
        cards.forEach((card) => {
          const match = !q || (card.dataset.search || "").includes(q) || card.textContent.toLowerCase().includes(q);
          card.style.display = match ? "" : "none";
          if (match) shown++;
        });
        let empty = document.getElementById("catalogEmptyState");
        if (!empty) {
          empty = document.createElement("p");
          empty.id = "catalogEmptyState";
          empty.className = "catalog-empty-state";
          empty.textContent = "Tidak ada hasil yang sesuai.";
          eventCatalog.parentElement.appendChild(empty);
        }
        empty.hidden = shown !== 0;
      }
    };
    btn.addEventListener("click", run);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
  }
}

function initQuerySearch() {
  const input = document.getElementById("searchInput");
  if (!input || !document.getElementById("eventCatalog") || !location.search) return;

  const q = new URLSearchParams(location.search).get("q");
  if (q) {
    input.value = q;
    const tryFilter = () => {
      const applyBtn = document.getElementById("applyFilter");
      if (applyBtn) applyBtn.click();
      else {
        const btn = document.getElementById("searchBtn");
        if (btn) btn.click();
      }
    };
    const cards = document.querySelectorAll("#eventCatalog article");
    if (cards.length) {
      setTimeout(tryFilter, 50);
    } else {
      document.addEventListener("DicoEventsLoaded", () => setTimeout(tryFilter, 100), { once: true });
    }
  }
}

function initExpertProfiles() {
  const X = window.DICO_EXPERTS;
  const catalog = document.getElementById("expertCatalog");
  if (!catalog) return;

  catalog.querySelectorAll(".expert-grid-card__link--oval").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const card = trigger.closest(".expert-grid-card");
      const id = trigger.dataset.id || (card && card.dataset.id);
      const ex = X ? X.getExpert(id) : null;

      const name = ex ? ex.name : card?.querySelector(".expert-grid-card__name")?.textContent?.trim() || "Expert DICO";
      const role = ex ? ex.role : card?.querySelector(".expert-grid-card__role")?.textContent?.trim() || "";
      const bio = ex ? (ex.bio || "") : "";
      const photo = ex ? `<img class="dico-detail-dialog__photo" src="${ex.photo}" alt="Foto ${name}" loading="lazy" />` : "";

      const skillTags = ex ? ex.skills.map((s, i) => {
        const colors = ["blue", "teal", "purple", "pink"];
        return `<span class="skill-tag skill-tag--${colors[i % colors.length]}">${s}</span>`;
      }).join("") : "";

      showDialog(name, `
        ${photo}
        <p class="dico-detail-dialog__role"><strong>${role}</strong></p>
        ${bio ? `<p class="dico-detail-dialog__bio">${bio}</p>` : ""}
        ${skillTags ? `<p class="dico-detail-dialog__skills-label">Keahlian:</p><div class="expert-grid-card__tags dico-detail-dialog__tags">${skillTags}</div>` : ""}
      `);
    });
  });
}

function ensureDialog() {
  let dialog = document.getElementById("dicoDetailDialog");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "dicoDetailDialog";
  dialog.className = "dico-detail-dialog";
  dialog.innerHTML = `<button class="dico-detail-dialog__close" type="button" aria-label="Tutup">&times;</button><div class="dico-detail-dialog__content"></div>`;
  document.body.appendChild(dialog);
  dialog.querySelector(".dico-detail-dialog__close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  return dialog;
}

function showDialog(title, html) {
  const dialog = ensureDialog();
  dialog.querySelector(".dico-detail-dialog__content").innerHTML = `<span class="badge-pill badge-pill--soft-blue">DICO</span><h2>${title}</h2>${html}`;
  if (typeof dialog.showModal === "function") dialog.showModal();
}
