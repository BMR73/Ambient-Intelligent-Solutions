async function fetchLatestOrder() {
  const res = await fetch("/api/order/latest");
  return await res.json();
}

async function fetchOrderHistory() {
  const res = await fetch("/api/orders");
  return await res.json();
}

function renderLatestOrder(order) {
  const container = document.getElementById("latest-order");

  if (!order || Object.keys(order).length === 0) {
    container.classList.add("empty");
    container.innerText = "Waiting for orders...";
    return;
  }

  container.classList.remove("empty");
  container.innerHTML = `
    <strong>Order #${order.id}</strong><br>
    Table: ${order.table}<br>
    Items: ${order.order.join(", ")}<br>
    Dietary: ${order.dietary.join(", ")}<br>
    <span class="timestamp">${order.timestamp}</span>
  `;
}

function renderOrderHistory(orders) {
  const container = document.getElementById("order-history");
  container.innerHTML = "";

  if (!orders || orders.length === 0) {
    container.innerHTML = `<p class="empty-history">No orders yet.</p>`;
    return;
  }

  orders.forEach(order => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <strong>Order #${order.id}</strong><br>
      Table: ${order.table}<br>
      Items: ${order.order.join(", ")}<br>
      Dietary: ${order.dietary.join(", ")}<br>
      <span class="timestamp">${order.timestamp}</span>
    `;
    container.appendChild(item);
  });
}

async function updateUI() {
  const latest = await fetchLatestOrder();
  const history = await fetchOrderHistory();

  renderLatestOrder(latest);
  renderOrderHistory(history);
}

setInterval(updateUI, 2000);
updateUI();
