const { app } = require("@azure/functions");

app.http("orderUpdate", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    const body = await request.json();

    return {
      jsonBody: {
        success: true,
        received: body
      }
    };
  }
});
