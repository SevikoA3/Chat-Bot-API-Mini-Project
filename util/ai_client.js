const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");
const { findRelevantSectionsLunr } = require("./pdf_preparation");

require("dotenv").config();

const token = process.env.API_KEY;
const endpoint = process.env.ENDPOINT;
const modelName = process.env.MODEL;

const chat = async (message) => {
    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    // const relevantSections = await findRelevantSections(message);
    // const context = relevantSections.join("\n\n");
    const topSections = findRelevantSectionsLunr(message, 3); 
    const context = topSections.map((s) => s.text).join("\n\n");
    console.log(context);
  
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role:"system", content: "You are a helpful assistant that only and only answer based on the following information:\n\n" + context },
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