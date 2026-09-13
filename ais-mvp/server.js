// AIS MVP Server
// Ambient Intelligent Solutions
// This server receives JSON orders and serves a chef display webpage.

import express from "express";
import bodyParser from "body-parser";

const app = express();

// Parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the /public directory
app.use(express.static("public"));

// Store the latest order in memory
let currentOrder = {};

// Endpoint to receive an order (POST from ElevenLabs → your parser)
app.post("/api/order", (req, res) => {
  currentOrder = req.body;
  console.log("Received order:", currentOrder);
  res.json({ success: true });
});

// Endpoint for the chef UI to fetch the latest order
app.get("/api/order/latest", (req, res) => {
  res.json(currentOrder);
});

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`AIS MVP server running on port ${PORT}`);
});
