const express = require('express');
const router = express.Router();

const { chat_response } = require('../controller/text');

router.post('/chat', chat_response);

router.get('/readiness_check', (req, res) => {
    res.status(200).json({ status: "success", message: "Server is ready to accept requests" });
});

module.exports = router;