async function fetchLatestOrder() {
  try {
    const res = await fetch("/api/order/latest");
    const data = await res.json();
    renderOrder(data);
  } catch (err) {
    console.error("Error fetching latest order:", err);
  }
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
    timestampEl.textContent = "Received: —";
    orderContainer.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  waitstaffEl.textContent = `Waitstaff: ${order.waitstaff_id || "Unknown"}`;
  tableEl.textContent = `Table: ${order.table ?? "Unknown"}`;
  timestampEl.textContent = `Received: ${order.received_at || "Unknown"}`;

  order.kitchen_text.forEach(line => {
    const div = document.createElement("div");
    const verbClass = classifyVerb(line);
    div.className = `order-line ${verbClass}`;
    if (hasAllergy(line)) {
      div.classList.add("allergy");
    }
    div.textContent = line;
    orderContainer.appendChild(div);
  });
}

// Poll every few seconds for new orders
setInterval(fetchLatestOrder, 3000);
fetchLatestOrder();
