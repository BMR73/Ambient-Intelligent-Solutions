const { app } = require("@azure/functions");

app.http("getLatestOrder", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req, context) => {
    context.log("GET /getLatestOrder called");

    return {
      status: 200,
      jsonBody: {
        orderId: "12345",
        status: "Processing",
        timestamp: new Date().toISOString()
      }
    };
  }
});
