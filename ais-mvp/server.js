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

// ---------- Create New Order ----------
app.post("/api/order", (req, res) => {
  const orders = readOrders();
  const newOrder = {
    id: Date.now(),
    waitstaff_id: req.body.waitstaff_id || null,
    waitstaff_name: req.body.waitstaff_name || null,
    table: req.body.table || null,
    items: req.body.items || [],
    ready: false,
    ready_at: null,
    complete: false,
    created_at: new Date().toISOString()
  };

  orders.push(newOrder);
  writeOrders(orders);

  res.json({ success: true, order: newOrder });
});

// ---------- Toggle Ready ----------
app.post("/api/order/ready", (req, res) => {
  const { id } = req.body;
  const orders = readOrders();

  const updated = orders.map(order => {
    if (order.id === Number(id)) {
      const nowReady = !order.ready;
      return {
        ...order,
        ready: nowReady,
        ready_at: nowReady ? new Date().toISOString() : null
      };
    }
    return order;
  });

  writeOrders(updated);
  res.json({ success: true });
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
