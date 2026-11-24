let currentUser = null;

function getCurrentUser() {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem('user');
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  return null;
}

function hasRole(allowedRoles) {
  const user = getCurrentUser();
  if (!user) return false;
  return allowedRoles.includes(user.role_name);
}

async function showDashboard() {
  const loginPage = document.getElementById('loginPage');
  if (loginPage) loginPage.style.display = 'none';

  const erpLayout = document.getElementById('erpLayout');
  if (erpLayout) erpLayout.classList.add('active');

  const user = getCurrentUser();
  if (user) {
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    if (userNameEl) userNameEl.textContent = user.nama;
    if (userAvatarEl) userAvatarEl.textContent = user.nama.charAt(0).toUpperCase();
    
    window.location.hash = '#dashboard';
  }

  await buildSidebar();

  initRouter();
}

async function logout() {
  try {
    await fetch('api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=logout'
    });
  } catch (err) {
    console.error(err);
  }

  currentUser = null;
  localStorage.removeItem('user');
  window.location.href = '../web/login.html';
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=me'
    });
    const data = await res.json();

    if (data.success && data.is_staff && data.user) {
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      await showDashboard();
    } else {
      localStorage.removeItem('user');
      window.location.href = '../web/login.html';
    }
  } catch (e) {
    console.error('Auth verification failed:', e);
    window.location.href = '../web/login.html';
  }
});
