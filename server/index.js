const express = require("express");

const PORT = process.env.PORT || 3000;

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World! from Express");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
