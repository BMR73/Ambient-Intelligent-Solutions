module.exports = async function (context, req) {
    context.log("Order received");

    const order = req.body;

    if (!order) {
        context.res = {
            status: 400,
            body: "No order data received"
        };
        return;
    }

    const fs = require("fs");
    const path = require("path");
    const ordersPath = path.join(__dirname, "..", "..", "orders.json");

    let orders = [];
    if (fs.existsSync(ordersPath)) {
        orders = JSON.parse(fs.readFileSync(ordersPath, "utf8"));
    }

    orders.push(order);

    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

    context.res = {
        status: 200,
        body: { message: "Order stored successfully", order }
    };
};

