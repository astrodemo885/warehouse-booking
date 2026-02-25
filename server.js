const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("OK"));

let items = [
  { id: 1, name: "Trukki", stock: 5 },
  { id: 2, name: "Kuormalava", stock: 50 }
];

let reservations = [];

app.get("/items", (req, res) => {
  res.json(items);
});

app.post("/reserve", (req, res) => {
  const { itemId, qty, customer } = req.body;

  const item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Tuotetta ei löydy" });
  if (item.stock < qty) return res.status(400).json({ error: "Ei tarpeeksi varastossa" });

  item.stock -= qty;

  const reservation = {
    id: reservations.length + 1,
    itemId,
    qty,
    customer,
    status: "PENDING_PAYMENT"
  };
