"use strict";

const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/items", (req, res) => {
  res.json([
    { id: 1, name: "Trukki", stock: 5 },
    { id: 2, name: "Kuormalava", stock: 50 }
  ]);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
let reservations = [];

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

  reservations.push(reservation);
  res.json(reservation);
});

app.post("/pay/:id", (req, res) => {
  const reservation = reservations.find(r => r.id == req.params.id);
  if (!reservation) return res.status(404).json({ error: "Varausta ei löydy" });

  reservation.status = "PAID";
  res.json(reservation);
});

app.get("/reservations", (req, res) => {
  res.json(reservations);
});
