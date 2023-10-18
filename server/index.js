const express = require('express');
const app = express();
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


//Integration of NLP - 1st attempt
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: '2022-04-07',
  authenticator: new IamAuthenticator({
    apikey: 'gx6kRGAf7X3a0A4y9WYcznh0WZlkPHEmDH6M5hIEal8c',
  }),
  serviceUrl: 'https://api.us-east.natural-language-understanding.watson.cloud.ibm.com/instances/4fe634a9-b7bc-41a6-b68b-a5ad7970fba4',
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/submit', (req, res) => {
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
  naturalLanguageUnderstanding.analyze(analyzeParams)
      .then(analysisResults => {
        res.render('results', { analysisResults }); // Render the results template
      })
      .catch(err => {
        console.log('error:', err);
        res.status(500).send('An error occurred during analysis.');
      });
});
