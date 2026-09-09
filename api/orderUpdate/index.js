module.exports = async function (context, req) {
    try {
        const orderData = req.body;

        if (!orderData) {
            context.res = {
                status: 400,
                body: { error: "No JSON body received." }
            };
            return;
        }

        const fs = require('fs');
        const path = require('path');

        const filePath = path.join(__dirname, '../order.json');

        fs.writeFileSync(filePath, JSON.stringify(orderData, null, 2));

        context.res = {
            status: 200,
            body: { message: "Order updated successfully.", order: orderData }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: "Failed to update order.", details: error.message }
        };
    }
};
