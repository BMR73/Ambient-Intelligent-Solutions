// ── Persistent state in localStorage ───────────────────────────────────────
// completedIds: Set of order IDs marked complete (moved to completed section)
// orderStatuses: Map of orderId -> 'new' | 'prep' | 'ready'

const completedIds = new Set(
  JSON.parse(localStorage.getItem('chef_completed_ids') || '[]')
);
const orderStatuses = JSON.parse(
  localStorage.getItem('chef_order_statuses') || '{}'
);

function saveState() {
  localStorage.setItem('chef_completed_ids',    JSON.stringify([...completedIds]));
  localStorage.setItem('chef_order_statuses',   JSON.stringify(orderStatuses));
}

function setStatus(orderId, status) {
  orderStatuses[String(orderId)] = status;
  saveState();
  loadOrders();
}

function markComplete(orderId) {
  completedIds.add(String(orderId));
  delete orderStatuses[String(orderId)];
  saveState();
  loadOrders();
}

// ── Stat counter updater ────────────────────────────────────────────────────
function updateStats(activeOrders, completedCount) {
  let newCount = 0, prepCount = 0, readyCount = 0;

  activeOrders.forEach(o => {
    const id = String(o.order_id ?? o.id ?? o.orderId ?? '');
    const localStatus = orderStatuses[id] ?? 'new';
    if (localStatus === 'prep')  prepCount++;
    else if (localStatus === 'ready') readyCount++;
    else newCount++;
  });

  document.getElementById('stat-new').textContent   = newCount;
  document.getElementById('stat-prep').textContent  = prepCount;
  document.getElementById('stat-ready').textContent = readyCount;
  document.getElementById('stat-total').textContent = activeOrders.length + completedCount;
}

// ── Build a single order card ───────────────────────────────────────────────
function buildOrderCard(order, isCompleted = false) {
  const orderId    = String(order.order_id ?? order.id ?? order.orderId ?? '—');
  const placedTime = order.placed_time ?? order.created_at  ?? order.placedAt
                  ?? order.timestamp   ?? order.placed_at   ?? '—';
  const apiStatus  = order.status ?? order.order_status ?? order.orderStatus ?? order.state ?? '—';
  const localStatus = isCompleted ? 'complete' : (orderStatuses[orderId] ?? 'new');

  const items =
    Array.isArray(order.pending_order_items) ? order.pending_order_items :
    Array.isArray(order.items)               ? order.items               :
    Array.isArray(order.order_items)         ? order.order_items         :
    Array.isArray(order.orderItems)          ? order.orderItems          :
    Array.isArray(order.line_items)          ? order.line_items          :
    Array.isArray(order.dishes)              ? order.dishes              : [];

  // Card — colour-coded left border by local status
  const card = document.createElement('div');
  card.className = 'order-card' +
    (localStatus === 'prep'     ? ' status-prep'  :
     localStatus === 'ready'    ? ' status-ready' :
     isCompleted                ? ' completed'    : ' status-new');
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

  // Status badge (from API or local)
  const statusEl = document.createElement('div');
  statusEl.className = 'status-tag';
  statusEl.innerText =
    localStatus === 'prep'    ? 'In Preparation' :
    localStatus === 'ready'   ? 'Ready to Serve' :
    isCompleted               ? 'Completed'       :
    apiStatus !== '—'         ? apiStatus         : 'New';
  card.appendChild(statusEl);

  // Items list
  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'items-container';
  items.forEach(item => {
    const el     = document.createElement('div');
    el.className = 'item';
    const name   = item.name    ?? item.item_name ?? item.title ?? item.dish ?? '—';
    const course = item.course  ?? item.category  ?? item.type  ?? item.section ?? '';
    const mods   = Array.isArray(item.modifiers)            ? item.modifiers            :
                   Array.isArray(item.modifications)        ? item.modifications        :
                   Array.isArray(item.options)              ? item.options              :
                   Array.isArray(item.extras)               ? item.extras               :
                   Array.isArray(item.special_instructions) ? item.special_instructions : [];
    const diet   = Array.isArray(item.dietary)              ? item.dietary              :
                   Array.isArray(item.dietary_restrictions) ? item.dietary_restrictions :
                   Array.isArray(item.allergens)            ? item.allergens            :
                   Array.isArray(item.flags)                ? item.flags                : [];

    el.innerHTML = `
      <div class="item-name">${name}${course ? ` <span class="course">(${course})</span>` : ''}</div>
      <div class="item-modifiers">${mods.length > 0 ? `<strong>Modifiers:</strong> ${mods.join(', ')}` : ''}</div>
      <div class="item-dietary">${diet.length  > 0 ? `<strong>Dietary:</strong> ${diet.join(', ')}`   : ''}</div>
    `;
    itemsContainer.appendChild(el);
  });
  card.appendChild(itemsContainer);

  // ── 3 action buttons (active orders only) ────────────────────────────────
  if (!isCompleted) {
    const actions = document.createElement('div');
    actions.className = 'order-actions';

    // In Preparation
    const prepBtn = document.createElement('button');
    prepBtn.className = 'prep-btn' + (localStatus === 'prep' ? ' btn-active' : '');
    prepBtn.innerText = '🍳 In Prep';
    prepBtn.title = 'Mark as In Preparation';
    prepBtn.addEventListener('click', () => setStatus(orderId, 'prep'));
    actions.appendChild(prepBtn);

    // Ready to Serve
    const readyBtn = document.createElement('button');
    readyBtn.className = 'ready-btn' + (localStatus === 'ready' ? ' btn-active' : '');
    readyBtn.innerText = '🔔 Ready';
    readyBtn.title = 'Mark as Ready to Serve';
    readyBtn.addEventListener('click', () => setStatus(orderId, 'ready'));
    actions.appendChild(readyBtn);

    // Complete
    const completeBtn = document.createElement('button');
    completeBtn.className = 'complete-btn' + (localStatus === 'complete' ? ' btn-active' : '');
    completeBtn.innerText = '✓ Done';
    completeBtn.title = 'Mark as Complete — moves to Completed section';
    completeBtn.addEventListener('click', () => markComplete(orderId));
    actions.appendChild(completeBtn);

    card.appendChild(actions);
  }

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

    // Render active orders
    ordersContainer.innerHTML = '';
    active.forEach(o => ordersContainer.appendChild(buildOrderCard(o, false)));

    // Render completed orders (greyed, no buttons)
    if (completedContainer) {
      completedContainer.innerHTML = '';
      completed.forEach(o => completedContainer.appendChild(buildOrderCard(o, true)));
    }

    updateStats(active, completed.length);

  } catch (err) {
    console.error('Error loading orders:', err);
  }
}

setInterval(loadOrders, 5000);
loadOrders();
