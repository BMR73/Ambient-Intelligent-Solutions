import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const ORDERS_FILE = "orders.json";

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

function readOrders() {
  return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

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

app.post("/api/order", (req, res) => {
  try {
    const incomingOrder = JSON.parse(req.body.order_json);
    const kitchenText = toKitchenLanguage(incomingOrder);

    const orders = readOrders();

    const newOrder = {
      id: orders.length + 1,
      received_at: new Date().toISOString(),
      kitchen_text: kitchenText,
      waitstaff_name: incomingOrder.waitstaff_name || null,
      ...incomingOrder
    };

    orders.push(newOrder);
    writeOrders(orders);

    res.json({ success: true, order: newOrder });
  } catch (err) {
    res.status(400).json({ success: false, error: "Invalid JSON" });
  }
});

app.get("/api/order/latest", (req, res) => {
  const orders = readOrders();
  res.json(orders.length > 0 ? orders[orders.length - 1] : {});
});

app.get("/api/orders", (req, res) => {
  res.json(readOrders());
});

app.post("/api/order/complete", (req, res) => {
  const { id } = req.body;
  const orders = readOrders();
  const updated = orders.filter(order => order.id !== Number(id));
  writeOrders(updated);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AIS server running on port ${PORT}`));
