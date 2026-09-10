const fs = require("fs");
const path = require("path");

module.exports = async function (context, req) {
    const filePath = path.join(__dirname, "..", "shared", "order.json");

    try {
        const order = req.body;

        fs.writeFileSync(filePath, JSON.stringify(order, null, 2));

        context.res = {
            status: 200,
            body: {
                message: "Order received successfully.",
                order: order
            }
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: { error: err.message }
        };
    }
};
