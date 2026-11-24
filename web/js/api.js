(function () {
  "use strict";

  const DEMO_MODE = false;
  const AUTH_URL = "../erp/api/auth.php";

  const STATUS = {
    TERDAFTAR: "terdaftar",
    MENUNGGU_PEMBAYARAN: "menunggu_pembayaran",
    MENUNGGU_VERIFIKASI: "menunggu_verifikasi",
    TERVERIFIKASI: "terverifikasi",
    DITOLAK: "ditolak",
  };

  class ApiError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "ApiError";
      this.code = code || "ERROR";
    }
  }

  async function postForm(url, data) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) {
      if (v !== null && v !== undefined) fd.append(k, v);
    }
    const res = await fetch(url, { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) throw new ApiError("Server error " + res.status, "SERVER_ERROR");
    return res.json();
  }

  async function getJSON(url) {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new ApiError("Server error " + res.status, "SERVER_ERROR");
    return res.json();
  }

  let cachedUser = undefined; // undefined = belum dicek, null = belum login

  async function daftarAkun({ nama, email, wa, instansi, minat_produk, password }) {
    const json = await postForm(AUTH_URL, {
      action: "register",
      nama,
      email,
      wa,
      instansi,
      minat_produk,
      password,
      password2: password,
    });
    if (!json.success) throw new ApiError(json.message || "Gagal membuat akun.", "REGISTER_FAILED");
    cachedUser = json.user;

    if (json.is_staff) {
      window.location.href = json.redirect || "../erp/#dashboard";
      return { user: json.user };
    }

    return { user: json.user };
  }

  async function login({ email, password }) {
    const json = await postForm(AUTH_URL, {
      action: "login",
      email,
      password,
    });
    if (!json.success) throw new ApiError(json.message || "Email atau password salah.", "INVALID_CREDENTIALS");
    cachedUser = json.user;

    if (json.is_staff) {
      window.location.href = json.redirect || "../erp/#dashboard";
      // Lempar error khusus agar flow.js tidak lanjut redirect ke next
      throw new ApiError("__STAFF_REDIRECT__", "STAFF_REDIRECT");
    }

    return { user: json.user };
  }

  async function logout() {
    await postForm(AUTH_URL, { action: "logout" });
    cachedUser = null;
    return { ok: true };
  }

  async function ambilUserSaatIni() {
    if (cachedUser !== undefined) return cachedUser;
    try {
      const json = await postForm(AUTH_URL, { action: "me" });
      if (json.success && json.user) {
        if (json.is_staff) {
          cachedUser = null;
          return null;
        }
        cachedUser = json.user;
        return json.user;
      }
      cachedUser = null;
      return null;
    } catch (e) {
      cachedUser = null;
      return null;
    }
  }

  // Hapus sampah pendaftaran localStorage lama agar tidak membingungkan
  try { localStorage.removeItem("dico_registrations"); } catch (e) {}

  const REG_URL = "api/registration.php";

  async function cariPendaftaran(eventId) {
    const u = await ambilUserSaatIni();
    if (!u) return null;
    try {
      const json = await getJSON(REG_URL + "?action=search&event_id=" + encodeURIComponent(eventId));
      if (json.success && json.registration) return json.registration;
      return null;
    } catch (e) {
      return null;
    }
  }

  async function kirimPendaftaran(data) {
    const json = await postForm(REG_URL, {
      action: "create",
      event_id: data.eventId,
      nama: data.nama,
      email: data.email,
      wa: data.wa,
      instansi: data.instansi,
      jenis: data.jenis,
      amount: data.amount,
    });
    if (!json.success) {
      throw new ApiError(json.message || "Gagal mengirim pendaftaran.", json.code || "ERROR");
    }
    return { registration: json.registration };
  }

  async function ambilPendaftaran(regId) {
    const json = await getJSON(REG_URL + "?action=get&id=" + encodeURIComponent(regId));
    if (!json.success) {
      throw new ApiError(json.message || "Data pendaftaran tidak ditemukan.", json.code || "NOT_FOUND");
    }
    return { registration: json.registration };
  }

  async function ambilStatusPendaftaran(regId) {
    const { registration } = await ambilPendaftaran(regId);
    return { status: registration.status };
  }

  async function unggahBuktiBayar(regId, file) {
    const fd = new FormData();
    fd.append("action", "upload");
    fd.append("reg_id", regId);
    fd.append("proof", file);
    const res = await fetch(REG_URL, { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) throw new ApiError("Server error " + res.status, "SERVER_ERROR");
    const json = await res.json();
    if (!json.success) {
      throw new ApiError(json.message || "Gagal mengunggah bukti.", json.code || "ERROR");
    }
    return { registration: json.registration || {} };
  }

  window.DicoAPI = {
    DEMO_MODE,
    STATUS,
    ApiError,
    daftarAkun,
    login,
    logout,
    ambilUserSaatIni,
    cariPendaftaran,
    kirimPendaftaran,
    ambilPendaftaran,
    ambilStatusPendaftaran,
    unggahBuktiBayar,
  };

  async function renderNavbar() {
    const box = document.querySelector(".navbar__actions");
    if (!box) return;
    const u = await ambilUserSaatIni();
    if (!u) return;
    const first = u.nama.split(/\s+/)[0];
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.gap = "10px";
    box.innerHTML = "";
    const hi = document.createElement("span");
    hi.className = "navbar__user";
    hi.textContent = "Halo, " + first;
    const profileLink = document.createElement("a");
    profileLink.href = "profile.html";
    profileLink.className = "navbar__btn-profile";
    profileLink.textContent = "Profil Saya";
    const out = document.createElement("a");
    out.href = "#";
    out.className = "navbar__btn-logout";
    out.textContent = "Keluar";
    out.addEventListener("click", async (e) => {
      e.preventDefault();
      await logout();
      location.href = "login.html";
    });
    box.appendChild(hi);
    box.appendChild(profileLink);
    box.appendChild(out);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderNavbar);
  else renderNavbar();
})();
