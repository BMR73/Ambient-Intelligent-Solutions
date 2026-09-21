// Fetch and display orders from the backend
async function loadOrders() {
  try {
    const response = await fetch('/api/orders');
    const orders = await response.json();

    const ordersContainer = document.getElementById('orders');
    ordersContainer.innerHTML = '';

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';

      // Header
      const header = document.createElement('div');
      header.className = 'order-header';
      header.innerText = `Order #${order.order_id}`;
      card.appendChild(header);

      // Meta info
      const meta = document.createElement('div');
      meta.className = 'order-meta';
      meta.innerHTML = `
        Waitstaff: ${order.waitstaff_name} (ID: ${order.waitstaff_id})<br>
        Table: ${order.table}<br>
        Placed: ${order.placed_time}
      `;
      card.appendChild(meta);

      // Status
      const status = document.createElement('div');
      status.className =
        order.status === 'Pending'
          ? 'status-pending'
          : order.status === 'Ready'
          ? 'status-ready'
          : 'status-complete';

      status.innerText = `Status: ${order.status}`;
      card.appendChild(status);

      // Items
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'items-container';

      order.pending_order_items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';

        itemElement.innerHTML = `
          <div class="item-name">
            ${item.name} <span class="course">(${item.course})</span>
          </div>

          <div class="item-modifiers">
            ${
              item.modifiers && item.modifiers.length > 0
                ? `<strong>Modifiers:</strong> ${item.modifiers.join(', ')}`
                : ''
            }
          </div>

          <div class="item-dietary">
            ${
              item.dietary && item.dietary.length > 0
                ? `<strong>Dietary:</strong> ${item.dietary.join(', ')}`
                : ''
            }
          </div>
        `;

        itemsContainer.appendChild(itemElement);
      });

      card.appendChild(itemsContainer);

      // Append card to page
      ordersContainer.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Auto-refresh every 5 seconds
setInterval(loadOrders, 5000);

// Initial load
loadOrders();
