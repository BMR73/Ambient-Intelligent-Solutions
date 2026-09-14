async function fetchLatestOrder() {
  try {
    const res = await fetch("/api/order/latest");
    const data = await res.json();
    renderOrder(data);
  } catch (err) {
    console.error("Error fetching latest order:", err);
  }
}

function timeAgo(timestamp) {
  if (!timestamp) return "—";
  const now = Date.now();
  const placed = new Date(timestamp).getTime();
  const diffMs = now - placed;
  const diffMin = Math.floor(diffMs / 60000);
  const diffSec = Math.floor((diffMs % 60000) / 1000);

  if (diffMin > 0) return `${diffMin} min ${diffSec} sec ago`;
  return `${diffSec} sec ago`;
}

function agingClass(timestamp) {
  if (!timestamp) return "aging-0";
  const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
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

function renderOrder(order) {
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

  waitstaffEl.textContent = `Waitstaff: ${order.waitstaff_id || "Unknown"}`;
  tableEl.textContent = `Table: ${order.table ?? "Unknown"}`;
  timestampEl.textContent = `Placed: ${timeAgo(order.received_at)}`;

  order.kitchen_text.forEach(line => {
    const div = document.createElement("div");
    const verbClass = classifyVerb(line);
    div.className = `order-line ${verbClass} ${agingClass(order.received_at)}`;
    if (hasAllergy(line)) {
      div.classList.add("allergy");
    }
    div.textContent = line;
    orderContainer.appendChild(div);
  });
}

setInterval(fetchLatestOrder, 3000);
fetchLatestOrder();
