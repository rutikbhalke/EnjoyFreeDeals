const blogRepository = require("../repositories/blogRepository");
const { sendSuccess } = require("../utils/responses");

async function getBlogs(_req, res, next) {
  try {
    const blogs = await blogRepository.listPublishedBlogs();
    return sendSuccess(res, blogs);
  } catch (error) {
    next(error);
  }
}

module.exports = { getBlogs };
