module.exports = async function (context, req) {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../order.json');

    if (!fs.existsSync(filePath)) {
        context.res = {
            status: 200,
            body: {}
        };
        return;
    }

    const allOrders = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    context.res = {
        status: 200,
        body: allOrders
    };
};
