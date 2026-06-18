const adminDatabaseRepository = require("../repositories/adminDatabaseRepository");
const { sendSuccess } = require("../utils/responses");

async function listTables(_req, res, next) {
  try {
    const result = await adminDatabaseRepository.listAdminTables();
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTables
};
