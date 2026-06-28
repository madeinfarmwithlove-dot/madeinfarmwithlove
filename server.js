const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory and orders file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([]), 'utf8');
}

let storeConfig = {
  whatsappNumber: "919876543210",
  brandName: "Made in Farm",
  currency: "₹"
};

const productsCatalog = [
  {
    id: "cashews",
    name: "Royal King Cashews",
    tagline: "Whole jumbo W240 grade cashews, buttery & crisp.",
    organic: true,
    image: "images/cashews.jpg",
    prices: { "250g": 380, "500g": 720, "1kg": 1400 }
  },
  {
    id: "almonds",
    name: "Mammoth California Almonds",
    tagline: "Crunchy, high-protein organic raw almonds.",
    organic: true,
    image: "images/almonds.jpg",
    prices: { "250g": 320, "500g": 620, "1kg": 1200 }
  },
  {
    id: "walnuts",
    name: "Mountain Harvest Walnuts",
    tagline: "Rich in Omega-3, soft Chilean halves.",
    organic: false,
    image: "images/walnuts.jpg",
    prices: { "250g": 360, "500g": 690, "1kg": 1350 }
  },
  {
    id: "pistachios",
    name: "Roasted Salted Pistachios",
    tagline: "Premium Iranian green pistachios in light sea salt.",
    organic: false,
    image: "images/pistachios.jpg",
    prices: { "250g": 410, "500g": 790, "1kg": 1550 }
  },
  {
    id: "raisins",
    name: "Sun-Dried Golden Raisins",
    tagline: "Naturally sweet Afghan golden raisins.",
    organic: false,
    image: "images/raisins.jpg",
    video: "images/raisins.mp4",
    prices: { "250g": 180, "500g": 340, "1kg": 650 }
  },
  {
    id: "dates",
    name: "Royal Medjool Dates",
    tagline: "Soft, caramel-like organic handpicked dates.",
    organic: true,
    image: "images/dates.jpg",
    prices: { "250g": 450, "500g": 880, "1kg": 1700 }
  }
];

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/products' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, products: productsCatalog, storeConfig }));
    return;
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { customer, items, totalAmount } = payload;
        
        if (!customer || !items || items.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
          return;
        }

        const newOrder = {
          orderId: "MIF-" + Date.now().toString().slice(-6),
          createdAt: new Date().toISOString(),
          customer,
          items,
          totalAmount,
          status: "Pending WhatsApp Confirmation"
        };

        const fileData = fs.readFileSync(ORDERS_FILE, 'utf8');
        const orders = JSON.parse(fileData || '[]');
        orders.push(newOrder);
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');

        // Build WhatsApp URL
        let text = `*New Order - Made in Farm*\n`;
        text += `*Order ID:* #${newOrder.orderId}\n\n`;
        text += `*Customer Details:*\n`;
        text += `👤 Name: ${customer.name}\n`;
        text += `📞 Phone: ${customer.phone}\n`;
        text += `📍 Address: ${customer.address}, ${customer.pincode}\n\n`;
        text += `*Ordered Items:*\n`;

        items.forEach((item, index) => {
          text += `${index + 1}. ${item.name} (${item.weight}) x ${item.quantity} = ₹${item.price * item.quantity}\n`;
        });

        text += `\n*Total Amount:* ₹${totalAmount}\n`;
        text += `\nPlease confirm my order and share payment details!`;

        const whatsappUrl = `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, orderId: newOrder.orderId, whatsappUrl }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Server error parsing order' }));
      }
    });
    return;
  }

  if (pathname === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { whatsappNumber } = JSON.parse(body);
        if (whatsappNumber) storeConfig.whatsappNumber = whatsappNumber.replace(/[^0-9]/g, '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, storeConfig }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🌾 Made in Farm zero-dependency server running on http://localhost:${PORT}`);
});
