module.exports = async function (context, req) {
    const order = require('../order.json');
    context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: order
    };
};
