const MODULE_REGISTRY = [];

const MODULE_PATHS = [
  'modules/dashboard',
  'modules/hrm',
  'modules/crm',
  'modules/finance',
  'modules/event'
];

async function buildSidebar() {
  MODULE_REGISTRY.length = 0;

  for (const path of MODULE_PATHS) {
    try {
      const resp = await fetch(`${path}/manifest.json?v=${Date.now()}`, { cache: 'no-store' });
      if (resp.ok) {
        const manifest = await resp.json();
        manifest._path = path;
        MODULE_REGISTRY.push(manifest);
      }
    } catch (e) {
    }
  }

  const user = getCurrentUser();
  if (!user) return;

  const allowed = MODULE_REGISTRY.filter(m =>
    m.allowed_roles.includes('Superadmin') && user.role_name === 'Superadmin' ||
    m.allowed_roles.includes(user.role_name)
  );

  const sidebarEl = document.getElementById('sidebar');
  sidebarEl.innerHTML = `
    <nav class="sidebar">
      <div class="sidebar-logo">
        <img src="../assets/images/logo-dico.png" alt="DICO" onerror="this.style.display='none'">
        <span>DICO ERP</span>
      </div>
      <ul class="sidebar-menu">
        ${allowed.map(m => {
          if (m.menu && m.menu.length > 0) {
            return m.menu.filter(sub => {
              // Hide Registrasi untuk selain Superadmin dan Event Manager
              if (sub.route === '#event/registrations') {
                return ['Superadmin', 'Event Manager'].includes(user.role_name);
              }
              return true;
            }).map(sub => {
              const route = sub.route;
              return `
              <li class="sidebar-menu-item">
                <a href="${route}" class="sidebar-menu-link" data-route="${route}">
                  <span class="sidebar-menu-icon">${icon(m.icon)}</span>
                  ${sub.label}
                </a>
              </li>
            `;}).join('');
          }
          return `
            <li class="sidebar-menu-item">
              <a href="${m.route}" class="sidebar-menu-link" data-route="${m.route}">
                <span class="sidebar-menu-icon">${icon(m.icon)}</span>
                ${m.name}
              </a>
            </li>
          `;
        }).join('')}
        <li class="sidebar-menu-item" style="margin-top:24px;border-top:1px solid rgba(255,255,255,0.1);padding-top:12px">
          <button type="button" class="sidebar-menu-link" style="width:100%;background:none;border:none;cursor:pointer;padding:10px 12px;text-align:left;font-size:14px;color:rgba(255,255,255,0.7);font-weight:500;border-radius:6px;transition:all 200ms;display:flex;align-items:center;gap:12px" onmouseenter="this.style.backgroundColor='rgba(20,38,83,1)';this.style.color='white'" onmouseleave="this.style.backgroundColor='transparent';this.style.color='rgba(255,255,255,0.7)'" onclick="logout()">
            <span class="sidebar-menu-icon">${icon('logout')}</span>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  `;

  updateActiveLink();
}

function updateActiveLink() {
  const hash = window.location.hash || '#dashboard';
  document.querySelectorAll('.sidebar-menu-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-route') === hash) {
      link.classList.add('active');
    }
  });
}
