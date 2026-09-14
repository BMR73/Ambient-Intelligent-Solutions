async function fetchLatestOrder() {
  const res = await fetch("/api/order/latest");
  const data = await res.json();
  renderLatestOrder(data);
}

async function fetchOrderHistory() {
  const res = await fetch("/api/orders");
  const data = await res.json();
  renderOrderHistory(data);
}

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.floor(diff / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  return min > 0 ? `${min} min ${sec} sec ago` : `${sec} sec ago`;
}

function agingClass(ts) {
  if (!ts) return "aging-0";
  const minutes = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (minutes >= 3) return "aging-3";
  if (minutes >= 2) return "aging-2";
  if (minutes >= 1) return "aging-1";
  return "aging-0";
}

function classifyVerb(line) {
  if (line.startsWith("Fire")) return "fire";
  if (line.startsWith("Start")) return "start";
  if (line.startsWith("Drink for")) return "drink";
  return "";
}

function hasAllergy(line) {
  return line.includes("Allergy alert");
}

function renderLatestOrder(order) {
  const orderContainer = document.getElementById("order");
  const waitstaffEl = document.getElementById("waitstaff");
  const tableEl = document.getElementById("table");
  const timestampEl = document.getElementById("timestamp");

  orderContainer.innerHTML = "";

  if (!order || !order.kitchen_text || order.kitchen_text.length === 0) {
    waitstaffEl.textContent = "Waitstaff: —";
    tableEl.textContent = "Table: —";
    timestampEl.textContent = "Placed: —";
    orderContainer.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  waitstaffEl.textContent = `Waitstaff: ${order.waitstaff_id}`;
  tableEl.textContent = `Table: ${order.table}`;
  timestampEl.textContent = `Placed: ${timeAgo(order.received_at)}`;

  order.kitchen_text.forEach(line => {
    const div = document.createElement("div");
    div.className = `order-line ${classifyVerb(line)} ${agingClass(order.received_at)}`;
    if (hasAllergy(line)) div.classList.add("allergy");
    div.textContent = line;
    orderContainer.appendChild(div);
  });
}

function renderOrderHistory(orders) {
  const historyEl = document.getElementById("order-history");
  historyEl.innerHTML = "";

  if (!orders || orders.length === 0) {
    historyEl.innerHTML = "<p>No previous orders.</p>";
    return;
  }

  orders.forEach(order => {
    const wrapper = document.createElement("div");
    wrapper.className = `history-order ${agingClass(order.received_at)}`;

    wrapper.innerHTML = `
      <div class="history-header">
        <strong>Order #${order.id}</strong>
        <span>Table ${order.table}</span>
        <span>Waitstaff ${order.waitstaff_id}</span>
        <span>${timeAgo(order.received_at)}</span>
      </div>
      <ul>
        ${order.kitchen_text.map(line => `
          <li class="${hasAllergy(line) ? "allergy" : ""}">${line}</li>
        `).join("")}
      </ul>
      <div class="history-controls">
        <label>
          <input type="checkbox" class="complete-checkbox" data-order-id="${order.id}">
          Complete
        </label>
      </div>
    `;

    historyEl.appendChild(wrapper);
  });

  document.querySelectorAll(".complete-checkbox").forEach(cb => {
    cb.addEventListener("change", () => {
      if (cb.checked) completeOrder(cb.dataset.orderId);
    });
  });
}

async function completeOrder(id) {
  await fetch("/api/order/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  fetchLatestOrder();
  fetchOrderHistory();
}

setInterval(fetchLatestOrder, 3000);
setInterval(fetchOrderHistory, 3000);
fetchLatestOrder();
fetchOrderHistory();
