/**
 * dashboard.js — Dashboard Logic Module
 * Handles panel navigation, analytics, favorites, history, and settings.
 */

import { History, initGeneratorUI } from './content-generator.js';

// ─── Panel Navigation ─────────────────────────────────────────────────────────
function initPanelNav() {
  const sidebarLinks    = document.querySelectorAll('.sidebar-link[data-panel]');
  const panels          = document.querySelectorAll('.panel');
  const breadcrumb      = document.getElementById('breadcrumb');
  const sidebarToggle   = document.getElementById('sidebarToggle');
  const sidebarClose    = document.getElementById('sidebarClose');
  const sidebar         = document.getElementById('sidebar');

  const panelTitles = {
    overview:  'Dashboard',
    generator: 'Content Generator',
    analytics: 'Analytics',
    favorites: 'Favorites',
    history:   'History',
    settings:  'Settings',
  };

  function activatePanel(panelId) {
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${panelId}`));
    sidebarLinks.forEach(l => l.classList.toggle('active', l.dataset.panel === panelId));
    breadcrumb && (breadcrumb.textContent = panelTitles[panelId] || panelId);
    sidebar?.classList.remove('open');
    window.scrollTo(0, 0);

    // Lazy-load panel content
    if (panelId === 'analytics') renderAnalytics();
    if (panelId === 'favorites') renderFavorites();
    if (panelId === 'history')   renderHistoryTable();
    if (panelId === 'settings')  populateSettings();
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      activatePanel(link.dataset.panel);
    });
  });

  // Quick action buttons
  document.querySelectorAll('[data-panel]').forEach(el => {
    if (!el.classList.contains('sidebar-link')) {
      el.addEventListener('click', e => {
        e.preventDefault();
        activatePanel(el.dataset.panel);
      });
    }
  });

  // Panel links (in content body)
  document.querySelectorAll('[data-panel-link]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      activatePanel(el.dataset.panelLink);
    });
  });

  // Sidebar toggle
  sidebarToggle?.addEventListener('click', () => sidebar?.classList.add('open'));
  sidebarClose?.addEventListener('click', () => sidebar?.classList.remove('open'));
}

// ─── Stats Overview ───────────────────────────────────────────────────────────
function updateStats() {
  const stats  = History.getStats();
  const total  = stats.total;
  const limit  = 50;
  const usage  = Math.min(total, limit);
  const pct    = Math.round((usage / limit) * 100);

  const usageBar = document.getElementById('usageBar');
  usageBar && (usageBar.style.width = `${pct}%`);
  usageBar && (usageBar.style.background = pct > 80 ? 'var(--color-danger)' : 'var(--gradient-primary)');

  setEl('statContent', total);
  setEl('statTools', parseInt(localStorage.getItem('nexus_tools_used') || '0'));
  setEl('statMonthly', `${usage}/${limit}`);

  const plan = localStorage.getItem('nexus_plan') || 'Free';
  setEl('statPlan', plan);
}

// ─── History Table (overview) ─────────────────────────────────────────────────
function renderOverviewHistory() {
  const tbody = document.getElementById('overviewHistoryBody');
  if (!tbody) return;
  const history = History.getAll().slice(0, 5);
  if (!history.length) return;
  tbody.innerHTML = history.map(item => buildHistoryRow(item)).join('');
  wireHistoryActions(tbody);
}

function renderHistoryTable() {
  const tbody    = document.getElementById('historyTableBody');
  const filter   = document.getElementById('historyTypeFilter');
  if (!tbody) return;

  const type    = filter?.value || 'all';
  let history   = History.getAll();
  if (type !== 'all') history = history.filter(i => i.contentType === type);

  if (!history.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">
      <div class="empty-state">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <p>No content history yet.</p>
      </div></td></tr>`;
    return;
  }

  tbody.innerHTML = history.map(item => buildHistoryRow(item, true)).join('');
  wireHistoryActions(tbody);
}

