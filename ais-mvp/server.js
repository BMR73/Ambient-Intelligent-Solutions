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
      pending_order_items
    } = parsed.arguments;

    const orders = readOrders();

    // Extract AIS order ID if present
    const incomingId = parsed.arguments.id || parsed.arguments.order_id || null;

    // If AIS didn't provide an ID, use the timestamp-based ID you already generate
    const generatedId = incomingId || Date.now();

    // Check if this order already exists
    const existingIndex = orders.findIndex(o => String(o.id) === String(generatedId));

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
        id: generatedId,
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
