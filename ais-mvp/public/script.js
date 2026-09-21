async function loadOrders() {
  try {
    const ordersContainer = document.getElementById('orders');
    if (!ordersContainer) {
      console.error("Chef page missing <div id='orders'>");
      return;
    }

    const response = await fetch('/api/orders');
    const orders = await response.json();

    ordersContainer.innerHTML = '';

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';

      const header = document.createElement('div');
      header.className = 'order-header';
      header.innerText = `Order #${order.order_id}`;
      card.appendChild(header);

      const meta = document.createElement('div');
      meta.className = 'order-meta';
      meta.innerHTML = `
        Waitstaff: ${order.waitstaff_name} (ID: ${order.waitstaff_id})<br>
        Table: ${order.table}<br>
        Placed: ${order.placed_time}
      `;
      card.appendChild(meta);

      const status = document.createElement('div');
      status.className =
        order.status === 'Pending'
          ? 'status-pending'
          : order.status === 'Ready'
          ? 'status-ready'
          : 'status-complete';
      status.innerText = `Status: ${order.status}`;
      card.appendChild(status);

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'items-container';

      const items = Array.isArray(order.pending_order_items)
        ? order.pending_order_items
        : [];

      items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';

        const modifiers = Array.isArray(item.modifiers)
          ? item.modifiers
          : [];
        const dietary = Array.isArray(item.dietary)
          ? item.dietary
          : [];

        itemElement.innerHTML = `
          <div class="item-name">
            ${item.name} <span class="course">(${item.course})</span>
          </div>

          <div class="item-modifiers">
            ${
              modifiers.length > 0
                ? `<strong>Modifiers:</strong> ${modifiers.join(', ')}`
                : ''
            }
          </div>

          <div class="item-dietary">
            ${
              dietary.length > 0
                ? `<strong>Dietary:</strong> ${dietary.join(', ')}`
                : ''
            }
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
