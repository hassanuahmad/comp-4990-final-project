const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 3001;

const NaturalLanguageUnderstandingV1 = require("ibm-watson/natural-language-understanding/v1");
const { IamAuthenticator } = require("ibm-watson/auth");

// Configurations
app.use(cors());
app.use(express.json()); // Use this to parse incoming JSON data

// IBM Watson NLP Setup
const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: "2022-04-07",
    authenticator: new IamAuthenticator({
        apikey: process.env.NLP_API_KEY,
    }),
    serviceUrl:
        "https://api.us-east.natural-language-understanding.watson.cloud.ibm.com/instances/4fe634a9-b7bc-41a6-b68b-a5ad7970fba4",
});

// Routes
app.get("/", (req, res) => {
    res.send("Hello, this is the NLP API server!");
});

app.post("/submit", (req, res) => {
    const userInput = req.body.userInput;
    const userInputEncoded = encodeURIComponent(userInput);

    // Define the analyzeParams using the user input
    const analyzeParams = {
        text: userInputEncoded,
        features: {
            entities: {
                emotion: true,
                sentiment: true,
                limit: 10,
            },
            keywords: {
                emotion: true,
                sentiment: true,
                limit: 10,
            },
        },
    };

    // Call NLU service to analyze the user input
    naturalLanguageUnderstanding
        .analyze(analyzeParams)
        .then((analysisResults) => {
            res.json(analysisResults);
        })
        .catch((err) => {
            console.log("error:", err);
            res.status(500).send("An error occurred during analysis.");
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
