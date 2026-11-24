(function () {
  "use strict";

  const TYPE_LABEL = { seminar: "Seminar", webinar: "Webinar", workshop: "Workshop" };

  function parseDate(d) {
    if (!d) return 0;
    return new Date(d).getTime();
  }

  function fmtDateShort(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return isoStr;
    }
  }

  function fmtDateLong(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return isoStr;
    }
  }

  function isEnded(ev) {
    try {
      return new Date(ev.date) < new Date(new Date().toDateString());
    } catch (e) {
      return false;
    }
  }

  function isRegClosed(ev) {
    if (isEnded(ev)) return true;
    try {
      return new Date() > new Date(ev.regDeadline);
    } catch (e) {
      return false;
    }
  }

  function fmtPrice(n) {
    if (n === null || n === undefined) return "Harga menyusul";
    if (n === 0) return "Gratis";
    return "Rp " + Number(n).toLocaleString("id-ID");
  }

  window.DICO_EVENT_DATA = {
    TYPE_LABEL,
    EVENTS: [],
    parseDate,
    fmtDateShort,
    fmtDateLong,
    fmtPrice,
    isEnded,
    isRegClosed,
  };

  async function loadLiveEvents() {
    try {
      const res = await fetch("api/get_events.php?_t=" + Date.now());
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        window.DICO_EVENT_DATA.EVENTS = json.data;
        document.dispatchEvent(new CustomEvent("DicoEventsLoaded", { detail: json.data }));
      }
    } catch (e) {
      // keep empty EVENTS on failure
    }
  }

  loadLiveEvents();
})();
