'use strict';

const API_BASE = '';

const latestOrderNumberEl = document.getElementById('order-number');
const latestWaitstaffEl = document.getElementById('waitstaff');
const latestTableEl = document.getElementById('table');
const latestTimestampEl = document.getElementById('timestamp');
const latestOrderEl = document.getElementById('order');
const historyEl = document.getElementById('order-history');

const POLL_INTERVAL = 8000;

// ── API helper ─────────────────────────────────────────────────────────────

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

// ── Formatting helpers ────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// Render AIS-6.0 items (objects) into readable strings
function renderItems(items) {
  if (!Array.isArray(items) || !items.length) return '<p>No items.</p>';

  const lines = items.map(item => {
    const name = item.name || 'Item';
    const course = item.course ? ` (${item.course})` : '';
    const mods = [
      ...(Array.isArray(item.modifiers) ? item.modifiers : []),
      ...(Array.isArray(item.dietary) ? item.dietary : [])
    ];
    const modsStr = mods.length ? ` – ${mods.join(', ')}` : '';
    return `<li>${escHtml(name + course + modsStr)}</li>`;
  });

  return `<ul>${lines.join('')}</ul>`;
}

// ── Latest order ───────────────────────────────────────────────────────────

async function fetchLatest() {
  try {
    const latest = await apiFetch('/api/order/latest');

    if (!latest || !latest.id) {
      latestOrderNumberEl.textContent = 'Order #: —';
      latestWaitstaffEl.textContent = 'Waitstaff: —';
      latestTableEl.textContent = 'Table: —';
      latestTimestampEl.textContent = 'Placed: —';
      latestOrderEl.innerHTML = '<p>No orders yet.</p>';
      return;
    }

    latestOrderNumberEl.textContent = `Order #: ${latest.id}`;
    latestWaitstaffEl.textContent = `Waitstaff: ${latest.waitstaff_name || '—'} (ID: ${latest.waitstaff_id ?? '—'})`;
    latestTableEl.textContent = `Table: ${latest.table ?? '—'}`;
    latestTimestampEl.textContent = `Placed: ${fmtTime(latest.created_at)}`;

    latestOrderEl.innerHTML = renderItems(latest.items);
  } catch (err) {
    latestOrderEl.innerHTML = `<p style="color:red;">Error loading latest order: ${escHtml(err.message)}</p>`;
  }
}

// ── Order history ──────────────────────────────────────────────────────────

async function fetchHistory() {
  try {
    const orders = await apiFetch('/api/orders');

    if (!Array.isArray(orders) || !orders.length) {
      historyEl.innerHTML = '<p>No order history yet.</p>';
      return;
    }

    const rows = orders.slice().reverse().map(order => {
      const status = order.complete
        ? 'Complete'
        : order.ready
          ? 'Ready'
          : 'Pending';

      return `
        <article class="history-order">
          <header>
            <strong>Order #${order.id}</strong>
            <span>Table ${order.table ?? '—'}</span>
            <span>Status: ${status}</span>
          </header>
          <div class="history-meta">
            <span>Waitstaff: ${escHtml(order.waitstaff_name || '—')} (ID: ${order.waitstaff_id ?? '—'})</span>
            <span>Placed: ${fmtTime(order.created_at)}</span>
            <span>Ready at: ${fmtTime(order.ready_at)}</span>
          </div>
          <div class="history-items">
            ${renderItems(order.items)}
          </div>
        </article>
      `;
    });

    historyEl.innerHTML = rows.join('');
  } catch (err) {
    historyEl.innerHTML = `<p style="color:red;">Error loading order history: ${escHtml(err.message)}</p>`;
  }
}

// ── Polling ────────────────────────────────────────────────────────────────

async function refreshAll() {
  await fetchLatest();
  await fetchHistory();
}

refreshAll();
setInterval(refreshAll, POLL_INTERVAL);