function buildHistoryRow(item, showWords = false) {
  const date     = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const typeMap  = { blog: 'Blog Post', social: 'Social Media', email: 'Email', product: 'Product Desc', youtube: 'YT Script', thread: 'X Thread' };
  const label    = typeMap[item.contentType] || item.contentType;
  const iconMap  = { blog: 'fa-blog', social: 'fa-instagram', email: 'fa-envelope', product: 'fa-tag', youtube: 'fa-youtube', thread: 'fa-x-twitter' };
  const icon     = iconMap[item.contentType] || 'fa-file';
  const model    = item.model?.replace('claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet').replace('claude-3-haiku-20240307', 'Claude Haiku').replace('claude-3-opus-20240229', 'Claude Opus') || 'Claude';
  const words    = item.wordCount || 0;
  const prompt   = (item.prompt || '').slice(0, 60) + ((item.prompt?.length > 60) ? '…' : '');

  return `<tr>
    <td><span class="badge badge--category"><i class="fa-solid ${icon}"></i> ${label}</span></td>
    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${prompt}</td>
    <td style="font-size:0.75rem;color:var(--text-muted);">${model}</td>
    ${showWords ? `<td style="font-size:0.75rem;color:var(--text-muted);">${words.toLocaleString()} words</td>` : ''}
    <td style="font-size:0.75rem;color:var(--text-muted);">${date}</td>
    <td>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-ghost btn-sm view-content-btn" data-id="${item.id}" title="View"><i class="fa-solid fa-eye"></i></button>
        <button class="btn btn-ghost btn-sm copy-content-btn" data-id="${item.id}" title="Copy"><i class="fa-solid fa-copy"></i></button>
        <button class="btn btn-ghost btn-sm delete-content-btn" data-id="${item.id}" title="Delete" style="color:var(--color-danger)"><i class="fa-solid fa-trash"></i></button>
      </div>
    </td>
  </tr>`;
}

function wireHistoryActions(container) {
  const history = History.getAll();
  const getItem = id => history.find(h => h.id === id);

  container.querySelectorAll('.view-content-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getItem(btn.dataset.id);
      if (!item) return;
      showContentModal(item);
    });
  });

  container.querySelectorAll('.copy-content-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const item = getItem(btn.dataset.id);
      if (!item) return;
      await navigator.clipboard.writeText(item.content || '');
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i>'; }, 1500);
    });
  });

  container.querySelectorAll('.delete-content-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      History.delete(btn.dataset.id);
      btn.closest('tr').remove();
      updateStats();
    });
  });
}

// ─── Content View Modal ───────────────────────────────────────────────────────
function showContentModal(item) {
  const modal   = document.getElementById('contentViewModal');
  const title   = document.getElementById('contentViewTitle');
  const text    = document.getElementById('contentViewText');
  const copyBtn = document.getElementById('contentViewCopy');
  const close   = document.getElementById('contentViewClose');

  if (!modal) return;

  const typeMap = { blog: 'Blog Post', social: 'Social Media', email: 'Email', product: 'Product Desc', youtube: 'YT Script', thread: 'X Thread' };
  title && (title.textContent = typeMap[item.contentType] || 'Content');
  text  && (text.textContent  = item.content || '');

  modal.classList.add('active');

  copyBtn?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(item.content || '');
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => { copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy'; }, 2000);
  }, { once: true });

  close?.addEventListener('click', () => modal.classList.remove('active'), { once: true });
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); }, { once: true });
}

