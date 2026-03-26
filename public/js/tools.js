/**
 * tools.js — AI Tools Directory Logic
 * Handles loading, search, filtering, sorting, favorites, and rendering.
 */

const TOOLS_JSON_PATH = 'data/ai-tools.json';
const PAGE_SIZE       = 12;
const FAV_KEY         = 'nexus_favorites';
const TOOLS_USED_KEY  = 'nexus_tools_used';

let allTools     = [];
let filteredTools = [];
let currentPage  = 1;
let currentCat   = 'all';
let currentSort  = 'rating';
let isListView   = false;

// ─── Favorites ────────────────────────────────────────────────────────────────
function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
  catch { return []; }
}

function toggleFavorite(tool) {
  const favs = getFavorites();
  const idx  = favs.findIndex(f => f.id === tool.id);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(tool);
    // Track tools used count
    const used = parseInt(localStorage.getItem(TOOLS_USED_KEY) || '0');
    localStorage.setItem(TOOLS_USED_KEY, used + 1);
  }
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  return idx < 0; // true if now favorited
}

function isFavorite(id) {
  return getFavorites().some(f => f.id === id);
}

// ─── Star Rating HTML ─────────────────────────────────────────────────────────
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return [
    ...Array(full).fill('<i class="fa-solid fa-star"></i>'),
    ...Array(half).fill('<i class="fa-solid fa-star-half-stroke"></i>'),
    ...Array(empty).fill('<i class="fa-regular fa-star"></i>'),
  ].join('');
}

// ─── Format Review Count ──────────────────────────────────────────────────────
function formatReviews(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return n.toString();
}

// ─── Tool Card HTML ───────────────────────────────────────────────────────────
function buildToolCard(tool, idx) {
  const faved    = isFavorite(tool.id);
  const colorIdx = idx % 8;
  const initials = tool.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return `
    <div class="tool-card" data-id="${tool.id}">
      <div class="tool-card__header">
        <div class="tool-card__identity">
          <div class="tool-icon" data-idx="${colorIdx}">${initials}</div>
          <div class="tool-card__name-group">
            <h3>${tool.name}</h3>
            <span class="badge badge--category">${tool.category}</span>
          </div>
        </div>
        <div class="tool-card__actions-top">
          ${tool.free
            ? '<span class="badge badge--free"><i class="fa-solid fa-check-circle"></i> Free</span>'
            : '<span class="badge badge--paid"><i class="fa-solid fa-crown"></i> Paid</span>'}
          <button class="fav-btn ${faved ? 'active' : ''}" data-id="${tool.id}" title="${faved ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="fa-${faved ? 'solid' : 'regular'} fa-heart"></i>
          </button>
        </div>
      </div>

      <div class="tool-card__body">
        <p class="tool-card__desc">${tool.description}</p>
        <div class="tool-card__tags">
          ${tool.tags.slice(0, 4).map(tag => `<span class="tool-tag">${tag}</span>`).join('')}
        </div>
      </div>

      <div class="tool-card__meta">
        <div class="tool-card__rating">
          <div class="star-rating">${renderStars(tool.rating)}</div>
          <span class="rating-score">${tool.rating.toFixed(1)}</span>
          <span class="review-count">(${formatReviews(tool.reviews)})</span>
        </div>
      </div>

      <div class="tool-card__footer">
        <a
          href="${tool.url}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary btn-sm"
          onclick="trackToolVisit('${tool.id}')"
        >
          <i class="fa-solid fa-external-link-alt"></i> Visit Tool
        </a>
        <button class="btn btn-outline btn-sm tool-detail-btn" data-id="${tool.id}">
          <i class="fa-solid fa-info-circle"></i> Details
        </button>
      </div>
    </div>
  `;
}

