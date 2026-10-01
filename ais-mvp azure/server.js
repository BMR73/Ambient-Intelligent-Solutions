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

// ---------- Create or Update Order (AIS-6.0) ----------
// ElevenLabs webhook sends:
// { "order_json": "<stringified AIS-6.0 JSON>" }

app.post("/api/order", (req, res) => {
  try {
    const raw = req.body.order_json;

    if (!raw) {
      return res.status(400).json({ error: "Missing order_json" });
    }

    // Parse AIS-6.0 JSON
    const parsed = JSON.parse(raw);

    const {
      waitstaff_id,
      waitstaff_name,
      table,
      pending_order_items,
      id: incomingId,          // optional AIS-provided ID
      order_id: incomingOrderId
    } = parsed.arguments;

    const orders = readOrders();

    // Determine order ID
    const resolvedId = incomingId || incomingOrderId || Date.now();

    // Check if this order already exists
    const existingIndex = orders.findIndex(o => String(o.id) === String(resolvedId));

    if (existingIndex !== -1) {
      // ---- UPDATE EXISTING ORDER ----
      const existing = orders[existingIndex];

      existing.waitstaff_id   = waitstaff_id   ?? existing.waitstaff_id;
      existing.waitstaff_name = waitstaff_name ?? existing.waitstaff_name;
      existing.table          = table          ?? existing.table;

      // Items stay the same — do NOT duplicate
      orders[existingIndex] = existing;

      writeOrders(orders);
      return res.json({ success: true, updated: existing });

    } else {
      // ---- CREATE NEW ORDER ----
      const newOrder = {
        id: resolvedId,
        waitstaff_id,
        waitstaff_name,
        table,
        items: pending_order_items,
        ready: false,
        ready_at: null,
        complete: false,
        created_at: new Date().toISOString()
      };

      orders.push(newOrder);
      writeOrders(orders);

      return res.json({ success: true, order: newOrder });
    }

  } catch (err) {
    console.error("Failed to parse AIS order:", err);
    res.status(400).json({ error: "Invalid AIS order JSON" });
  }
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
