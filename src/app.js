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
