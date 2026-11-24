const ROUTES = {};

function registerRoute(hash, handler) {
  ROUTES[hash] = handler;
}

function navigateTo(hash) {
  window.location.hash = hash;
}

async function renderRoute() {
  const hash = window.location.hash || '#dashboard';
  const contentArea = document.getElementById('contentArea');

  const handler = ROUTES[hash];
  if (handler) {
    try {
      const result = await handler();
      if (typeof result === 'string') {
        contentArea.innerHTML = result;
      }
    } catch (err) {
      console.error('[ROUTER ERROR]', hash, err);
      contentArea.innerHTML = `
        <div class="card" style="padding:40px;border-color:var(--error)">
          <h2 style="color:var(--error);margin-bottom:8px">Terjadi Kesalahan</h2>
          <p class="text-muted">Gagal memuat halaman <code>${hash}</code>.</p>
          <pre style="margin-top:12px;background:var(--bg);padding:12px;border-radius:6px;font-size:13px">${err.message || err}</pre>
        </div>
      `;
    }
  } else {
    contentArea.innerHTML = `
      <div class="card" style="text-align:center;padding:60px 24px">
        <h2 style="margin-bottom:8px">Modul Belum Tersedia</h2>
        <p class="text-muted">Halaman <code>${hash}</code> belum dikembangkan.</p>
        <p class="text-muted" style="margin-top:12px">Hubungi koordinator tim untuk modul ini.</p>
      </div>
    `;
  }

  updateActiveLink();
}

function render() {
  renderRoute();
}

function initRouter() {
  loadModuleScripts().then(() => {
    window.addEventListener('hashchange', renderRoute);

    if (!window.location.hash) {
      window.location.hash = '#dashboard';
    } else {
      renderRoute();
    }
  });
}

function loadStylesheet(href) {
  const cleanHref = href.split('?')[0];
  if (document.querySelector(`link[href^="${cleanHref}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

async function loadModuleScripts() {
  for (const mod of MODULE_REGISTRY) {
    try {
      const cssPath = `${mod._path}/${mod.id}.css?v=${Date.now()}`;
      loadStylesheet(cssPath);
      const scriptPath = `${mod._path}/${mod.id}.js?v=${Date.now()}`;
      await loadScript(scriptPath);
    } catch (e) {
    }
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = resolve; // Don't block on missing modules
    document.body.appendChild(script);
  });
}
