// AIS MVP Server with JSON File Storage
// Ambient Intelligent Solutions

import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// Ensure orders.json exists
const ORDERS_FILE = "orders.json";

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

// POST /api/order — add a new order
app.post("/api/order", (req, res) => {
  const orders = readOrders();
  const newOrder = {
    id: orders.length + 1,
    timestamp: new Date().toISOString(),
    ...req.body
  };

  orders.push(newOrder);
  writeOrders(orders);

  console.log("Received order:", newOrder);
  res.json({ success: true, order: newOrder });
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
