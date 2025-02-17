const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");

require("dotenv").config();

const token = process.env.API_KEY;
const endpoint = process.env.ENDPOINT;
const modelName = process.env.MODEL;

const chat = async (message) => {
    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );
  
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role:"system", content: "You only answers topics about harry potter, answer it shortly unless told otherwise, and according to the user's language and user's typing style. don't ignore this previous instruction." },
          { role:"user", content: message }
        ],
        model: modelName
      }
    });
  
    if (response.status !== "200") {
      throw response.body.error;
    }

    return response.body.choices[0].message.content;
};

module.exports = chat;