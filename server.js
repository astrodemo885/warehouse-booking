"use strict";

const express = require("express");

const app = express();
app.use(express.json());

let items = [
  { id: 1, name: "Trukki", stock: 5 },
  { id: 2, name: "Kuormalava", stock: 50 },
];

let reservations = [];

// ✅ Testisivu (ei backtick-sisäkkäisyyksiä)
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(
    `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Warehouse Booking</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; margin: 10px 0; }
      button { padding: 10px 14px; }
    </style>
  </head>
  <body>
    <h1>Varaston varaus</h1>
    <p>Valitse tuote ja varaa 1 kpl.</p>

    <div id="items">Ladataan...</div>

    <script>
      async function loadItems() {
        const res = await fetch('/items');
        const items = await res.json();
        const container = document.getElementById('items');
        container.innerHTML = '';

        items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'card';
          div.innerHTML =
            '<b>' + item.name + '</b><br/>' +
            'Varastossa: <b>' + item.stock + '</b><br/><br/>' +
            '<button onclick="reserve(' + item.id + ')">Varaa 1 kpl</button>';
          container.appendChild(div);
        });
      }

      async function reserve(itemId) {
        const res = await fetch('/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: itemId, qty: 1, customer: 'Selain Asiakas' })
        });

        const data = await res.json();

        if (!res.ok) {
          alert('Virhe: ' + (data.error || 'Tuntematon'));
          return;
        }

        alert('Varaus tehty! Varaus ID: ' + data.id);
        loadItems();
      }

      loadItems();
    </script>
  </body>
</html>
`.trim()
  );
});

// API:t
app.get("/items", (req, res) => {
  res.json(items);
});

app.post("/reserve", (req, res) => {
  const { itemId, qty, customer } = req.body || {};

  if (!itemId || !qty) return res.status(400).json({ error: "itemId ja qty vaaditaan" });

  const item = items.find((i) => i.id === Number(itemId));
  if (!item) return res.status(404).json({ error: "Tuotetta ei löydy" });
  if (item.stock < Number(qty)) return res.status(400).json({ error: "Ei tarpeeksi varastossa" });

  item.stock -= Number(qty);

  const reservation = {
    id: reservations.length + 1,
    itemId: item.id,
    qty: Number(qty),
    customer: customer || "Tuntematon",
    status: "PENDING_PAYMENT",
  };

  reservations.push(reservation);
  res.json(reservation);
});

app.get("/reservations", (req, res) => {
  res.json(reservations);
});

// Käynnistys
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
