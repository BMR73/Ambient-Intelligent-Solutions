async function loadOrders() {
  try {
    const ordersContainer = document.getElementById('orders');
    if (!ordersContainer) {
      console.error("Chef page missing <div id='orders'>");
      return;
    }

    const response = await fetch('/api/orders');
    const orders = await response.json();

    // ── DEBUG: log actual field names from the API so you can verify them ──
    if (orders.length > 0) {
      console.log('[Chef] API field names on order object:', Object.keys(orders[0]));
      console.log('[Chef] First order (raw):', orders[0]);
    }

    ordersContainer.innerHTML = '';

    orders.forEach(order => {

      // ── Normalise field names — try every common variant ──────────────
      const orderId    = order.order_id    ?? order.id           ?? order.orderId     ?? '—';
      const placedTime = order.placed_time ?? order.created_at   ?? order.placedAt    ?? order.timestamp ?? order.placed_at ?? '—';
      const status     = order.status      ?? order.order_status ?? order.orderStatus ?? '—';

      // ── Card shell ────────────────────────────────────────────────────
      const card = document.createElement('div');
      card.className = 'order-card';

      const header = document.createElement('div');
      header.className = 'order-header';
      header.innerText = `Order #${orderId}`;
      card.appendChild(header);

      const meta = document.createElement('div');
      meta.className = 'order-meta';
      meta.innerHTML = `
        Waitstaff: ${order.waitstaff_name} (ID: ${order.waitstaff_id})<br>
        Table: ${order.table}<br>
        Placed: ${placedTime}
      `;
      card.appendChild(meta);

      const statusEl = document.createElement('div');
      statusEl.className =
        status === 'Pending' ? 'status-pending' :
        status === 'Ready'   ? 'status-ready'   :
        'status-complete';
      statusEl.innerText = `Status: ${status}`;
      card.appendChild(statusEl);

      // ── Items ─────────────────────────────────────────────────────────
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'items-container';

      const items = Array.isArray(order.pending_order_items)
        ? order.pending_order_items : [];

      items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';

        const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
        const dietary   = Array.isArray(item.dietary)   ? item.dietary   : [];

        itemElement.innerHTML = `
          <div class="item-name">
            ${item.name} <span class="course">(${item.course})</span>
          </div>
          <div class="item-modifiers">
            ${modifiers.length > 0 ? `<strong>Modifiers:</strong> ${modifiers.join(', ')}` : ''}
          </div>
          <div class="item-dietary">
            ${dietary.length > 0 ? `<strong>Dietary:</strong> ${dietary.join(', ')}` : ''}
          </div>
        `;

        itemsContainer.appendChild(itemElement);
      });

      card.appendChild(itemsContainer);
      ordersContainer.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

setInterval(loadOrders, 5000);
loadOrders();
