(function () {
  "use strict";

  const X = window.DICO_EXPERTS;
  if (!X) return;

  const esc = (v) =>
    String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const TAG_COLORS = ["blue", "teal", "purple", "pink"];
  const tagsHTML = (ex, limit) => {
    const shown = ex.skills.slice(0, limit || ex.skills.length);
    const hidden = ex.skills.length - shown.length + (ex.moreSkills || 0);
    return (
      shown.map((s, i) => `<span class="skill-tag skill-tag--${TAG_COLORS[i % TAG_COLORS.length]}">${esc(s)}</span>`).join("") +
      (hidden > 0 ? `<span class="skill-tag skill-tag--more">+${hidden}</span>` : "")
    );
  };

  const track = document.getElementById("expertsTrack");
  if (track) {
    track.innerHTML = X.EXPERTS.map(
      (ex) => `
              <div class="expert-card">
                <span class="expert-card__avatar"><img src="${esc(ex.photo)}" alt="Foto ${esc(ex.name)}" /></span>
                <h4>${esc(ex.name)}</h4>
                <p>${esc(ex.role)}</p>
              </div>`
    ).join("");
  }

  function renderExpertCatalog() {
    const X = window.DICO_EXPERTS;
    if (!X) return;

    const catalog = document.getElementById("expertCatalog");
    if (catalog) {
      catalog.innerHTML = X.EXPERTS.map(
        (ex, i) => `
              <article class="expert-grid-card" data-id="${esc(ex.id)}" data-category="${esc(ex.categories.join(" "))}" data-order="${i}" data-skills="${ex.skills.length + (ex.moreSkills || 0)}" data-search="${esc(ex.name + ' ' + ex.role + ' ' + ex.skills.join(' '))}">
                <div class="expert-grid-card__image expert-grid-card__image--photo">
                  <img class="expert-grid-card__photo" src="${esc(ex.photo)}" alt="Foto ${esc(ex.name)}" loading="lazy" />
                </div>
                <div class="expert-grid-card__body">
                  <h3 class="expert-grid-card__name">${esc(ex.name)}</h3>
                  <p class="expert-grid-card__role">${esc(ex.role)}</p>
                  <p class="expert-grid-card__label">Keahlian:</p>
                  <div class="expert-grid-card__tags">${tagsHTML(ex, 4)}</div>
                </div>
              </article>`
      ).join("");

      const pills = document.getElementById("categoryPills");
      if (pills) {
        pills.innerHTML =
          '<button class="pill pill--active" data-category="semua">Semua</button>' +
          X.CATEGORIES.map((c) => `<button class="pill" data-category="${esc(c.id)}">${esc(c.label)}</button>`).join("");
      }

      const list = document.getElementById("expertFilterList");
      if (list) {
        list.innerHTML = X.CATEGORIES.map((c) => {
          const n = X.EXPERTS.filter((e) => e.categories.includes(c.id)).length;
          return `
                <label class="filter-checkbox">
                  <span class="filter-checkbox__input">
                    <input type="checkbox" data-filter-category="${esc(c.id)}" />
                    <span>${esc(c.label)}</span>
                  </span>
                  <span class="filter-checkbox__count">${n}</span>
                </label>`;
        }).join("");
      }

      if (typeof initExpertCatalog === "function") {
        initExpertCatalog();
      }
    }
  }

  renderExpertCatalog();

  document.addEventListener("DicoExpertsLoaded", () => {
    renderExpertCatalog();
    const track = document.getElementById("expertsTrack");
    const X = window.DICO_EXPERTS;
    if (track && X) {
      track.innerHTML = X.EXPERTS.map(
        (ex) => `
              <div class="expert-card">
                <span class="expert-card__avatar"><img src="${esc(ex.photo)}" alt="Foto ${esc(ex.name)}" /></span>
                <h4>${esc(ex.name)}</h4>
                <p>${esc(ex.role)}</p>
              </div>`
      ).join("");
    }
  });
})();
