require("dotenv").config();

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

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(envValidator);

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EnjoyFreeDeals API</title>
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
    <h1>EnjoyFreeDeals API</h1>
    <p>The backend is live. Use the Android app or the API endpoints below to fetch deals.</p>
    <a href="/api/deals?limit=10">View Deals API</a>
    <a class="secondary" href="/api/health">Check Health</a>
  </main>
</body>
</html>`);
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

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

module.exports = app;
