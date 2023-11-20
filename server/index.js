const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 3001;
const sql = require("mssql");

// Configurations
app.use(cors());
app.use(express.json()); // Use this to parse incoming JSON data

const NaturalLanguageUnderstandingV1 = require("ibm-watson/natural-language-understanding/v1");
const { IamAuthenticator } = require("ibm-watson/auth");

// IBM Watson NLP Setup
const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: "2022-04-07",
    authenticator: new IamAuthenticator({
        apikey: process.env.NLP_API_KEY,
    }),
    serviceUrl:
        "https://api.us-east.natural-language-understanding.watson.cloud.ibm.com/instances/4fe634a9-b7bc-41a6-b68b-a5ad7970fba4",
});

// SQL Daqtabase Setup NM
const DB_USER = process.env.DB_USER;
const DB_SERVER = process.env.DB_SERVER;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: 1433,
    database: process.env.DB_NAME,

    authentication: {
        type: "default",
    },
    options: {
        encrypt: true,
    },
};

// Function to check the database connection
async function checkDatabaseConnection() {
    try {
        await sql.connect(config);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
}

// Call the function to check the database connection
checkDatabaseConnection();

// Routes
app.get("/", (req, res) => {
    res.render("index");
});

app.post("/submit", async (req, res) => {
    try {
        const userId = req.body.userId;
        const userInput = req.body.userInput;
        const userInputEncoded = encodeURIComponent(userInput);

        // Insert UserInput into the database
        const inputID = await insertUserInput(userInput, userId);

        if (inputID) {
            // Perform NLP analysis
            const analysisResults = await performNLPAnalysis(userInputEncoded);

            if (analysisResults) {
                const nlpResult = JSON.stringify(analysisResults);

                // Insert NLPResponse into the database
                const responseID = await insertNLPResponse(
                    inputID,
                    nlpResult,
                    userId
                );

                if (responseID) {
                    // Insert emotion data into DocumentEmotion table
                    const emotionData =
                        analysisResults.result.emotion.document.emotion;
                    await insertEmotionData(responseID, emotionData);

                    // Insert sentiment data into DocumentSentiment table
                    const sentimentData =
                        analysisResults.result.sentiment.document;
                    await insertSentimentData(responseID, sentimentData);

                    // Insert keyword analysis into KeywordAnalysis table
                    const keywordData = analysisResults.result.keywords;
                    await insertKeywordAnalysis(responseID, keywordData);

                    res.json({ inputID, analysisResults });
                } else {
                    console.error(
                        "An error occurred during NLP response insertion."
                    );
                    res.status(500).send(
                        "An error occurred during NLP response insertion."
                    );
                }
            } else {
                console.error("An error occurred NLP analysis.");
                res.status(500).send("An error occurred during NLP analysis.");
            }
        } else {
            console.error("An error occurred during UserInput insertion.");
            res.status(500).send(
                "An error occurred during UserInput insertion."
            );
        }
    } catch (error) {
        console.error("Unhandled error:", error);
        res.status(500).send("An unexpected error occurred.");
    }
});

// INSERTION INTO UserInput Table
async function insertUserInput(userInput, userId) {
    // Include userId as a parameter
    try {
        const sqlQuery = `
            INSERT INTO dbo.UserInput (inputText, userId, timestamp)
            OUTPUT INSERTED.id
            VALUES (@inputText, @userId, GETDATE());
        `;

        const sqlParameters = [
            { name: "inputText", type: sql.NVarChar, value: userInput },
            { name: "userId", type: sql.NVarChar, value: userId },
        ];
        const request = new sql.Request();

        sqlParameters.forEach((param) => {
            request.input(param.name, param.type, param.value);
        });

        const result = await request.query(sqlQuery);
        const insertedId =
            result.recordset.length > 0 ? result.recordset[0].id : null;

        if (insertedId) {
            console.log(
                "User input inserted successfully with ID:",
                insertedId
            );
        } else {
            console.error("Error inserting user input into the database");
        }

        return insertedId;
    } catch (error) {
        console.error("Error inserting user input:", error);
        throw error;
    }
}

//PERFORM NLP ANALYSIS
async function performNLPAnalysis(userInputEncoded) {
    const analyzeParams = {
        text: userInputEncoded,
        features: {
            emotion: {
                document: true,
            },
            sentiment: {
                document: true,
            },
            keywords: {
                emotion: true,
                sentiment: true,
                limit: 25,
            },
        },
    };

    return await naturalLanguageUnderstanding.analyze(analyzeParams);
}

// INSERTION INTO NPResponse Table
async function insertNLPResponse(inputID, nlpResult, userId) {
    try {
        const insertNLPResponseQuery = `
            INSERT INTO NLPResponse (UserInputID, NLPResult, userId, Timestamp)
            OUTPUT INSERTED.ResponseID
            VALUES (@userInputID, @nlpResult, @userId, GETDATE());
        `;

        const nlpParameters = [
            { name: "userInputID", type: sql.Int, value: inputID },
            { name: "nlpResult", type: sql.NVarChar, value: nlpResult },
            {
                name: "userId",
                type: sql.NVarChar(200),
                value: userId.toString(),
            },
        ];

        const nlpRequest = new sql.Request();

        // Set input parameters
        nlpParameters.forEach((param) => {
            nlpRequest.input(param.name, param.type, param.value);
        });

        // Execute query
        const result = await nlpRequest.query(insertNLPResponseQuery);

        // Check if the insertion was successful
        if (result.recordset.length > 0) {
            const responseID = result.recordset[0].ResponseID;
            console.log(
                "NLP response inserted successfully with ID:",
                responseID
            );
            return responseID;
        } else {
            console.error("Failed to get NLP response ID after insertion.");
            return null;
        }
    } catch (error) {
        console.error("Error inserting NLP response:", error);
        throw error;
    }
}

// INSERTION INTO DocumentEmotion Table
async function insertEmotionData(responseID, emotionData) {
    try {
        const insertEmotionQuery = `
            INSERT INTO DocumentEmotion (Sadness, Joy, Fear, Disgust, Anger, ResponseID)
            VALUES ( @Sadness, @Joy, @Fear, @Disgust, @Anger, @ResponseID);
        `;

        const emotionParameters = [
            { name: "Sadness", type: sql.Float, value: emotionData.sadness },
            { name: "Joy", type: sql.Float, value: emotionData.joy },
            { name: "Fear", type: sql.Float, value: emotionData.fear },
            { name: "Disgust", type: sql.Float, value: emotionData.disgust },
            { name: "Anger", type: sql.Float, value: emotionData.anger },
            { name: "ResponseID", type: sql.Int, value: responseID },
        ];

        const emotionRequest = new sql.Request();

        emotionParameters.forEach((param) => {
            emotionRequest.input(param.name, param.type, param.value);
        });

        await emotionRequest.query(insertEmotionQuery);
        console.log("Emotion data inserted successfully");
    } catch (error) {
        console.error("Error inserting emotion data:", error);
        throw error;
    }
}

// INSERTION INTO DocumentSentiment Table
async function insertSentimentData(responseID, sentimentData) {
    try {
        const insertSentimentQuery = `
            INSERT INTO DocumentSentiment (score, label, ResponseID)
            VALUES (@score, @label, @ResponseID);
        `;

        const sentimentParameters = [
            { name: "score", type: sql.Float, value: sentimentData.score },
            { name: "label", type: sql.NVarChar, value: sentimentData.label },
            { name: "responseID", type: sql.Int, value: responseID },
        ];

        const sentimentRequest = new sql.Request();

        sentimentParameters.forEach((param) => {
            sentimentRequest.input(param.name, param.type, param.value);
        });

        await sentimentRequest.query(insertSentimentQuery);
        console.log("Sentiment data inserted successfully");
    } catch (error) {
        console.error("Error inserting sentiment data:", error);
        throw error;
    }
}

// INSERTION INTO KeywordAnalysis Table
async function insertKeywordAnalysis(responseID, keywords) {
    try {
        const insertKeywordAnalysisQuery = `
            INSERT INTO KeywordAnalysis (Text, SentimentScore, SentimentLabel, Relevance, Sadness, Joy, Fear, Disgust, Anger, Count, ResponseID)
            VALUES (@Text, @SentimentScore, @SentimentLabel, @Relevance, @Sadness, @Joy, @Fear, @Disgust, @Anger, @Count, @ResponseID);
        `;

        const keywordRequest = new sql.Request();

        for (const keyword of keywords) {
            const keywordParameters = [
                { name: "Text", type: sql.NVarChar, value: keyword.text },
                {
                    name: "SentimentScore",
                    type: sql.Float,
                    value: keyword.sentiment.score,
                },
                {
                    name: "SentimentLabel",
                    type: sql.NVarChar,
                    value: keyword.sentiment.label,
                },
                {
                    name: "Relevance",
                    type: sql.Float,
                    value: keyword.relevance,
                },
                {
                    name: "Sadness",
                    type: sql.Float,
                    value: keyword.emotion ? keyword.emotion.sadness : null,
                },
                {
                    name: "Joy",
                    type: sql.Float,
                    value: keyword.emotion ? keyword.emotion.joy : null,
                },
                {
                    name: "Fear",
                    type: sql.Float,
                    value: keyword.emotion ? keyword.emotion.fear : null,
                },
                {
                    name: "Disgust",
                    type: sql.Float,
                    value: keyword.emotion ? keyword.emotion.disgust : null,
                },
                {
                    name: "Anger",
                    type: sql.Float,
                    value: keyword.emotion ? keyword.emotion.anger : null,
                },
                { name: "Count", type: sql.Int, value: keyword.count },
                { name: "ResponseID", type: sql.Int, value: responseID },
            ];

            keywordRequest.parameters = []; // Reset parameters array

            keywordParameters.forEach((param) => {
                keywordRequest.input(param.name, param.type, param.value);
            });

            await keywordRequest.query(insertKeywordAnalysisQuery);
        }

        console.log("Keyword analysis inserted successfully");
    } catch (error) {
        console.error("Error inserting keyword analysis:", error);
        throw error;
    }
}

// GET all user inputs
// GET all user inputs for a specific user
app.get("/user-inputs/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const sqlQuery = `
            SELECT * FROM UserInput
            WHERE userId = @userId;
        `;

        const request = new sql.Request();
        request.input("userId", sql.NVarChar, userId);

        const result = await request.query(sqlQuery);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching user inputs for user:", error);
        res.status(500).send("Error fetching user inputs for user.");
    }
});

// GET details for a specific user input
app.get("/user-input/:id", async (req, res) => {
    const inputID = req.params.id;

    try {
        // Updated SQL query to perform a join
        const sqlQuery = `
            SELECT NLPResponse.*, UserInput.inputText 
            FROM NLPResponse 
            JOIN UserInput ON NLPResponse.UserInputID = UserInput.id
            WHERE NLPResponse.UserInputID = @inputID;
        `;

        const request = new sql.Request();
        request.input("inputID", sql.Int, inputID);

        const result = await request.query(sqlQuery);

        // Check if any data is returned
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send("No data found for the given input ID.");
        }
    } catch (error) {
        console.error("Error fetching input details:", error);
        res.status(500).send("Error fetching input details.");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
