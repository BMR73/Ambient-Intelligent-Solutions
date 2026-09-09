module.exports = async function (context, req) {
    try {
        const newOrder = req.body;

        if (!newOrder) {
            context.res = {
                status: 400,
                body: { error: "No JSON body received." }
            };
            return;
        }

        // TEMPORARY FIX: Just return the order instead of writing a file
        context.res = {
            status: 200,
            body: {
                message: "Order received successfully.",
                order: newOrder
            }
        };

    } catch (error) {
        context.res = {
            status: 500,
            body: {
                error: "Failed to process order.",
                details: error.message
            }
        };
    }
};
