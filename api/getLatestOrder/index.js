const fs = require("fs");
const path = require("path");

module.exports = async function (context, req) {
    const filePath = path.join(__dirname, "..", "shared", "order.json");

    try {
        const raw = fs.readFileSync(filePath, "utf8");
        const order = JSON.parse(raw);

        context.res = {
            status: 200,
            body: order
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: { error: err.message }
        };
    }
};
