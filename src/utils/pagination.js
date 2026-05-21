function getPagination(query) {
  const limit = clamp(Number.parseInt(query.limit, 10) || 20, 1, 100);
  const page = clamp(Number.parseInt(query.page, 10) || 1, 1, 100000);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { limit, page, from, to };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

module.exports = { getPagination };