// ─── Clear History ────────────────────────────────────────────────────────────
function initClearHistory() {
  document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
    if (!confirm('Clear all content history? This cannot be undone.')) return;
    History.clear();
    renderHistoryTable();
    renderOverviewHistory();
    updateStats();
  });

  document.getElementById('historyTypeFilter')?.addEventListener('change', () => renderHistoryTable());
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function renderAnalytics() {
  const stats   = History.getStats();
  const { byType } = stats;
  const total   = stats.total;

  // Content type chart
  const barsEl = document.getElementById('contentBars');
  if (barsEl && total > 0) {
    const types = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const max   = Math.max(...types.map(([, v]) => v), 1);
    barsEl.innerHTML = types.map(([type, count]) => {
      const pct = Math.round((count / max) * 100);
      const labels = { blog: 'Blog', social: 'Social', email: 'Email', product: 'Product', youtube: 'YouTube', thread: 'Thread' };
      return `<div class="chart-bar" data-label="${labels[type] || type}" style="height:${pct}%;flex:1;min-width:40px;" title="${count} generated"></div>`;
    }).join('');
  } else if (barsEl) {
    barsEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;align-self:center;text-align:center;width:100%">No data yet — generate some content first!</p>';
  }

  // Weekly chart
  const weeklyEl = document.getElementById('weeklyChart');
  if (weeklyEl) {
    const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    const history = History.getAll();
    history.forEach(item => {
      const d = new Date(item.createdAt);
      if (Date.now() - d.getTime() < 7 * 86400000) {
        counts[d.getDay()]++;
      }
    });
    const max = Math.max(...counts, 1);
    weeklyEl.innerHTML = counts.map((c, i) => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;">
        <div style="width:100%;background:var(--gradient-primary);border-radius:6px 6px 0 0;height:${Math.round((c / max) * 150)}px;min-height:4px;"></div>
        <span style="font-size:0.65rem;color:var(--text-muted);">${days[i]}</span>
      </div>
    `).join('');
  }

  // Usage summary
  const summaryEl = document.getElementById('usageSummary');
  if (summaryEl) {
    const now        = new Date();
    const thisMonth  = History.getAll().filter(i => new Date(i.createdAt).getMonth() === now.getMonth()).length;
    const totalWords = History.getAll().reduce((sum, i) => sum + (i.wordCount || 0), 0);
    summaryEl.innerHTML = `
      <div class="usage-metric"><span>${thisMonth}</span><span>This Month</span></div>
      <div class="usage-metric"><span>${total}</span><span>All Time</span></div>
      <div class="usage-metric"><span>${totalWords.toLocaleString()}</span><span>Total Words</span></div>
    `;
  }
}

// ─── Favorites ────────────────────────────────────────────────────────────────
function renderFavorites() {
  const grid = document.getElementById('favoritesGrid');
  if (!grid) return;

  const favorites = JSON.parse(localStorage.getItem('nexus_favorites') || '[]');

  if (!favorites.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fa-solid fa-heart"></i>
      <p>No favorite tools yet.</p>
      <a href="tools.html" class="btn btn-primary"><i class="fa-solid fa-robot"></i> Browse AI Tools</a>
    </div>`;
    return;
  }

  grid.innerHTML = favorites.map(tool => `
    <div class="card" style="padding:var(--space-5);">
      <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);">
        <div class="tool-avatar">${tool.name?.slice(0,2).toUpperCase() || 'AI'}</div>
        <div>
          <h4 style="font-size:var(--text-base);">${tool.name || 'Tool'}</h4>
          <span class="badge badge--category">${tool.category || ''}</span>
        </div>
        <button class="fav-btn active" data-id="${tool.id}" style="margin-left:auto;">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>
      <p style="font-size:var(--text-sm);margin-bottom:var(--space-4);">${(tool.description || '').slice(0, 90)}...</p>
      <a href="${tool.url}" target="_blank" rel="noopener" class="btn btn-primary btn-sm btn-block">
        Visit Tool <i class="fa-solid fa-external-link-alt"></i>
      </a>
    </div>
  `).join('');

  grid.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const favs = JSON.parse(localStorage.getItem('nexus_favorites') || '[]');
      const idx  = favs.findIndex(f => f.id === id);
      if (idx >= 0) favs.splice(idx, 1);
      localStorage.setItem('nexus_favorites', JSON.stringify(favs));
      btn.closest('.card').remove();
    });
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function populateSettings() {
  const cachedUser = JSON.parse(localStorage.getItem('nexus_user_cache') || '{}');
  setInputVal('settingsName',  cachedUser.displayName || '');
  setInputVal('settingsEmail', cachedUser.email        || '');

  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const toggle = document.getElementById('settingsThemeToggle');
  if (toggle) toggle.checked = isDark;

  toggle?.addEventListener('change', () => {
    const theme = toggle.checked ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
}

function initSettings() {
  document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
    const name = document.getElementById('settingsName')?.value?.trim();
    if (!name) return;
    const cached = JSON.parse(localStorage.getItem('nexus_user_cache') || '{}');
    cached.displayName = name;
    localStorage.setItem('nexus_user_cache', JSON.stringify(cached));
    setEl('userNameHeader', name);
    setEl('welcomeName', name);
    alert('Profile saved!');
  });

  document.getElementById('saveApiKeysBtn')?.addEventListener('click', () => {
    const key = document.getElementById('anthropicKey')?.value?.trim();
    if (key) {
      localStorage.setItem('nexus_anthropic_key', key);
      alert('API key saved locally!');
    }
  });

  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    localStorage.removeItem('nexus_user_cache');
    window.location.href = 'index.html';
  });

  // API key reveal toggles
  document.querySelectorAll('.input-reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.querySelector('i').className = input.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });
  });
}

// ─── User Header ──────────────────────────────────────────────────────────────
function populateUserHeader() {
  const cached = JSON.parse(localStorage.getItem('nexus_user_cache') || '{}');
  const name   = cached.displayName || 'Creator';
  const plan   = localStorage.getItem('nexus_plan') || 'Free';

  setEl('userNameHeader', name);
  setEl('userPlanHeader', `${plan} Plan`);
  setEl('welcomeName', name.split(' ')[0]);
  setEl('userAvatarHeader', name.slice(0, 1).toUpperCase());

  // Sidebar theme toggle
  const themeToggleSidebar = document.getElementById('themeToggleSidebar');
  const themeIconSidebar   = document.getElementById('themeIconSidebar');
  const isDark = document.body.getAttribute('data-theme') === 'dark';

  if (themeIconSidebar) themeIconSidebar.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';

  themeToggleSidebar?.addEventListener('click', () => {
    const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    if (themeIconSidebar) themeIconSidebar.className = next === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setInputVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  const theme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', theme);

  initPanelNav();
  updateStats();
  renderOverviewHistory();
  populateUserHeader();
  initSettings();
  initClearHistory();
  initGeneratorUI();
});
