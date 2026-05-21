const express = require("express");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/:userId", notificationController.getNotifications);
router.put("/:id/read", notificationController.markRead);
router.put("/user/:userId/read-all", notificationController.markAllRead);

module.exports = router;
