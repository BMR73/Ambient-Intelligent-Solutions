// AIS MVP Server
// Ambient Intelligent Solutions

import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// JSON file to store orders
const ORDERS_FILE = "orders.json";

// Ensure orders.json exists
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

// Helper: read all orders
function readOrders() {
  const data = fs.readFileSync(ORDERS_FILE, "utf8");
  return JSON.parse(data);
}

// Helper: write all orders
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

// POST /api/order — receives order_json STRING from ElevenLabs webhook
app.post("/api/order", (req, res) => {
  try {
    // Parse JSON string sent by ElevenLabs
    const incomingOrder = JSON.parse(req.body.order_json);

    // Generate kitchen language
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

// GET /api/order/latest — return the most recent order
app.get("/api/order/latest", (req, res) => {
  const orders = readOrders();
  const latest = orders.length > 0 ? orders[orders.length - 1] : {};
  res.json(latest);
});

// GET /api/orders — return all stored orders
app.get("/api/orders", (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AIS MVP server running on port ${PORT}`);
});
