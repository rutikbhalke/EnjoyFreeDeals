function sendSuccess(res, data, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.json(body);
}

function sendCreated(res, data) {
  return res.status(201).json({ success: true, data });
}

module.exports = { sendSuccess, sendCreated };
