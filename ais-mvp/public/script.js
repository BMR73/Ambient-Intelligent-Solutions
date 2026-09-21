async function loadOrders() {
  try {
    const ordersContainer = document.getElementById('orders');
    if (!ordersContainer) {
      console.error("Chef page missing <div id='orders'>");
      return;
    }

    const response = await fetch('/api/orders');
    const orders = await response.json();

    // ── DEBUG: top-level order keys ───────────────────────────────────
    if (orders.length > 0) {
      console.log('[Chef] Order keys:', Object.keys(orders[0]));
      console.log('[Chef] First order (raw):', orders[0]);
    }

    ordersContainer.innerHTML = '';

    orders.forEach(order => {

      // ── Normalise top-level fields ────────────────────────────────────
      const orderId    = order.order_id    ?? order.id           ?? order.orderId     ?? '—';
      const placedTime = order.placed_time ?? order.created_at   ?? order.placedAt    ?? order.timestamp ?? order.placed_at ?? '—';
      const status     = order.status      ?? order.order_status ?? order.orderStatus ?? order.state     ?? '—';

      // ── Normalise items array — try every common field name ───────────
      const items =
        Array.isArray(order.pending_order_items) ? order.pending_order_items :
        Array.isArray(order.items)               ? order.items               :
        Array.isArray(order.order_items)         ? order.order_items         :
        Array.isArray(order.orderItems)          ? order.orderItems          :
        Array.isArray(order.line_items)          ? order.line_items          :
        Array.isArray(order.dishes)              ? order.dishes              :
        [];

      // ── DEBUG: item structure (only logs once per order) ──────────────
      if (items.length > 0) {
        console.log('[Chef] Item keys:', Object.keys(items[0]));
        console.log('[Chef] First item (raw):', items[0]);
      } else {
        console.warn('[Chef] No items found for order', orderId,
          '— checked: pending_order_items, items, order_items, orderItems, line_items, dishes');
      }

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

      items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';

        // Normalise item sub-fields
        const name    = item.name      ?? item.item_name ?? item.title       ?? item.dish     ?? '—';
        const course  = item.course    ?? item.category  ?? item.type        ?? item.section  ?? '';
        const mods    = Array.isArray(item.modifiers)           ? item.modifiers           :
                        Array.isArray(item.modifications)       ? item.modifications       :
                        Array.isArray(item.options)             ? item.options             :
                        Array.isArray(item.extras)              ? item.extras              :
                        Array.isArray(item.special_instructions)? item.special_instructions:
                        [];
        const dietary = Array.isArray(item.dietary)              ? item.dietary              :
                        Array.isArray(item.dietary_restrictions) ? item.dietary_restrictions :
                        Array.isArray(item.allergens)            ? item.allergens            :
                        Array.isArray(item.flags)                ? item.flags               :
                        [];

        itemElement.innerHTML = `
          <div class="item-name">
            ${name}${course ? ` <span class="course">(${course})</span>` : ''}
          </div>
          <div class="item-modifiers">
            ${mods.length    > 0 ? `<strong>Modifiers:</strong> ${mods.join(', ')}`    : ''}
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
