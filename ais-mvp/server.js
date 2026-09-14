// AIS MVP Server
// Ambient Intelligent Solutions

import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const ORDERS_FILE = "orders.json";

// Ensure orders.json exists
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

function readOrders() {
  const data = fs.readFileSync(ORDERS_FILE, "utf8");
  return JSON.parse(data);
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Kitchen language generator
function toKitchenLanguage(order) {
  if (!order || !order.items || !Array.isArray(order.items)) return [];

  return order.items.map(item => {
    let verb = "Prep";
    if (item.course === "entree") verb = "Fire";
    else if (item.course === "appetizer") verb = "Start";
    else if (item.course === "drink") verb = "Drink for";

    const base = `${verb} table ${order.table} — ${item.name}.`;

    const mods = item.modifiers?.length
      ? item.modifiers.map(m => `${m}.`).join(" ")
      : "";

    const dietary = item.dietary?.length
      ? `Allergy alert: ${item.dietary.join(", ")}.`
      : "";

    return `${base} ${mods} ${dietary}`.trim();
  });
}

// POST /api/order — webhook target
app.post("/api/order", (req, res) => {
  try {
    const incomingOrder = JSON.parse(req.body.order_json);
    const kitchenText = toKitchenLanguage(incomingOrder);

    const orders = readOrders();

    const newOrder = {
      id: orders.length + 1,
      received_at: new Date().toISOString(),
      kitchen_text: kitchenText,
      ...incomingOrder
    };

    orders.push(newOrder);
    writeOrders(orders);

    console.log("Received order:", newOrder);
    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("Failed to parse order_json:", err);
    res.status(400).json({ success: false, error: "Invalid JSON" });
  }
});

// GET /api/order/latest — most recent order
app.get("/api/order/latest", (req, res) => {
  const orders = readOrders();
  const latest = orders.length > 0 ? orders[orders.length - 1] : {};
  res.json(latest);
});

// GET /api/orders — full history
app.get("/api/orders", (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// POST /api/order/complete — remove an order by id
app.post("/api/order/complete", (req, res) => {
  const { id } = req.body;
  const orders = readOrders();

  const updated = orders.filter(order => order.id !== Number(id));
  writeOrders(updated);

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AIS MVP server running on port ${PORT}`);
});
