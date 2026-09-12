const { app } = require("@azure/functions");

app.http("orderUpdate", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req, context) => {
    context.log("POST /orderUpdate called");

    const body = await req.json();

    // Example response — replace with your real logic
    return {
      status: 200,
      jsonBody: {
        message: "Order updated successfully",
        received: body
      }
    };
  }
});

