import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// Serve static files from /public
app.use(express.static("public"));

// Store the latest order in memory
let currentOrder = {};

// Receive order JSON from ElevenLabs → your parser
app.post("/api/order", (req, res) => {
  currentOrder = req.body;
  console.log("Received order:", currentOrder);
  res.json({ success: true });
});

// Chef UI polls this endpoint
app.get("/api/order/latest", (req, res) => {
  res.json(currentOrder);
});

// Render injects PORT automatically
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AIS MVP running on port ${PORT}`);
});

