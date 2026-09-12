const { app } = require("@azure/functions");

// Enable streaming (required for ElevenLabs)
app.setup({
  enableHttpStream: true
});

// Register functions
require("./functions/getLatestOrder");
require("./functions/orderUpdate");

module.exports = app;
