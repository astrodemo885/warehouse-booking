app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Warehouse Booking</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="font-family: Arial; padding: 20px;">
        <h1>Varaston varaus</h1>
        <p>Valitse tuote ja varaa 1 kpl.</p>

        <div id="items">Ladataan...</div>

        <script>
          async function loadItems() {
            const res = await fetch('/items');
            const items = await res.json();

            const container = document.getElementById('items');
            container.innerHTML = "";

            items.forEach(item => {
              const div = document.createElement('div');
              div.style.padding = "12px";
              div.style.marginBottom = "12px";
              div.style.border = "1px solid #ddd";
              div.style.borderRadius = "10px";

              div.innerHTML = \`
                <b>\${item.name}</b><br/>
                Varastossa: <b>\${item.stock}</b><br/><br/>
                <button style="padding:10px 14px" onclick="reserve(\${item.id})">Varaa 1 kpl</button>
              \`;

              container.appendChild(div);
            });
          }

          async function reserve(itemId) {
            const res = await fetch('/reserve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                itemId: itemId,
                qty: 1,
                customer: "Selain Asiakas"
              })
            });

            const data = await res.json();

            if (!res.ok) {
              alert("Virhe: " + (data.error || "Tuntematon"));
              return;
            }

            alert("Varaus tehty! Varaus ID: " + data.id);
            loadItems();
          }

          loadItems();
        </script>
      </body>
    </html>
  `);
});
