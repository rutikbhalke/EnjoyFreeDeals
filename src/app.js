require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { envValidator } = require("./middleware/envValidator");
const { errorHandler } = require("./middleware/errorHandler");
const dealRoutes = require("./routes/dealRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const blogRoutes = require("./routes/blogRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const priceAlertRoutes = require("./routes/priceAlertRoutes");
const healthRoutes = require("./routes/healthRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const priceComparisonRoutes = require("./routes/priceComparisonRoutes");
const sharedDealRoutes = require("./routes/sharedDealRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dealRepository = require("./repositories/dealRepository");
const compatApiRoutes = require("./routes/compatApiRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(envValidator);

app.get("/logo.png", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "app", "src", "main", "res", "drawable", "enjoyfreedeals_logo.png"));
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EnjoyFreeDeals</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: Arial, sans-serif;
      background: #f7faf7;
      color: #172016;
    }
    main {
      width: min(720px, calc(100% - 32px));
      padding: 32px;
      border: 1px solid #dce7dc;
      border-radius: 8px;
      background: white;
      box-shadow: 0 18px 45px rgba(20, 45, 20, 0.12);
    }
    h1 {
      margin: 0 0 10px;
      color: #087b33;
      font-size: 32px;
    }
    .logo {
      width: min(520px, 100%);
      height: auto;
      margin-bottom: 18px;
      display: block;
    }
    p {
      margin: 0 0 22px;
      line-height: 1.5;
      color: #4b5a4d;
    }
    a {
      display: inline-block;
      margin: 0 10px 10px 0;
      padding: 12px 16px;
      border-radius: 6px;
      background: #087b33;
      color: white;
      text-decoration: none;
      font-weight: 700;
    }
    a.secondary {
      background: #eef6ef;
      color: #087b33;
    }
  </style>
</head>
<body>
  <main>
    <img class="logo" src="/logo.png" alt="EnjoyFreeDeals">
    <p><strong>EnjoyFreeDeals API is Live</strong></p>
    <p>Backend status: Running<br>Environment: Production</p>
    <p>This is the backend API for EnjoyFreeDeals Android app.</p>
    <p>Available API routes:</p>
    <ul>
      <li>/api/health</li>
      <li>/api/deals</li>
      <li>/api/filter-telegram-deals</li>
      <li>/api/compare-price</li>
      <li>/api/send-whatsapp-otp</li>
      <li>/api/verify-whatsapp-otp</li>
      <li>/api/saved-deals</li>
    </ul>
    <a href="/deals">View Deals</a>
    <a class="secondary" href="/api/health">Check Health</a>
  </main>
</body>
</html>`);
});

app.get("/deals", async (req, res, next) => {
  try {
    const result = await dealRepository.listDeals({ ...req.query, limit: req.query.limit || 24 });
    const cards = result.deals.map(renderDealCard).join("");

    res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EnjoyFreeDeals - Live Deals</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f5f8f4;
      color: #172016;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 2;
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid #dce7dc;
      backdrop-filter: blur(8px);
    }
    .bar {
      width: min(1180px, calc(100% - 28px));
      margin: 0 auto;
      padding: 18px 0;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
    }
    h1 {
      margin: 0;
      color: #087b33;
      font-size: 28px;
    }
    .brand-logo {
      width: min(360px, 64vw);
      height: auto;
      display: block;
    }
    .api-link {
      padding: 10px 14px;
      border-radius: 6px;
      background: #eef6ef;
      color: #087b33;
      text-decoration: none;
      font-weight: 700;
      white-space: nowrap;
    }
    main {
      width: min(1180px, calc(100% - 28px));
      margin: 24px auto 40px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 18px;
    }
    .card {
      overflow: hidden;
      border: 1px solid #dce7dc;
      border-radius: 8px;
      background: white;
      box-shadow: 0 12px 30px rgba(20, 45, 20, 0.08);
    }
    .image {
      width: 100%;
      aspect-ratio: 1.2;
      object-fit: cover;
      background: #eef6ef;
      display: block;
    }
    .content {
      padding: 14px;
    }
    h2 {
      min-height: 42px;
      margin: 0 0 10px;
      font-size: 16px;
      line-height: 1.3;
    }
    .price {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;
    }
    .current {
      color: #087b33;
      font-size: 20px;
      font-weight: 800;
    }
    .original {
      color: #6c786d;
      text-decoration: line-through;
    }
    .meta {
      margin: 0 0 14px;
      color: #5b685d;
      font-size: 13px;
    }
    .open {
      display: block;
      width: 100%;
      padding: 11px 12px;
      border-radius: 6px;
      background: #087b33;
      color: white;
      text-align: center;
      text-decoration: none;
      font-weight: 700;
    }
    .empty {
      padding: 28px;
      border: 1px solid #dce7dc;
      border-radius: 8px;
      background: white;
    }
    @media (max-width: 560px) {
      .bar {
        display: block;
      }
      .api-link {
        margin-top: 12px;
        display: inline-block;
      }
      .brand-logo {
        width: 100%;
        max-width: 320px;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <img class="brand-logo" src="/logo.png" alt="EnjoyFreeDeals">
      <a class="api-link" href="/api/deals?limit=10">Raw API</a>
    </div>
  </header>
  <main>
    <div class="grid">
      ${cards || '<div class="empty">No active deals found.</div>'}
    </div>
  </main>
</body>
</html>`);
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "EnjoyFreeDeals API is running",
    status: "ok",
    service: "EnjoyFreeDeals Backend",
    version: "1.0.0"
  });
});

app.use("/api", compatApiRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/shared-deals", sharedDealRoutes);
app.use("/api/price-alerts", priceAlertRoutes);
app.use("/api/price-comparisons", priceComparisonRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use(errorHandler);

function renderDealCard(deal) {
  const imageUrl = escapeHtml(deal.imageUrl || deal.productImage || "");
  const dealUrl = escapeHtml(deal.dealUrl || deal.productUrl || "#");
  const title = escapeHtml(deal.title || "Deal");
  const storeName = escapeHtml(deal.storeName || "Store");
  const discount = Number(deal.discountPercent || 0);
  const discountText = discount > 0 ? `${Math.round(discount)}% off` : "Live deal";

  return `<article class="card">
    ${imageUrl ? `<img class="image" src="${imageUrl}" alt="${title}" loading="lazy">` : '<div class="image"></div>'}
    <div class="content">
      <h2>${title}</h2>
      <div class="price">
        <span class="current">${formatPrice(deal.discountedPrice || deal.currentPrice || deal.originalPrice)}</span>
        ${deal.originalPrice && deal.originalPrice !== deal.discountedPrice ? `<span class="original">${formatPrice(deal.originalPrice)}</span>` : ""}
      </div>
      <p class="meta">${escapeHtml(discountText)} - ${storeName}</p>
      <a class="open" href="${dealUrl}" target="_blank" rel="noopener noreferrer">Open Deal</a>
    </div>
  </article>`;
}

function formatPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Price not set";
  return `Rs. ${numeric.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = app;
