const chat = require("../util/ai_client");

const chat_response = async (req, res) => {
    try {
        if (!req.body.message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const message = req.body.message;
        const response = await chat(message);
        res.status(200).json({
            status: "success",
            message: response,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { chat_response };