// ─── Tool Detail Modal ────────────────────────────────────────────────────────
function showToolModal(tool) {
  const modal   = document.getElementById('toolModal');
  const content = document.getElementById('toolModalContent');
  const close   = document.getElementById('toolModalClose');
  if (!modal || !content) return;

  const faved    = isFavorite(tool.id);
  const initials = tool.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  content.innerHTML = `
    <div class="tool-modal__header">
      <div class="tool-modal__icon">${initials}</div>
      <div style="flex:1;">
        <h2 class="tool-modal__title">${tool.name}</h2>
        <div class="tool-modal__meta">
          <span class="badge badge--category">${tool.category}</span>
          ${tool.free
            ? '<span class="badge badge--free"><i class="fa-solid fa-check-circle"></i> Free Plan Available</span>'
            : '<span class="badge badge--paid"><i class="fa-solid fa-crown"></i> Paid Only</span>'}
          <div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;">
            <span style="color:var(--color-warning);">${renderStars(tool.rating)}</span>
            <strong>${tool.rating.toFixed(1)}</strong>
            <span style="color:var(--text-muted);">${formatReviews(tool.reviews)} reviews</span>
          </div>
        </div>
      </div>
    </div>

    <div class="tool-modal__body">
      <div class="tool-modal__section">
        <h4>About</h4>
        <p>${tool.description}</p>
      </div>
      <div class="tool-modal__section">
        <h4>Use Cases</h4>
        <div class="tool-modal__use-cases">
          ${tool.useCases.map(uc => `<div class="use-case-item"><i class="fa-solid fa-check"></i> ${uc}</div>`).join('')}
        </div>
      </div>
      <div class="tool-modal__section">
        <h4>Tags</h4>
        <div class="tool-modal__tags">
          ${tool.tags.map(t => `<span class="tool-tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="tool-modal__footer">
      <button class="btn btn-outline ${faved ? 'fav-active' : ''}" id="modalFavBtn" data-id="${tool.id}">
        <i class="fa-${faved ? 'solid' : 'regular'} fa-heart" style="${faved ? 'color:var(--color-danger)' : ''}"></i>
        ${faved ? 'Remove Favorite' : 'Add to Favorites'}
      </button>
      <a href="${tool.url}" target="_blank" rel="noopener" class="btn btn-primary">
        <i class="fa-solid fa-external-link-alt"></i> Visit ${tool.name}
      </a>
    </div>
  `;

  // Favorite button in modal
  const modalFavBtn = content.querySelector('#modalFavBtn');
  modalFavBtn?.addEventListener('click', () => {
    const nowFaved = toggleFavorite(tool);
    modalFavBtn.innerHTML = `<i class="fa-solid fa-heart" style="${nowFaved ? 'color:var(--color-danger)' : ''}"></i> ${nowFaved ? 'Remove Favorite' : 'Add to Favorites'}`;
    // Update card in grid
    const card = document.querySelector(`.tool-card[data-id="${tool.id}"] .fav-btn`);
    if (card) {
      card.classList.toggle('active', nowFaved);
      card.innerHTML = `<i class="fa-${nowFaved ? 'solid' : 'regular'} fa-heart"></i>`;
    }
  });

  modal.classList.add('active');
  close.onclick = () => modal.classList.remove('active');
  modal.onclick  = e => { if (e.target === modal) modal.classList.remove('active'); };
}

// ─── Track Tool Visit ──────────────────────────────────────────────────────────
window.trackToolVisit = function(id) {
  const used = parseInt(localStorage.getItem(TOOLS_USED_KEY) || '0');
  localStorage.setItem(TOOLS_USED_KEY, used + 1);
};

// ─── Render Grid ──────────────────────────────────────────────────────────────
function renderTools(tools, append = false) {
  const grid  = document.getElementById('toolsGrid');
  const empty = document.getElementById('toolsEmpty');
  const more  = document.getElementById('loadMoreSection');
  if (!grid) return;

  if (!tools.length && !append) {
    grid.innerHTML = '';
    empty && (empty.style.display = 'flex');
    more  && (more.style.display  = 'none');
    return;
  }

  empty && (empty.style.display = 'none');
  grid.classList.toggle('list-view', isListView);

  const startIdx = append ? (currentPage - 1) * PAGE_SIZE : 0;
  const cards    = tools.map((t, i) => buildToolCard(t, (startIdx + i) % 8)).join('');

  if (append) {
    grid.insertAdjacentHTML('beforeend', cards);
  } else {
    grid.innerHTML = cards;
  }

  // Wire up event listeners
  grid.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id   = btn.dataset.id;
      const tool = allTools.find(t => t.id === id);
      if (!tool) return;
      const nowFaved = toggleFavorite(tool);
      btn.classList.toggle('active', nowFaved);
      btn.innerHTML = `<i class="fa-${nowFaved ? 'solid' : 'regular'} fa-heart"></i>`;
    });
  });

  grid.querySelectorAll('.tool-detail-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const tool = allTools.find(t => t.id === btn.dataset.id);
      if (tool) showToolModal(tool);
    });
  });

  grid.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const tool = allTools.find(t => t.id === card.dataset.id);
      if (tool) showToolModal(tool);
    });
  });

  // Load more button
  const hasMore = filteredTools.length > currentPage * PAGE_SIZE;
  more && (more.style.display = hasMore ? 'block' : 'none');
}

// ─── Update Result Count ──────────────────────────────────────────────────────
function updateResultCount() {
  setEl('resultCount', filteredTools.length);
  setEl('totalCount', allTools.length + '+');
}

// ─── Update Category Counts ───────────────────────────────────────────────────
function updateCategoryCounts() {
  const catMap = {
    'all':              allTools.length,
    'content':          allTools.filter(t => t.category === 'Content & Writing').length,
    'design':           allTools.filter(t => t.category === 'Design & Art').length,
    'video':            allTools.filter(t => t.category === 'Video & Media').length,
    'audio':            allTools.filter(t => t.category === 'Audio & Music').length,
    'coding':           allTools.filter(t => t.category === 'Coding & Dev').length,
    'productivity':     allTools.filter(t => t.category === 'Productivity').length,
    'presentation':     allTools.filter(t => t.category === 'Presentation').length,
    'website':          allTools.filter(t => t.category === 'Website Builder').length,
  };

  Object.entries(catMap).forEach(([key, count]) => {
    const el = document.getElementById(`cat-count-${key}`);
    if (el) el.textContent = count;
  });
}

// ─── Filter & Sort Pipeline ───────────────────────────────────────────────────
function applyFilters(searchQuery = '') {
  let result = [...allTools];

  // Category filter
  if (currentCat !== 'all') {
    result = result.filter(t => t.category === currentCat);
  }

  // Search filter
  const q = searchQuery.toLowerCase().trim();
  if (q) {
    result = result.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q)) ||
      t.useCases.some(uc => uc.toLowerCase().includes(q))
    );
  }

  // Sort
  result.sort((a, b) => {
    switch (currentSort) {
      case 'rating':  return b.rating - a.rating;
      case 'reviews': return b.reviews - a.reviews;
      case 'name':    return a.name.localeCompare(b.name);
      case 'free':    return (b.free ? 1 : 0) - (a.free ? 1 : 0);
      default:        return 0;
    }
  });

  filteredTools = result;
  currentPage   = 1;
  updateResultCount();
  renderTools(filteredTools.slice(0, PAGE_SIZE));
}

// ─── Search ───────────────────────────────────────────────────────────────────
function initSearch() {
  const input     = document.getElementById('toolSearchInput');
  const clearBtn  = document.getElementById('searchClear');
  let debounceTimer;

  input?.addEventListener('input', () => {
    const val = input.value;
    clearBtn && (clearBtn.style.display = val ? 'flex' : 'none');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyFilters(val), 200);
  });

  clearBtn?.addEventListener('click', () => {
    if (input) input.value = '';
    clearBtn.style.display = 'none';
    input?.focus();
    applyFilters('');
  });
}

// ─── Category Filters ─────────────────────────────────────────────────────────
function initCategoryFilters() {
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.category;
      const search = document.getElementById('toolSearchInput')?.value || '';
      applyFilters(search);
    });
  });
}

// ─── Sort ─────────────────────────────────────────────────────────────────────
function initSort() {
  const sel = document.getElementById('sortSelect');
  sel?.addEventListener('change', () => {
    currentSort = sel.value;
    const search = document.getElementById('toolSearchInput')?.value || '';
    applyFilters(search);
  });
}

// ─── View Toggle ──────────────────────────────────────────────────────────────
function initViewToggle() {
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');

  gridBtn?.addEventListener('click', () => {
    isListView = false;
    gridBtn.classList.add('active');
    listBtn?.classList.remove('active');
    document.getElementById('toolsGrid')?.classList.remove('list-view');
  });

  listBtn?.addEventListener('click', () => {
    isListView = true;
    listBtn.classList.add('active');
    gridBtn?.classList.remove('active');
    document.getElementById('toolsGrid')?.classList.add('list-view');
  });
}

// ─── Load More ────────────────────────────────────────────────────────────────
function initLoadMore() {
  document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    currentPage++;
    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = filteredTools.slice(start, start + PAGE_SIZE);
    renderTools(slice, true);
  });
}

// ─── Clear Filters ────────────────────────────────────────────────────────────
function initClearFilters() {
  document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    const input = document.getElementById('toolSearchInput');
    if (input) input.value = '';
    currentCat  = 'all';
    currentSort = 'rating';
    document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
    const sortSel = document.getElementById('sortSelect');
    if (sortSel) sortSel.value = 'rating';
    applyFilters('');
  });
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function init() {
  try {
    const resp = await fetch(TOOLS_JSON_PATH);
    if (!resp.ok) throw new Error('Failed to load tools');
    allTools = await resp.json();
  } catch (err) {
    console.error('Could not load AI tools:', err);
    const empty = document.getElementById('toolsEmpty');
    empty && (empty.style.display = 'flex');
    return;
  }

  updateCategoryCounts();
  applyFilters();
  initSearch();
  initCategoryFilters();
  initSort();
  initViewToggle();
  initLoadMore();
  initClearFilters();
}

document.addEventListener('DOMContentLoaded', init);
