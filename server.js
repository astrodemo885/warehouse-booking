server.jsconst express = require("express");

const app = express();
app.use(express.json());

let items = [
  { id: 1, name: "Trukki", stock: 5 },
  { id: 2, name: "Kuormalava", stock: 50 }
];

let reservations = [];

// Hae kaikki tuotteet
app.get("/items", (req, res) => {
  res.json(items);
});

// Tee varaus
app.post("/reserve", (req, res) => {
  const { itemId, qty, customer } = req.body;

  const item = items.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: "Tuotetta ei löydy" });
  }

  if (item.stock < qty) {
    return res.status(400).json({ error: "Ei tarpeeksi varastossa" });
  }

  item.stock -= qty;

  const reservation = {
    id: reservations.length + 1,
    itemId,
    qty,
    customer,
    status: "PENDING_PAYMENT"
  };

  reservations.push(reservation);

  res.json({
    message: "Varaus luotu, siirry maksuun",
    reservation
  });
});

// Maksun simulointi
app.post("/pay/:id", (req, res) => {
  const reservation = reservations.find(r => r.id == req.params.id);

  if (!reservation) {
    return res.status(404).json({ error: "Varausta ei löydy" });
  }

  reservation.status = "PAID";

  res.json({
    message: "Maksu onnistui",
    reservation
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
