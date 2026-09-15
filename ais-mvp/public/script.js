'use strict';

const API_BASE      = '';
const POLL_INTERVAL = 8_000;
const AGE_WARN_MIN  = 10;
const AGE_ALERT_MIN = 20;

let activeOrders    = [];
let completedOrders = [];
let pollTimer       = null;

const board            = document.getElementById('order-board');
const emptyState       = document.getElementById('empty-state');
const clockEl          = document.getElementById('clock');
const completedCountEl = document.getElementById('completed-count');
const modalOverlay     = document.getElementById('modal-new-order');
const formNewOrder     = document.getElementById('form-new-order');
const inputTable       = document.getElementById('input-table');
const inputNotes       = document.getElementById('input-notes');
const itemsList        = document.getElementById('items-list');
const drawerOverlay    = document.getElementById('drawer-overlay');
const drawerCompleted  = document.getElementById('drawer-completed');
const completedList    = document.getElementById('completed-list');
const toast            = document.getElementById('toast');

// ── Clock ──────────────────────────────────────────────────────────────────
function updateClock() {
  clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(message, type = 'info', duration = 2800) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => toast.classList.replace('show', 'hide'), duration);
}

// ── API ────────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ── Timestamp helpers ──────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function elapsedMin(iso)   { return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000); }
function elapsedLabel(iso) {
  const min = elapsedMin(iso);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderBoard() {
  const incomingIds = new Set(activeOrders.map(o => String(o.id)));
  board.querySelectorAll('.order-card').forEach(el => {
    if (!incomingIds.has(el.dataset.id)) el.remove();
  });

  activeOrders.forEach((order, idx) => {
    const sid      = String(order.id);
    const existing = board.querySelector(`.order-card[data-id="${sid}"]`);
    if (existing) {
      updateCard(existing, order);
    } else {
      const card  = buildCard(order);
      const cards = board.querySelectorAll('.order-card');
      if (!cards.length || idx >= cards.length) board.appendChild(card);
      else board.insertBefore(card, cards[idx]);
    }
  });

  emptyState.style.display = board.querySelectorAll('.order-card').length ? 'none' : '';
}

function buildCard(order) {
  const card = document.createElement('article');
  card.className  = 'order-card';
  card.dataset.id = String(order.id);
  populateCard(card, order);
  return card;
}

function updateCard(card, order) {
  card.classList.toggle('is-ready', order.ready);
  const ageEl   = card.querySelector('.card-age');
  if (ageEl) updateAgeEl(ageEl, order.created_at);
  const btnReady = card.querySelector('.btn-ready');
  if (btnReady) syncReadyBtn(btnReady, order);
  const tsReady = card.querySelector('.ts-ready-val');
  if (tsReady) {
    tsReady.textContent = order.ready_at ? fmtTime(order.ready_at) : '—';
    tsReady.classList.toggle('ts-ready', !!order.ready_at);
  }
}

function populateCard(card, order) {
  card.classList.toggle('is-ready', order.ready);
  const ageClass   = ageClassName(order.created_at);
  const itemsHtml  = order.items.map(i => `<li class="card-item">${escHtml(i)}</li>`).join('');
  const notesHtml  = order.notes
    ? `<p class="card-notes"><strong>⚠ Note:</strong> ${escHtml(order.notes)}</p>` : '';
  const readyTsCls = order.ready_at ? 'ts-ready' : '';

  card.innerHTML = `
    <header class="card-header">
      <span class="card-table">${escHtml(order.table_number)}</span>
      <span class="card-age ${ageClass}">${elapsedLabel(order.created_at)}</span>
    </header>
    <div class="card-body">
      <ul class="card-items">${itemsHtml}</ul>
      ${notesHtml}
    </div>
    <div class="card-timestamps">
      <div class="timestamp-row">
        <span class="timestamp-label">Ordered</span>
        <span class="timestamp-value">${fmtTime(order.created_at)}</span>
      </div>
      <div class="timestamp-row">
        <span class="timestamp-label">Ready at</span>
        <span class="timestamp-value ts-ready-val ${readyTsCls}">${order.ready_at ? fmtTime(order.ready_at) : '—'}</span>
      </div>
    </div>
    <footer class="card-footer">
      <button class="btn-ready ${order.ready ? 'is-ready' : ''}"
        data-id="${order.id}" data-ready="${order.ready}"
        aria-pressed="${order.ready}"
        aria-label="${order.ready ? 'Un-mark ready' : 'Mark order ready'}"
      >${order.ready ? '✓ Ready' : 'Mark Ready'}</button>

      <label class="complete-wrap" title="Mark order complete">
        <input type="checkbox" class="complete-checkbox"
          data-id="${order.id}" aria-label="Complete order" />
        <span class="complete-label">Complete</span>
      </label>

      <button class="btn-delete" data-id="${order.id}"
        aria-label="Delete order" title="Delete order">🗑</button>
    </footer>`;

  card.querySelector('.btn-ready').addEventListener('click',    () => handleReadyToggle(card, order));
  card.querySelector('.complete-checkbox').addEventListener('change', e => handleComplete(card, order, e.target));
  card.querySelector('.btn-delete').addEventListener('click',   () => handleDelete(order));
}

function ageClassName(createdAt) {
  const min = elapsedMin(createdAt);
  if (min >= AGE_ALERT_MIN) return 'alert';
  if (min >= AGE_WARN_MIN)  return 'warn';
  return '';
}
function updateAgeEl(el, createdAt) {
  el.textContent = elapsedLabel(createdAt);
  el.className   = `card-age ${ageClassName(createdAt)}`;
}
function syncReadyBtn(btn, order) {
  btn.textContent = order.ready ? '✓ Ready' : 'Mark Ready';
  btn.classList.toggle('is-ready', order.ready);
  btn.dataset.ready = String(order.ready);
  btn.setAttribute('aria-pressed', String(order.ready));
  btn.setAttribute('aria-label', order.ready ? 'Un-mark ready' : 'Mark order ready');
}

// Refresh age labels every 30s without full re-render
setInterval(() => {
  board.querySelectorAll('.order-card').forEach(card => {
    const order = activeOrders.find(o => String(o.id) === card.dataset.id);
    if (!order) return;
    const ageEl = card.querySelector('.card-age');
    if (ageEl) updateAgeEl(ageEl, order.created_at);
  });
}, 30_000);

// ── Action Handlers ────────────────────────────────────────────────────────

// Toggle ready — optimistic UI, then sync server response
async function handleReadyToggle(card, order) {
  const newReady = !order.ready;
  const btn = card.querySelector('.btn-ready');
  btn.disabled = true;
  syncReadyBtn(btn, { ...order, ready: newReady });
  card.classList.toggle('is-ready', newReady);

  try {
    const updated = await apiFetch('/api/order/ready', {
      method: 'POST',
      body: JSON.stringify({ id: order.id, ready: newReady }),
    });

    const idx = activeOrders.findIndex(o => o.id === order.id);
    if (idx !== -1) activeOrders[idx] = updated;

    // Flash border animation on mark-ready
    if (newReady) {
      card.classList.remove('flash-ready');
      void card.offsetWidth;                    // restart animation
      card.classList.add('flash-ready');
      card.addEventListener('animationend', () => card.classList.remove('flash-ready'), { once: true });
      showToast(`Order ${order.table_number} is READY 🔔`, 'success');
    } else {
      showToast(`Order ${order.table_number} marked as pending`, 'info');
    }

    const tsReadyEl = card.querySelector('.ts-ready-val');
    if (tsReadyEl) {
      tsReadyEl.textContent = updated.ready_at ? fmtTime(updated.ready_at) : '—';
      tsReadyEl.classList.toggle('ts-ready', !!updated.ready_at);
    }
  } catch (err) {
    syncReadyBtn(btn, order);
    card.classList.toggle('is-ready', order.ready);
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleComplete(card, order, checkbox) {
  if (!checkbox.checked) return;
  checkbox.disabled = true;
  try {
    await apiFetch('/api/order/complete', { method: 'POST', body: JSON.stringify({ id: order.id }) });
    activeOrders = activeOrders.filter(o => o.id !== order.id);
    card.style.transition = 'opacity .3s, transform .3s';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(.95)';
    setTimeout(() => {
      card.remove();
      emptyState.style.display = board.querySelectorAll('.order-card').length ? 'none' : '';
    }, 320);
    showToast(`Order ${order.table_number} completed ✓`, 'success');
    fetchCompleted();
  } catch (err) {
    checkbox.checked  = false;
    checkbox.disabled = false;
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function handleDelete(order) {
  if (!confirm(`Delete order for "${order.table_number}"? This cannot be undone.`)) return;
  try {
    await apiFetch(`/api/orders/${order.id}`, { method: 'DELETE' });
    activeOrders = activeOrders.filter(o => o.id !== order.id);
    renderBoard();
    showToast('Order deleted', 'info');
  } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
}

// ── Data Fetching & Polling ────────────────────────────────────────────────
async function fetchActive() {
  try { activeOrders = await apiFetch('/api/orders'); renderBoard(); }
  catch (_) { showToast('Could not load orders — retrying…', 'error'); }
}
async function fetchCompleted() {
  try {
    const all = await apiFetch('/api/orders?all=true');
    completedOrders = all.filter(o => o.status === 'complete');
    completedCountEl.textContent = completedOrders.length;
    renderCompletedDrawer();
  } catch (_) {}
}
function renderCompletedDrawer() {
  if (!completedOrders.length) { completedList.innerHTML = '<p class="drawer-empty">No completed orders yet.</p>'; return; }
  completedList.innerHTML = completedOrders.slice().reverse().map(o => `
    <div class="completed-row">
      <div class="completed-row-top">
        <strong>${escHtml(o.table_number)}</strong>
        <div style="display:flex;align-items:center;gap:.4rem;">
          <span class="cr-badge-complete">DONE</span>
          <span class="cr-time">${fmtTime(o.completed_at || o.created_at)}</span>
        </div>
      </div>
      <div class="cr-items">${o.items.slice(0,3).map(escHtml).join(', ')}${o.items.length > 3 ? ` +${o.items.length-3} more` : ''}</div>
    </div>`).join('');
}

function startPolling() { stopPolling(); pollTimer = setInterval(fetchActive, POLL_INTERVAL); }
function stopPolling()  { clearInterval(pollTimer); }

// ── Modal ──────────────────────────────────────────────────────────────────
function openModal() {
  formNewOrder.reset(); itemsList.innerHTML = ''; addItemRow();
  modalOverlay.hidden = false; inputTable.focus(); stopPolling();
}
function closeModal() { modalOverlay.hidden = true; startPolling(); }

function addItemRow(value = '') {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input type="text" class="item-input" placeholder="e.g. Burger – no onion" maxlength="120" value="${escHtml(value)}" />
    <button type="button" class="btn-remove-item" aria-label="Remove item">−</button>`;
  row.querySelector('.btn-remove-item').addEventListener('click', () => {
    if (itemsList.querySelectorAll('.item-row').length > 1) row.remove();
  });
  row.querySelector('.item-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addItemRow(); itemsList.lastElementChild?.querySelector('.item-input')?.focus(); }
  });
  itemsList.appendChild(row);
  return row;
}

document.getElementById('btn-new-order').addEventListener('click', openModal);
document.getElementById('btn-close-modal').addEventListener('click', closeModal);
document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
document.getElementById('btn-add-item').addEventListener('click', () => {
  addItemRow(); itemsList.lastElementChild?.querySelector('.item-input')?.focus();
});
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!modalOverlay.hidden) closeModal(); if (!drawerCompleted.hidden) closeDrawer(); }
});

formNewOrder.addEventListener('submit', async e => {
  e.preventDefault();
  const table = inputTable.value.trim();
  if (!table) { inputTable.focus(); return; }
  const items = [...itemsList.querySelectorAll('.item-input')].map(i => i.value.trim()).filter(Boolean);
  if (!items.length) { showToast('Add at least one item', 'error'); return; }
  const notes = inputNotes.value.trim();
  const submitBtn = formNewOrder.querySelector('[type="submit"]');
  submitBtn.disabled = true; submitBtn.textContent = 'Sending…';
  try {
    const newOrder = await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify({ table_number: table, items, notes }) });
    activeOrders.unshift(newOrder); renderBoard(); closeModal();
    showToast(`Order for ${newOrder.table_number} sent to kitchen 🍳`, 'success');
  } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
  finally { submitBtn.disabled = false; submitBtn.textContent = 'Send to Kitchen'; }
});

// ── Drawer ─────────────────────────────────────────────────────────────────
function openDrawer()  { fetchCompleted(); drawerOverlay.hidden = drawerCompleted.hidden = false; }
function closeDrawer() { drawerOverlay.hidden = drawerCompleted.hidden = true; }
document.getElementById('btn-show-completed').addEventListener('click', openDrawer);
document.getElementById('btn-close-drawer').addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// ── Utility ────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Boot ───────────────────────────────────────────────────────────────────
(async function init() { await fetchActive(); fetchCompleted(); startPolling(); })();
