// ===== UTILITIES =====

// Toast notifications
const toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 4000) {
    this.init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  warning: (msg) => toast.show(msg, 'warning'),
  info: (msg) => toast.show(msg, 'info'),
};
window.toast = toast;

// Modal utilities
const modal = {
  show(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  },
  hide(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'none'; document.body.style.overflow = ''; }
  },
  hideAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => { m.style.display = 'none'; });
    document.body.style.overflow = '';
  },
  confirm(options) {
    return new Promise((resolve) => {
      const { title = 'Are you sure?', message = 'This action cannot be undone.', confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' } = options;
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-body">
            <div class="confirm-dialog">
              <div class="confirm-icon">${type === 'danger' ? '🗑️' : '❓'}</div>
              <h3>${title}</h3>
              <p>${message}</p>
              <div style="display:flex;gap:12px;justify-content:center">
                <button class="btn btn-ghost" id="confirm-cancel">${cancelText}</button>
                <button class="btn btn-${type}" id="confirm-ok">${confirmText}</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#confirm-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
      overlay.querySelector('#confirm-ok').addEventListener('click', () => { overlay.remove(); resolve(true); });
      overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    });
  },
};
window.modal = modal;

// Loading state
const loader = {
  show() {
    let el = document.getElementById('global-loader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'global-loader';
      el.className = 'loading-overlay';
      el.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
  },
  hide() {
    const el = document.getElementById('global-loader');
    if (el) el.style.display = 'none';
  },
};
window.loader = loader;

// Date formatting
const fmt = {
  date(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  dateTime(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  shortDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString('en', {month:'short'})}`;
  },
  relativeTime(dateStr) {
    if (!dateStr) return 'N/A';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return fmt.date(dateStr);
  },
  timeLeft(dateStr) {
    if (!dateStr) return '';
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return 'Expired';
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d left`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours}h left`;
    return 'Closing soon';
  },
};
window.fmt = fmt;

// Badge helpers
const badge = {
  approvalStatus(status) {
    const map = {
      draft: '<span class="badge badge-gray">Draft</span>',
      pending: '<span class="badge badge-warning">⏳ Pending</span>',
      approved: '<span class="badge badge-success">✅ Approved</span>',
      rejected: '<span class="badge badge-danger">❌ Rejected</span>',
      published: '<span class="badge badge-primary">🌐 Published</span>',
    };
    return map[status] || `<span class="badge badge-gray">${status}</span>`;
  },
  eventStatus(status) {
    const map = {
      upcoming: '<span class="badge badge-info">📅 Upcoming</span>',
      ongoing: '<span class="badge badge-warning">🔴 Ongoing</span>',
      completed: '<span class="badge badge-success">✅ Completed</span>',
      cancelled: '<span class="badge badge-danger">❌ Cancelled</span>',
    };
    return map[status] || `<span class="badge badge-gray">${status}</span>`;
  },
  hostStatus(status) {
    const map = {
      pending: '<span class="badge badge-warning">⏳ Pending</span>',
      approved: '<span class="badge badge-success">✅ Approved</span>',
      rejected: '<span class="badge badge-danger">❌ Rejected</span>',
      suspended: '<span class="badge badge-gray">🚫 Suspended</span>',
    };
    return map[status] || `<span class="badge badge-gray">${status}</span>`;
  },
  accountStatus(status) {
    const map = {
      active: '<span class="badge badge-success">Active</span>',
      inactive: '<span class="badge badge-gray">Inactive</span>',
      suspended: '<span class="badge badge-danger">Suspended</span>',
    };
    return map[status] || `<span class="badge badge-gray">${status}</span>`;
  },
  registrationStatus(status) {
    const map = {
      registered: '<span class="badge badge-success">✅ Registered</span>',
      cancelled: '<span class="badge badge-danger">❌ Cancelled</span>',
      waitlisted: '<span class="badge badge-warning">⌛ Waitlisted</span>',
    };
    return map[status] || `<span class="badge badge-gray">${status}</span>`;
  },
  attendanceStatus(status) {
    const map = {
      present: '<span class="badge badge-success">Present</span>',
      absent: '<span class="badge badge-danger">Absent</span>',
      'not-marked': '<span class="badge badge-gray">Not Marked</span>',
    };
    return map[status] || `<span class="badge badge-gray">${status}</span>`;
  },
};
window.badge = badge;

// Progress bar HTML
function progressBar(current, max, colorClass = '') {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const cls = pct >= 90 ? 'danger' : pct >= 70 ? '' : 'success';
  return `
    <div class="progress-wrap">
      <div class="progress-label">
        <span>${current}/${max} seats</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
    </div>
  `;
}
window.progressBar = progressBar;

// Avatar initials
function avatarInitials(name, size = 36) {
  const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  return `<div class="user-avatar" style="width:${size}px;height:${size}px">${initials}</div>`;
}
window.avatarInitials = avatarInitials;

// Image URL helper
function imgUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
}
window.imgUrl = imgUrl;

// Empty state HTML
function emptyState(icon, title, subtitle = '', btnHtml = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h4>${title}</h4>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
      ${btnHtml}
    </div>
  `;
}
window.emptyState = emptyState;

// Sidebar active link
function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href')?.split('/').pop();
    if (href === currentPath) a.classList.add('active');
    else a.classList.remove('active');
  });
}
window.setActiveNavLink = setActiveNavLink;

// Sidebar mobile toggle
function initSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (btn && sidebar) {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('visible');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }
}
window.initSidebarToggle = initSidebarToggle;

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());
  }
});
