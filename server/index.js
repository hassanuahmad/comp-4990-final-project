const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 3001;
const sql = require ('mssql');

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
        type: 'default',
    },
    options: {
        encrypt: true,
    },
};

// Function to check the database connection
async function checkDatabaseConnection() {
    try {
        await sql.connect(config);
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

// Call the function to check the database connection
checkDatabaseConnection();

// Routes
app.get('/', (req, res) => {
    res.render('index');
  });
  
  app.post("/submit", (req, res) => {
      const userInput = req.body.userInput;
      const userInputEncoded = encodeURIComponent(userInput);
  
      //SQL query to insert UserInput and retrieve the inserted ID
      const sqlQuery = `
          INSERT INTO dbo.UserInput (inputText, timestamp)
          OUTPUT INSERTED.id -- Retrieve the inserted ID
          VALUES (@inputText, GETDATE());
      `;
  
      const sqlParameters = [
          {
              name: 'inputText',
              type: sql.NVarChar,
              value: userInput,
          },
      ];
  
      const request = new sql.Request();
  
      sqlParameters.forEach((param) => {
          request.input(param.name, param.type, param.value);
      });
  
      request.query(sqlQuery)
          .then((result) => {
              // Check if the result contains the inserted ID
              if (result.recordset && result.recordset.length > 0) {
                  const inputID = result.recordset[0].id;
                  console.log('User input inserted successfully with ID:', inputID);
  
                  // Continue with NLP analysis
                  const analyzeParams = {
                      text: userInputEncoded,
                      features: {
                          emotion: {
                              document: true // Analyze the entire document for emotion
                          },
                          sentiment: {
                              document: true // Analyze the entire document for sentiment
                          },
                          keywords: { // Select and Analyze 10 keywords
                              emotion: true,
                              sentiment: true,
                              limit: 10,
                          },
                      },
                  };

                  let nlpResult;
  
                  naturalLanguageUnderstanding
                      .analyze(analyzeParams)
                      .then((analysisResults) => {
                          res.json(analysisResults); //Display NLP Result to Client
                          nlpResult = JSON.stringify(analysisResults);
                        
                          // Insert NLPResponse into the database
                          const insertNLPResponseQuery = `
                              INSERT INTO NLPResponse (UserInputID, NLPResult, Timestamp)
                              VALUES (@userInputID, @nlpResult, GETDATE());
                          `;
  
                          const nlpParameters = [
                              {
                                  name: 'userInputID',
                                  type: sql.Int,
                                  value: inputID, // ID of UserInput
                              },
                              {
                                  name: 'nlpResult',
                                  type: sql.NVarChar,
                                  value: nlpResult,
                              },
                          ];
  
                          const nlpRequest = new sql.Request();
  
                          nlpParameters.forEach((param) => {
                              nlpRequest.input(param.name, param.type, param.value);
                          });
  
                          nlpRequest.query(insertNLPResponseQuery)
                            .then(() => {
                            console.log('NLP response inserted successfully');
                              })
                              .catch((nlpError) => {
                                  console.log('NLP response insertion error:', nlpError);
                                  res.status(500).send('An error occurred during NLP response insertion.');
                              });
                      })
                      

                      .catch((analysisError) => {
                          console.log('Error during analysis:', analysisError);
                          res.status(500).send('An error occurred during analysis.');
                      });
              } else {
                  console.log('No UserInput records found in the result.recordset');
                  res.status(500).send('No UserInput records found for NLP response insertion.');
              }
          })
          .catch((dbError) => {
              console.log('Database insertion error:', dbError);
              res.status(500).send('An error occurred during database insertion.');
          });
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});