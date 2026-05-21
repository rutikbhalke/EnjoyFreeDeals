const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "notifications";

async function listNotifications(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  throwIfSupabaseError(error, TABLE);
  return (data || []).map(toApiNotification);
}

async function markNotificationRead(id) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ is_read: true })
    .eq("id", id)
    .select("*")
    .single();
  throwIfSupabaseError(error, TABLE);
  return toApiNotification(data);
}

async function markAllNotificationsRead(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ is_read: true })
    .eq("user_id", userId)
    .select("*");
  throwIfSupabaseError(error, TABLE);
  return (data || []).map(toApiNotification);
}

function toApiNotification(row) {
  return {
    notificationId: row.id,
    id: row.id,
    userId: row.user_id,
    type: row.type || "SYSTEM",
    notificationType: row.type || "SYSTEM",
    title: row.title || "",
    message: row.message || "",
    dealId: row.deal_id || "",
    isRead: Boolean(row.is_read),
    createdAt: row.created_at
  };
}

module.exports = {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
};
