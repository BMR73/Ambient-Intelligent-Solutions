const { app } = require("@azure/functions");

app.http("getLatestOrder", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    return {
      jsonBody: {
        success: true,
        latestOrder: {
          id: "12345",
          item: "Example Item",
          timestamp: new Date().toISOString()
        }
      }
    };
  }
});
