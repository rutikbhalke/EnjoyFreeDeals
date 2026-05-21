const categoryRepository = require("../repositories/categoryRepository");
const { sendSuccess } = require("../utils/responses");

async function getCategories(_req, res, next) {
  try {
    const categories = await categoryRepository.listCategories();
    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
}

module.exports = { getCategories };
