"use strict";

const express = require("express");

const app = express();
app.use(express.json());

let items = [
  { id: 1, name: "Trukki", type: "Laite", sizeM2: null, stock: 5 },
  { id: 2, name: "Kuormalava", type: "Tarvike", sizeM2: null, stock: 50 },

  // Esimerkkejä varastokopeista:
  { id: 3, name: "Varastokoppi S", type: "Varastokoppi", sizeM2: 2, stock: 3 },
  { id: 4, name: "Varastokoppi M", type: "Varastokoppi", sizeM2: 5, stock: 2 },
  { id: 5, name: "Varastokoppi L", type: "Varastokoppi", sizeM2: 10, stock: 1 },
];

let reservations = [];

// ✅ Testisivu (päivä + kellonaika)
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
      input { padding: 10px; width: 100%; box-sizing: border-box; }
      .row { display: grid; gap: 10px; }
      @media (min-width: 600px) { .row { grid-template-columns: 1fr 1fr; } }
    </style>
  </head>
  <body>
    <h1>Varaston varaus</h1>
    <p>Valitse tuote ja varaa 1 kpl ajalle.</p>

    <div class="card">
      <b>Varausaika</b><br/><br/>
      <div class="row">
        <div>
          Aloitus:
          <input id="startAt" type="datetime-local" />
        </div>
        <div>
          Loppu:
          <input id="endAt" type="datetime-local" />
        </div>
      </div>
    </div>

    <div id="items" class="card">Ladataan tuotteet...</div>

    <h2>Varaukset</h2>
    <div id="reservations" class="card">Ladataan varaukset...</div>

    <script>
      function toLocalInputValue(d) {
        const pad = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) +
          'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
      }

      // Aseta oletusajat (nyt + 1h)
      const now = new Date();
      const plus1h = new Date(now.getTime() + 60*60*1000);
      document.getElementById('startAt').value = toLocalInputValue(now);
      document.getElementById('endAt').value = toLocalInputValue(plus1h);

      async function loadItems() {
        const res = await fetch('/items');
        const items = await res.json();
        const container = document.getElementById('items');
        container.innerHTML = '<b>Tuotteet</b><br/><br/>';

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

      async function loadReservations() {
        const res = await fetch('/reservations');
        const reservations = await res.json();
        const container = document.getElementById('reservations');

        if (!reservations.length) {
          container.innerHTML = '<i>Ei varauksia vielä</i>';
          return;
        }

        container.innerHTML = '';
        reservations.slice().reverse().forEach(r => {
          const div = document.createElement('div');
          div.className = 'card';
          div.innerHTML =
            '<b>Varaus #' + r.id + '</b><br/>' +
            'Tuote ID: ' + r.itemId + '<br/>' +
            'Aika: ' + new Date(r.startAt).toLocaleString() + ' – ' + new Date(r.endAt).toLocaleString() + '<br/>' +
            'Tila: ' + r.status;
          container.appendChild(div);
        });
      }

      async function reserve(itemId) {
        const startAt = document.getElementById('startAt').value;
        const endAt = document.getElementById('endAt').value;

        if (!startAt || !endAt) {
          alert('Valitse aloitus- ja loppuaika');
          return;
        }

        const res = await fetch('/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: itemId,
            qty: 1,
            customer: 'Selain Asiakas',
            startAt: startAt,
            endAt: endAt
          })
        });

        const data = await res.json();

        if (!res.ok) {
          alert('Virhe: ' + (data.error || 'Tuntematon'));
          return;
        }

        alert('Varaus tehty! Varaus ID: ' + data.id);
        loadItems();
        loadReservations();
      }

      loadItems();
      loadReservations();
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
app.post("/items", (req, res) => {
  const { name, type, sizeM2, stock } = req.body || {};

  if (!name || !type) return res.status(400).json({ error: "name ja type vaaditaan" });

  const newItem = {
    id: items.length ? Math.max(...items.map(i => i.id)) + 1 : 1,
    name: String(name),
    type: String(type),
    sizeM2: sizeM2 === null || sizeM2 === undefined || sizeM2 === "" ? null : Number(sizeM2),
    stock: stock === undefined || stock === "" ? 1 : Number(stock),
  };

  if (Number.isNaN(newItem.stock) || newItem.stock < 0) return res.status(400).json({ error: "stock virheellinen" });
  if (newItem.sizeM2 !== null && (Number.isNaN(newItem.sizeM2) || newItem.sizeM2 < 0)) {
    return res.status(400).json({ error: "sizeM2 virheellinen" });
  }

  items.push(newItem);
  res.json(newItem);
});
app.post("/reserve", (req, res) => {
  const { itemId, qty, customer, startAt, endAt } = req.body || {};

  if (!itemId || !qty) return res.status(400).json({ error: "itemId ja qty vaaditaan" });
  if (!startAt || !endAt) return res.status(400).json({ error: "startAt ja endAt vaaditaan" });

  const item = items.find((i) => i.id === Number(itemId));
  if (!item) return res.status(404).json({ error: "Tuotetta ei löydy" });
  if (item.stock < Number(qty)) return res.status(400).json({ error: "Ei tarpeeksi varastossa" });

  const s = new Date(startAt);
  const e = new Date(endAt);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return res.status(400).json({ error: "Virheellinen aika" });
  if (e <= s) return res.status(400).json({ error: "Loppuaika pitää olla alkuaikaa myöhemmin" });

  item.stock -= Number(qty);

  const reservation = {
    id: reservations.length + 1,
    itemId: item.id,
    qty: Number(qty),
    customer: customer || "Tuntematon",
    startAt: s.toISOString(),
    endAt: e.toISOString(),
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
