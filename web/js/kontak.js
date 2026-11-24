(function () {
  "use strict";
  const form = document.getElementById("kontakForm");
  if (!form) return;

  const TUJUAN = "info@dicocommunity.org";
  const $ = (id) => document.getElementById(id);
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function setError(input, msg) {
    const f = input.closest(".field");
    f.classList.toggle("has-error", !!msg);
    const p = f.querySelector(".field__error");
    if (p) p.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = $("ktNama"), email = $("ktEmail"), subjek = $("ktSubjek"), pesan = $("ktPesan");
    const note = $("ktNote");
    let ok = true;
    if (nama.value.trim().length < 3) { setError(nama, "Nama minimal 3 karakter."); ok = false; } else setError(nama, "");
    if (!isEmail(email.value.trim())) { setError(email, "Format email belum benar."); ok = false; } else setError(email, "");
    if (!subjek.value) { setError(subjek, "Pilih keperluan."); ok = false; } else setError(subjek, "");
    if (pesan.value.trim().length < 10) { setError(pesan, "Pesan minimal 10 karakter."); ok = false; } else setError(pesan, "");
    if (!ok) {
      const first = form.querySelector(".has-error .field__control");
      if (first) first.focus();
      return;
    }
    const subject = "[" + subjek.value + "] Pesan dari " + nama.value.trim();
    const body = pesan.value.trim() + "\n\n--\nNama: " + nama.value.trim() + "\nEmail: " + email.value.trim();
    const url = "mailto:" + TUJUAN + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    note.dataset.mailto = url;
    note.textContent = "Pesan anda akan otomatis tersimpan dalam database kami, dan harap menunggu balasan dari tim DICO melalui email ataupun Whatsapp. Jika tidak ada balasan dalam 1x24 jam, silakan hubungi kami melalui email atau telepon.";
    note.hidden = false;
    window.location.href = url;
  });
})();
