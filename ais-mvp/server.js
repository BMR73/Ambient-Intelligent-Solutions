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
    // Determine the correct kitchen verb
    let verb = "Prep";
    if (item.course === "entree") verb = "Fire";
    else if (item.course === "appetizer") verb = "Start";
    else if (item.course === "drink") verb = "Drink for";

    // Base command
    const base = `${verb} table ${order.table} — ${item.name}.`;

    // Modifiers
    const mods = item.modifiers && item.modifiers.length > 0
      ? item.modifiers.map(m => `${m}.`).join(" ")
      : "";

    // Dietary restrictions
    const dietary = item.dietary && item.dietary.length > 0
      ? `Allergy alert: ${item.dietary.join(", ")}.`
      : "";

    return `${base} ${mods} ${dietary}`.trim();
  });
}

// Receive order from ElevenLabs / AIS
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

// Serve latest order to chef UI
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
