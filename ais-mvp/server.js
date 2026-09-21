const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ORDERS_FILE = path.join(__dirname, "orders.json");

// ---------- Helpers ----------

function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    return [];
  }
}

function writeOrders(data) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2));
}

// ---------- Get Latest Order ----------

app.get("/api/order/latest", (req, res) => {
  const orders = readOrders();
  if (orders.length === 0) return res.json({});
  res.json(orders[orders.length - 1]);
});

// ---------- Get All Orders ----------

app.get("/api/orders", (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// ---------- Create New Order (AIS-6.0) ----------
// Accepts payloads from ElevenLabs function:
// {
//   "waitstaff_id": <number or string>,
//   "waitstaff_name": "<string>",
//   "table": <number or string>,
//   "pending_order_items": [
//     { "name": "<menu item>", "course": "<entree|appetizer|drink>", "modifiers": [], "dietary": [] }
//   ]
// }
app.post("/api/order", (req, res) => {
  const body = req.body;

  // Accept both "items" and "pending_order_items" from AIS-6.0
  const incomingItems = body.items || body.pending_order_items || [];

  // Normalize items into AIS-6.0 format
  const normalizedItems = incomingItems.map(item => ({
    name: item.name || null,
    course: item.course || null,
    modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
    dietary: Array.isArray(item.dietary) ? item.dietary : []
  }));

  const newOrder = {
    id: Date.now(),
    waitstaff_id: body.waitstaff_id !== undefined
      ? Number(body.waitstaff_id)
      : null,
    waitstaff_name: body.waitstaff_name || null,
    table: body.table !== undefined
      ? Number(body.table)
      : null,
    items: normalizedItems,
    ready: false,
    ready_at: null,
    complete: false,
    created_at: new Date().toISOString()
  };

  const orders = readOrders();
  orders.push(newOrder);
  writeOrders(orders);

  res.json({ success: true, order: newOrder });
});

// ---------- Toggle Ready ----------

app.post("/api/order/ready", (req, res) => {
  const { id } = req.body;
  const orders = readOrders();

  let updatedOrder = null;

  const updated = orders.map(order => {
    if (order.id === Number(id)) {
      const nowReady = !order.ready;
      updatedOrder = {
        ...order,
        ready: nowReady,
        ready_at: nowReady ? new Date().toISOString() : null
      };
      return updatedOrder;
    }
    return order;
  });

  writeOrders(updated);

  res.json(updatedOrder || { success: false });
});

// ---------- Mark Complete ----------

app.post("/api/order/complete", (req, res) => {
  const { id } = req.body;
  const orders = readOrders();

  const updated = orders.map(order =>
    order.id === Number(id)
      ? { ...order, complete: true }
      : order
  );

  writeOrders(updated);

  res.json({ success: true });
});

// ---------- Start Server ----------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
