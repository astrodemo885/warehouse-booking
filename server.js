'use strict';

const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("OK"));

app.get("/items", (req, res) => {
  res.json([
    { id: 1, name: "Trukki", stock: 5 },
    { id: 2, name: "Kuormalava", stock: 50 }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Listening on " + PORT);
});
