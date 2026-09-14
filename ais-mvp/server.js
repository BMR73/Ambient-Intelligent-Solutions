const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

let currentOrder = null;

// Convert structured JSON into kitchen-friendly text
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

// Receive order from ElevenLabs
app.post("/api/order", (req, res) => {
  const incomingOrder = req.body;

  const kitchenText = toKitchenLanguage(incomingOrder);

  currentOrder = {
    ...incomingOrder,
    kitchen_text: kitchenText,
    received_at: new Date().toISOString()
  };

  console.log("Received order:", JSON.stringify(currentOrder, null, 2));

  res.json({ success: true });
});

// Serve latest order
app.get("/api/order/latest", (req, res) => {
  if (!currentOrder) {
    return res.json({ kitchen_text: [], received_at: null });
  }
  res.json(currentOrder);
});

// Serve chef page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Chef UI server running on port ${PORT}`);
});
