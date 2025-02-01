require('dotenv').config();

const WA_Router = require('./routes/text_based');
const { prepareLunrIndex } = require("./util/pdf_preparation");

const express = require('express');
const app = express();

app.use(express.json());

app.use(WA_Router);

const port = process.env.PORT;

prepareLunrIndex()
.then(() => {
  // 2) Start the server once the index is ready
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
})
.catch((error) => {
  console.error("Failed to prepare Lunr index: " + error.message);
});

// not using preparePDF() yet
// preparePDF().then(() => {
//     app.listen(port, () => {
//         console.log(`Server is running on port ${port}`);
//     });
// }).catch((error) => {
//     console.error("Failed to prepare PDF: " + error.message);
// });