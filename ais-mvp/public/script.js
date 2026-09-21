// ── Persist completed order IDs across the 5-second refresh cycle ──────────
const completedIds = new Set(
  JSON.parse(localStorage.getItem('chef_completed_ids') || '[]')
);
function saveCompleted() {
  localStorage.setItem('chef_completed_ids', JSON.stringify([...completedIds]));
}

// ── Update the four stat counters at the top of the page ───────────────────
function updateStats(activeOrders, completedCount) {
  const s = o => o.status ?? o.order_status ?? o.orderStatus ?? o.state ?? '';

  document.getElementById('stat-new').textContent   =
    activeOrders.filter(o => ['Pending','New',''].includes(s(o))).length;
  document.getElementById('stat-prep').textContent  =
    activeOrders.filter(o => ['Preparing','In Preparation','In Progress'].includes(s(o))).length;
  document.getElementById('stat-ready').textContent =
    activeOrders.filter(o => s(o) === 'Ready').length;
  document.getElementById('stat-total').textContent =
    activeOrders.length + completedCount;
}

// ── Build a single order card DOM element ──────────────────────────────────
function buildOrderCard(order) {
  const orderId    = order.order_id    ?? order.id           ?? order.orderId     ?? '—';
  const placedTime = order.placed_time ?? order.created_at   ?? order.placedAt    ?? order.timestamp ?? order.placed_at ?? '—';
  const status     = order.status      ?? order.order_status ?? order.orderStatus ?? order.state     ?? '—';

  const items =
    Array.isArray(order.pending_order_items) ? order.pending_order_items :
    Array.isArray(order.items)               ? order.items               :
    Array.isArray(order.order_items)         ? order.order_items         :
    Array.isArray(order.orderItems)          ? order.orderItems          :
    Array.isArray(order.line_items)          ? order.line_items          :
    Array.isArray(order.dishes)              ? order.dishes              : [];

  const card = document.createElement('div');
  card.className = 'order-card';
  card.dataset.orderId = orderId;

  // Header
  const header = document.createElement('div');
  header.className = 'order-header';
  header.innerText = `Order #${orderId}`;
  card.appendChild(header);

  // Meta
  const meta = document.createElement('div');
  meta.className = 'order-meta';
  meta.innerHTML = `
    Waitstaff: ${order.waitstaff_name} (ID: ${order.waitstaff_id})<br>
    Table: ${order.table}<br>
    Placed: ${placedTime}
  `;
  card.appendChild(meta);

  // Status badge
  const statusEl = document.createElement('div');
  statusEl.className =
    status === 'Pending' ? 'status-pending' :
    status === 'Ready'   ? 'status-ready'   : 'status-complete';
  statusEl.innerText = `Status: ${status}`;
  card.appendChild(statusEl);

  // Items
  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'items-container';

  items.forEach(item => {
    const el      = document.createElement('div');
    el.className  = 'item';
    const name    = item.name     ?? item.item_name ?? item.title ?? item.dish ?? '—';
    const course  = item.course   ?? item.category  ?? item.type  ?? item.section ?? '';
    const mods    = Array.isArray(item.modifiers)            ? item.modifiers            :
                    Array.isArray(item.modifications)        ? item.modifications        :
                    Array.isArray(item.options)              ? item.options              :
                    Array.isArray(item.extras)               ? item.extras               :
                    Array.isArray(item.special_instructions) ? item.special_instructions : [];
    const dietary = Array.isArray(item.dietary)              ? item.dietary              :
                    Array.isArray(item.dietary_restrictions) ? item.dietary_restrictions :
                    Array.isArray(item.allergens)            ? item.allergens            :
                    Array.isArray(item.flags)                ? item.flags                : [];

    el.innerHTML = `
      <div class="item-name">${name}${course ? ` <span class="course">(${course})</span>` : ''}</div>
      <div class="item-modifiers">${mods.length    > 0 ? `<strong>Modifiers:</strong> ${mods.join(', ')}`    : ''}</div>
      <div class="item-dietary">${dietary.length  > 0 ? `<strong>Dietary:</strong> ${dietary.join(', ')}` : ''}</div>
    `;
    itemsContainer.appendChild(el);
  });
  card.appendChild(itemsContainer);

  // ✓ Complete button
  const btn = document.createElement('button');
  btn.className = 'complete-btn';
  btn.innerText = '✓ Mark Complete';
  btn.addEventListener('click', () => {
    completedIds.add(String(orderId));
    saveCompleted();
    loadOrders();
  });
  card.appendChild(btn);

  return card;
}

// ── Main render loop ────────────────────────────────────────────────────────
async function loadOrders() {
  try {
    const ordersContainer    = document.getElementById('orders');
    const completedContainer = document.getElementById('completed-orders');
    if (!ordersContainer) { console.error("Missing <div id='orders'>"); return; }

    const orders = await fetch('/api/orders').then(r => r.json());

    const getId = o => String(o.order_id ?? o.id ?? o.orderId ?? '');
    const active    = orders.filter(o => !completedIds.has(getId(o)));
    const completed = orders.filter(o =>  completedIds.has(getId(o)));

    // Render active
    ordersContainer.innerHTML = '';
    active.forEach(o => ordersContainer.appendChild(buildOrderCard(o)));

    // Render completed (no button, greyed out)
    if (completedContainer) {
      completedContainer.innerHTML = '';
      completed.forEach(o => {
        const card = buildOrderCard(o);
        card.classList.add('completed');
        card.querySelector('.complete-btn')?.remove();
        completedContainer.appendChild(card);
      });
    }

    // Update counters
    updateStats(active, completed.length);

  } catch (err) {
    console.error('Error loading orders:', err);
  }
}

setInterval(loadOrders, 5000);
loadOrders();
