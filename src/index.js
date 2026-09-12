const { app } = require("@azure/functions");

app.setup({ enableHttpStream: true });

require("./functions/getLatestOrder");
require("./functions/orderUpdate");
