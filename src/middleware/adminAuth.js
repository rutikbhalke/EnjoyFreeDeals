const { supabaseAdmin } = require("../config/supabaseClient");

async function requireAdmin(req, res, next) {
  try {
    const expectedSecret = process.env.ADMIN_API_SECRET || process.env.ADMIN_SECRET || "";
    const providedSecret = req.get("x-admin-secret") || String(req.query.secret || "");
    if (expectedSecret && providedSecret === expectedSecret) {
      req.adminUser = { id: "admin-secret", email: "admin-secret" };
      return next();
    }

    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authorization token is required."
      });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin authorization token."
      });
    }

    const role = data.user.app_metadata?.role || data.user.user_metadata?.role;
    const { data: storedRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError && !["PGRST116", "PGRST205"].includes(roleError.code)) {
      throw roleError;
    }

    if (role !== "admin" && storedRole?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required."
      });
    }

    req.adminUser = data.user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAdmin };
