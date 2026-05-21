const express = require("express");
const healthController = require("../controllers/healthController");

const router = express.Router();

router.get("/supabase", healthController.getSupabaseHealth);

module.exports = router;
