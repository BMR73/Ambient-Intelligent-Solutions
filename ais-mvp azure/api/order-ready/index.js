module.exports = async function (context, req) {
    const fs = require("fs");
    const path = require("path");
    const ordersPath = path.join(__dirname, "..", "..", "orders.json");

    const { id } = req.body;

    if (!id) {
        context.res = {
            status: 400,
            body: "Order ID required"
        };
        return;
    }

    let orders = JSON.parse(fs.readFileSync(ordersPath, "utf8"));

    const order = orders.find(o => o.id === id);
    if (!order) {
        context.res = {
            status: 404,
            body: "Order not found"
        };
        return;
    }

    order.status = "ready";

    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

    context.res = {
        status: 200,
        body: { message: "Order marked ready", order }
    };
};

