const express = require('express');
const router = express.Router();

const { chat_response } = require('../controller/text');

router.post('/chat', chat_response);

module.exports = router;