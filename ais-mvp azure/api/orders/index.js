module.exports = async function (context, req) {
    const fs = require("fs");
    const path = require("path");
    const ordersPath = path.join(__dirname, "..", "..", "orders.json");

    let orders = [];
    if (fs.existsSync(ordersPath)) {
        orders = JSON.parse(fs.readFileSync(ordersPath, "utf8"));
    }

    context.res = {
        status: 200,
        body: orders
    };
};
