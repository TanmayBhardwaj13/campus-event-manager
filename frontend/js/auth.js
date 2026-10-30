// frontend/js/auth.js

const auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  getRole() {
    const user = this.getUser();
    return (user && user.role) ? user.role : localStorage.getItem('role');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setSession(token, user) {
    if (token) localStorage.setItem('token', token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role) {
        localStorage.setItem('role', user.role);
      }
    }
  },

  updateUser(fields) {
    const user = this.getUser() || {};
    const updated = { ...user, ...fields };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  },

  requireRole(expectedRole, redirectUrl) {
    if (!this.isLoggedIn()) {
      window.location.href = redirectUrl || `../${expectedRole}/login.html`;
      return false;
    }
    const role = this.getRole();
    if (role !== expectedRole) {
      window.location.href = redirectUrl || `../${expectedRole}/login.html`;
      return false;
    }
    return true;
  },

  logoutRole(role) {
    this.clearSession();
    window.location.href = `../${role}/login.html`;
  },

  populateSidebarUser() {
    const user = this.getUser();
    if (!user) return;

    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');

    if (nameEl && user.name) nameEl.textContent = user.name;
    if (roleEl && user.role) roleEl.textContent = user.role;
    if (avatarEl && user.name) {
      avatarEl.textContent = user.name.charAt(0).toUpperCase();
    }
  }
};

window.auth = auth;
