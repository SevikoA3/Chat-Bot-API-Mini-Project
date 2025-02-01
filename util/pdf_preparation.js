const pdfParse = require("pdf-parse");
const fs = require("fs");
const lunr = require("lunr");

let paragraphs = [];

let idx = null;

async function extractPDF() {
  const pdfPath = "./assets/harrypotter.pdf";
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

function splitIntoParagraphs(text) {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
}

async function prepareLunrIndex() {
  console.log("Preparing LUNR index...");

  // Extract PDF text
  const pdfText = await extractPDF();
  paragraphs = splitIntoParagraphs(pdfText);
  console.log("Paragraph count:", paragraphs.length);

  // Build the Lunr index
  // - this.ref("id") => we reference each doc by "id"
  // - this.field("text") => we want to search the "text" field
  idx = lunr(function () {
    this.ref("id");
    this.field("text");

    // Add each paragraph as a document
    paragraphs.forEach((text, i) => {
      this.add({
        id: i.toString(),
        text,
      });
    });
  });

  console.log("LUNR index is ready!");
}

// 4) Search the Lunr index
function findRelevantSectionsLunr(query, topK = 3) {
    if (!idx) {
      console.error("LUNR index not built yet!");
      return [];
    }
  
    const results = idx.search(query); // returns array of { ref, score, ... }
  
    // If no results at all, return "no information"
    if (results.length === 0) {
      return [{ text: "no information", score: 0 }];
    }
  
    // 1) Find the best score among all results
    const bestScore = results[0].score;
  
    // 2) Define the confidence threshold at 80% of the best score
    const threshold = bestScore * 0.1;
  
    // 3) Filter results that meet or exceed that threshold,
    //    then take only the topK of those.
    const filtered = results
      .filter((r) => r.score >= threshold)
      .slice(0, topK);
  
    // If none surpass 80% of the top score, return "no information"
    if (filtered.length === 0) {
      return [{ text: "no information", score: 0 }];
    }
  
    // 4) Convert refs to paragraph text and return
    return filtered.map((r) => ({
      text: paragraphs[parseInt(r.ref, 10)],
      score: r.score,
    }));
}

module.exports = {
  prepareLunrIndex,
  findRelevantSectionsLunr,
};

// // NOT USED IN THE FINAL IMPLEMENTATION YET

// const fs = require("fs");
// const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
// const ModelClient = require("@azure-rest/ai-inference").default;
// const { AzureKeyCredential } = require("@azure/core-auth");
// const faiss = require("faiss-node");
// const path = require("path");
// const pdf = require("pdf-parse");
// const indexFile = path.join(__dirname, "faiss.index");

// const token = process.env.API_KEY;
// const endpoint = process.env.ENDPOINT;
// let index = new faiss.IndexFlatL2(1536);

// const extractPDF = async () => {
//     const pdf_path = "./assets/Kurikulum Bangkit 2024.pdf";
//     const dataBuffer = fs.readFileSync(pdf_path);
//     const data = await pdf(dataBuffer);
//     return data.text;
// }

// const splitTextIntoChunks = async (text) => {
//     const splitter = new RecursiveCharacterTextSplitter({
//         chunkSize: 512,
//         chunkOverlap: 50,
//     });

//     return await splitter.createDocuments([text]);
// }

// async function generateAzureEmbeddings(text) {
//     const client = ModelClient(
//         endpoint,
//         new AzureKeyCredential(token),
//     );

//     const response = await client.path("/embeddings").post({
//         body: {
//             input: [text],
//             model: "text-embedding-3-small"
//         }
//     });

//     if (response.status !== "200") {
//         throw new Error("Failed to generate embeddings: " + JSON.stringify(response.body));
//     }

//     return response.body.data[0].embedding;
// }

// async function storeEmbeddings(chunks) {
//     try {
//         await loadFAISSIndex();

//         console.log(`Storing embeddings for ${chunks.length} chunks...`);

//         for (let i = 0; i < chunks.length; i++) {
//             const chunk = chunks[i];
//             try {
//                 console.log(`Chunk #${i} text length: ${chunk.pageContent.length}`);

//                 // Generate embedding from Azure
//                 const embedding = await generateAzureEmbeddings(chunk.pageContent);
//                 console.log(`Chunk #${i} embedding dimension: ${embedding.length}`);

//                 // Convert plain JS array to typed Float32Array
//                 const floatVector = new Float32Array(embedding);

//                 // Add typed array to FAISS
//                 index.add([floatVector]);
//             } catch (error) {
//                 console.error(`Error on chunk #${i}:`, error.message);
//             }
//         }

//         await saveFAISSIndex();
//     } catch (error) {
//         console.error("Failed to store embeddings: " + error.message);
//     }
// }

// async function saveFAISSIndex() {
//     try {
//         const vectors = [];
//         for (let i = 0; i < index.ntotal; i++) {
//             vectors.push(index.reconstruct(i));  // Extract stored vectors
//         }
    
//         const data = {
//             vectors: vectors
//         };
    
//         fs.writeFileSync(indexFile, JSON.stringify(data));
//     } catch (error) {
//         console.error("Failed to save FAISS index: " + error.message);
//     }
// }

// async function loadFAISSIndex() {
//     try {
//         if (fs.existsSync(indexFile)) {
//             const rawData = fs.readFileSync(indexFile);
//             const data = JSON.parse(rawData);
    
//             for (const vector of data.vectors) {
//                 index.add([vector]);
//             }
//         }
//     } catch (error) {
//         console.error("Failed to load FAISS index: " + error.message);
//     }
// }

// async function findRelevantSections(query) {
//     try {
//         await loadFAISSIndex();
    
//         if (index.ntotal === 0) {
//             return [];
//         }
    
//         const k = Math.min(3, index.ntotal);
//         const queryVector = await generateAzureEmbeddings(query);
    
//         const result = index.search([queryVector], k);
//         return result.labels.map(label => label.metadata?.text ?? "");
//     } catch (error) {
//         console.error("Failed to find relevant sections: " + error.message);
//     }
// }

// async function preparePDF() {
//     try {
//         console.log("Preparing PDF...");
//         const text = await extractPDF();
//         const chunks = await splitTextIntoChunks(text);
//         console.log("Number of chunks:", chunks.length);
//         await storeEmbeddings(chunks);
//     } catch (error) {
//         console.error("Failed to prepare PDF: " + error.message);
//     }
// }

// module.exports = {
//     extractPDF,
//     splitTextIntoChunks,
//     storeEmbeddings,
//     findRelevantSections,
//     preparePDF
// };