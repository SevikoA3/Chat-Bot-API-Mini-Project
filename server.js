require('dotenv').config();

const WA_Router = require('./routes/text_based');

const express = require('express');
const app = express();

app.use(express.json());

app.use(WA_Router);

const port = process.env.PORT;

try {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
} catch (error) {
    console.error("Failed to start the server: " + error.message);
}