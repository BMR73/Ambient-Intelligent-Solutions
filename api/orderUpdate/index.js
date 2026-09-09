module.exports = async function (context, req) {
    try {
        const newOrder = req.body;

        if (!newOrder || !newOrder.table || !newOrder.table.number) {
            context.res = {
                status: 400,
                body: { error: "Order must include table.number." }
            };
            return;
        }

        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../order.json');

        let allOrders = {};

        if (fs.existsSync(filePath)) {
            allOrders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        // Store order under its table number
        const tableNum = newOrder.table.number;
        allOrders[tableNum] = newOrder;

        fs.writeFileSync(filePath, JSON.stringify(allOrders, null, 2));

        context.res = {
            status: 200,
            body: { message: "Order updated.", orders: allOrders }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: "Failed to update order.", details: error.message }
        };
    }
};
