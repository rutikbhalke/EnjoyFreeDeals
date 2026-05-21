const notificationRepository = require("../repositories/notificationRepository");
const { sendSuccess } = require("../utils/responses");

async function getNotifications(req, res, next) {
  try {
    const notifications = await notificationRepository.listNotifications(req.params.userId);
    return sendSuccess(res, notifications);
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationRepository.markNotificationRead(req.params.id);
    return sendSuccess(res, notification);
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    const notifications = await notificationRepository.markAllNotificationsRead(req.params.userId);
    return sendSuccess(res, notifications);
  } catch (error) {
    next(error);
  }
}

module.exports = { getNotifications, markAllRead, markRead };
