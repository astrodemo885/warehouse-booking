"use strict";

const express = require("express");
const app = express();
app.use(express.json());

let items = [
  { id: 1, name: "Trukki", type: "Laite", sizeM2: null, stock: 5 },
  { id: 2, name: "Kuormalava", type: "Tarvike", sizeM2: null, stock: 50 },
  { id: 3, name: "Varastokoppi S", type: "Varastokoppi", sizeM2: 2, stock: 3 },
  { id: 4, name: "Varastokoppi M", type: "Varastokoppi", sizeM2: 5, stock: 2 },
  { id: 5, name: "Varastokoppi L", type: "Varastokoppi", sizeM2: 10, stock: 1 },
];

let reservations = [];

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Warehouse</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial; padding: 20px; }
          .card { border:1px solid #ddd; padding:12px; margin:10px 0; border-radius:10px; }
          button { padding:8px 12px; }
          input { padding:8px; width:100%; margin:5px 0; }
        </style>
      </head>
      <body>
        <h1>Varaston varaus</h1>

        <h3>Lisää uusi tuote</h3>
        <div class="card">
          <input id="name" placeholder="Nimi" />
          <input id="type" placeholder="Tyyppi" />
          <input id="size" type="number" placeholder="Koko m2 (valinnainen)" />
          <input id="stock" type="number" value="1" />
          <button onclick="addItem()">Lisää</button>
        </div>

        <h3>Tuotteet</h3>
        <div id="items"></div>

        <h3>Varaukset</h3>
        <div id="reservations"></div>

        <script>
          async function loadItems() {
            const res = await fetch('/items');
            const items = await res.json();
            const el = document.getElementById('items');
            el.innerHTML = "";
            items.forEach(i => {
              el.innerHTML += "<div class='card'><b>"+i.name+"</b><br/>Tyyppi: "+i.type+"<br/>Varastossa: "+i.stock+"<br/><button onclick='reserve("+i.id+")'>Varaa</button></div>";
            });
          }

          async function loadReservations() {
            const res = await fetch('/reservations');
            const data = await res.json();
            const el = document.getElementById('reservations');
            el.innerHTML = "";
            data.forEach(r => {
              el.innerHTML += "<div class='card'>Varaus #"+r.id+" | Tuote: "+r.itemId+"</div>";
            });
          }

          async function reserve(id) {
            await fetch('/reserve', {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body: JSON.stringify({
                itemId:id,
                qty:1,
                startAt:new Date().toISOString(),
                endAt:new Date(Date.now()+3600000).toISOString()
              })
            });
            loadItems();
            loadReservations();
          }

          async function addItem() {
            await fetch('/items', {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body: JSON.stringify({
                name:document.getElementById('name').value,
                type:document.getElementById('type').value,
                sizeM2:document.getElementById('size').value,
                stock:document.getElementById('stock').value
              })
            });
            loadItems();
          }

          loadItems();
          loadReservations();
        </script>
      </body>
    </html>
  `);
});

app.get("/items", (req, res) => res.json(items));

app.post("/items", (req, res) => {
  const { name, type, sizeM2, stock } = req.body;
  if (!name || !type) return res.status(400).json({ error: "name ja type vaaditaan" });

  items.push({
    id: items.length + 1,
    name,
    type,
    sizeM2: sizeM2 ? Number(sizeM2) : null,
    stock: Number(stock) || 1
  });

  res.json({ success:true });
});

app.post("/reserve", (req, res) => {
  const { itemId, qty, startAt, endAt } = req.body;
  const item = items.find(i => i.id === Number(itemId));
  if (!item) return res.status(404).json({ error:"Ei löydy" });
  if (item.stock < qty) return res.status(400).json({ error:"Ei tarpeeksi varastossa" });

  item.stock -= qty;

  reservations.push({
    id: reservations.length+1,
    itemId,
    qty,
    startAt,
    endAt
  });

  res.json({ success:true });
});

app.get("/reservations", (req, res) => res.json(reservations));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
